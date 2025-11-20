import express from "express";
import db from "../db/connection.js";

const router = express.Router();

// Get all papers
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.paper_id,
        p.paper_code,
        p.paper_name,
        COUNT(DISTINCT o.occurrence_id) as occurrence_count,
        MAX(o.year) as latest_year,
        MAX(o.trimester) as latest_trimester
      FROM papers p
      LEFT JOIN occurrences o ON p.paper_id = o.paper_id
      GROUP BY p.paper_id
      ORDER BY p.paper_code
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all occurrences with grade data
router.get("/occurrences", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        o.occurrence_id,
        o.paper_id,
        p.paper_code,
        p.paper_name,
        o.year,
        o.trimester,
        o.location,
        o.points,
        o.delivery_mode,
        gd.total_students,
        gd.pass_rate,
        cf.status as form_status
      FROM occurrences o
      JOIN papers p ON o.paper_id = p.paper_id
      LEFT JOIN grade_distributions gd ON o.occurrence_id = gd.occurrence_id
      LEFT JOIN course_forms cf ON o.occurrence_id = cf.occurrence_id
      ORDER BY o.year DESC, o.trimester DESC, p.paper_code
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get incomplete occurrences (form not complete)
router.get("/occurrences/incomplete", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        o.occurrence_id,
        o.paper_id,
        p.paper_code,
        p.paper_name,
        o.year,
        o.trimester,
        o.location,
        o.points,
        o.delivery_mode,
        gd.total_students,
        gd.pass_rate,
        cf.status as form_status
      FROM occurrences o
      JOIN papers p ON o.paper_id = p.paper_id
      LEFT JOIN grade_distributions gd ON o.occurrence_id = gd.occurrence_id
      LEFT JOIN course_forms cf ON o.occurrence_id = cf.occurrence_id
      WHERE cf.status IS NULL OR cf.status != 'submitted'
      ORDER BY o.year DESC, o.trimester DESC, p.paper_code
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single occurrence with details
router.get("/occurrences/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get occurrence info with paper details
    const occurrenceResult = await db.query(
      `SELECT 
        o.*,
        p.paper_code,
        p.paper_name
      FROM occurrences o
      JOIN papers p ON o.paper_id = p.paper_id
      WHERE o.occurrence_id = $1`,
      [id]
    );

    if (occurrenceResult.rows.length === 0) {
      return res.status(404).json({ error: "Occurrence not found" });
    }

    const occurrence = occurrenceResult.rows[0];

    // Get outline data if exists
    const outlineResult = await db.query(
      "SELECT scraped_data FROM paper_outlines WHERE occurrence_id = $1",
      [id]
    );

    // Get grade distribution
    const gradeResult = await db.query(
      `SELECT 
        grade_a_plus, grade_a, grade_a_minus,
        grade_b_plus, grade_b, grade_b_minus,
        grade_c_plus, grade_c, grade_c_minus,
        grade_d, grade_e, grade_rp, grade_other,
        total_students, pass_count, pass_rate
      FROM grade_distributions 
      WHERE occurrence_id = $1`,
      [id]
    );

    const gradeDistribution = gradeResult.rows[0] || null;

    res.json({
      ...occurrence,
      outline: outlineResult.rows[0]?.scraped_data || null,
      gradeDistribution,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save scraped outline data
router.post("/occurrences/:id/outline", async (req, res) => {
  try {
    const { id } = req.params;
    const { scrapedData } = req.body;

    // Check if paper exists
    // Check if occurrence exists
    const occurrenceCheck = await db.query(
      "SELECT occurrence_id FROM occurrences WHERE occurrence_id = $1",
      [id]
    );

    if (occurrenceCheck.rows.length === 0) {
      return res.status(404).json({ error: "Occurrence not found" });
    }

    // Check if outline already exists
    const existingOutline = await db.query(
      "SELECT outline_id FROM paper_outlines WHERE occurrence_id = $1",
      [id]
    );

    if (existingOutline.rows.length > 0) {
      return res.json({
        success: true,
        message: "Outline already exists, skipping",
      });
    }

    // Insert new outline only if none exists
    await db.query(
      "INSERT INTO paper_outlines (occurrence_id, scraped_data, scraped_at) VALUES ($1, $2, NOW())",
      [id, scrapedData]
    );

    res.json({ success: true, message: "Outline saved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
