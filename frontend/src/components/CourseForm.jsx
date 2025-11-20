import { useState, useEffect } from "react";
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
import "./CourseForm.css";
import GradeDistributionChart from "./GradeDistributionChart";
import HistoricalStatsTable from "./HistoricalStatsTable";
import HistoricalDistributionChart from "./HistoricalDistributionChart";

export default function CourseForm() {
  const [occurrences, setOccurrences] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
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
      console.log("Error fetching paper:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPaper) {
      alert("Please select a paper");
      return;
    }

    try {
      const response = await submitForm({
        occurrenceId: selectedPaper.occurrence_id,
        ...formData,
      });

      if (response.data.success) {
        alert("Form submitted successfully!");
        // Reset form
        setSelectedPaper(null);
        setFormData({
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
      }
    } catch (error) {
      alert(
        "Error submitting form: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  return (
    <div className="course-form-page">
      <h2>Course Form Submission</h2>

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
        {scraping && (
          <span className="loading-text">Scraping paper outline...</span>
        )}
      </div>

      {selectedPaper && (
        <div className="split-layout">
          {/* LEFT: Form */}
          <div className="form-panel">
            <div className="paper-header">
              <h3>
                {selectedPaper.paper_code} - {selectedPaper.year}{" "}
                {selectedPaper.trimester} ({selectedPaper.location})
              </h3>
              <p className="paper-stats">
                {selectedPaper.gradeDistribution?.total_students || 0} students
                | {selectedPaper.gradeDistribution?.pass_rate || 0}% pass rate
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Submitter Info */}
              <section className="form-section">
                <h4>Submitter Information</h4>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="submittedByEmail"
                    value={formData.submittedByEmail}
                    onChange={handleInputChange}
                    required
                  />
                </div>
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
                  <label>Lecturer(s)</label>
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
                <h4>Grade Statistics</h4>
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
                    name="rpCount"
                    value={formData.rpCount}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </div>
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
              occurrenceId={selectedPaper.occurrence_id}
            />

            <h3>Historical Statistics</h3>
            <p className="graph-description">Comparing with previous years</p>
            <HistoricalStatsTable paperCode={selectedPaper.paper_code} />

            <h3>Historical Distribution</h3>
            <p className="graph-description">Comparing with previous years</p>
            <HistoricalDistributionChart
              occurrenceId={selectedPaper.occurrence_id}
            />
          </div>
        </div>
      )}
    </div>
  );
}
