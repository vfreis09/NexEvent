import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { useToast } from "../../hooks/useToast";
import AppToast from "../../components/ToastComponent/ToastComponent";
import "./Home.css";

function HomePage() {
  const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);
  const [pastEvents, setPastEvents] = useState<EventData[]>([]);
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

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/events/");
        const data = await response.json();

        const allEvents: EventData[] = Array.isArray(data) ? data : [];
        const now = new Date();

        const sortedUpcoming = allEvents
          .filter((event) => new Date(event.event_datetime) >= now)
          .sort(
            (a, b) =>
              new Date(a.event_datetime).getTime() -
              new Date(b.event_datetime).getTime()
          );

        const sortedPast = allEvents
          .filter((event) => new Date(event.event_datetime) < now)
          .sort(
            (a, b) =>
              new Date(b.event_datetime).getTime() -
              new Date(a.event_datetime).getTime()
          );

        setUpcomingEvents(sortedUpcoming);
        setPastEvents(sortedPast);
      } catch (error) {
        showNotification(
          "Uh oh, we couldn't fetch the events right now.",
          "Error",
          "danger",
          "white"
        );
        setUpcomingEvents([]);
        setPastEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [showNotification]);

  const handleEventUpdate = (updatedEvent: EventData) => {
    if (!updatedEvent || typeof updatedEvent.id === "undefined") {
      return;
    }

    const updateList = (prevEvents: EventData[]): EventData[] =>
      prevEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      );

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
