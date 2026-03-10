import React, { useState } from "react";
import { Container, Table, Button, Alert, Spinner } from "react-bootstrap";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EventType } from "../../types/EventType";
import { useToast } from "../../hooks/useToast";
import AppToast from "../../components/ToastComponent/ToastComponent";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { PaginatedResponse } from "../../types/PaginationTypes";
import { useTheme } from "../../context/ThemeContext";
import "./ManageEvents.css";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const API_URL = rawUrl
  ? `https://${rawUrl}/api/admin`
  : "http://localhost:3000/api/admin";

const ManageEvents: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;
  const queryClient = useQueryClient();
  const { showToast, toastInfo, showNotification, hideToast } = useToast();

  useTheme();

  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ["admin-events", currentPage],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/events?page=${currentPage}&limit=${eventsPerPage}`,
        { credentials: "include" },
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

  if (isLoading)
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
        {error && <Alert variant="danger">{(error as Error).message}</Alert>}
        {events.length === 0 && !isLoading && !error ? (
          <Alert variant="info">No events found to manage.</Alert>
        ) : (
          <>
            <Table
              striped
              bordered
              hover
              responsive
              variant="dark"
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
