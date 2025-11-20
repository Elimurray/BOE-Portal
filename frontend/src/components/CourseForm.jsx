import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getOccurrencesIncomplete } from "../services/api";
import "./CourseForm.css";

export default function CourseForm() {
  const navigate = useNavigate();
  const [occurrences, setOccurrences] = useState([]);
  const [filteredOccurrences, setFilteredOccurrences] = useState([]);
  const [filters, setFilters] = useState({
    year: "",
    trimester: "",
    location: "",
    paperCode: "",
  });

  useEffect(() => {
    fetchPapers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [occurrences, filters]);

  const fetchPapers = async () => {
    try {
      const response = await getOccurrencesIncomplete();
      setOccurrences(response.data);
    } catch (error) {
      console.error("Error fetching papers:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...occurrences];

    if (filters.year) {
      filtered = filtered.filter((occ) => occ.year === parseInt(filters.year));
    }
    if (filters.trimester) {
      filtered = filtered.filter((occ) => occ.trimester === filters.trimester);
    }
    if (filters.location) {
      filtered = filtered.filter((occ) => occ.location === filters.location);
    }
    if (filters.paperCode) {
      filtered = filtered.filter((occ) => {
        const shortYear = occ.year.toString().slice(-2);
        const occurrenceCode = `${occ.paper_code}-${shortYear}${occ.trimester} (${occ.location})`;
        return occurrenceCode
          .toLowerCase()
          .includes(filters.paperCode.toLowerCase());
      });
    }

    setFilteredOccurrences(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      year: "",
      trimester: "",
      location: "",
      paperCode: "",
    });
  };

  const getUniqueYears = () => {
    return [...new Set(occurrences.map((occ) => occ.year))].sort(
      (a, b) => b - a
    );
  };

  const getUniqueTrimesters = () => {
    return [...new Set(occurrences.map((occ) => occ.trimester))].sort();
  };

  const getUniqueLocations = () => {
    return [...new Set(occurrences.map((occ) => occ.location))].sort();
  };

  const handleOccurrenceClick = (occurrenceId) => {
    navigate(`/form/${occurrenceId}`);
  };

  return (
    <div className="course-form-page">
      <h2>Course Form Submission</h2>

      {/* Filter Section */}
      <div className="filters-section">
        <h3>Filter Occurrences</h3>
        <div className="filters-grid">
          <div className="filter-item">
            <label htmlFor="filter-year">Year:</label>
            <select
              id="filter-year"
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
            >
              <option value="">All Years</option>
              {getUniqueYears().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filter-trimester">Trimester:</label>
            <select
              id="filter-trimester"
              name="trimester"
              value={filters.trimester}
              onChange={handleFilterChange}
            >
              <option value="">All Trimesters</option>
              {getUniqueTrimesters().map((trimester) => (
                <option key={trimester} value={trimester}>
                  {trimester}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filter-location">Location:</label>
            <select
              id="filter-location"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
            >
              <option value="">All Locations</option>
              {getUniqueLocations().map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filter-paperCode">Search:</label>
            <input
              type="text"
              id="filter-paperCode"
              name="paperCode"
              value={filters.paperCode}
              onChange={handleFilterChange}
              placeholder="Search by code, year, etc."
            />
          </div>

          <div className="filter-item">
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          </div>
        </div>
        <div className="filter-results">
          Showing {filteredOccurrences.length} of {occurrences.length}{" "}
          occurrences
        </div>
      </div>

      {/* Occurrences List */}
      <div className="occurrences-list">
        {filteredOccurrences.length === 0 ? (
          <p className="no-results">No occurrences match the current filters</p>
        ) : (
          <div className="occurrences-grid">
            {filteredOccurrences.map((occurrence) => {
              const shortYear = occurrence.year.toString().slice(-2);
              const occurrenceCode = `${occurrence.paper_code}-${shortYear}${occurrence.trimester} (${occurrence.location})`;

              return (
                <div
                  key={occurrence.occurrence_id}
                  className="occurrence-card"
                  onClick={() =>
                    handleOccurrenceClick(occurrence.occurrence_id)
                  }
                >
                  <div className="occurrence-code">{occurrenceCode}</div>
                  <div className="occurrence-name">{occurrence.paper_name}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
