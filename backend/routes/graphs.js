import express from "express";
import db from "../db/connection.js";

const router = express.Router();

// Get grade distribution data for a specific occurrence (LETTER GRADES)
router.get("/:occurrenceId/distribution", async (req, res) => {
  try {
    const { occurrenceId } = req.params;

    // Get grade distribution for this occurrence
    const result = await db.query(
      `SELECT 
        grade_a_plus, grade_a, grade_a_minus,
        grade_b_plus, grade_b, grade_b_minus,
        grade_c_plus, grade_c, grade_c_minus,
        grade_d, grade_e, grade_rp, grade_other
      FROM grade_distributions 
      WHERE occurrence_id = $1`,
      [occurrenceId]
    );

    if (result.rows.length === 0) {
      return res.json({
        labels: [],
        data: [],
        message: "No grade data available",
      });
    }

    const gradeData = result.rows[0];

    // Format data for chart (reverse order so A+ is on right)
    const labels = [
      "E",
      "D",
      "C-",
      "C",
      "C+",
      "B-",
      "B",
      "B+",
      "A-",
      "A",
      "A+",
    ];
    const data = [
      gradeData.grade_e,
      gradeData.grade_d,
      gradeData.grade_c_minus,
      gradeData.grade_c,
      gradeData.grade_c_plus,
      gradeData.grade_b_minus,
      gradeData.grade_b,
      gradeData.grade_b_plus,
      gradeData.grade_a_minus,
      gradeData.grade_a,
      gradeData.grade_a_plus,
    ];

    const total = data.reduce((sum, count) => sum + count, 0);

    res.json({
      labels: labels,
      data: data,
      total: total,
    });
  } catch (error) {
    console.error("Error generating distribution:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get historical comparison data for a paper code
router.get("/historical/:paperCode", async (req, res) => {
  try {
    const { paperCode } = req.params;

    // Get historical data for this paper code across all years/trimesters
    const historicalResult = await db.query(
      `
      SELECT 
        o.year,
        o.trimester,
        o.location,
        gd.total_students as student_count,
        gd.pass_rate,
        ROUND(
          (gd.grade_a_plus * 95 + gd.grade_a * 87.5 + gd.grade_a_minus * 82.5 +
           gd.grade_b_plus * 77.5 + gd.grade_b * 72.5 + gd.grade_b_minus * 67.5 +
           gd.grade_c_plus * 62.5 + gd.grade_c * 57.5 + gd.grade_c_minus * 52.5 +
           gd.grade_d * 45 + gd.grade_e * 30)::numeric / 
           NULLIF(gd.total_students, 0)::numeric, 2
        ) as avg_grade
      FROM occurrences o
      JOIN papers p ON o.paper_id = p.paper_id
      LEFT JOIN grade_distributions gd ON o.occurrence_id = gd.occurrence_id
      WHERE p.paper_code = $1
        AND gd.distribution_id IS NOT NULL
      ORDER BY o.year ASC, o.trimester ASC
    `,
      [paperCode]
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
      (row) => `${row.year} ${row.trimester}`
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
