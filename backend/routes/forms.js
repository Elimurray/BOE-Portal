import express from "express";
import db from "../db/connection.js";

const router = express.Router();

// Helper function to clean and format staff names
function cleanStaffName(name) {
  return name
    .trim()
    .replace(/^(DR|Dr|dr|APROF|Aprof|aprof)\.?\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Helper function to process staff and create staff_occurrences
async function processStaff(occurrenceId, staffNames, role, client) {
  if (!staffNames || !staffNames.trim()) {
    return;
  }

  const names = staffNames
    .split(",")
    .map((name) => cleanStaffName(name))
    .filter((name) => name);

  for (const name of names) {
    // Get or create staff member
    let staffResult = await client.query(
      "SELECT staff_id FROM staff WHERE name = $1",
      [name],
    );

    let staffId;
    if (staffResult.rows.length === 0) {
      // Create new staff member
      const newStaff = await client.query(
        "INSERT INTO staff (name) VALUES ($1) RETURNING staff_id",
        [name],
      );
      staffId = newStaff.rows[0].staff_id;
    } else {
      staffId = staffResult.rows[0].staff_id;
    }

    // Insert into staff_occurrences (avoid duplicates)
    await client.query(
      `INSERT INTO occurrence_staff (occurrence_id, staff_id, role) 
       VALUES ($1, $2, $3)
       ON CONFLICT (occurrence_id, staff_id, role) DO NOTHING`,
      [occurrenceId, staffId, role],
    );
  }
}

// Submit form
router.post("/", async (req, res) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

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

    // Insert course form
    const result = await client.query(
      `
      INSERT INTO course_forms (
        occurrence_id, submitted_by_name,
        lecturers, tutors, 
        rp_count, assessment_item_count, internal_external_split,
        assessment_types_summary, delivery_mode,
        major_changes_description, grade_distribution_different,
        grade_distribution_comments, other_comments,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING form_id
    `,
      [
        occurrenceId,
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
        "submitted",
      ],
    );

    const formId = result.rows[0].form_id;

    // Process lecturers
    await processStaff(occurrenceId, lecturers, "Lecturer", client);

    // Process tutors
    await processStaff(occurrenceId, tutors, "Tutor", client);

    await client.query("COMMIT");

    res.json({
      success: true,
      formId: formId,
      message: "Form submitted successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error submitting form:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
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
