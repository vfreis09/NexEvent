import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Calendar, ClipboardList } from "lucide-react";
import { getStats } from "../../services/adminApi";
import Loading from "../../components/Loading/Loading";

interface Stats {
  totals: {
    total_users: number;
    total_events: number;
    total_rsvps: number;
  };
  events_per_month: { month: string; total: number }[];
  event_status: { status: string; total: number }[];
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading variant="page" text="Loading dashboard..." />;

  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-medium text-foreground">
        Admin dashboard
      </h1>

      {stats && (
        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded border border-border bg-card p-6">
            <Users className="mb-3 text-primary" size={24} />
            <p className="text-sm text-muted-foreground">Total users</p>
            <div className="mt-1 font-mono text-3xl text-card-foreground">
              {stats.totals.total_users}
            </div>
          </div>
          <div className="rounded border border-border bg-card p-6">
            <Calendar className="mb-3 text-primary" size={24} />
            <p className="text-sm text-muted-foreground">Total events</p>
            <div className="mt-1 font-mono text-3xl text-card-foreground">
              {stats.totals.total_events}
            </div>
          </div>
          <div className="rounded border border-border bg-card p-6">
            <ClipboardList className="mb-3 text-primary" size={24} />
            <p className="text-sm text-muted-foreground">Total RSVPs</p>
            <div className="mt-1 font-mono text-3xl text-card-foreground">
              {stats.totals.total_rsvps}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link to="/admin/users">
          <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Manage users
          </button>
        </Link>
        <Link to="/admin/events">
          <button className="rounded bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
            Manage events
          </button>
        </Link>
        <Link to="/admin/stats">
          <button className="rounded border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            View stats
          </button>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;