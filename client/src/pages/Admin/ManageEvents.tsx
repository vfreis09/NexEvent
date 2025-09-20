import React, { useEffect, useState } from "react";
import { Container, Table, Button, Alert, Spinner } from "react-bootstrap";
import { EventType } from "../../types/EventType";
import "./ManageEvents.css";

const ManageEvents: React.FC = () => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/admin/events", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch events");
      const data: EventType[] = await res.json();
      setEvents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCancel = async (id: number) => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/admin/events/${id}/cancel`,
        { method: "PUT", credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to cancel event");
      const data = await res.json();
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: data.event.status } : e))
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3000/api/admin/events/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete event");
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading)
    return (
      <div className="events-loading">
        <Spinner animation="border" variant="primary" />
      </div>
    );

  return (
    <Container className="manage-events">
      <h1 className="page-title">Manage Events</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Table
        striped
        bordered
        hover
        responsive
        className="events-table shadow-sm"
      >
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Address</th>
            <th>Date & Time</th>
            <th>Author</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{event.title}</td>
              <td>{event.description}</td>
              <td>{event.address}</td>
              <td>{new Date(event.event_datetime).toLocaleString()}</td>
              <td>{event.author_username}</td>
              <td className={`status-text ${event.status}`}>{event.status}</td>
              <td className="actions-col">
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => handleCancel(event.id)}
                  disabled={event.status === "canceled"}
                >
                  Cancel
                </Button>{" "}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(event.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default ManageEvents;
