import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import "./Home.css";

function HomePage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const location = useLocation();

  useEffect(() => {
    const state = location.state as { successMessage?: string } | null;

    if (state?.successMessage) {
      setSuccessMessage(state.successMessage);

      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      window.history.replaceState({}, document.title, window.location.pathname);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/events/");
        const data = await response.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);
  return (
    <>
      {successMessage && (
        <div className="bottom-toast" role="alert">
          {successMessage}
        </div>
      )}
      <div className="home-page">
        {loading ? (
          <div>Loading events...</div>
        ) : (
          <>
            <h2>Upcoming Events</h2>
            <EventList events={events} />
          </>
        )}
      </div>
    </>
  );
}

export default HomePage;
