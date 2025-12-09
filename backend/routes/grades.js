import express from "express";
import multer from "multer";
import Papa from "papaparse";
import fs from "fs";
import db from "../db/connection.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// PaperCode parser
function parsePaperCode(fullCode) {
  const regex = /^([A-Z]+\d+)-(\d{2})([A-Z])\s*\(([A-Z]+)\)$/;
  const match = fullCode.match(regex);

  if (!match) {
    throw new Error(`Invalid paper code format: ${fullCode}`);
  }

  return {
    code: match[1],
    year: match[2],
    semester: match[3],
    location: match[4],
  };
}

router.post("/upload", upload.single("csv"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Read CSV file
    const csvData = fs.readFileSync(req.file.path, "utf8");

    // Parse CSV
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });

    if (parsed.errors.length > 0) {
      return res
        .status(400)
        .json({ error: "CSV parsing error", details: parsed.errors });
    }

    // Validate required columns
    const firstRow = parsed.data[0];
    let fullPaperCode;

    // Try to get paper occurrence from CSV first, otherwise from filename
    if (firstRow["Paper occurrence"]) {
      fullPaperCode = firstRow["Paper occurrence"];
    } else {
      // Extract from filename: "CSMAX101-24A (HAM).csv" or "ENGEN101-25A__HAM_.csv"
      const filenameMatch = req.file.originalname.match(
        /^([A-Z0-9-]+)-(\d{2})([A-Z])\s*[\(_]+([A-Z]+)[\)_]*\.csv$/i
      );

      if (!filenameMatch) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          error: "Cannot determine paper occurrence",
          details:
            "CSV must contain 'Paper occurrence' column or filename must follow pattern: COMPX101-25A (HAM).csv",
        });
      }

      fullPaperCode = `${filenameMatch[1]}-${filenameMatch[2]}${filenameMatch[3]} (${filenameMatch[4]})`;
    }

    if (!firstRow["Paper total"]) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: 'Missing required column: "Paper total"',
      });
    }

    // Call parse set variables
    let paperCode, year, semester, location;
    try {
      const parsed = parsePaperCode(fullPaperCode);
      paperCode = parsed.code;
      year = parsed.year;
      semester = parsed.semester;
      location = parsed.location;
    } catch (parseError) {
      // Clean up uploaded file before returning error
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: "Invalid paper code format",
        details: parseError.message,
        expected: "Format should be: COMPX374-24H (HAM)",
      });
    }

    // First, find or create the paper definition
    let paperDefResult = await db.query(
      "SELECT paper_id FROM papers WHERE paper_code = $1",
      [paperCode]
    );

    let paperDefId;
    if (paperDefResult.rows.length === 0) {
      // Create new paper definition (Fetch Title from outline here)
      const insertPaperDef = await db.query(
        "INSERT INTO papers (paper_code, paper_name) VALUES ($1, $2) RETURNING paper_id",
        [paperCode, `${paperCode} - Title`]
      );
      paperDefId = insertPaperDef.rows[0].paper_id;
    } else {
      paperDefId = paperDefResult.rows[0].paper_id;
    }

    // Now find or create the occurrence
    let occurrenceResult = await db.query(
      "SELECT occurrence_id FROM occurrences WHERE paper_id = $1 AND year = $2 AND trimester = $3 AND location = $4",
      [paperDefId, `20${year}`, semester, location]
    );

    let occurrenceId;
    if (occurrenceResult.rows.length === 0) {
      // Create new occurrence
      const insertOccurrence = await db.query(
        "INSERT INTO occurrences (paper_id, year, trimester, location) VALUES ($1, $2, $3, $4) RETURNING occurrence_id",
        [paperDefId, `20${year}`, semester, location]
      );
      occurrenceId = insertOccurrence.rows[0].occurrence_id;
    } else {
      occurrenceId = occurrenceResult.rows[0].occurrence_id;
    }

    // Delete existing grade distribution for this occurrence
    await db.query("DELETE FROM grade_distributions WHERE occurrence_id = $1", [
      occurrenceId,
    ]);

    // Count grades by letter grade
    const gradeCounts = {
      a_plus: 0,
      a: 0,
      a_minus: 0,
      b_plus: 0,
      b: 0,
      b_minus: 0,
      c_plus: 0,
      c: 0,
      c_minus: 0,
      d: 0,
      e: 0,
      rp: 0,
      other: 0,
    };

    for (const row of parsed.data) {
      const paperTotal = parseFloat(row["Paper total"]);

      if (paperTotal !== null && !isNaN(paperTotal)) {
        // Determine grade based on percentage
        if (paperTotal >= 90) gradeCounts.a_plus++;
        else if (paperTotal >= 85) gradeCounts.a++;
        else if (paperTotal >= 80) gradeCounts.a_minus++;
        else if (paperTotal >= 75) gradeCounts.b_plus++;
        else if (paperTotal >= 70) gradeCounts.b++;
        else if (paperTotal >= 65) gradeCounts.b_minus++;
        else if (paperTotal >= 60) gradeCounts.c_plus++;
        else if (paperTotal >= 55) gradeCounts.c++;
        else if (paperTotal >= 50) gradeCounts.c_minus++;
        else if (paperTotal >= 40) gradeCounts.d++;
        else gradeCounts.e++;
      }
    }

    const totalStudents = Object.values(gradeCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    // Insert aggregated grade distribution
    await db.query(
      `INSERT INTO grade_distributions 
   (occurrence_id, grade_a_plus, grade_a, grade_a_minus, 
    grade_b_plus, grade_b, grade_b_minus, 
    grade_c_plus, grade_c, grade_c_minus, 
    grade_d, grade_e, grade_rp, grade_other, 
    uploaded_from_csv, upload_filename) 
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        occurrenceId,
        gradeCounts.a_plus,
        gradeCounts.a,
        gradeCounts.a_minus,
        gradeCounts.b_plus,
        gradeCounts.b,
        gradeCounts.b_minus,
        gradeCounts.c_plus,
        gradeCounts.c,
        gradeCounts.c_minus,
        gradeCounts.d,
        gradeCounts.e,
        gradeCounts.rp,
        gradeCounts.other,
        true,
        req.file.originalname,
      ]
    );

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      occurrenceId,
      paperCode: fullPaperCode,
      code: paperCode,
      year: `20${year}`,
      trimester: semester,
      location,
      studentCount: totalStudents,
      gradeDistribution: gradeCounts,
      message: `Uploaded grade distribution for ${fullPaperCode} (${totalStudents} students)`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update grade distribution for an occurrence
router.put("/update/:occurrenceId", async (req, res) => {
  try {
    const { occurrenceId } = req.params;
    const {
      a_plus,
      a,
      a_minus,
      b_plus,
      b,
      b_minus,
      c_plus,
      c,
      c_minus,
      d,
      e,
      rp,
      other,
    } = req.body;

    // Validate that occurrence exists
    const occurrenceCheck = await db.query(
      "SELECT occurrence_id FROM occurrences WHERE occurrence_id = $1",
      [occurrenceId]
    );

    if (occurrenceCheck.rows.length === 0) {
      return res.status(404).json({ error: "Occurrence not found" });
    }

    // Check if grade distribution exists
    const existingGrades = await db.query(
      "SELECT distribution_id FROM grade_distributions WHERE occurrence_id = $1",
      [occurrenceId]
    );

    if (existingGrades.rows.length === 0) {
      // Insert new grade distribution
      await db.query(
        `INSERT INTO grade_distributions 
         (occurrence_id, grade_a_plus, grade_a, grade_a_minus, 
          grade_b_plus, grade_b, grade_b_minus, 
          grade_c_plus, grade_c, grade_c_minus, 
          grade_d, grade_e, grade_rp, grade_other, 
          uploaded_from_csv) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          occurrenceId,
          a_plus || 0,
          a || 0,
          a_minus || 0,
          b_plus || 0,
          b || 0,
          b_minus || 0,
          c_plus || 0,
          c || 0,
          c_minus || 0,
          d || 0,
          e || 0,
          rp || 0,
          other || 0,
          false, // Not uploaded from CSV
        ]
      );
    } else {
      // Update existing grade distribution
      await db.query(
        `UPDATE grade_distributions 
         SET grade_a_plus = $1, grade_a = $2, grade_a_minus = $3,
             grade_b_plus = $4, grade_b = $5, grade_b_minus = $6,
             grade_c_plus = $7, grade_c = $8, grade_c_minus = $9,
             grade_d = $10, grade_e = $11, grade_rp = $12, grade_other = $13,
             uploaded_from_csv = false
         WHERE occurrence_id = $14`,
        [
          a_plus || 0,
          a || 0,
          a_minus || 0,
          b_plus || 0,
          b || 0,
          b_minus || 0,
          c_plus || 0,
          c || 0,
          c_minus || 0,
          d || 0,
          e || 0,
          rp || 0,
          other || 0,
          occurrenceId,
        ]
      );
    }

    const totalStudents =
      (a_plus || 0) +
      (a || 0) +
      (a_minus || 0) +
      (b_plus || 0) +
      (b || 0) +
      (b_minus || 0) +
      (c_plus || 0) +
      (c || 0) +
      (c_minus || 0) +
      (d || 0) +
      (e || 0) +
      (rp || 0) +
      (other || 0);

    res.json({
      success: true,
      occurrenceId,
      totalStudents,
      message: "Grade distribution updated successfully",
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
