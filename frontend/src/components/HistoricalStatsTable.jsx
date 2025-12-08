import { useEffect, useState } from "react";
import { getHistoricalComparison } from "../services/api";
import "./HistoricalStatsTable.css";

export default function HistoricalStatsTable({
  paperCode,
  location,
  trimester,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!paperCode || !location || !trimester) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getHistoricalComparison(
          paperCode,
          location,
          trimester
        );

        if (!response.data.labels || response.data.labels.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        // Transform data for table
        const tableData = response.data.labels.map((label, index) => ({
          year: label,
          avgGrade: response.data.datasets[0].data[index],
          passRate: response.data.datasets[1].data[index],
          students: response.data.datasets[2].data[index],
        }));

        setData(tableData.reverse()); // Show most recent first
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [paperCode, location]);

  if (loading) {
    return <div className="table-loading">Loading historical data...</div>;
  }

  if (error) {
    return <div className="table-error">Error: {error}</div>;
  }

  if (data.length === 0) {
    return <div className="table-empty">No historical data available</div>;
  }

  return (
    <div className="historical-stats-container">
      <table className="historical-stats-table">
        <thead>
          <tr>
            <th>Year/Trimester</th>
            <th>Students</th>
            <th>Pass / Fail</th>
            <th>Pass Rate</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className={index === 0 ? "current-year" : ""}>
              <td>{row.year}</td>
              <td>{row.students}</td>
              <td>{row.avgGrade}</td>
              <td>{row.passRate.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
