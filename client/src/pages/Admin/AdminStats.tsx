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
import "./AdminStats.css";

const COLORS = ["#0088FE", "#FF8042", "#00C49F"];

const AdminStats: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading stats...</p>;
  if (error) return <p>Error: {error}</p>;

  const pieData =
    stats?.event_status.map((s: StatusData) => ({
      name: s.status,
      value: s.total,
    })) || [];

  return (
    <div className="admin-stats">
      <div className="kpi-cards">
        <div className="kpi-card">
          Total Users
          <div>{stats?.totals.total_users}</div>
        </div>
        <div className="kpi-card">
          Total Events
          <div>{stats?.totals.total_events}</div>
        </div>
        <div className="kpi-card">
          Total RSVPs
          <div>{stats?.totals.total_rsvps}</div>
        </div>
      </div>
      <div className="chart-container">
        <h2>Events Per Month</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats?.events_per_month}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#8884d8" />
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
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminStats;
