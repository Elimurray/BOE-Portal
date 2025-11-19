import { Link } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Board of Examiners Portal</h1>
        <p className="subtitle">Manage course data and review forms</p>
      </div>

      <div className="dashboard-grid">
        <Link to="/upload" className="dashboard-card">
          <h2>Upload Grades</h2>
          <p>Upload CSV files containing student grade data for analysis</p>
          <span className="card-arrow">→</span>
        </Link>

        <Link to="/form" className="dashboard-card">
          <h2>Course Review Form</h2>
          <p>
            Submit course review forms with grade distributions and commentary
          </p>
          <span className="card-arrow">→</span>
        </Link>

        <Link to="/Review" className="dashboard-card">
          <h2>Review Papers</h2>
          <p>
            Review paper occurrences through historical data and dynamic data
            visualization
          </p>
          <span className="card-arrow">→</span>
        </Link>
      </div>

      <div className="dashboard-info">
        <div className="info-card">
          <h3>Getting Started</h3>
          <ol>
            <li>Upload your grade CSV file to import student data</li>
            <li>The system will automatically scrape paper outlines</li>
            <li>Fill out the course review form with pre-populated data</li>
            <li>View grade distributions and historical comparisons</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
