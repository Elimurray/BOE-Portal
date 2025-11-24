import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Present.css";
import { getOccurrences } from "../services/api";
import GradeDistributionChart from "./GradeDistributionChart";
import HistoricalDistributionChart from "./HistoricalDistributionChart";
import HistoricalStatsTable from "./HistoricalStatsTable";

export default function Present() {
  const navigate = useNavigate();
  const [occurrences, setOccurrences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOccurrences();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextOccurrence();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        previousOccurrence();
      } else if (e.key === "Escape") {
        navigate("/review");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, occurrences]);

  const fetchOccurrences = async () => {
    setLoading(true);
    try {
      const response = await getOccurrences();
      // Filter to only occurrences with submitted forms
      const submitted = response.data.filter(
        (occ) => occ.form_status === "submitted"
      );
      setOccurrences(submitted);
    } catch (error) {
      console.error("Error fetching occurrences:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextOccurrence = () => {
    if (currentIndex < occurrences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const previousOccurrence = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return <div className="present-page loading">Loading...</div>;
  }

  if (occurrences.length === 0) {
    return (
      <div className="present-page">
        <div className="no-data">
          <h2>No occurrences with submitted forms found</h2>
          <button onClick={() => navigate("/review")}>Back to Review</button>
        </div>
      </div>
    );
  }

  const current = occurrences[currentIndex];
  const shortYear = current.year.toString().slice(-2);
  const occurrenceCode = `${current.paper_code}-${shortYear}${current.trimester} (${current.location})`;

  return (
    <div className="present-page">
      {/* Header with navigation */}
      <div className="present-header">
        <button className="back-button" onClick={() => navigate("/")}>
          Exit Presentation
        </button>
        <div className="progress">
          {currentIndex + 1} / {occurrences.length}
        </div>
      </div>

      {/* Main content */}
      <div className="present-content">
        {/* Title slide */}
        <div className="title-slide">
          <h1>{occurrenceCode}</h1>
          <h2>{current.paper_name}</h2>
          <div className="occurrence-stats">
            <span className="stat">
              Total Students: {current.total_students || "N/A"}
            </span>
            <span className="stat">
              Pass Rate: {current.pass_rate ? `${current.pass_rate}%` : "N/A"}
            </span>
          </div>
        </div>

        {/* Graphs section */}
        <div className="graphs-container">
          <div className="graph-section">
            <h3>Grade Distribution</h3>
            <GradeDistributionChart occurrenceId={current.occurrence_id} />
          </div>

          <div className="graph-section">
            <h3>Historical Statistics</h3>
            <HistoricalStatsTable paperCode={current.paper_code} />
          </div>

          <div className="graph-section full-width">
            <h3>Historical Distribution Comparison</h3>
            <HistoricalDistributionChart occurrenceId={current.occurrence_id} />
          </div>
        </div>
      </div>

      {/* Navigation controls */}
      <div className="present-navigation">
        <button
          className="back-button"
          onClick={previousOccurrence}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>
        <div className="occurrence-selector">
          <select
            value={currentIndex}
            onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
          >
            {occurrences.map((occ, idx) => {
              const year = occ.year.toString().slice(-2);
              const code = `${occ.paper_code}-${year}${occ.trimester} (${occ.location})`;
              return (
                <option key={occ.occurrence_id} value={idx}>
                  {code}
                </option>
              );
            })}
          </select>
        </div>
        <button
          className="back-button"
          onClick={nextOccurrence}
          disabled={currentIndex === occurrences.length - 1}
        >
          Next →
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="keyboard-hint">
        Use ← → arrow keys or space to navigate • ESC to exit
      </div>
    </div>
  );
}
