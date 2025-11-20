import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  NavLink,
} from "react-router-dom";
import Dashboard from "./components/Dashboard";
import CSVUpload from "./components/CSVUpload";
import CourseForm from "./components/CourseForm";
import Review from "./components/Review";
import Logo from "./assets/Uni-of-Waikato-banner.png";
import Crest from "./assets/crest.svg";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app">
        {/* Navigation */}
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
