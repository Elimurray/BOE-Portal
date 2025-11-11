import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import CSVUpload from "./components/CSVUpload";
import CourseForm from "./components/CourseForm";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app">
        {/* Navigation */}
        <nav className="navbar">
          <div className="navbar-container">
            <h1>BOE Portal</h1>
            <div className="navbar-links">
              <Link to="/">Upload CSV</Link>
              <Link to="/form">Course Form</Link>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<CSVUpload />} />
            <Route path="/form" element={<CourseForm />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
