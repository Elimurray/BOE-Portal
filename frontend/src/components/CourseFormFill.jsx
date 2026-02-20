import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getOccurrence,
  submitForm,
  updateGradeDistribution,
} from "../services/api";
import GradeDistributionChart from "./GradeDistributionChart";
import HistoricalStatsTable from "./HistoricalStatsTable";
import HistoricalDistributionChart from "./HistoricalDistributionChart";
import "./CourseForm.css";

export default function CourseFormFill() {
  const { occurrenceId } = useParams();
  const navigate = useNavigate();
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingGrades, setIsEditingGrades] = useState(false);
  const [editedGrades, setEditedGrades] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [formData, setFormData] = useState({
    submittedByEmail: "",
    submittedByName: "",
    lecturers: "",
    tutors: "",
    rpCount: "",
    assessmentItemCount: "",
    internalExternalSplit: "",
    assessmentTypesSummary: "",
    deliveryMode: "",
    majorChangesDescription: "",
    gradeDistributionDifferent: false,
    gradeDistributionComments: "",
    otherComments: "",
  });

  useEffect(() => {
    fetchOccurrence();
  }, [occurrenceId]);

  const fetchOccurrence = async () => {
    setLoading(true);
    try {
      const response = await getOccurrence(occurrenceId);
      const occurrence = response.data;
      setSelectedPaper(occurrence);
      initializeEditedGrades(occurrence);

      // Prepopulate form with paper data
      setFormData((prev) => ({
        ...prev,
        lecturers:
          occurrence.outline?.lecturers?.map((c) => c.name).join(", ") ||
          occurrence.outline?.convenors?.map((c) => c.name).join(", ") ||
          "",
        tutors: occurrence.outline?.tutors?.map((t) => t.name).join(", ") || "",
        deliveryMode: occurrence.outline?.deliveryMode || "",
        internalExternalSplit: occurrence.outline?.assessmentRatio || "",
      }));
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
      a_plus: occurrence.gradeDistribution?.grade_a_plus || 0,
      a: occurrence.gradeDistribution?.grade_a || 0,
      a_minus: occurrence.gradeDistribution?.grade_a_minus || 0,
      b_plus: occurrence.gradeDistribution?.grade_b_plus || 0,
      b: occurrence.gradeDistribution?.grade_b || 0,
      b_minus: occurrence.gradeDistribution?.grade_b_minus || 0,
      c_plus: occurrence.gradeDistribution?.grade_c_plus || 0,
      c: occurrence.gradeDistribution?.grade_c || 0,
      c_minus: occurrence.gradeDistribution?.grade_c_minus || 0,
      d: occurrence.gradeDistribution?.grade_d || 0,
      e: occurrence.gradeDistribution?.grade_e || 0,
      rp: occurrence.gradeDistribution?.grade_rp || 0,
      ic: occurrence.gradeDistribution?.grade_ic || 0,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
    initializeEditedGrades(selectedPaper);
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
    ic: "IC",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await submitForm({
        occurrenceId: selectedPaper.occurrence_id,
        ...formData,
        rpCount: selectedPaper.gradeDistribution?.grade_rp || 0,
      });

      if (response.data.success) {
        alert("Form submitted successfully!");
        navigate("/form");
      }
    } catch (error) {
      alert(
        "Error submitting form: " +
          (error.response?.data?.error || error.message),
      );
    }
  };

  if (loading) {
    return <div className="loading-page">Loading occurrence...</div>;
  }

  if (!selectedPaper) {
    return <div className="error-page">Occurrence not found</div>;
  }

  return (
    <div className="course-form-fill-page">
      <div className="split-layout">
        {/* LEFT: Form */}
        <div className="form-panel">
          <button className="back-button" onClick={() => navigate("/form")}>
            ← Back to Search
          </button>
          <div className="paper-header">
            <h3>
              {selectedPaper.paper_code} - {selectedPaper.year}{" "}
              {selectedPaper.trimester} ({selectedPaper.location})
            </h3>
            <p className="paper-stats">
              {selectedPaper.gradeDistribution?.total_students || 0} students |{" "}
              {selectedPaper.gradeDistribution?.pass_rate || 0}% pass rate
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Submitter Info */}
            <section className="form-section">
              <h4>Submitter Information</h4>
              {/* <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="submittedByEmail"
                  value={formData.submittedByEmail}
                  onChange={handleInputChange}
                  required
                />
              </div> */}
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="submittedByName"
                  value={formData.submittedByName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </section>

            {/* Staff Info */}
            <section className="form-section">
              <h4>Staff Information</h4>
              <div className="form-group">
                <label>Lecturer(s) - e.g.(Firstname Lastname)</label>
                <input
                  type="text"
                  name="lecturers"
                  value={formData.lecturers}
                  onChange={handleInputChange}
                  placeholder="Prepopulated from paper outline"
                />
              </div>
              <div className="form-group">
                <label>Tutor(s)</label>
                <input
                  type="text"
                  name="tutors"
                  value={formData.tutors}
                  onChange={handleInputChange}
                  placeholder="Prepopulated from paper outline"
                />
              </div>
            </section>

            {/* Grade Statistics */}
            <section className="form-section">
              <div className="statistics-header">
                <h4>Grade Statistics</h4>
                {!isEditingGrades ? (
                  <button
                    type="button"
                    className="edit-grades-button"
                    onClick={() => setIsEditingGrades(true)}
                  >
                    Edit Grades
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button
                      type="button"
                      className="save-grades-button"
                      onClick={handleSaveGrades}
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="cancel-edit-button"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {!isEditingGrades ? (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Student Count</label>
                      <input
                        type="number"
                        value={
                          selectedPaper.gradeDistribution?.total_students || 0
                        }
                        readOnly
                        className="readonly"
                      />
                    </div>
                    <div className="form-group">
                      <label>Pass Rate (%)</label>
                      <input
                        type="number"
                        value={selectedPaper.gradeDistribution?.pass_rate || 0}
                        readOnly
                        className="readonly"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Pass / Fail</label>
                    <input
                      type="text"
                      value={`${
                        selectedPaper.gradeDistribution?.pass_count || 0
                      } / ${
                        (selectedPaper.gradeDistribution?.total_students || 0) -
                        (selectedPaper.gradeDistribution?.pass_count || 0)
                      }`}
                      readOnly
                      className="readonly"
                    />
                  </div>
                  <div className="form-group">
                    <label>Number of Restricted Passes (RP) *</label>
                    <input
                      type="number"
                      value={selectedPaper.gradeDistribution.grade_rp}
                      readOnly
                      className="readonly"
                    />
                  </div>
                </>
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
                          onChange={(e) =>
                            handleGradeChange(key, e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grade-total">
                    Total Students: {calculateTotal()}
                  </div>
                </div>
              )}
            </section>

            {/* Assessment Structure */}
            <section className="form-section">
              <h4>Assessment Structure</h4>
              <div className="form-group">
                <label>Number of Assessment Items *</label>
                <input
                  type="number"
                  name="assessmentItemCount"
                  value={formData.assessmentItemCount}
                  onChange={handleInputChange}
                  required
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Internal / External Split *</label>
                <input
                  type="text"
                  name="internalExternalSplit"
                  value={formData.internalExternalSplit}
                  onChange={handleInputChange}
                  placeholder="e.g., 60/40 or 100/0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Assessment Types Summary *</label>
                <textarea
                  name="assessmentTypesSummary"
                  value={formData.assessmentTypesSummary}
                  onChange={handleInputChange}
                  placeholder="e.g., practical assignment, quiz, written test"
                  rows="3"
                  required
                />
              </div>
            </section>

            {/* Delivery Information */}
            <section className="form-section">
              <h4>Delivery Information</h4>
              <div className="form-group">
                <label>Delivery Mode *</label>
                <select
                  name="deliveryMode"
                  value={formData.deliveryMode}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select mode</option>
                  <option value="OnCampus">On Campus</option>
                  <option value="Online">Online</option>
                  <option value="Blended">Blended</option>
                  <option value="Dual">Dual</option>
                </select>
              </div>
            </section>

            {/* Commentary */}
            <section className="form-section">
              <h4>Reflective Commentary</h4>
              <div className="form-group">
                <label>Major Changes Since Last Year</label>
                <textarea
                  name="majorChangesDescription"
                  value={formData.majorChangesDescription}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Describe any significant changes to content, assessment, or delivery"
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="gradeDistributionDifferent"
                    checked={formData.gradeDistributionDifferent}
                    onChange={handleInputChange}
                  />
                  Grade distribution significantly different from previous
                  instances?
                </label>
              </div>
              {formData.gradeDistributionDifferent && (
                <div className="form-group">
                  <label>Please Comment on Differences</label>
                  <textarea
                    name="gradeDistributionComments"
                    value={formData.gradeDistributionComments}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Any Other Comments</label>
                <textarea
                  name="otherComments"
                  value={formData.otherComments}
                  onChange={handleInputChange}
                  rows="4"
                />
              </div>
            </section>

            <button type="submit" className="submit-button">
              Submit Form
            </button>
          </form>
        </div>

        {/* RIGHT: Graphs */}
        <div className="graph-panel">
          <h3>Grade Distribution</h3>
          <p className="graph-description">
            {selectedPaper.year}
            {selectedPaper.trimester} for {selectedPaper.paper_code}
          </p>
          <GradeDistributionChart
            key={`grade-${selectedPaper.occurrence_id}-${refreshKey}`}
            occurrenceId={selectedPaper.occurrence_id}
          />

          <h3>Historical Statistics</h3>
          <p className="graph-description">Comparing with previous years</p>

          <HistoricalStatsTable
            key={`stats-${selectedPaper.occurrence_id}-${refreshKey}`}
            paperCode={selectedPaper.paper_code}
            location={selectedPaper.location}
            trimester={selectedPaper.trimester}
          />

          <h3>Historical Distribution</h3>
          <p className="graph-description">Comparing with previous years</p>
          <HistoricalDistributionChart
            key={`historical-${selectedPaper.occurrence_id}-${refreshKey}`}
            occurrenceId={selectedPaper.occurrence_id}
          />
        </div>
      </div>
    </div>
  );
}
