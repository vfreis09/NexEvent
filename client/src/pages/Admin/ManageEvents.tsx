import React, { useState, useEffect } from "react";
import { Container, Table, Button, Alert, Form } from "react-bootstrap";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EventType } from "../../types/EventType";
import { useToast } from "../../hooks/useToast";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { PaginatedResponse } from "../../types/PaginationTypes";
import { useTheme } from "../../context/ThemeContext";
import Loading from "../../components/Loading/Loading";
import "./ManageEvents.css";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const API_URL = rawUrl
  ? `https://${rawUrl}/api/admin`
  : "http://localhost:3000/api/admin";

const ManageEvents: React.FC = () => {
  const [displaySearch, setDisplaySearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;
  const queryClient = useQueryClient();
  const { showNotification } = useToast();
  const { theme } = useTheme();

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      setActiveSearch(displaySearch);
      setCurrentPage(1);
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [displaySearch]);

  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ["admin-events", currentPage, activeSearch],
    queryFn: async ({ signal }) => {
      const res = await fetch(
        `${API_URL}/events?page=${currentPage}&limit=${eventsPerPage}&search=${activeSearch}`,
        {
          credentials: "include",
          signal,
        },
      );
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const events: EventType[] = data?.events ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCancel = async (id: number, title: string) => {
    try {
      const res = await fetch(`${API_URL}/events/${id}/cancel`, {
        method: "PUT",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to cancel event");
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      showNotification(
        `Event '${title}' was successfully canceled.`,
        "Success",
        "success",
      );
    } catch {
      showNotification(`Failed to cancel event '${title}'.`, "Error", "danger");
    }
  };

  const handleDelete = async (id: number, title: string) => {
    try {
      const res = await fetch(`${API_URL}/events/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete event");
      if (events.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      showNotification(
        `Event '${title}' was successfully deleted.`,
        "Success",
        "success",
      );
    } catch {
      showNotification(`Failed to delete event '${title}'.`, "Error", "danger");
    }
  };

  if (isLoading) return <Loading variant="page" text="Loading events..." />;

  return (
    <Container className="manage-events">
      <h1 className="page-title">Manage Events</h1>
      {error && <Alert variant="danger">{(error as Error).message}</Alert>}
      <Form.Control
        type="text"
        placeholder="Search events by title or address..."
        className="mb-4 shadow-sm search-bar"
        value={displaySearch}
        onChange={(e) => setDisplaySearch(e.target.value)}
      />
      {events.length === 0 && !isLoading && !error ? (
        <Alert variant="info">No events found to manage.</Alert>
      ) : (
        <>
          <Table
            striped
            bordered
            hover
            responsive
            variant={theme === "dark" ? "dark" : undefined}
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
          <div className="mb-5">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </Container>
  );
};

export default ManageEvents;
