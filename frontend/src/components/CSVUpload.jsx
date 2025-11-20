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
          paper.occurrenceId
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
        const response = await uploadCSV(file);

        // Attempt to scrape outline if we have the necessary info
        let scrapeResult = null;
        if (
          response.data.code &&
          response.data.year &&
          response.data.trimester &&
          response.data.location
        ) {
          scrapeResult = await handleScrapeAndSaveOutline({
            occurrenceId: response.data.occurrenceId,
            code: response.data.code,
            year: response.data.year,
            trimester: response.data.trimester,
            location: response.data.location,
          });
        }

        uploadResults.push({
          fileName: file.name,
          ...response.data,
          scraped: scrapeResult?.success || false,
        });
      } catch (err) {
        uploadErrors.push({
          fileName: file.name,
          error: err.response?.data?.error || "Upload failed",
        });
      }
    }

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
                  {result.scraped && " (outline scraped)"}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
