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
    if (!firstRow["Paper code"] || !firstRow["Paper total (Real)"]) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error:
          'Missing required columns: "Paper code" and/or "Paper total (Real)"',
      });
    }

    // Group rows by paper occurrence
    const occurrenceGroups = {};

    for (const row of parsed.data) {
      const fullPaperCode = row["Paper code"];
      const rawTotal = row["Paper total (Real)"];
      const isIC =
        typeof rawTotal === "string" &&
        rawTotal.trim().toUpperCase() === "IC";
      const paperTotal = isIC ? "IC" : parseFloat(rawTotal);

      if (!fullPaperCode || (!isIC && isNaN(paperTotal))) {
        continue; // Skip invalid rows
      }

      if (!occurrenceGroups[fullPaperCode]) {
        occurrenceGroups[fullPaperCode] = [];
      }

      occurrenceGroups[fullPaperCode].push(paperTotal);
    }

    const results = [];

    // Process each occurrence group
    for (const [fullPaperCode, paperTotals] of Object.entries(
      occurrenceGroups,
    )) {
      try {
        // Parse paper code
        const parsed = parsePaperCode(fullPaperCode);
        const { code: paperCode, year, semester, location } = parsed;

        // First, find or create the paper definition
        let paperDefResult = await db.query(
          "SELECT paper_id FROM papers WHERE paper_code = $1",
          [paperCode],
        );

        let paperDefId;
        if (paperDefResult.rows.length === 0) {
          const insertPaperDef = await db.query(
            "INSERT INTO papers (paper_code, paper_name) VALUES ($1, $2) RETURNING paper_id",
            [paperCode, `${paperCode} - Title`],
          );
          paperDefId = insertPaperDef.rows[0].paper_id;
        } else {
          paperDefId = paperDefResult.rows[0].paper_id;
        }

        // Find or create the occurrence
        let occurrenceResult = await db.query(
          "SELECT occurrence_id FROM occurrences WHERE paper_id = $1 AND year = $2 AND trimester = $3 AND location = $4",
          [paperDefId, `20${year}`, semester, location],
        );

        let occurrenceId;
        if (occurrenceResult.rows.length === 0) {
          const insertOccurrence = await db.query(
            "INSERT INTO occurrences (paper_id, year, trimester, location) VALUES ($1, $2, $3, $4) RETURNING occurrence_id",
            [paperDefId, `20${year}`, semester, location],
          );
          occurrenceId = insertOccurrence.rows[0].occurrence_id;
        } else {
          occurrenceId = occurrenceResult.rows[0].occurrence_id;
        }

        // Delete existing grade distribution for this occurrence
        await db.query(
          "DELETE FROM grade_distributions WHERE occurrence_id = $1",
          [occurrenceId],
        );

        // Count grades by letter grade for this occurrence
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
          ic: 0,
        };

        for (const paperTotal of paperTotals) {
          if (paperTotal === "IC") { gradeCounts.ic++; continue; }
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

        const totalStudents = paperTotals.length;

        // Insert aggregated grade distribution
        await db.query(
          `INSERT INTO grade_distributions
           (occurrence_id, grade_a_plus, grade_a, grade_a_minus,
            grade_b_plus, grade_b, grade_b_minus,
            grade_c_plus, grade_c, grade_c_minus,
            grade_d, grade_e, grade_rp, grade_other, grade_ic,
            uploaded_from_csv, upload_filename)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
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
            gradeCounts.ic,
            true,
            req.file.originalname,
          ],
        );

        results.push({
          occurrenceId,
          paperCode: fullPaperCode,
          code: paperCode,
          year: `20${year}`,
          trimester: semester,
          location,
          studentCount: totalStudents,
          gradeDistribution: gradeCounts,
        });
      } catch (parseError) {
        console.error(`Error processing ${fullPaperCode}:`, parseError);
        results.push({
          paperCode: fullPaperCode,
          error: parseError.message,
          skipped: true,
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      processedOccurrences: results.length,
      results: results,
      message: `Uploaded grade distributions for ${results.length} occurrence(s)`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    // Clean up file if it still exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
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
      ic,
    } = req.body;

    // Validate that occurrence exists
    const occurrenceCheck = await db.query(
      "SELECT occurrence_id FROM occurrences WHERE occurrence_id = $1",
      [occurrenceId],
    );

    if (occurrenceCheck.rows.length === 0) {
      return res.status(404).json({ error: "Occurrence not found" });
    }

    // Check if grade distribution exists
    const existingGrades = await db.query(
      "SELECT distribution_id FROM grade_distributions WHERE occurrence_id = $1",
      [occurrenceId],
    );

    if (existingGrades.rows.length === 0) {
      // Insert new grade distribution
      await db.query(
        `INSERT INTO grade_distributions
         (occurrence_id, grade_a_plus, grade_a, grade_a_minus,
          grade_b_plus, grade_b, grade_b_minus,
          grade_c_plus, grade_c, grade_c_minus,
          grade_d, grade_e, grade_rp, grade_other, grade_ic,
          uploaded_from_csv)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
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
          ic || 0,
          false, // Not uploaded from CSV
        ],
      );
    } else {
      // Update existing grade distribution
      await db.query(
        `UPDATE grade_distributions
         SET grade_a_plus = $1, grade_a = $2, grade_a_minus = $3,
             grade_b_plus = $4, grade_b = $5, grade_b_minus = $6,
             grade_c_plus = $7, grade_c = $8, grade_c_minus = $9,
             grade_d = $10, grade_e = $11, grade_rp = $12, grade_other = $13,
             grade_ic = $14, uploaded_from_csv = false
         WHERE occurrence_id = $15`,
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
          ic || 0,
          occurrenceId,
        ],
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
      (other || 0) +
      (ic || 0);

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
