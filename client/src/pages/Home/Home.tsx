import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { useToast } from "../../hooks/useToast";
import { PaginatedResponse } from "../../types/PaginationTypes";
import { useState } from "react";
import Loading from "../../components/Loading/Loading";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `${rawUrl}/api` : "http://localhost:3000/api";

const fetchEvents = async (
  page: number,
  type: "upcoming" | "past",
): Promise<PaginatedResponse> => {
  const res = await fetch(
    `${BASE_URL}/events/?page=${page}&limit=10&type=${type}`,
    { credentials: "include" },
  );
  if (!res.ok) throw new Error(`Failed to fetch ${type} events`);
  return res.json();
};

function HomePage() {
  const [upcPage, setUpcPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);

  const location = useLocation();
  const queryClient = useQueryClient();
  const { showNotification } = useToast();

  useEffect(() => {
    const state = location.state as { successMessage?: string } | null;

    if (state?.successMessage) {
      showNotification(state.successMessage, "Success", "success", "white");

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state, showNotification]);

  const { data: upcomingData, isLoading: upcomingLoading } =
    useQuery<PaginatedResponse>({
      queryKey: ["events", "upcoming", upcPage],
      queryFn: () => fetchEvents(upcPage, "upcoming"),
      staleTime: 1000 * 60 * 5,
    });

  const { data: pastData, isLoading: pastLoading } =
    useQuery<PaginatedResponse>({
      queryKey: ["events", "past", pastPage],
      queryFn: () => fetchEvents(pastPage, "past"),
      staleTime: 1000 * 60 * 5,
    });

  const upcomingEvents: EventData[] = upcomingData?.events ?? [];
  const pastEvents: EventData[] = pastData?.events ?? [];
  const upcTotalPages = upcomingData?.pagination.totalPages ?? 1;
  const pastTotalPages = pastData?.pagination.totalPages ?? 1;

  const loading = upcomingLoading || pastLoading;

  const handleUpcomingPageChange = (page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setUpcPage(page);
  };

  const handlePastPageChange = (page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPastPage(page);
  };

  const handleEventUpdate = (updatedEvent: EventData) => {
    if (!updatedEvent || typeof updatedEvent.id === "undefined") return;
    queryClient.invalidateQueries({ queryKey: ["events"] });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6">
      {loading ? (
        <Loading variant="skeleton" count={3} />
      ) : (
        <>
          <h2 className="mb-8 mt-10 text-center text-3xl font-medium text-foreground">
            Upcoming events
          </h2>
          {upcomingEvents.length > 0 ? (
            <EventList
              events={upcomingEvents}
              onEventUpdate={handleEventUpdate}
              showNotification={showNotification}
              currentPage={upcPage}
              totalPages={upcTotalPages}
              onPageChange={handleUpcomingPageChange}
            />
          ) : (
            <p className="my-10 text-center text-sm italic text-muted-foreground">
              No upcoming events right now. Check back soon!
            </p>
          )}

          <h2 className="mb-4 mt-20 border-b border-border pb-4 text-center text-2xl font-medium text-muted-foreground">
            Past events
          </h2>
          {pastEvents.length > 0 ? (
            <EventList
              events={pastEvents}
              onEventUpdate={handleEventUpdate}
              showNotification={showNotification}
              isPast={true}
              currentPage={pastPage}
              totalPages={pastTotalPages}
              onPageChange={handlePastPageChange}
            />
          ) : (
            <p className="my-10 text-center text-sm italic text-muted-foreground">
              No past events to display.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default HomePage;