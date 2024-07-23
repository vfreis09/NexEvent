import { useState, useEffect } from "react";
import Header from "../../components/Header/Header";
import EventList from "../../components/EventList/EventList";

interface Event {
  id: number;
  title: string;
}

function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/events/");
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, []);
  return (
    <>
      <Header />
      <EventList events={events} />
    </>
  );
}

export default HomePage;
