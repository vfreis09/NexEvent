import React, { useEffect, useState, useCallback } from "react";
import { Container, Table, Button, Alert, Spinner } from "react-bootstrap";
import { EventType } from "../../types/EventType";
import { useToast } from "../../hooks/useToast";
import AppToast from "../../components/ToastComponent/ToastComponent";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { PaginatedResponse } from "../../types/PaginationTypes";
import "./ManageEvents.css";

const ManageEvents: React.FC = () => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const eventsPerPage = 10;

  const { showToast, toastInfo, showNotification, hideToast } = useToast();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const url = `http://localhost:3000/api/admin/events?page=${currentPage}&limit=${eventsPerPage}`;

    try {
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch events");

      const data: PaginatedResponse = await res.json();
      setEvents(data.events);
      setCurrentPage(data.pagination.currentPage);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      setError(err.message);
      showNotification("Failed to fetch events.", "Error", "danger");
      setEvents([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, eventsPerPage, showNotification]);
  useEffect(() => {
    fetchEvents();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchEvents]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleCancel = async (id: number, title: string) => {
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
      showNotification(
        `Event '${title}' was successfully canceled.`,
        "Success",
        "success"
      );
    } catch (err: any) {
      setError(err.message);
      showNotification(`Failed to cancel event '${title}'.`, "Error", "danger");
    }
  };

  const handleDelete = async (id: number, title: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/admin/events/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete event");
      setEvents((prev) => {
        const newEvents = prev.filter((e) => e.id !== id);
        if (newEvents.length === 0 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else if (newEvents.length === 0 && totalPages > 1) {
          fetchEvents();
        }
        return newEvents;
      });

      showNotification(
        `Event '${title}' was successfully deleted.`,
        "Success",
        "success"
      );
    } catch (err: any) {
      setError(err.message);
      showNotification(`Failed to delete event '${title}'.`, "Error", "danger");
    }
  };

  if (loading)
    return (
      <div className="events-loading">
        <Spinner animation="border" variant="primary" />
      </div>
    );

  return (
    <>
      {showToast && toastInfo && (
        <AppToast
          show={showToast}
          message={toastInfo.message}
          header={toastInfo.header}
          bg={toastInfo.bg}
          textColor={toastInfo.textColor}
          onClose={hideToast}
        />
      )}
      <Container className="manage-events">
        <h1 className="page-title">Manage Events</h1>

        {error && <Alert variant="danger">{error}</Alert>}

        {events.length === 0 && !loading && !error ? (
          <Alert variant="info">No events found to manage.</Alert>
        ) : (
          <>
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
                    <td className={`status-text ${event.status}`}>
                      {event.status}
                    </td>
                    <td className="actions-col">
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => handleCancel(event.id, event.title)}
                        disabled={event.status === "canceled"}
                      >
                        Cancel
                      </Button>{" "}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(event.id, event.title)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </Container>
    </>
  );
};

export default ManageEvents;
