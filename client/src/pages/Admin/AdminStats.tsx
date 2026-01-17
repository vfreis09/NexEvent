import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { getStats } from "../../services/adminApi";
import { Stats, StatusData } from "../../types/StatsTypes";
import { useTheme } from "../../context/ThemeContext";
import "./AdminStats.css";

const COLORS = ["#0088FE", "#FF8042", "#00C49F"];

const AdminStats: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useTheme();

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const darkChartTextStyle = { fill: "#f0f0f0" };
  const darkChartStroke = "#444444";
  const barFillColor = "#9370db";

  const darkTooltipContentStyle = {
    backgroundColor: "#252525",
    border: "1px solid #444",
    color: "#f0f0f0",
  };
  const darkTooltipLabelStyle = { color: "#f0f0f0" };

  if (loading) return <p className="info-text">Loading stats...</p>;
  if (error) return <p className="error-text">Error: {error}</p>;

  const pieData =
    stats?.event_status.map((s: StatusData) => ({
      name: s.status,
      value: s.total,
    })) || [];

  return (
    <div className="admin-stats">
      <div className="kpi-cards">
        <div className="kpi-card users-kpi">
          Total Users
          <div>{stats?.totals.total_users}</div>
        </div>
        <div className="kpi-card events-kpi">
          Total Events
          <div>{stats?.totals.total_events}</div>
        </div>
        <div className="kpi-card rsvps-kpi">
          Total RSVPs
          <div>{stats?.totals.total_rsvps}</div>
        </div>
      </div>
      <div className="chart-container">
        <h2>Events Per Month</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats?.events_per_month}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkChartStroke} />
            <XAxis
              dataKey="month"
              stroke={darkChartStroke}
              tick={darkChartTextStyle}
            />
            <YAxis stroke={darkChartStroke} tick={darkChartTextStyle} />
            <Tooltip
              contentStyle={darkTooltipContentStyle}
              labelStyle={darkTooltipLabelStyle}
            />
            <Legend wrapperStyle={darkChartTextStyle} />
            <Bar dataKey="total" fill={barFillColor} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-container">
        <h2>Event Status Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {pieData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={darkTooltipContentStyle}
              labelStyle={darkTooltipLabelStyle}
            />
            <Legend wrapperStyle={darkChartTextStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminStats;
