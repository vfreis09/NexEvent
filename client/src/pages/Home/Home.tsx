import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { useToast } from "../../hooks/useToast";
import AppToast from "../../components/ToastComponent/ToastComponent";
import { PaginatedResponse } from "../../types/PaginationTypes";
import "./Home.css";

function HomePage() {
  const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);
  const [pastEvents, setPastEvents] = useState<EventData[]>([]);

  const [upcPage, setUpcPage] = useState(1);
  const [upcTotalPages, setUpcTotalPages] = useState(1);

  const [pastPage, setPastPage] = useState(1);
  const [pastTotalPages, setPastTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const { showToast, toastInfo, showNotification, hideToast } = useToast();

  useEffect(() => {
    const state = location.state as { successMessage?: string } | null;

    if (state?.successMessage) {
      showNotification(
        "Success! Your event is live and ready for RSVPs.",
        "Success",
        "success",
        "white"
      );

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state, showNotification]);

  const fetchEvents = useCallback(
    async (page: number, type: "upcoming" | "past") => {
      const limit = 10;
      const url = `http://localhost:3000/api/events/?page=${page}&limit=${limit}&type=${type}`;

      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: PaginatedResponse = await response.json();

        const events: EventData[] = result.events;
        const pagination = result.pagination;
        if (type === "upcoming") {
          setUpcomingEvents(events);
          setUpcPage(pagination.currentPage);
          setUpcTotalPages(pagination.totalPages);
        } else {
          setPastEvents(events);
          setPastPage(pagination.currentPage);
          setPastTotalPages(pagination.totalPages);
        }
      } catch (error) {
        console.error(`Fetch error for ${type}:`, error);
        showNotification(
          `Uh oh, we couldn't fetch ${type} events right now.`,
          "Error",
          "danger",
          "white"
        );
        if (type === "upcoming") setUpcomingEvents([]);
        else setPastEvents([]);
      }
    },
    [showNotification]
  );

  useEffect(() => {
    const fetchUpcoming = fetchEvents(upcPage, "upcoming");
    const fetchPast = fetchEvents(pastPage, "past");

    const initialFetch = async () => {
      setLoading(true);
      await Promise.all([fetchUpcoming, fetchPast]);
      setLoading(false);
    };

    initialFetch();
  }, [fetchEvents, upcPage, pastPage]);
  const handleUpcomingPageChange = (page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setUpcPage(page);
  };

  const handlePastPageChange = (page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPastPage(page);
  };

  const handleEventUpdate = (updatedEvent: EventData) => {
    if (!updatedEvent || typeof updatedEvent.id === "undefined") {
      return;
    }

    const updateList = (prevEvents: EventData[]): EventData[] => {
      const now = new Date();
      const isUpcoming = new Date(updatedEvent.event_datetime) >= now;

      if (isUpcoming && !upcomingEvents.some((e) => e.id === updatedEvent.id)) {
        setPastEvents((prev) => prev.filter((e) => e.id !== updatedEvent.id));
        return [
          ...prevEvents.filter((e) => e.id !== updatedEvent.id),
          updatedEvent,
        ].sort(
          (a, b) =>
            new Date(a.event_datetime).getTime() -
            new Date(b.event_datetime).getTime()
        );
      }
      if (!isUpcoming && !pastEvents.some((e) => e.id === updatedEvent.id)) {
        setUpcomingEvents((prev) =>
          prev.filter((e) => e.id !== updatedEvent.id)
        );
        return [
          ...prevEvents.filter((e) => e.id !== updatedEvent.id),
          updatedEvent,
        ].sort(
          (a, b) =>
            new Date(b.event_datetime).getTime() -
            new Date(a.event_datetime).getTime()
        );
      }

      return prevEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      );
    };

    setUpcomingEvents(updateList);
    setPastEvents(updateList);
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
          <div>Loading events...</div>
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
