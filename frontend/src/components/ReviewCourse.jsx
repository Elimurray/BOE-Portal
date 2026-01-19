import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./Review.css";
import {
  getOccurrences,
  getOccurrenceReview,
  updateGradeDistribution,
} from "../services/api";
import GradeDistributionChart from "./GradeDistributionChart";
import HistoricalDistributionChart from "./HistoricalDistributionChart";
import HistoricalStatsTable from "./HistoricalStatsTable";
import ComparisonDistributionChart from "./ComparisonDistributionChart";

export default function ReviewCourse() {
  const navigate = useNavigate();
  const { occurrenceId } = useParams();
  const [selectedOccurrence, setSelectedOccurrence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [occurrences, setOccurrences] = useState([]);
  const [isEditingGrades, setIsEditingGrades] = useState(false);
  const [editedGrades, setEditedGrades] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Comparison states
  const [compareOccurrence, setCompareOccurrence] = useState(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareSearchTerm, setCompareSearchTerm] = useState("");
  const [allOccurrences, setAllOccurrences] = useState([]);

  useEffect(() => {
    fetchOccurrence();
    fetchAllOccurrences();
  }, [occurrenceId]);

  const fetchAllOccurrences = async () => {
    try {
      const response = await getOccurrences();
      // Filter to only submitted occurrences
      const submitted = response.data.filter(
        (occ) => occ.form_status === "submitted",
      );
      setAllOccurrences(submitted);
    } catch (error) {
      console.error("Error fetching all occurrences:", error);
    }
  };

  const fetchOccurrence = async () => {
    setLoading(true);
    try {
      const response = await getOccurrenceReview(occurrenceId);
      const occurrence = response.data;
      setSelectedOccurrence(occurrence);
      // Initialize edited grades with current values
      initializeEditedGrades(occurrence);
    } catch (error) {
      console.error("Error fetching occurrence:", error);
      alert("Failed to load occurrence");
      navigate("/form");
    } finally {
      setLoading(false);
    }
  };

  const initializeEditedGrades = (occurrence) => {
    setEditedGrades({
      a_plus: occurrence.grade_a_plus || 0,
      a: occurrence.grade_a || 0,
      a_minus: occurrence.grade_a_minus || 0,
      b_plus: occurrence.grade_b_plus || 0,
      b: occurrence.grade_b || 0,
      b_minus: occurrence.grade_b_minus || 0,
      c_plus: occurrence.grade_c_plus || 0,
      c: occurrence.grade_c || 0,
      c_minus: occurrence.grade_c_minus || 0,
      d: occurrence.grade_d || 0,
      e: occurrence.grade_e || 0,
      rp: occurrence.grade_rp || 0,
    });
  };

  const handleOccurrenceSelect = async (e) => {
    const occurrenceId = e.target.value;
    if (!occurrenceId) {
      setSelectedOccurrence(null);
      return;
    }

    setLoading(true);
    try {
      const response = await getOccurrenceReview(occurrenceId);
      const occurrence = response.data;
      console.log(occurrence);
      setSelectedOccurrence(occurrence);
      initializeEditedGrades(occurrence);
      setIsEditingGrades(false);
    } catch (error) {
      console.error("Error fetching occurrence:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (gradeKey, value) => {
    const numValue = parseInt(value) || 0;
    setEditedGrades((prev) => ({
      ...prev,
      [gradeKey]: numValue,
    }));
  };

  const handleSaveGrades = async () => {
    try {
      await updateGradeDistribution(occurrenceId, editedGrades);
      alert("Grades updated successfully!");
      setIsEditingGrades(false);
      setRefreshKey((prev) => prev + 1);
      await fetchOccurrence();
    } catch (error) {
      console.error("Error updating grades:", error);
      alert("Failed to update grades. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    initializeEditedGrades(selectedOccurrence);
    setIsEditingGrades(false);
  };

  const calculateTotal = () => {
    return Object.values(editedGrades).reduce((sum, val) => sum + val, 0);
  };

  // Helper function to format occurrence code
  const formatOccurrenceCode = (occ) => {
    const shortYear = occ.year.toString().slice(-2);
    return `${occ.paper_code}-${shortYear}${occ.trimester} (${occ.location})`;
  };

  // Filter occurrences for compare search
  const getFilteredCompareOccurrences = () => {
    if (!compareSearchTerm) return allOccurrences;

    const searchLower = compareSearchTerm.toLowerCase();
    return allOccurrences.filter((occ) => {
      const code = formatOccurrenceCode(occ).toLowerCase();
      const name = occ.paper_name?.toLowerCase() || "";
      return code.includes(searchLower) || name.includes(searchLower);
    });
  };

  const handleCompareSelect = (occurrence) => {
    setCompareOccurrence(occurrence);
    setShowCompareModal(false);
    setCompareSearchTerm("");
  };

  const gradeLabels = {
    a_plus: "A+",
    a: "A",
    a_minus: "A-",
    b_plus: "B+",
    b: "B",
    b_minus: "B-",
    c_plus: "C+",
    c: "C",
    c_minus: "C-",
    d: "D",
    e: "E",
    rp: "RP",
  };

  return (
    <div className="review-page">
      <button className="back-button" onClick={() => navigate("/review")}>
        ← Back to Search
      </button>
      <h2>Review Paper Occurrence</h2>

      {/* Compare Modal */}
      {showCompareModal && selectedOccurrence && (
        <div
          className="compare-modal-overlay"
          onClick={() => setShowCompareModal(false)}
        >
          <div className="compare-modal" onClick={(e) => e.stopPropagation()}>
            <div className="compare-modal-header">
              <h3>Select Occurrence to Compare</h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowCompareModal(false)}
              >
                ×
              </button>
            </div>

            <input
              type="text"
              className="compare-search-input"
              placeholder="Search by code or name..."
              value={compareSearchTerm}
              onChange={(e) => setCompareSearchTerm(e.target.value)}
              autoFocus
            />

            <div className="compare-occurrences-list">
              {getFilteredCompareOccurrences().map((occ) => {
                const isCurrent =
                  occ.occurrence_id === selectedOccurrence.occurrence_id;
                return (
                  <button
                    key={occ.occurrence_id}
                    className={`compare-occurrence-item ${
                      isCurrent ? "current" : ""
                    }`}
                    onClick={() => handleCompareSelect(occ)}
                    disabled={isCurrent}
                  >
                    <div className="occurrence-code">
                      {formatOccurrenceCode(occ)}
                    </div>
                    <div className="occurrence-name">
                      {occ.paper_name || "N/A"}
                    </div>
                    {isCurrent && (
                      <span className="current-badge">(Current)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {selectedOccurrence && (
        <div className="review-content">
          {/* Paper Overview Card */}
          <div className="overview-card">
            <h3>Paper Overview</h3>
            <div className="overview-grid">
              <div className="overview-item">
                <span className="label">Paper Code:</span>
                <span className="value">{selectedOccurrence.paper_code}</span>
              </div>
              <div className="overview-item">
                <span className="label">Paper Name:</span>
                <span className="value">{selectedOccurrence.paper_name}</span>
              </div>
              <div className="overview-item">
                <span className="label">Year:</span>
                <span className="value">{selectedOccurrence.year}</span>
              </div>
              <div className="overview-item">
                <span className="label">Trimester:</span>
                <span className="value">{selectedOccurrence.trimester}</span>
              </div>
              <div className="overview-item">
                <span className="label">Location:</span>
                <span className="value">{selectedOccurrence.location}</span>
              </div>
              <div className="overview-item">
                <span className="label">Points:</span>
                <span className="value">
                  {selectedOccurrence.outline_data?.points || "N/A"}
                </span>
              </div>
              <div className="overview-item">
                <span className="label">Delivery Mode:</span>
                <span className="value">
                  {selectedOccurrence.outline_data?.deliveryMode || "N/A"}
                </span>
              </div>
              <div className="overview-item">
                <span className="label">Form Status:</span>
                <span
                  className={`value status-${
                    selectedOccurrence.form_status || "none"
                  }`}
                >
                  {selectedOccurrence.form_status || "Not Submitted"}
                </span>
              </div>
            </div>
          </div>

          {/* Paper Outline Information */}
          {selectedOccurrence.outline_data && (
            <div className="outline-card">
              <h3>Paper Outline</h3>
              <table className="info-table">
                <tbody>
                  <tr>
                    <td className="info-label">Convenor(s)</td>
                    <td className="info-value">
                      {selectedOccurrence.outline_data?.convenors?.length > 0
                        ? selectedOccurrence.outline_data.convenors.map(
                            (conv, index) => (
                              <div key={index}>
                                {conv.name}
                                {conv.email && ` (${conv.email})`}
                              </div>
                            ),
                          )
                        : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="info-label">Delivery Mode</td>
                    <td className="info-value">
                      {selectedOccurrence.outline_data.deliveryMode || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="info-label">Location</td>
                    <td className="info-value">
                      {selectedOccurrence.outline_data.whereTaught || "N/A"}
                    </td>
                  </tr>
                  {selectedOccurrence.outline_data.tutors?.length > 0 && (
                    <tr>
                      <td className="info-label">Tutors</td>
                      <td className="info-value">
                        {selectedOccurrence.outline_data.tutors.map(
                          (tutor, index) => (
                            <div key={index}>
                              {typeof tutor === "string"
                                ? tutor
                                : `${tutor.name}${
                                    tutor.email ? ` (${tutor.email})` : ""
                                  }`}
                            </div>
                          ),
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Course Form Information (if submitted) */}
          {selectedOccurrence.form_status && (
            <div className="form-card">
              <h3>Course Form Details</h3>

              <h4>Staff Information</h4>
              <table className="info-table">
                <tbody>
                  <tr>
                    <td className="info-label">Lecturers</td>
                    <td className="info-value">
                      {selectedOccurrence.lecturers || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="info-label">Tutors</td>
                    <td className="info-value">
                      {selectedOccurrence.tutors || "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>

              <h4>Assessment Structure</h4>
              <table className="info-table">
                <tbody>
                  <tr>
                    <td className="info-label">Number of Items</td>
                    <td className="info-value">
                      {selectedOccurrence.assessment_item_count || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="info-label">Internal/External Split</td>
                    <td className="info-value">
                      {selectedOccurrence.internal_external_split || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="info-label">Assessment Types</td>
                    <td className="info-value">
                      {selectedOccurrence.assessment_types_summary || "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>

              <h4>Commentary</h4>
              <div className="commentary-box">
                <h5>Major Changes:</h5>
                <p>
                  {selectedOccurrence.major_changes_description ||
                    "None reported"}
                </p>
              </div>

              {selectedOccurrence.grade_distribution_different && (
                <div className="commentary-box">
                  <h5>Grade Distribution Comments:</h5>
                  <p>{selectedOccurrence.grade_distribution_comments}</p>
                </div>
              )}

              {selectedOccurrence.other_comments && (
                <div className="commentary-box">
                  <h5>Other Comments:</h5>
                  <p>{selectedOccurrence.other_comments}</p>
                </div>
              )}
            </div>
          )}

          {/* Grade Statistics Card with Edit Functionality */}
          <div className="statistics-card">
            <div className="statistics-header">
              <h3>Grade Statistics</h3>
              {!isEditingGrades ? (
                <button
                  className="edit-grades-button"
                  onClick={() => setIsEditingGrades(true)}
                >
                  Edit Grades
                </button>
              ) : (
                <div className="edit-actions">
                  <button
                    className="save-grades-button"
                    onClick={handleSaveGrades}
                  >
                    Save Changes
                  </button>
                  <button
                    className="cancel-edit-button"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {!isEditingGrades ? (
              <div className="stats-grid">
                <div className="stat-item highlight">
                  <span className="stat-label">Total Students</span>
                  <span className="stat-value">
                    {selectedOccurrence.total_students || "N/A"}
                  </span>
                </div>
                <div className="stat-item highlight">
                  <span className="stat-label">Pass Rate</span>
                  <span className="stat-value">
                    {selectedOccurrence.pass_rate
                      ? `${selectedOccurrence.pass_rate}%`
                      : "N/A"}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Restricted Passes</span>
                  <span className="stat-value">
                    {selectedOccurrence.grade_rp || 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="grade-edit-form">
                <div className="grade-inputs-grid">
                  {Object.entries(gradeLabels).map(([key, label]) => (
                    <div key={key} className="grade-input-field">
                      <label>{label}</label>
                      <input
                        type="number"
                        min="0"
                        value={editedGrades[key]}
                        onChange={(e) => handleGradeChange(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="grade-total">
                  Total Students: {calculateTotal()}
                </div>
              </div>
            )}
          </div>

          {/* Graphs Section */}
          {/* Distribution with compare button */}
          <div className="graphs-section">
            <div className="graph-card-left">
              <div className="graph-card-header">
                <div>
                  <h3>
                    {compareOccurrence
                      ? "Grade Distribution Comparison"
                      : "Grade Distribution"}
                  </h3>
                  <p className="graph-description">
                    {compareOccurrence
                      ? `${formatOccurrenceCode(
                          selectedOccurrence,
                        )} vs ${formatOccurrenceCode(compareOccurrence)}`
                      : `${formatOccurrenceCode(selectedOccurrence)}`}
                  </p>
                </div>
                <button
                  className="compare-chart-btn"
                  onClick={() =>
                    compareOccurrence
                      ? setCompareOccurrence(null)
                      : setShowCompareModal(true)
                  }
                >
                  {compareOccurrence ? "Clear Compare" : "Compare"}
                </button>
              </div>

              {compareOccurrence ? (
                <ComparisonDistributionChart
                  key={`comparison-${selectedOccurrence.occurrence_id}-${compareOccurrence.occurrence_id}`}
                  occurrence1Id={selectedOccurrence.occurrence_id}
                  occurrence2Id={compareOccurrence.occurrence_id}
                  occurrence1Label={formatOccurrenceCode(selectedOccurrence)}
                  occurrence2Label={formatOccurrenceCode(compareOccurrence)}
                  isFullscreen={false}
                />
              ) : (
                <GradeDistributionChart
                  key={`grade-${selectedOccurrence.occurrence_id}-${refreshKey}`}
                  occurrenceId={selectedOccurrence.occurrence_id}
                />
              )}
            </div>

            <div className="graph-card">
              {compareOccurrence ? (
                // Compare mode: stats side-by-side
                <>
                  <div className="graph-section right">
                    <h3>Statistics Comparison</h3>

                    <h4 className="stat-label">
                      {formatOccurrenceCode(selectedOccurrence)}
                    </h4>
                    <HistoricalStatsTable
                      key={`stats-${selectedOccurrence.occurrence_id}-${refreshKey}`}
                      paperCode={selectedOccurrence.paper_code}
                      location={selectedOccurrence.location}
                      trimester={selectedOccurrence.trimester}
                    />
                    <h4 className="stat-label">
                      {formatOccurrenceCode(compareOccurrence)}
                    </h4>
                    <HistoricalStatsTable
                      paperCode={compareOccurrence.paper_code}
                      location={compareOccurrence.location}
                      trimester={compareOccurrence.trimester}
                    />
                  </div>
                </>
              ) : (
                // Single view: stats
                <>
                  <div className="graph-section right">
                    <h3>Historical Statistics</h3>
                    <HistoricalStatsTable
                      key={`stats-${selectedOccurrence.occurrence_id}-${refreshKey}`}
                      paperCode={selectedOccurrence.paper_code}
                      location={selectedOccurrence.location}
                      trimester={selectedOccurrence.trimester}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Historical Distribution*/}
          <div className="graph-card">
            <div className="graph-card-header">
              <div>
                <h3>Historical Distribution</h3>
                <p className="graph-description">
                  Comparing with previous years
                </p>
              </div>
            </div>
            <HistoricalDistributionChart
              key={`historical-${selectedOccurrence.occurrence_id}-${refreshKey}`}
              occurrenceId={selectedOccurrence.occurrence_id}
            />
          </div>
        </div>
      )}
    </div>
  );
}
