import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Review.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  getPapers,
  getPaper,
  submitForm,
  scrapeOutline,
  getOccurrences,
  getOccurrence,
} from "../services/api";
import GradeDistributionChart from "./GradeDistributionChart";
import HistoricalComparisonChart from "./HistoricalComparisonChart";

export default function Review() {
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [loading, setLoading] = useState(false);
  const [occurrences, setOccurrences] = useState([]);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const response = await getOccurrences();
      setOccurrences(response.data);
    } catch (error) {
      console.error("Error fetching papers:", error);
    }
  };

  const handleOccurrenceSelect = async (e) => {
    const occurrenceId = e.target.value;
    if (!occurrenceId) {
      setSelectedPaper(null);
      return;
    }

    setLoading(true);
    try {
      const response = await getOccurrence(occurrenceId);
      const occurrence = response.data;
      console.log(occurrence);
      setSelectedPaper(occurrence);
    } catch (error) {
      console.log("Error fetching paper:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-page">
      <h2>Review Occurrence</h2>
      {/* Occurrence Selector */}
      <div className="paper-selector">
        <label htmlFor="occurrence-select">Select Paper Occurrence:</label>
        <select
          id="occurrence-select"
          onChange={handleOccurrenceSelect}
          disabled={loading}
        >
          <option value="">-- Select a paper occurrence --</option>
          {occurrences.map((occurrence) => {
            const shortYear = occurrence.year.toString().slice(-2);
            const occurrenceCode = `${occurrence.paper_code}-${shortYear}${occurrence.trimester} (${occurrence.location})`;

            return (
              <option
                key={occurrence.occurrence_id}
                value={occurrence.occurrence_id}
              >
                {occurrenceCode} - {occurrence.paper_name}
              </option>
            );
          })}
        </select>
      </div>

      {/* Only render graph panel if a paper is selected */}
      {selectedPaper && (
        <div className="graph-panel">
          <h3>Grade Distribution</h3>
          <p className="graph-description">
            Current semester for {selectedPaper.paper_code}
          </p>
          <GradeDistributionChart occurrenceId={selectedPaper.occurrence_id} />

          <h3>Historical Comparison</h3>
          <p className="graph-description">Comparing with previous years</p>
          <HistoricalComparisonChart paperCode={selectedPaper.paper_code} />
        </div>
      )}
    </div>
  );
}
