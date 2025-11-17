import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { getGradeDistribution } from "../services/api";
import "./GradeDistributionChart.css";

export default function GradeDistributionChart({ occurrenceId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!occurrenceId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getGradeDistribution(occurrenceId);

        // Transform data for Recharts
        const chartData = response.data.labels.map((label, index) => ({
          range: label,
          count: response.data.data[index],
        }));

        setData(chartData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [occurrenceId]);

  if (loading) {
    return <div className="chart-loading">Loading distribution...</div>;
  }

  if (error) {
    return <div className="chart-error">Error: {error}</div>;
  }

  if (data.length === 0) {
    return <div className="chart-empty">No grade data available</div>;
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="range" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#2563eb" name="Number of Students" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
