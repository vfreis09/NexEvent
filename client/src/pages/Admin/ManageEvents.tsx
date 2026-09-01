import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EventType } from "../../types/EventType";
import { useToast } from "../../hooks/useToast";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { PaginatedResponse } from "../../types/PaginationTypes";
import Loading from "../../components/Loading/Loading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const API_URL = rawUrl
  ? `${rawUrl}/api/admin`
  : "http://localhost:3000/api/admin";

const statusStyles: Record<string, string> = {
  active: "text-primary font-medium",
  full: "text-accent-foreground font-medium",
  expired: "text-muted-foreground",
  canceled: "text-destructive font-medium",
};

const ManageEvents: React.FC = () => {
  const [displaySearch, setDisplaySearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;
  const queryClient = useQueryClient();
  const { showNotification } = useToast();

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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-medium text-foreground">
        Manage events
      </h1>

      {error && (
        <div className="mb-4 rounded border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(error as Error).message}
        </div>
      )}

      <Input
        type="text"
        placeholder="Search events by title or address..."
        className="mb-4"
        value={displaySearch}
        onChange={(e) => setDisplaySearch(e.target.value)}
      />

      {events.length === 0 && !isLoading && !error ? (
        <div className="rounded border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          No events found to manage.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Address
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Date &amp; time
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Author
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 text-foreground">
                      {event.title}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                      {event.description}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {event.address}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(event.event_datetime).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {event.author_username}
                    </td>
                    <td className={cn("px-4 py-3", statusStyles[event.status])}>
                      {event.status}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(event.id, event.title)}
                          disabled={event.status === "canceled"}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(event.id, event.title)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-12 mt-6">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ManageEvents;