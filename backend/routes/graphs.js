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
        grade_d, grade_e, grade_rp, grade_other, grade_ic
      FROM grade_distributions
      WHERE occurrence_id = $1`,
      [occurrenceId],
    );

    if (result.rows.length === 0) {
      return res.json({
        labels: [],
        data: [],
        message: "No grade data available",
      });
    }

    const gradeData = result.rows[0];

    // Format data for chart (reverse order so A+ is on right, IC at start as special category)
    const labels = [
      "IC",
      "E",
      "D",
      "RP",
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
      gradeData.grade_ic || 0,
      gradeData.grade_e,
      gradeData.grade_d,
      gradeData.grade_rp,
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
    const { location, trimester } = req.query;

    // Get historical data for this paper code across all years/trimesters at the same location
    const historicalResult = await db.query(
      `
  SELECT 
    o.year,
    o.trimester,
    o.location,
    gd.total_students as student_count,
    gd.pass_rate,
    CONCAT(
      (gd.grade_a_plus + gd.grade_a + gd.grade_a_minus +
       gd.grade_b_plus + gd.grade_b + gd.grade_b_minus +
       gd.grade_c_plus + gd.grade_c + gd.grade_c_minus+ gd.grade_rp), 
      ' / ', 
      (gd.grade_d + gd.grade_e + gd.grade_ic)
    ) as pass_fail
  FROM occurrences o
  JOIN papers p ON o.paper_id = p.paper_id
  LEFT JOIN grade_distributions gd ON o.occurrence_id = gd.occurrence_id
  WHERE p.paper_code = $1
  AND o.location = $2
  AND o.trimester = $3
  AND gd.distribution_id IS NOT NULL
ORDER BY o.year ASC, o.trimester ASC
  `,
      [paperCode, location, trimester],
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
      (row) => `${row.year} ${row.trimester}`,
    );
    const passFailCounts = historicalResult.rows.map(
      (row) => row.pass_fail || "N/A",
    );
    const passRates = historicalResult.rows.map(
      (row) => parseFloat(row.pass_rate) || 0,
    );
    const studentCounts = historicalResult.rows.map(
      (row) => parseInt(row.student_count) || 0,
    );

    res.json({
      labels: labels,
      datasets: [
        {
          label: "Pass / Fail",
          data: passFailCounts,
          type: "text",
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

// Get historical grade distributions for a paper code BY OCCURRENCE ID
router.get("/historical-distribution/:occurrenceId", async (req, res) => {
  try {
    const { occurrenceId } = req.params;

    // First, get the paper code AND location from the occurrence
    const occurrenceResult = await db.query(
      `SELECT p.paper_code, o.location, o.trimester
   FROM occurrences o
   JOIN papers p ON o.paper_id = p.paper_id
   WHERE o.occurrence_id = $1`,
      [occurrenceId],
    );

    if (occurrenceResult.rows.length === 0) {
      return res.json({ data: [], message: "Occurrence not found" });
    }

    const paperCode = occurrenceResult.rows[0].paper_code;
    const location = occurrenceResult.rows[0].location;
    const trimester = occurrenceResult.rows[0].trimester;

    // Now get all historical distributions for this paper code at the same location
    const result = await db.query(
      `
      SELECT 
        o.year,
        o.trimester,
        o.occurrence_id,
        gd.grade_a_plus, gd.grade_a, gd.grade_a_minus,
        gd.grade_b_plus, gd.grade_b, gd.grade_b_minus,
        gd.grade_c_plus, gd.grade_c, gd.grade_c_minus,
        gd.grade_rp, gd.grade_ic,
        gd.grade_d, gd.grade_e,
        gd.total_students
      FROM occurrences o
      JOIN papers p ON o.paper_id = p.paper_id
      LEFT JOIN grade_distributions gd ON o.occurrence_id = gd.occurrence_id
      WHERE p.paper_code = $1
  AND o.location = $2
  AND o.trimester = $3
  AND gd.distribution_id IS NOT NULL
ORDER BY o.year ASC, o.trimester ASC
      `,
      [paperCode, location, trimester],
    );

    if (result.rows.length === 0) {
      return res.json({ data: [], message: "No historical data available" });
    }

    // Return raw counts, not percentages
    const distributions = result.rows.map((row) => {
      return {
        year: `${row.year} ${row.trimester}`,
        occurrenceId: row.occurrence_id,
        data: {
          IC: row.grade_ic || 0,
          E: row.grade_e,
          D: row.grade_d,
          RP: row.grade_rp,
          "C-": row.grade_c_minus,
          C: row.grade_c,
          "C+": row.grade_c_plus,
          "B-": row.grade_b_minus,
          B: row.grade_b,
          "B+": row.grade_b_plus,
          "A-": row.grade_a_minus,
          A: row.grade_a,
          "A+": row.grade_a_plus,
        },
      };
    });

    res.json({
      data: distributions,
      paperCode: paperCode,
      location: location,
    });
  } catch (error) {
    console.error("Error generating historical distribution:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
