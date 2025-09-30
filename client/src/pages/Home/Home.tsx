import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { useToast } from "../../hooks/useToast";
import AppToast from "../../components/ToastComponent/ToastComponent";
import "./Home.css";

function HomePage() {
  const [events, setEvents] = useState<EventData[]>([]);
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
        setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        showNotification(
          "Uh oh, we couldn't fetch the events right now.",
          "Error",
          "danger",
          "white"
        );
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [showNotification]);

  const handleEventUpdate = (updatedEvent: EventData) => {
    if (!updatedEvent || typeof updatedEvent.id === "undefined") {
    }

    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
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
            <EventList
              events={events}
              onEventUpdate={handleEventUpdate}
              showNotification={showNotification}
            />
          </>
        )}
      </div>
    </>
  );
}

export default HomePage;
