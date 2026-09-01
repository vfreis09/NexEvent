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
import Loading from "../../components/Loading/Loading";

const CHART_COLORS = ["#4B4ACF", "#1F7A4D", "#D98E1F"];
const CHART_COLORS_DARK = ["#7C79FF", "#34A66B", "#E5A438"];

const AdminStats: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const colors = isDark ? CHART_COLORS_DARK : CHART_COLORS;
  const gridStroke = isDark ? "#2A2933" : "#DEDDD6";
  const axisStroke = isDark ? "#9E9DA8" : "#6F6E66";
  const axisTick = { fill: isDark ? "#9E9DA8" : "#6F6E66" };
  const legendStyle = { color: isDark ? "#EDEDF0" : "#1C1B22" };
  const tooltipContentStyle = {
    backgroundColor: isDark ? "#201F27" : "#FFFFFF",
    border: `1px solid ${isDark ? "#2A2933" : "#DEDDD6"}`,
    color: isDark ? "#EDEDF0" : "#1C1B22",
    borderRadius: 6,
  };
  const tooltipLabelStyle = { color: isDark ? "#EDEDF0" : "#1C1B22" };

  if (loading) return <Loading variant="page" text="Loading stats..." />;

  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error: {error}
        </div>
      </div>
    );

  const pieData =
    stats?.event_status.map((s: StatusData) => ({
      name: s.status,
      value: s.total,
    })) || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total users</p>
          <div className="mt-1 font-mono text-3xl text-card-foreground">
            {stats?.totals.total_users}
          </div>
        </div>
        <div className="rounded border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total events</p>
          <div className="mt-1 font-mono text-3xl text-card-foreground">
            {stats?.totals.total_events}
          </div>
        </div>
        <div className="rounded border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total RSVPs</p>
          <div className="mt-1 font-mono text-3xl text-card-foreground">
            {stats?.totals.total_rsvps}
          </div>
        </div>
      </div>

      <div className="mb-8 rounded border border-border bg-card p-6">
        <h2 className="mb-4 text-base font-medium text-card-foreground">
          Events per month
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats?.events_per_month}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="month" stroke={axisStroke} tick={axisTick} />
            <YAxis stroke={axisStroke} tick={axisTick} />
            <Tooltip
              contentStyle={tooltipContentStyle}
              labelStyle={tooltipLabelStyle}
            />
            <Legend wrapperStyle={legendStyle} />
            <Bar dataKey="total" fill={colors[0]} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded border border-border bg-card p-6">
        <h2 className="mb-4 text-base font-medium text-card-foreground">
          Event status distribution
        </h2>
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
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipContentStyle}
              labelStyle={tooltipLabelStyle}
            />
            <Legend wrapperStyle={legendStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminStats;