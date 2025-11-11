import express from "express";
import multer from "multer";
import Papa from "papaparse";
import fs from "fs";
import db from "../db/connection.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

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
      return res.status(400).json({
        error:
          'Missing required columns: "Paper code" and "Paper total (Real)"',
      });
    }

    const paperCode = firstRow["Paper code"];

    // Find or create paper
    let paperResult = await db.query(
      "SELECT paper_id FROM papers WHERE code = $1 ORDER BY year DESC, semester DESC LIMIT 1",
      [paperCode]
    );

    let paperId;
    if (paperResult.rows.length === 0) {
      // Create new paper (basic entry, can be updated later)
      const insertResult = await db.query(
        "INSERT INTO papers (code) VALUES ($1) RETURNING paper_id",
        [paperCode]
      );
      paperId = insertResult.rows[0].paper_id;
    } else {
      paperId = paperResult.rows[0].paper_id;
    }

    // Delete existing grades for this paper (in case of re-upload)
    await db.query("DELETE FROM grades WHERE paper_id = $1", [paperId]);

    // Insert grades
    let successCount = 0;
    for (const row of parsed.data) {
      const paperTotal = parseFloat(row["Paper total (Real)"]);
      const studentId = row["ID number"];

      if (paperTotal !== null && !isNaN(paperTotal) && studentId) {
        await db.query(
          "INSERT INTO grades (paper_id, student_id, paper_total) VALUES ($1, $2, $3)",
          [paperId, studentId, paperTotal]
        );
        successCount++;
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      paperId,
      paperCode,
      studentCount: successCount,
      message: `Uploaded ${successCount} student grades for ${paperCode}`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
