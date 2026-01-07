import fetch from "node-fetch";
import * as cheerio from "cheerio";

async function scrapeOutline(paperCode, year, semester, location) {
  try {
    // Build occurrence code
    const occurrenceCode = `${paperCode}-${year}${semester} (${location})`;
    // URL encode the occurrence code
    const encodedCode = encodeURIComponent(occurrenceCode);

    // Use the actual API endpoint
    const url = `https://uow-func-net-currmngmt-offmngmt-aue-prod.azurewebsites.net/api/outline/view/${encodedCode}`;

    console.log("Fetching outline:", url);
    console.log("Occurrence code:", occurrenceCode);

    const response = await fetch(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      return {
        success: false,
        message: "Outline not found or not yet published",
        status: response.status,
      };
    }

    const json = await response.json();
    const $ = cheerio.load(json.html);

    // Helper function to clean text
    const cleanText = (text) => {
      return text.replace(/\s+/g, " ").trim();
    };

    // Helper function to extract email
    const extractEmail = (text) => {
      const match = text.match(/[\w.-]+@[\w.-]+\.[\w.-]+/);
      return match ? match[0] : "";
    };

    // Helper function to extract name (everything before the email)
    const extractName = (text) => {
      const cleaned = cleanText(text);
      const emailIndex = cleaned.indexOf("-");
      return emailIndex > 0 ? cleaned.substring(0, emailIndex).trim() : cleaned;
    };

    // Extract convenors
    const convenors = [];
    $('table.staff tr:has(td:contains("Convenor")) div').each((i, el) => {
      const convenorText = $(el).text();
      if (convenorText.trim()) {
        const name = extractName(convenorText);
        const email = extractEmail(convenorText);
        convenors.push({
          name,
          email,
        });
      }
    });

    // Extract lecturers
    const lecturers = [];
    $('table.staff tr:has(td:contains("Lecturer")) div').each((i, el) => {
      const lecturerText = $(el).text();
      if (lecturerText.trim()) {
        const name = extractName(lecturerText);
        const email = extractEmail(lecturerText);
        lecturers.push({
          name,
          email,
        });
      }
    });

    // Extract administrators
    const administrators = [];
    $('table.staff tr:has(td:contains("Administrators")) div').each((i, el) => {
      const administratorText = $(el).text();
      if (administratorText.trim()) {
        const name = extractName(administratorText);
        const email = extractEmail(administratorText);
        administrators.push({
          name,
          email,
        });
      }
    });

    // Extract tutors
    const tutors = [];
    $('table.staff tr:has(td:contains("Tutor")) div').each((i, el) => {
      const tutorText = $(el).text();
      if (tutorText.trim()) {
        const name = extractName(tutorText);
        const email = extractEmail(tutorText);
        tutors.push({
          name,
          email,
        });
      }
    });

    // Extract data
    const outlineData = {
      paperTitle: cleanText(
        $('div.row:has(label:contains("Paper Title")) span strong').text()
      ),
      paperOccurenceCode: cleanText(
        $('div.row:has(label:contains("Paper Occurrence Code")) span').text()
      ),
      points: cleanText($('div.row:has(label:contains("Points")) span').text()),
      deliveryMode: cleanText(
        $('div.row:has(label:contains("Delivery Mode")) span').text()
      ),
      whenTaught: cleanText(
        $('div.row:has(label:contains("When Taught")) span').text()
      ),
      startWeek: cleanText(
        $('div.row:has(label:contains("Start Week")) span').text()
      ),
      endWeek: cleanText(
        $('div.row:has(label:contains("End Week")) span').text()
      ),
      whereTaught: cleanText(
        $('div.row:has(label:contains("Where Taught")) span').text()
      ),
      selfPaced: cleanText(
        $('div.row:has(label:contains("Self-Paced")) span').text()
      ),
      convenors: convenors,
      lecturers: lecturers,
      administrators: administrators,
      tutors: tutors,
      assessmentRatio: cleanText(
        $('div.row:has(label:contains("Internal Assessment")) span').text()
      ),
    };

    console.log("\nScraped data:", JSON.stringify(outlineData, null, 2));

    return {
      success: true,
      data: outlineData,
      url,
    };
  } catch (error) {
    console.error("Scraper error:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to scrape outline",
    };
  }
}

// Test the scraper
async function main() {
  console.log("Starting scraper test...\n");

  const testCases = [
    // { paperCode: "COMPX374", year: "25", semester: "B", location: "HAM" },
    // { paperCode: "COMPX310", year: "25", semester: "B", location: "HAM" },
    { paperCode: "COMPX242", year: "24", semester: "B", location: "TGA" },
  ];

  for (const testCase of testCases) {
    console.log("\n" + "=".repeat(60));
    console.log("Testing:", testCase);
    console.log("=".repeat(60));

    const result = await scrapeOutline(
      testCase.paperCode,
      testCase.year,
      testCase.semester,
      testCase.location
    );

    if (result.success) {
      console.log("\nSUCCESS");
    } else {
      console.log("\nFAILED:", result.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Test complete!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
