import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { useToast } from "../../hooks/useToast";
import AppToast from "../../components/ToastComponent/ToastComponent";
import { PaginatedResponse } from "../../types/PaginationTypes";
import { useTheme } from "../../context/ThemeContext";
import { useState } from "react";
import Loading from "../../components/Loading/Loading";
import "./Home.css";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `https://${rawUrl}/api` : "http://localhost:3000/api";

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
  const { showToast, toastInfo, showNotification, hideToast } = useToast();

  useTheme();

  useEffect(() => {
    const state = location.state as { successMessage?: string } | null;
    if (state?.successMessage) {
      showNotification(
        "Success! Your event is live and ready for RSVPs.",
        "Success",
        "success",
        "white",
      );
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
      <div className="home-page">
        {loading ? (
          <Loading variant="skeleton" count={3} />
        ) : (
          <>
            <h2>Upcoming Events</h2>
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
              <p className="no-events-message">
                No upcoming events right now. Check back soon!
              </p>
            )}

            <h2 className="past-events-header">Past Events</h2>
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
              <p className="no-events-message">No past events to display.</p>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default HomePage;
