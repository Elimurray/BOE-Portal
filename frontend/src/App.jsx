import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import CSVUpload from "./components/CSVUpload";
import CourseForm from "./components/CourseForm";
import Review from "./components/Review";
import Logo from "./assets/Uni-of-Waikato-banner.png";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app">
        {/* Navigation */}
        <nav className="navbar">
          <div className="navbar-container">
            <div className="banner">
              <img src={Logo} alt="BOE Logo" className="logo" />
              <h1>BOE Portal</h1>
            </div>

            <div className="navbar-links">
              <Link to="/">Dashboard</Link>
              <Link to="/upload">Upload CSV</Link>
              <Link to="/form">Course Form</Link>
              <Link to="/review">Review Paper</Link>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<CSVUpload />} />
            <Route path="/form" element={<CourseForm />} />
            <Route path="/review" element={<Review />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
