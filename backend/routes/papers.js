import express from "express";
import db from "../db/connection.js";

const router = express.Router();

// Get all papers
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.*,
        COUNT(g.grade_id) as student_count,
        ROUND(AVG(g.paper_total), 2) as avg_grade
      FROM papers p
      LEFT JOIN grades g ON p.paper_id = g.paper_id
      GROUP BY p.paper_id
      ORDER BY p.year DESC, p.semester DESC, p.code
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single paper with details
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get paper info
    const paperResult = await db.query(
      "SELECT * FROM papers WHERE paper_id = $1",
      [id]
    );

    if (paperResult.rows.length === 0) {
      return res.status(404).json({ error: "Paper not found" });
    }

    const paper = paperResult.rows[0];

    // Get outline data if exists
    const outlineResult = await db.query(
      "SELECT scraped_data FROM paper_outlines WHERE paper_id = $1",
      [id]
    );

    // Get grade statistics
    const statsResult = await db.query(
      `
      SELECT 
        COUNT(*) as student_count,
        ROUND(AVG(paper_total), 2) as avg_grade,
        COUNT(CASE WHEN paper_total >= 50 THEN 1 END) as pass_count,
        ROUND(COUNT(CASE WHEN paper_total >= 50 THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as pass_rate
      FROM grades 
      WHERE paper_id = $1
    `,
      [id]
    );

    const stats = statsResult.rows[0];

    res.json({
      ...paper,
      outline: outlineResult.rows[0]?.scraped_data || null,
      studentCount: parseInt(stats.student_count) || 0,
      avgGrade: parseFloat(stats.avg_grade) || 0,
      passCount: parseInt(stats.pass_count) || 0,
      passRate: parseFloat(stats.pass_rate) || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save scraped outline data
router.post("/:id/outline", async (req, res) => {
  try {
    const { id } = req.params;
    const { scrapedData } = req.body;

    // Check if paper exists
    const paperCheck = await db.query(
      "SELECT paper_id FROM papers WHERE paper_id = $1",
      [id]
    );

    if (paperCheck.rows.length === 0) {
      return res.status(404).json({ error: "Paper not found" });
    }

    // Check if outline already exists
    const existingOutline = await db.query(
      "SELECT outline_id FROM paper_outlines WHERE paper_id = $1",
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
      "INSERT INTO paper_outlines (paper_id, scraped_data, scraped_at) VALUES ($1, $2, NOW())",
      [id, scrapedData]
    );

    res.json({ success: true, message: "Outline saved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
