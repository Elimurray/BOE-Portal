import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Present.css";
import { getOccurrences } from "../services/api";
import GradeDistributionChart from "./GradeDistributionChart";
import HistoricalDistributionChart from "./HistoricalDistributionChart";
import HistoricalStatsTable from "./HistoricalStatsTable";
import ComparisonDistributionChart from "./ComparisonDistributionChart";

export default function Present() {
  const navigate = useNavigate();
  const [allOccurrences, setAllOccurrences] = useState([]);
  const [filteredOccurrences, setFilteredOccurrences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Comparison states
  const [compareOccurrence, setCompareOccurrence] = useState(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareSearchTerm, setCompareSearchTerm] = useState("");

  // Filter states
  const [filters, setFilters] = useState({
    trimester: "all",
    year: "all",
    location: "all",
  });

  useEffect(() => {
    fetchOccurrences();
  }, []);

  // Apply filters whenever filter state or occurrences change
  useEffect(() => {
    applyFilters();
  }, [filters, allOccurrences]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Don't handle keyboard shortcuts when modal is open or when typing in search
      if (showCompareModal && e.target.tagName === "INPUT") {
        return;
      }

      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextOccurrence();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        previousOccurrence();
      } else if (e.key === "Escape") {
        if (showCompareModal) {
          setShowCompareModal(false);
        } else if (isFullscreen) {
          toggleFullscreen();
        } else {
          navigate("/review");
        }
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        setShowFilters(!showFilters);
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        if (compareOccurrence) {
          setCompareOccurrence(null);
        } else {
          setShowCompareModal(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    currentIndex,
    filteredOccurrences,
    isFullscreen,
    showFilters,
    showCompareModal,
    compareOccurrence,
  ]);

  const fetchOccurrences = async () => {
    setLoading(true);
    try {
      const response = await getOccurrences();
      // Filter to only occurrences with submitted forms
      const submitted = response.data.filter(
        (occ) => occ.form_status === "submitted"
      );
      setAllOccurrences(submitted);
    } catch (error) {
      console.error("Error fetching occurrences:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allOccurrences];

    if (filters.trimester !== "all") {
      filtered = filtered.filter((occ) => occ.trimester === filters.trimester);
    }

    if (filters.year !== "all") {
      filtered = filtered.filter((occ) => occ.year.toString() === filters.year);
    }

    if (filters.location !== "all") {
      filtered = filtered.filter((occ) => occ.location === filters.location);
    }

    setFilteredOccurrences(filtered);
    // Reset to first occurrence when filters change
    if (currentIndex >= filtered.length) {
      setCurrentIndex(0);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const nextOccurrence = () => {
    if (currentIndex < filteredOccurrences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const previousOccurrence = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Get unique values for filter dropdowns
  const getUniqueYears = () => {
    const years = [...new Set(allOccurrences.map((occ) => occ.year))].sort(
      (a, b) => b - a
    );
    return years;
  };

  const getUniqueLocations = () => {
    const locations = [
      ...new Set(allOccurrences.map((occ) => occ.location)),
    ].sort();
    return locations;
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
      const name = occ.paper_name.toLowerCase();
      return code.includes(searchLower) || name.includes(searchLower);
    });
  };

  const handleCompareSelect = (occurrence) => {
    setCompareOccurrence(occurrence);
    setShowCompareModal(false);
    setCompareSearchTerm("");
  };

  if (loading) {
    return <div className="present-page loading">Loading...</div>;
  }

  if (allOccurrences.length === 0) {
    return (
      <div className="present-page">
        <div className="no-data">
          <h2>No occurrences with submitted forms found</h2>
          <button onClick={() => navigate("/review")}>Back to Review</button>
        </div>
      </div>
    );
  }

  if (filteredOccurrences.length === 0) {
    return (
      <div className="present-page">
        <div className="no-data">
          <h2>No occurrences match the selected filters</h2>
          <button
            onClick={() =>
              setFilters({ trimester: "all", year: "all", location: "all" })
            }
          >
            Clear Filters
          </button>
          <button onClick={() => navigate("/review")}>Back to Review</button>
        </div>
      </div>
    );
  }

  const current = filteredOccurrences[currentIndex];
  const occurrenceCode = formatOccurrenceCode(current);

  return (
    <div className={`present-page ${isFullscreen ? "fullscreen" : ""}`}>
      {/* Header with navigation and filters */}
      <div className="present-header">
        <button className="exit-button" onClick={() => navigate("/")}>
          Exit Presentation
        </button>

        <div className="header-controls">
          <button
            className="compare-btn"
            onClick={() =>
              compareOccurrence
                ? setCompareOccurrence(null)
                : setShowCompareModal(true)
            }
            title="Compare with another occurrence (C)"
          >
            {compareOccurrence ? "Clear Compare" : "Compare"}
          </button>
          <button
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle filters (H)"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          <button
            className="fullscreen-btn"
            onClick={toggleFullscreen}
            title="Toggle fullscreen (F)"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>

        <div className="progress">
          {currentIndex + 1} / {filteredOccurrences.length}
        </div>
      </div>

      {/* Filters bar */}
      {showFilters && (
        <div className="filters-bar">
          <div className="filter-group">
            <label>Trimester:</label>
            <select
              value={filters.trimester}
              onChange={(e) => handleFilterChange("trimester", e.target.value)}
            >
              <option value="all">All</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="X">X</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Year:</label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
            >
              <option value="all">All</option>
              {getUniqueYears().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Location:</label>
            <select
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
            >
              <option value="all">All</option>
              {getUniqueLocations().map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <button
            className="clear-filters-btn"
            onClick={() =>
              setFilters({ trimester: "all", year: "all", location: "all" })
            }
          >
            Clear All
          </button>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
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
                const isCurrent = occ.occurrence_id === current.occurrence_id;
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
                    <div className="occurrence-name">{occ.paper_name}</div>
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

      {/* Main content */}
      <div className="present-content">
        {/* Title slide */}
        <div className="title-slide">
          {compareOccurrence ? (
            // Comparison mode: Single title showing both papers
            <div className="title-slide-item">
              <h1>Grade Distribution Comparison</h1>
              <div className="comparison-subtitle">
                <div className="comparison-paper">
                  <span className="paper-code">{occurrenceCode}</span>
                  <span className="paper-name">{current.paper_name}</span>
                </div>
                <div className="vs-divider">vs</div>
                <div className="comparison-paper">
                  <span className="paper-code">
                    {formatOccurrenceCode(compareOccurrence)}
                  </span>
                  <span className="paper-name">
                    {compareOccurrence.paper_name}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // Single view: Show current paper details
            <div className="title-slide-item">
              <h1>{occurrenceCode}</h1>
              <h2>{current.paper_name}</h2>
              <div className="occurrence-stats">
                <span className="stat">
                  Total Students: {current.total_students || "N/A"}
                </span>
                <span className="stat">
                  Pass Rate:{" "}
                  {current.pass_rate ? `${current.pass_rate}%` : "N/A"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Graphs section */}
        <div
          className={`graphs-container ${
            compareOccurrence ? "compare-mode" : ""
          }`}
        >
          {compareOccurrence ? (
            // Compare mode: Single column with comparison chart and stats side-by-side
            <>
              <div className="graph-section left">
                <h3>Direct Comparison</h3>
                <ComparisonDistributionChart
                  occurrence1Id={current.occurrence_id}
                  occurrence2Id={compareOccurrence.occurrence_id}
                  occurrence1Label={occurrenceCode}
                  occurrence2Label={formatOccurrenceCode(compareOccurrence)}
                  isFullscreen={isFullscreen}
                />
              </div>

              <div className="graph-section right">
                <h3>Statistics Comparison</h3>

                <h4 className="stat-label">{occurrenceCode}</h4>
                <HistoricalStatsTable
                  paperCode={current.paper_code}
                  location={current.location}
                  trimester={current.trimester}
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
            // Single view: Historical distribution and stats
            <>
              <div className="graph-section left">
                <h3>Historical Distribution Comparison</h3>
                <HistoricalDistributionChart
                  occurrenceId={current.occurrence_id}
                  isFullscreen={isFullscreen}
                />
              </div>

              <div className="graph-section right">
                <h3>Historical Statistics</h3>
                <HistoricalStatsTable
                  paperCode={current.paper_code}
                  location={current.location}
                  trimester={current.trimester}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation controls */}
      <div className="present-navigation">
        <button
          className="nav-button"
          onClick={previousOccurrence}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>
        <div className="occurrence-selector">
          <select
            value={currentIndex}
            onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
          >
            {filteredOccurrences.map((occ, idx) => (
              <option key={occ.occurrence_id} value={idx}>
                {formatOccurrenceCode(occ)}
              </option>
            ))}
          </select>
        </div>
        <button
          className="nav-button"
          onClick={nextOccurrence}
          disabled={currentIndex === filteredOccurrences.length - 1}
        >
          Next →
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="keyboard-hint">
        Use ← → or Space to navigate • C to compare • F for fullscreen • H to
        hide filters • ESC to exit
      </div>
    </div>
  );
}
