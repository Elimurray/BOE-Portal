import { useState } from "react";
import { uploadCSV, scrapeOutline, saveOutline } from "../services/api";
import "./CSVUpload.css";

export default function CSVUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
  };

  const handleScrapeAndSaveOutline = async (paper) => {
    setScraping(true);
    try {
      console.log("Starting scrape for paper:", paper);

      const response = await scrapeOutline({
        paperCode: paper.code,
        year: paper.year,
        semester: paper.semester,
        location: paper.location,
      });

      console.log("Scrape response:", response.data);

      if (response.data.success) {
        const scrapedData = response.data.data;

        console.log("Attempting to save outline for paper_id:", paper.paperId);
        console.log("Scraped data:", scrapedData);

        // Save the scraped data to the database
        const saveResponse = await saveOutline(paper.paperId, scrapedData);

        console.log("Save response:", saveResponse.data);
        console.log("Outline scraped and saved successfully");
      } else {
        console.error("Scrape was not successful:", response.data);
      }
    } catch (error) {
      console.error("Error in handleScrapeAndSaveOutline:", error);
      console.error("Error response:", error.response?.data);
    } finally {
      setScraping(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const response = await uploadCSV(file);
      setResult(response.data);
      setFile(null);

      // Reset file input
      document.getElementById("csv-input").value = "";

      // After successful upload, scrape and save outline if we have paper info
      if (
        response.data.code &&
        response.data.year &&
        response.data.semester &&
        response.data.location
      ) {
        console.log("CSV upload response data:", response.data);
        await handleScrapeAndSaveOutline({
          paperId: response.data.paperId,
          code: response.data.code,
          year: response.data.year,
          semester: response.data.semester,
          location: response.data.location,
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
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
          />

          {file && (
            <p className="file-name">
              Selected: <strong>{file.name}</strong>
            </p>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading || scraping}
            className="upload-button"
          >
            {uploading
              ? "Uploading..."
              : scraping
              ? "Scraping outline..."
              : "Upload CSV"}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          <span>
            Uploaded <strong>{result.studentCount}</strong> students for{" "}
            <strong>{result.paperCode}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
