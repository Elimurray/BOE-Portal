import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Present.css";
import { getOccurrences } from "../services/api";
import HistoricalDistributionChart from "./HistoricalDistributionChart";
import HistoricalStatsTable from "./HistoricalStatsTable";
import ComparisonDistributionChart from "./ComparisonDistributionChart";

export default function Present() {
  const navigate = useNavigate();
  const [allOccurrences, setAllOccurrences] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Staging state ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState("staging"); // "staging" | "presenting"
  const [stagingFilters, setStagingFilters] = useState({
    trimester: "all",
    year: "all",
    location: "all",
  });
  const [selectedPrefixes, setSelectedPrefixes] = useState(new Set());
  const [presentationQueue, setPresentationQueue] = useState([]);

  // ── Presentation state ─────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [compareOccurrence, setCompareOccurrence] = useState(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareSearchTerm, setCompareSearchTerm] = useState("");

  useEffect(() => {
    fetchOccurrences();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Keyboard navigation (presenting mode only)
  useEffect(() => {
    if (mode !== "presenting") return;

    const handleKeyPress = (e) => {
      if (showCompareModal && e.target.tagName === "INPUT") return;

      const len = presentationQueue.length;

      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentIndex((i) => Math.min(len - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Escape") {
        if (showCompareModal) setShowCompareModal(false);
        else if (isFullscreen) toggleFullscreen();
        else setMode("staging");
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        if (compareOccurrence) setCompareOccurrence(null);
        else setShowCompareModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    mode,
    currentIndex,
    presentationQueue,
    isFullscreen,
    showCompareModal,
    compareOccurrence,
  ]);

  const fetchOccurrences = async () => {
    setLoading(true);
    try {
      const response = await getOccurrences();
      // skip this next line show all for present
      const submitted = response.data.filter(
        (occ) => occ.form_status === "submitted",
      );
      //
      setAllOccurrences(response.data);
    } catch (error) {
      console.error("Error fetching occurrences:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatOccurrenceCode = (occ) => {
    const shortYear = occ.year.toString().slice(-2);
    return `${occ.paper_code}-${shortYear}${occ.trimester} (${occ.location})`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .catch((err) => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  // ── Shared unique-value helpers (from all submitted occurrences) ───────────
  const getUniqueYears = () =>
    [...new Set(allOccurrences.map((o) => o.year))].sort((a, b) => b - a);
  const getUniqueTrimesters = () =>
    [...new Set(allOccurrences.map((o) => o.trimester))].sort();
  const getUniqueLocations = () =>
    [...new Set(allOccurrences.map((o) => o.location))].sort();

  // ── Staging helpers ────────────────────────────────────────────────────────
  const getPrefixOf = (occ) => occ.paper_code.slice(0, 5).toUpperCase();

  const getAvailablePrefixes = () =>
    [...new Set(allOccurrences.map(getPrefixOf))].sort();

  const getStagingFiltered = () => {
    let f = [...allOccurrences];
    if (stagingFilters.trimester !== "all")
      f = f.filter((o) => o.trimester === stagingFilters.trimester);
    if (stagingFilters.year !== "all")
      f = f.filter((o) => o.year.toString() === stagingFilters.year);
    if (stagingFilters.location !== "all")
      f = f.filter((o) => o.location === stagingFilters.location);
    return f;
  };

  const isInQueue = (occ) =>
    presentationQueue.some((q) => q.occurrence_id === occ.occurrence_id);

  const toggleOccurrenceInQueue = (occ) => {
    if (isInQueue(occ)) {
      setPresentationQueue((prev) =>
        prev.filter((q) => q.occurrence_id !== occ.occurrence_id),
      );
    } else {
      setPresentationQueue((prev) => [...prev, occ]);
    }
  };

  const togglePrefix = (prefix) => {
    const stagingFiltered = getStagingFiltered();
    const matchingOccs = stagingFiltered.filter(
      (occ) => getPrefixOf(occ) === prefix,
    );

    if (selectedPrefixes.has(prefix)) {
      // Deselect: remove all matching occurrences from queue
      const matchingIds = new Set(matchingOccs.map((o) => o.occurrence_id));
      setPresentationQueue((prev) =>
        prev.filter((q) => !matchingIds.has(q.occurrence_id)),
      );
      setSelectedPrefixes((prev) => {
        const next = new Set(prev);
        next.delete(prefix);
        return next;
      });
    } else {
      // Select: add matching occurrences not already in queue
      setPresentationQueue((prev) => {
        const existingIds = new Set(prev.map((q) => q.occurrence_id));
        const toAdd = matchingOccs.filter(
          (o) => !existingIds.has(o.occurrence_id),
        );
        return [...prev, ...toAdd];
      });
      setSelectedPrefixes((prev) => new Set([...prev, prefix]));
    }
  };

  const startPresentation = () => {
    if (presentationQueue.length === 0) return;
    setCurrentIndex(0);
    setMode("presenting");
  };

  const getFilteredCompareOccurrences = () => {
    if (!compareSearchTerm) return allOccurrences;
    const searchLower = compareSearchTerm.toLowerCase();
    return allOccurrences.filter((occ) => {
      const code = formatOccurrenceCode(occ).toLowerCase();
      const name = occ.paper_name.toLowerCase();
      return code.includes(searchLower) || name.includes(searchLower);
    });
  };

  // ── Loading / empty states ─────────────────────────────────────────────────
  if (loading) return <div className="present-page loading">Loading...</div>;

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

  // ══════════════════════════════════════════════════════════════════════════
  // STAGING MODE
  // ══════════════════════════════════════════════════════════════════════════
  if (mode === "staging") {
    const stagingFiltered = getStagingFiltered();
    const availablePrefixes = getAvailablePrefixes();

    return (
      <div className="staging-page">
        {/* Header */}
        <div className="staging-header">
          <h2>Presentation Staging</h2>
          <button
            className="start-presentation-btn"
            onClick={startPresentation}
            disabled={presentationQueue.length === 0}
          >
            Start Presentation ({presentationQueue.length} paper
            {presentationQueue.length !== 1 ? "s" : ""})
          </button>
        </div>

        {/* Standard filters */}
        <div className="staging-filters">
          <div className="filter-group">
            <label>Year:</label>
            <select
              value={stagingFilters.year}
              onChange={(e) =>
                setStagingFilters((p) => ({ ...p, year: e.target.value }))
              }
            >
              <option value="all">All Years</option>
              {getUniqueYears().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Trimester:</label>
            <select
              value={stagingFilters.trimester}
              onChange={(e) =>
                setStagingFilters((p) => ({ ...p, trimester: e.target.value }))
              }
            >
              <option value="all">All Trimesters</option>
              {getUniqueTrimesters().map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Location:</label>
            <select
              value={stagingFilters.location}
              onChange={(e) =>
                setStagingFilters((p) => ({ ...p, location: e.target.value }))
              }
            >
              <option value="all">All Locations</option>
              {getUniqueLocations().map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <button
            className="clear-filters-btn"
            onClick={() =>
              setStagingFilters({
                trimester: "all",
                year: "all",
                location: "all",
              })
            }
          >
            Clear Filters
          </button>
        </div>

        {/* Prefix filter chips */}
        <div className="prefix-filter-section">
          <span className="prefix-filter-label">Subject Prefix:</span>
          <div className="prefix-chips">
            {availablePrefixes.map((prefix) => (
              <button
                key={prefix}
                className={`prefix-chip${selectedPrefixes.has(prefix) ? " selected" : ""}`}
                onClick={() => togglePrefix(prefix)}
              >
                {prefix}
              </button>
            ))}
          </div>
        </div>

        {/* Two-column body: occurrence list + queue panel */}
        <div className="staging-body">
          {/* Occurrence list */}
          <div className="staging-list">
            <div className="staging-list-header">
              <span className="staging-count">
                {stagingFiltered.length} occurrence
                {stagingFiltered.length !== 1 ? "s" : ""}
              </span>
              <div className="staging-actions">
                <button
                  className="staging-action-btn"
                  onClick={() => {
                    const existingIds = new Set(
                      presentationQueue.map((q) => q.occurrence_id),
                    );
                    const toAdd = stagingFiltered.filter(
                      (o) => !existingIds.has(o.occurrence_id),
                    );
                    setPresentationQueue((prev) => [...prev, ...toAdd]);
                  }}
                >
                  Select All Visible
                </button>
                <button
                  className="staging-action-btn"
                  onClick={() => {
                    const visibleIds = new Set(
                      stagingFiltered.map((o) => o.occurrence_id),
                    );
                    setPresentationQueue((prev) =>
                      prev.filter((q) => !visibleIds.has(q.occurrence_id)),
                    );
                  }}
                >
                  Deselect All Visible
                </button>
              </div>
            </div>

            <div className="staging-occurrences">
              {stagingFiltered.length === 0 ? (
                <p className="no-results">
                  No occurrences match the current filters
                </p>
              ) : (
                stagingFiltered.map((occ) => {
                  const prefix = getPrefixOf(occ);
                  const highlighted = selectedPrefixes.has(prefix);
                  const inQueue = isInQueue(occ);
                  return (
                    <div
                      key={occ.occurrence_id}
                      className={`staging-item${highlighted ? " highlighted" : ""}${inQueue ? " in-queue" : ""}`}
                      onClick={() => toggleOccurrenceInQueue(occ)}
                    >
                      <input
                        type="checkbox"
                        checked={inQueue}
                        onChange={() => toggleOccurrenceInQueue(occ)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="staging-item-info">
                        <span className="staging-item-code">
                          {formatOccurrenceCode(occ)}
                        </span>
                        <span className="staging-item-name">
                          {occ.paper_name}
                        </span>
                      </div>
                      {highlighted && (
                        <span className="prefix-badge">{prefix}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Queue panel */}
          <div className="queue-preview">
            <h3>Presentation Queue ({presentationQueue.length})</h3>
            {presentationQueue.length === 0 ? (
              <p className="queue-empty">
                Select prefixes or check individual papers to build your queue.
              </p>
            ) : (
              <div className="queue-list">
                {presentationQueue.map((occ, idx) => (
                  <div key={occ.occurrence_id} className="queue-item">
                    <span className="queue-number">{idx + 1}</span>
                    <div className="queue-item-info">
                      <span className="queue-code">
                        {formatOccurrenceCode(occ)}
                      </span>
                      <span className="queue-name">{occ.paper_name}</span>
                    </div>
                    <button
                      className="queue-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOccurrenceInQueue(occ);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {presentationQueue.length > 0 && (
              <button
                className="clear-queue-btn"
                onClick={() => {
                  setPresentationQueue([]);
                  setSelectedPrefixes(new Set());
                }}
              >
                Clear Queue
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PRESENTING MODE
  // ══════════════════════════════════════════════════════════════════════════
  const presenting = presentationQueue;

  const safeIndex = Math.min(currentIndex, presenting.length - 1);
  const current = presenting[safeIndex];
  const occurrenceCode = formatOccurrenceCode(current);

  return (
    <div className={`present-page ${isFullscreen ? "fullscreen" : ""}`}>
      {/* Header */}
      <div className="present-header">
        <button className="exit-button" onClick={() => setMode("staging")}>
          ← Back to Staging
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
            className="fullscreen-btn"
            onClick={toggleFullscreen}
            title="Toggle fullscreen (F)"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>

        <div className="progress">
          {safeIndex + 1} / {presenting.length}
        </div>
      </div>

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
                    className={`compare-occurrence-item${isCurrent ? " current" : ""}`}
                    onClick={() => {
                      setCompareOccurrence(occ);
                      setShowCompareModal(false);
                      setCompareSearchTerm("");
                    }}
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
        <div className="title-slide">
          {compareOccurrence ? (
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

        <div
          className={`graphs-container${compareOccurrence ? " compare-mode" : ""}`}
        >
          {compareOccurrence ? (
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
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={safeIndex === 0}
        >
          ← Previous
        </button>
        <div className="occurrence-selector">
          <select
            value={safeIndex}
            onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
          >
            {presenting.map((occ, idx) => (
              <option key={occ.occurrence_id} value={idx}>
                {formatOccurrenceCode(occ)}
              </option>
            ))}
          </select>
        </div>
        <button
          className="nav-button"
          onClick={() =>
            setCurrentIndex((i) => Math.min(presenting.length - 1, i + 1))
          }
          disabled={safeIndex === presenting.length - 1}
        >
          Next →
        </button>
      </div>

      <div className="keyboard-hint">
        Use ← → or Space to navigate • C to compare • F for fullscreen • ESC
        to staging
      </div>
    </div>
  );
}
