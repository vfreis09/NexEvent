import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Event from "../../components/Event/Event";

function EventDetails() {
    const [event, setEvent] = useState(null);
    const { id } = useParams<{ id: string }>();
    const eventId = parseInt(id ?? "");
    const navigate = useNavigate();
  
    if (isNaN(eventId)) {
        console.error("Invalid eventId:", eventId);
        return <p>Invalid post ID</p>;
    }

    const handleDelete = async (eventId: number) => {
      const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Error deleting event");
      }
      setEvent(null);
      navigate("/");
    };

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
    }, [eventId]);

  return event ? (
    <>
      <Header />
      <Event event={event} onDelete={() => handleDelete(eventId)} />
    </>
  ) : (
    <p>No post found</p>
  );
}

export default EventDetails;