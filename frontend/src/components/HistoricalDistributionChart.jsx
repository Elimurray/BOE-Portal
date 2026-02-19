import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { getHistoricalDistribution } from "../services/api";
import "./HistoricalDistributionChart.css";

export default function HistoricalDistributionChart({
  occurrenceId,
  isFullscreen,
}) {
  const [chartData, setChartData] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!occurrenceId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getHistoricalDistribution(occurrenceId);

        if (!response.data.data || response.data.data.length === 0) {
          setChartData([]);
          setYears([]);
          setLoading(false);
          return;
        }

        const distributions = response.data.data;
        const yearLabels = distributions.map((d) => d.year);

        // Grade labels in order
        const gradeLabels = [
          "IC",
          "E",
          "D",
          "RP",
          "C-",
          "C",
          "C+",
          "B-",
          "B",
          "B+",
          "A-",
          "A",
          "A+",
        ];

        // Transform data: each grade gets data points from all years
        const transformedData = gradeLabels.map((grade) => {
          const dataPoint = { grade };

          distributions.forEach((dist) => {
            dataPoint[dist.year] = parseFloat(dist.data[grade]);
          });

          return dataPoint;
        });

        setChartData(transformedData);
        setYears(yearLabels);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [occurrenceId]);

  if (loading) {
    return <div className="chart-loading">Loading distribution data...</div>;
  }

  if (error) {
    return <div className="chart-error">Error: {error}</div>;
  }

  if (chartData.length === 0) {
    return <div className="chart-empty">No distribution data available</div>;
  }

  // Color palette for historical years (lines)
  const lineColors = [
    "#970fd6", // Purple
    "#21c244", // Green
    "#f97316", // Orange
    "#e7d800", // Yellow
    "#06b6d4", // Cyan
  ];

  // Current year color (bar) - blue
  const currentYearColor = "#2563eb";

  // Separate current year from historical years
  const currentYear = years[years.length - 1];
  const historicalYears = years.slice(0, -1);

  // Dynamic height based on fullscreen state
  const chartHeight = isFullscreen ? 550 : 400;

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="grade" />
          <YAxis
            label={{
              value: "Number of Students",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip />
          <Legend />

          {/* Historical years as lines */}
          {historicalYears.map((year, index) => (
            <Bar
              key={year}
              // type="monotone"
              dataKey={year}
              fill={lineColors[index % lineColors.length]}
              barSize={20}
              // stroke={lineColors[index % lineColors.length]}
              // strokeWidth={2}
              name={year}
              // dot={{ r: 4 }}
              zIndex={1}
            />
          ))}

          {/* Current year as bars */}
          <Bar
            dataKey={currentYear}
            fill={currentYearColor}
            name={`${currentYear} (Current)`}
            barSize={20}
            zIndex={10}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
