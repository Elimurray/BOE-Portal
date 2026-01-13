// ComparisonDistributionChart.jsx
import { useState, useEffect } from "react";
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
import { getGradeDistribution } from "../services/api";

export default function ComparisonDistributionChart({
  occurrence1Id,
  occurrence2Id,
  occurrence1Label,
  occurrence2Label,
  isFullscreen,
}) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBothDistributions();
  }, [occurrence1Id, occurrence2Id]);

  const fetchBothDistributions = async () => {
    setLoading(true);
    setError(null);
    try {
      const [response1, response2] = await Promise.all([
        getGradeDistribution(occurrence1Id),
        getGradeDistribution(occurrence2Id),
      ]);

      console.log("Response 1:", response1.data);
      console.log("Response 2:", response2.data);

      // The API returns { labels: [...], data: [...], total: number }
      const labels1 = response1.data.labels || [];
      const data1 = response1.data.data || [];

      const labels2 = response2.data.labels || [];
      const data2 = response2.data.data || [];

      // Verify both have the same labels
      if (labels1.length === 0 && labels2.length === 0) {
        setError("No grade data available for these occurrences");
        return;
      }

      // Use labels from the first occurrence (they should be the same)
      const labels = labels1.length > 0 ? labels1 : labels2;

      // Check if we have any non-zero data
      const hasData1 = data1.some((val) => val > 0);
      const hasData2 = data2.some((val) => val > 0);

      if (!hasData1 && !hasData2) {
        setError("No grade data available for these occurrences");
        return;
      }

      // Format data for Recharts
      // Recharts expects array of objects: [{ grade: "A+", occ1: 5, occ2: 3 }, ...]
      const formattedData = labels.map((label, index) => ({
        grade: label,
        [occurrence1Label]: data1[index] || 0,
        [occurrence2Label]: data2[index] || 0,
      }));

      console.log("Formatted data:", formattedData);
      setChartData(formattedData);
    } catch (error) {
      console.error("Error fetching distributions:", error);
      setError(error.message || "Failed to fetch grade distributions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "300px",
        }}
      >
        Loading comparison...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "300px",
          color: "#ef4444",
        }}
      >
        Error: {error}
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "300px",
        }}
      >
        No data available
      </div>
    );
  }
  // Dynamic height based on fullscreen state
  const chartHeight = isFullscreen ? 550 : 400;
  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="grade" style={{ fontSize: isFullscreen ? 12 : 10 }} />
        <YAxis
          label={{
            value: "Number of Students",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: isFullscreen ? 14 : 12 },
          }}
          style={{ fontSize: isFullscreen ? 12 : 10 }}
        />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: isFullscreen ? 16 : 12 }} />
        <Bar dataKey={occurrence1Label} fill="#970fd6" stroke="#970fd6" />
        <Bar dataKey={occurrence2Label} fill="#2563eb" stroke="#2563eb" />
      </BarChart>
    </ResponsiveContainer>
  );
}
