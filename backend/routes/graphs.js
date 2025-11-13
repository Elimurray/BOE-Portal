import express from "express";
import db from "../db/connection.js";

const router = express.Router();

// Get grade distribution data for a specific paper (LETTER GRADES)
router.get("/:paperId/distribution", async (req, res) => {
  try {
    const { paperId } = req.params;

    // Get all grades for this paper
    const result = await db.query(
      "SELECT paper_total FROM grades WHERE paper_id = $1",
      [paperId]
    );

    if (result.rows.length === 0) {
      return res.json({
        labels: [],
        data: [],
        message: "No grade data available",
      });
    }

    const gradeBins = {
      [`E`]: 0,
      [`D`]: 0,
      [`C-`]: 0,
      [`C`]: 0,
      [`C+`]: 0,
      [`B-`]: 0,
      [`B`]: 0,
      [`B+`]: 0,
      [`A-`]: 0,
      [`A`]: 0,
      [`A+`]: 0,
    };

    // Helper function to calculate letter grade
    const calculateLetterGrade = (percentage) => {
      if (percentage >= 90) return "A+";
      if (percentage >= 85) return "A";
      if (percentage >= 80) return "A-";
      if (percentage >= 75) return "B+";
      if (percentage >= 70) return "B";
      if (percentage >= 65) return "B-";
      if (percentage >= 60) return "C+";
      if (percentage >= 55) return "C";
      if (percentage >= 50) return "C-";
      if (percentage >= 40) return "D";
      return "E";
    };

    // Count grades in each bin
    result.rows.forEach((row) => {
      const grade = parseFloat(row.paper_total);
      if (!isNaN(grade) && grade >= 0 && grade <= 100) {
        const letterGrade = calculateLetterGrade(grade);
        gradeBins[letterGrade]++;
      }
    });

    // Convert to arrays for chart
    const labels = Object.keys(gradeBins);
    const data = Object.values(gradeBins);

    res.json({
      labels: labels,
      data: data,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Error generating distribution:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get historical comparison data for a paper code
router.get("/:paperId/historical", async (req, res) => {
  try {
    const { paperId } = req.params;

    // Get the paper's code and semester
    const paperResult = await db.query(
      "SELECT code, semester FROM papers WHERE paper_id = $1",
      [paperId]
    );

    if (paperResult.rows.length === 0) {
      return res.status(404).json({ error: "Paper not found" });
    }

    const { code, semester } = paperResult.rows[0];

    // Get historical data for same paper code and semester
    const historicalResult = await db.query(
      `
      SELECT 
        p.year,
        p.semester,
        COUNT(g.grade_id) as student_count,
        ROUND(AVG(g.paper_total), 2) as avg_grade,
        COUNT(CASE WHEN g.paper_total >= 50 THEN 1 END) as pass_count,
        ROUND(
          COUNT(CASE WHEN g.paper_total >= 50 THEN 1 END)::numeric / 
          COUNT(g.grade_id)::numeric * 100, 
          2
        ) as pass_rate
      FROM papers p
      LEFT JOIN grades g ON p.paper_id = g.paper_id
      WHERE p.code = $1 
        AND p.semester = $2
        AND g.grade_id IS NOT NULL
      GROUP BY p.year, p.semester
      ORDER BY p.year ASC
    `,
      [code, semester]
    );

    if (historicalResult.rows.length === 0) {
      return res.json({
        labels: [],
        datasets: [],
        message: "No historical data available",
      });
    }

    // Format for Chart.js/Recharts
    const labels = historicalResult.rows.map(
      (row) => `${row.year}${row.semester}`
    );
    const avgGrades = historicalResult.rows.map(
      (row) => parseFloat(row.avg_grade) || 0
    );
    const passRates = historicalResult.rows.map(
      (row) => parseFloat(row.pass_rate) || 0
    );
    const studentCounts = historicalResult.rows.map(
      (row) => parseInt(row.student_count) || 0
    );

    res.json({
      labels: labels,
      datasets: [
        {
          label: "Average Grade",
          data: avgGrades,
          type: "line",
        },
        {
          label: "Pass Rate (%)",
          data: passRates,
          type: "line",
        },
        {
          label: "Student Count",
          data: studentCounts,
          type: "bar",
        },
      ],
    });
  } catch (error) {
    console.error("Error generating historical data:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
