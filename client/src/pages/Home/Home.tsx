import { useState, useEffect } from "react";
import Header from "../../components/Header/Header";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import "./Home.css";

function HomePage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

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
      <Header />
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
