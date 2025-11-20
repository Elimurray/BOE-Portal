import express from "express";
import db from "../db/connection.js";

const router = express.Router();

// Submit form
router.post("/", async (req, res) => {
  try {
    const {
      occurrenceId,
      submittedByEmail,
      submittedByName,
      lecturers,
      tutors,
      rpCount,
      assessmentItemCount,
      internalExternalSplit,
      assessmentTypesSummary,
      deliveryMode,
      majorChangesDescription,
      gradeDistributionDifferent,
      gradeDistributionComments,
      otherComments,
    } = req.body;

    // Get grade stats
    // const statsResult = await db.query(
    //   `
    //   SELECT
    //     COUNT(*) as student_count,
    //     ROUND(COUNT(CASE WHEN paper_total >= 50 THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as pass_rate
    //   FROM grades WHERE paper_id = $1
    // `,
    //   [paperId]
    // );

    // const stats = statsResult.rows[0];

    const result = await db.query(
      `
      INSERT INTO course_forms (
        occurrence_id, submitted_by_email, submitted_by_name,
        lecturers, tutors, 
        rp_count, assessment_item_count, internal_external_split,
        assessment_types_summary, delivery_mode,
        major_changes_description, grade_distribution_different,
        grade_distribution_comments, other_comments,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING form_id
    `,
      [
        occurrenceId,
        submittedByEmail,
        submittedByName,
        lecturers,
        tutors,
        // stats.student_count,
        // stats.pass_rate,
        rpCount,
        assessmentItemCount,
        internalExternalSplit,
        assessmentTypesSummary,
        deliveryMode,
        majorChangesDescription,
        gradeDistributionDifferent,
        gradeDistributionComments,
        otherComments,
        "submitted",
      ]
    );

    // Mark the occurrence as having a complete form
    await db.query(
      `
      UPDATE occurrences
      SET form_complete = TRUE
      WHERE occurrence_id = $1
    `,
      [occurrenceId]
    );

    res.json({
      success: true,
      formId: result.rows[0].form_id,
      message: "Form submitted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all forms
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        cf.*,
        p.code, p.title, p.semester, p.year
      FROM course_forms cf
      JOIN papers p ON cf.paper_id = p.paper_id
      ORDER BY cf.submission_date DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
