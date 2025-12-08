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

export default function ReviewCourse() {
  const navigate = useNavigate();
  const { occurrenceId } = useParams();
  const [selectedOccurrence, setSelectedOccurrence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [occurrences, setOccurrences] = useState([]);
  const [isEditingGrades, setIsEditingGrades] = useState(false);
  const [editedGrades, setEditedGrades] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchOccurrence();
  }, [occurrenceId]);

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
              <div className="outline-info">
                <p>
                  <strong>Convenor(s):</strong>{" "}
                  {selectedOccurrence.outline_data?.convenors?.length > 0
                    ? selectedOccurrence.outline_data.convenors.map(
                        (conv, index) => (
                          <span key={index}>
                            {conv.name}
                            {conv.email && ` (${conv.email})`}
                            {index <
                              selectedOccurrence.outline_data.convenors.length -
                                1 && ", "}
                          </span>
                        )
                      )
                    : "N/A"}
                </p>
                <p>
                  <strong>Delivery Mode:</strong>{" "}
                  {selectedOccurrence.outline_data.deliveryMode || "N/A"}
                </p>
                <p>
                  <strong>Location:</strong>{" "}
                  {selectedOccurrence.outline_data.whereTaught || "N/A"}
                </p>
                {selectedOccurrence.outline_data.tutors?.length > 0 && (
                  <p>
                    <strong>Tutors:</strong>{" "}
                    {selectedOccurrence.outline_data.tutors.map(
                      (tutor, index) => (
                        <span key={index}>
                          {typeof tutor === "string"
                            ? tutor
                            : `${tutor.name}${
                                tutor.email ? ` (${tutor.email})` : ""
                              }`}
                          {index <
                            selectedOccurrence.outline_data.tutors.length -
                              1 && <br />}
                        </span>
                      )
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Course Form Information (if submitted) */}
          {selectedOccurrence.form_status && (
            <div className="form-card">
              <h3>Course Form Details</h3>
              <div className="form-info">
                <div className="form-section">
                  <h4>Staff Information</h4>
                  <p>
                    <strong>Lecturers:</strong>{" "}
                    {selectedOccurrence.lecturers || "N/A"}
                  </p>
                  <p>
                    <strong>Tutors:</strong>{" "}
                    {selectedOccurrence.tutors || "N/A"}
                  </p>
                </div>

                <div className="form-section">
                  <h4>Assessment Structure</h4>
                  <p>
                    <strong>Number of Items:</strong>{" "}
                    {selectedOccurrence.assessment_item_count || "N/A"}
                  </p>
                  <p>
                    <strong>Internal/External Split:</strong>{" "}
                    {selectedOccurrence.internal_external_split || "N/A"}
                  </p>
                  <p>
                    <strong>Assessment Types:</strong>{" "}
                    {selectedOccurrence.assessment_types_summary || "N/A"}
                  </p>
                </div>

                <div className="form-section">
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
              </div>
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
          <div className="graphs-section">
            <div className="graph-card">
              <h3>Grade Distribution</h3>
              <p className="graph-description">
                {selectedOccurrence.year}
                {selectedOccurrence.trimester} for{" "}
                {selectedOccurrence.paper_code}
              </p>
              <GradeDistributionChart
                key={`grade-${selectedOccurrence.occurrence_id}-${refreshKey}`}
                occurrenceId={selectedOccurrence.occurrence_id}
              />
            </div>

            <div className="graph-card">
              <h3>Historical Statistics</h3>
              <p className="graph-description">Comparing with previous years</p>
              <HistoricalStatsTable
                key={`stats-${selectedOccurrence.occurrence_id}-${refreshKey}`}
                paperCode={selectedOccurrence.paper_code}
                location={selectedOccurrence.location}
              />
            </div>
          </div>
          <div className="graph-card">
            <h3>Historical Distribution</h3>
            <p className="graph-description">Comparing with previous years</p>
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
