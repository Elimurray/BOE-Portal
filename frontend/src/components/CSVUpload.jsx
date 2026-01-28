import { useState } from "react";
import { uploadCSV, scrapeOutline, saveOutline } from "../services/api";
import "./CSVUpload.css";

export default function CSVUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setResults([]);
    setErrors([]);
  };

  const handleScrapeAndSaveOutline = async (paper) => {
    try {
      console.log("Starting scrape for paper:", paper);

      const response = await scrapeOutline({
        paperCode: paper.code,
        year: paper.year,
        trimester: paper.trimester,
        location: paper.location,
      });

      console.log("Scrape response:", response.data);

      if (response.data.success) {
        const scrapedData = response.data.data;
        console.log(
          "Attempting to save outline for occurrence_id:",
          paper.occurrenceId,
        );

        await saveOutline(paper.occurrenceId, scrapedData);
        console.log("Outline scraped and saved successfully");
        return { success: true };
      } else {
        console.error("Scrape was not successful:", response.data);
        return { success: false, error: "Scrape failed" };
      }
    } catch (error) {
      console.error("Error in handleScrapeAndSaveOutline:", error);
      return { success: false, error: error.message };
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setResults([]);
    setErrors([]);
    setProgress({ current: 0, total: files.length });

    const uploadResults = [];
    const uploadErrors = [];

    // Process files sequentially to avoid overwhelming the server
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({ current: i + 1, total: files.length });

      try {
        // Upload CSV
        console.log(`Uploading file: ${file.name}`);
        const response = await uploadCSV(file);
        console.log(`Upload response for ${file.name}:`, response.data);

        // Handle new response format with multiple occurrences
        if (response.data.results && Array.isArray(response.data.results)) {
          console.log(
            `Processing ${response.data.results.length} occurrences from ${file.name}`,
          );

          for (const occurrence of response.data.results) {
            // Skip occurrences that failed to process
            if (occurrence.skipped) {
              console.log(
                `Skipping failed occurrence: ${occurrence.paperCode}`,
              );
              uploadErrors.push({
                fileName: file.name,
                error: `${occurrence.paperCode}: ${occurrence.error}`,
              });
              continue;
            }

            console.log(`Processing occurrence: ${occurrence.paperCode}`);

            // Attempt to scrape outline for this occurrence
            let scrapeResult = null;
            if (
              occurrence.code &&
              occurrence.year &&
              occurrence.trimester &&
              occurrence.location
            ) {
              console.log(
                `Attempting to scrape outline for ${occurrence.paperCode}`,
              );
              try {
                scrapeResult = await handleScrapeAndSaveOutline({
                  occurrenceId: occurrence.occurrenceId,
                  code: occurrence.code,
                  year: occurrence.year,
                  trimester: occurrence.trimester,
                  location: occurrence.location,
                });
                console.log(
                  `Scrape result for ${occurrence.paperCode}:`,
                  scrapeResult,
                );
              } catch (scrapeError) {
                console.error(
                  `Scrape failed for ${occurrence.paperCode}:`,
                  scrapeError,
                );
                // Don't let scraping errors stop the process
                scrapeResult = { success: false, error: scrapeError.message };
              }
            } else {
              console.log(
                `Missing data for scraping ${occurrence.paperCode}:`,
                {
                  code: occurrence.code,
                  year: occurrence.year,
                  trimester: occurrence.trimester,
                  location: occurrence.location,
                },
              );
            }

            uploadResults.push({
              fileName: file.name,
              paperCode: occurrence.paperCode,
              studentCount: occurrence.studentCount,
              scraped: scrapeResult?.success || false,
              scrapeError:
                scrapeResult?.success === false ? scrapeResult.error : null,
            });
          }
        } else {
          // Fallback for old single-occurrence format (if you still support it)
          console.log("Using legacy single-occurrence format");
          let scrapeResult = null;
          if (
            response.data.code &&
            response.data.year &&
            response.data.trimester &&
            response.data.location
          ) {
            try {
              scrapeResult = await handleScrapeAndSaveOutline({
                occurrenceId: response.data.occurrenceId,
                code: response.data.code,
                year: response.data.year,
                trimester: response.data.trimester,
                location: response.data.location,
              });
            } catch (scrapeError) {
              console.error("Scrape failed:", scrapeError);
              scrapeResult = { success: false, error: scrapeError.message };
            }
          }

          uploadResults.push({
            fileName: file.name,
            ...response.data,
            scraped: scrapeResult?.success || false,
          });
        }
      } catch (err) {
        console.error(`Error processing file ${file.name}:`, err);
        uploadErrors.push({
          fileName: file.name,
          error: err.response?.data?.error || err.message || "Upload failed",
        });
      }
    }

    console.log("Final upload results:", uploadResults);
    console.log("Final upload errors:", uploadErrors);

    setResults(uploadResults);
    setErrors(uploadErrors);
    setFiles([]);
    setUploading(false);

    // Reset file input
    document.getElementById("csv-input").value = "";
  };

  return (
    <div className="csv-upload-container">
      <h2>Upload Grade CSV</h2>

      <div className="upload-area">
        <div className="upload-box">
          <input
            id="csv-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="file-input"
            multiple
          />

          {files.length > 0 && (
            <div className="file-list">
              <p>
                <strong>{files.length}</strong> file(s) selected:
              </p>
              <ul>
                {files.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="upload-button"
          >
            {uploading
              ? `Uploading... (${progress.current}/${progress.total})`
              : `Upload ${files.length} CSV${files.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          <div>
            <strong>Failed uploads ({errors.length}):</strong>
            <ul>
              {errors.map((err, idx) => (
                <li key={idx}>
                  <strong>{err.fileName}</strong>: {err.error}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          <div>
            <strong>Successfully uploaded ({results.length}):</strong>
            <ul>
              {results.map((result, idx) => (
                <li key={idx}>
                  <strong>{result.paperCode}</strong>: {result.studentCount}{" "}
                  students
                  {/* {result.scraped && " (outline scraped)"}
                  {result.scrapeError &&
                    ` (scrape failed: ${result.scrapeError})`} */}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
