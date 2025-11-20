import express from "express";
import db from "../db/connection.js";

const router = express.Router();

// Get single occurrence with full details using the view
router.get("/occurrences/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Fetching occurrence:", id); // Debug log

    // Query the view
    const result = await db.query(
      "SELECT * FROM occurrence_summary WHERE occurrence_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Occurrence not found" });
    }

    const occurrence = result.rows[0];

    // Safely parse JSON fields
    if (occurrence.outline_data) {
      try {
        // If it's already an object (Postgres returns JSONB as object), leave it
        if (typeof occurrence.outline_data === "string") {
          occurrence.outline_data = JSON.parse(occurrence.outline_data);
        }
      } catch (parseError) {
        console.error("Error parsing outline_data:", parseError);
        occurrence.outline_data = null; // Set to null if parsing fails
      }
    }

    // console.log("Returning occurrence:", occurrence); // Debug log
    res.json(occurrence);
  } catch (error) {
    console.error("Error in /occurrences/:id:", error); // Debug log
    res.status(500).json({
      error: error.message,
      detail: error.detail || "No additional details",
    });
  }
});

export default router;
