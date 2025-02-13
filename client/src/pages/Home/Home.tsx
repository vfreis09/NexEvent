import { useState, useEffect } from "react";
import Header from "../../components/Header/Header";
import EventList from "../../components/EventList/EventList";
import { EventTitle } from "../../types/EventTitle";

function HomePage() {
  const [events, setEvents] = useState<EventTitle[]>([]);
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
      {loading ? <div>Loading events...</div> : <EventList events={events} />}
    </>
  );
}

export default HomePage;
