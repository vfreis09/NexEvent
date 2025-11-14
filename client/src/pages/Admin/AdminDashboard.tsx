import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import { FaUsers, FaCalendarAlt, FaClipboardList } from "react-icons/fa";
import { getStats } from "../../services/adminApi";
import { useTheme } from "../../context/ThemeContext";
import "./AdminDashboard.css";

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

  useTheme();

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="dashboard-loading">
        <Spinner animation="border" variant="primary" />
      </div>
    );

  if (error)
    return (
      <Alert variant="danger" className="dashboard-alert">
        {error}
      </Alert>
    );

  return (
    <Container className="admin-dashboard">
      <h1 className="dashboard-title">Admin Dashboard</h1>

      {stats && (
        <Row className="mb-5">
          <Col md={4}>
            <Card className="stat-card users-card shadow-sm">
              <Card.Body>
                <FaUsers className="stat-icon users-icon" />
                <Card.Title>Total Users</Card.Title>
                <div className="stat-value">{stats.totals.total_users}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card events-card shadow-sm">
              <Card.Body>
                <FaCalendarAlt className="stat-icon events-icon" />
                <Card.Title>Total Events</Card.Title>
                <div className="stat-value">{stats.totals.total_events}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card rsvps-card shadow-sm">
              <Card.Body>
                <FaClipboardList className="stat-icon rsvps-icon" />
                <Card.Title>Total RSVPs</Card.Title>
                <div className="stat-value">{stats.totals.total_rsvps}</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <div className="dashboard-nav">
        <Link to="/admin/users" className="btn btn-lg btn-primary">
          Manage Users
        </Link>
        <Link to="/admin/events" className="btn btn-lg btn-success">
          Manage Events
        </Link>
        <Link to="/admin/stats" className="btn btn-lg btn-teal">
          View Stats
        </Link>
      </div>
    </Container>
  );
};

export default AdminDashboard;
