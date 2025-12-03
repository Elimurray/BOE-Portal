import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  NavLink,
} from "react-router-dom";
import Dashboard from "./components/Dashboard";
import CSVUpload from "./components/CSVUpload";
import CourseForm from "./components/CourseForm";
import CourseFormFill from "./components/CourseFormFill";
import Review from "./components/Review";
import ReviewCourse from "./components/ReviewCourse";
import Present from "./components/Present";
import Logo from "./assets/Uni-of-Waikato-banner.png";
import Crest from "./assets/crest.svg";
import "./App.css";

function AppContent() {
  const location = useLocation();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Only hide navbar on present page when fullscreen
  const shouldShowNavbar = !(location.pathname === "/present" && isFullscreen);

  // Add fullscreen class to main-content when on present page and fullscreen
  const mainContentClass =
    location.pathname === "/present" && isFullscreen
      ? "main-content fullscreen-present"
      : "main-content";

  return (
    <div className="app">
      {/* Navigation - hidden only on present page in fullscreen */}
      {shouldShowNavbar && (
        <nav className="navbar">
          <div className="navbar-container">
            <div className="banner">
              <div className="crest">
                <img src={Crest} alt="BOE Logo" className="logo" />
              </div>
              <h1>BOE Portal</h1>
            </div>

            <div className="navbar-links">
              <NavLink to="/">Dashboard</NavLink>
              <NavLink to="/upload">Upload</NavLink>
              <NavLink to="/form">Form</NavLink>
              <NavLink to="/review">Review</NavLink>
              <NavLink to="/present">Present</NavLink>
            </div>
          </div>
        </nav>
      )}

      {/* Routes */}
      <div className={mainContentClass}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<CSVUpload />} />
          <Route path="/form" element={<CourseForm />} />
          <Route path="/form/:occurrenceId" element={<CourseFormFill />} />
          <Route path="/review" element={<Review />} />
          <Route path="/review/:occurrenceId" element={<ReviewCourse />} />
          <Route path="/present" element={<Present />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
