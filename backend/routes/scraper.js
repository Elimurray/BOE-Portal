import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import db from "../db/connection.js";

const router = express.Router();

router.post("/outline", async (req, res) => {
  try {
    const { paperCode, year, semester, location } = req.body;

    // Build occurrence code: COMPX374-25B%20(HAM)
    const occurrenceCode = `${paperCode}-${year}${semester}%20(${location})`;
    const url = `https://paperoutlines.waikato.ac.nz/outline/${occurrenceCode}`;

    console.log("Fetching outline:", url);

    const response = await fetch(url);

    if (!response.ok) {
      return res.json({
        success: false,
        message: "Outline not found or not yet published",
      });
    }

    const json = await response.json();
    const $ = cheerio.load(json.html);

    // Extract data
    const outlineData = {
      title: $('div.row:has(label:contains("Paper Title")) span strong')
        .text()
        .trim(),
      deliveryMode: $('div.row:has(label:contains("Delivery Mode")) span')
        .text()
        .trim(),
      location: $('div.row:has(label:contains("Where Taught")) span')
        .text()
        .trim(),
      convenor: $('table.staff tr:has(td:contains("Convenor")) div')
        .first()
        .text()
        .trim(),
      tutors: [],
      assessmentRatio: $(
        'div.row:has(label:contains("Internal Assessment")) span'
      )
        .text()
        .trim(),
    };

    // Extract tutors if they exist
    $('table.staff tr:has(td:contains("Tutors")) div').each((i, el) => {
      const tutorText = $(el).text().trim();
      if (tutorText) outlineData.tutors.push(tutorText);
    });

    console.log("Scraped data:", outlineData);

    res.json({
      success: true,
      data: outlineData,
      url,
    });
  } catch (error) {
    console.error("Scraper error:", error);
    res.json({
      success: false,
      error: error.message,
      message: "Failed to scrape outline",
    });
  }
});

export default router;
