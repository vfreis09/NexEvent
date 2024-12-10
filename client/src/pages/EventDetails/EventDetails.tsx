import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "../../components/Header/Header";
import Event from "../../components/Event/Event";

function EventDetails() {
    const [event, setEvent] = useState<Event | null>(null);
    const { id } = useParams<{ id: string }>();
    const eventId = parseInt(id ?? "");
  
    if (isNaN(eventId)) {
        console.error("Invalid eventId:", eventId);
        return <p>Invalid post ID</p>;
    }

    useEffect(() => {
        const fetchEvent = async (eventId: number) => {
        const response = await fetch(`http://localhost:3000/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setEvent(data);
        };
        fetchEvent(eventId);
    }, []);

  return event ? (
    <>
      <Header />
      <Event event={event}/>
    </>
  ) : (
    <p>No post found</p>
  );
}

export default EventDetails;