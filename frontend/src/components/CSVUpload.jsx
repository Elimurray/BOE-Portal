import { useState } from "react";
import { uploadCSV } from "../services/api";
import "./CSVUpload.css";

export default function CSVUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
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
          <svg
            className="upload-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

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
            disabled={!file || uploading}
            className="upload-button"
          >
            {uploading ? "Uploading..." : "Upload CSV"}
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
