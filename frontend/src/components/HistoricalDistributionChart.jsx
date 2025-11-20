import {
  AreaChart,
  Area,
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

export default function HistoricalDistributionChart({ occurrenceId }) {
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
          "E",
          "D",
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

  // Color palette for all years (with different opacity for current year)
  const areaColors = [
    { stroke: "#e7d800", fill: "#e7d800", fillOpacity: 0.3 },
    { stroke: "#21c244", fill: "#21c244", fillOpacity: 0.3 },
    { stroke: "#970fd6", fill: "#970fd6", fillOpacity: 0.3 },
    { stroke: "#f97316", fill: "#f97316", fillOpacity: 0.3 },
    { stroke: "#06b6d4", fill: "#06b6d4", fillOpacity: 0.3 },
    { stroke: "#2563eb", fill: "#2563eb", fillOpacity: 0.5 }, // Current year - more opaque
  ];

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
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
              value: "Student number",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip formatter={(value) => `${value}`} />
          <Legend />

          {/* All years as area charts */}
          {years.map((year, index) => {
            const isCurrentYear = index === years.length - 1;
            const colors = areaColors[index % areaColors.length];
            return (
              <Area
                key={year}
                type="monotone"
                dataKey={year}
                stroke={colors.stroke}
                fill={colors.fill}
                fillOpacity={isCurrentYear ? 0.5 : 0.3}
                strokeWidth={isCurrentYear ? 3 : 2}
                name={year}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
