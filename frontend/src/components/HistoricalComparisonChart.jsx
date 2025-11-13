import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { getHistoricalComparison } from "../services/api";
import "./HistoricalComparisonChart.css";

export default function HistoricalComparisonChart({ paperId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!paperId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getHistoricalComparison(paperId);

        if (!response.data.labels || response.data.labels.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        // Transform data for Recharts
        const chartData = response.data.labels.map((label, index) => ({
          year: label,
          avgGrade: response.data.datasets[0].data[index],
          passRate: response.data.datasets[1].data[index],
          students: response.data.datasets[2].data[index],
        }));

        setData(chartData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [paperId]);

  if (loading) {
    return <div className="chart-loading">Loading historical data...</div>;
  }

  if (error) {
    return <div className="chart-error">Error: {error}</div>;
  }

  if (data.length === 0) {
    return <div className="chart-empty">No historical data available</div>;
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Line
            type="monotone"
            dataKey="avgGrade"
            stroke="#2563eb"
            strokeWidth={2}
            activeDot={{ r: 8 }}
            name="Average Grade"
          />

          <Line
            type="monotone"
            dataKey="passRate"
            stroke="#10b981"
            strokeWidth={2}
            activeDot={{ r: 8 }}
            name="Pass Rate (%)"
          />

          <Line
            type="monotone"
            dataKey="students"
            stroke="#f59e0b"
            strokeWidth={2}
            activeDot={{ r: 8 }}
            name="Student Count"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
