import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Event from "../../components/Event/Event";
import Map from "../../components/Map/Map";
import { useMapContext } from "../../context/MapProvider";
import RSVPButton from "../../components/RSVPButton/RSVPButton";
import { useUser } from "../../context/UserContext";

type EventData = {
  id: number;
  title: string;
  description: string;
  location: {
    x: number;
    y: number;
  };
  event_datetime: string;
  number_of_attendees: number;
  author_id: number;
  status: string;
  created_at: string;
};

function EventDetails() {
  const [event, setEvent] = useState<EventData | null>(null);
  const { user } = useUser();
  const { id } = useParams<{ id: string }>();
  const eventId = parseInt(id ?? "");
  const navigate = useNavigate();

  const { isLoaded } = useMapContext();

  if (isNaN(eventId)) {
    console.error("Invalid eventId:", eventId);
    return <p>Invalid post ID</p>;
  }

  const handleDelete = async (eventId: number) => {
    const response = await fetch(
      `http://localhost:3000/api/events/${eventId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    if (!response.ok) {
      throw new Error("Error deleting event");
    }
    setEvent(null);
    alert("Event deleted successfully");
    navigate("/");
  };

  useEffect(() => {
    const fetchEvent = async (eventId: number) => {
      const response = await fetch(
        `http://localhost:3000/api/events/${eventId}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setEvent(data);
    };
    fetchEvent(eventId);
  }, [eventId]);

  const location = {
    lat: event?.location?.y ?? 37.7749,
    lng: event?.location?.x ?? -122.4194,
  };

  return event ? (
    <>
      <Header />
      <Event event={event} onDelete={() => handleDelete(eventId)} />
      {event.status === "active" && (
        <RSVPButton eventId={event.id} userId={user?.id} />
      )}
      <Map location={location} isLoaded={isLoaded} />
    </>
  ) : (
    <p>No post found</p>
  );
}

export default EventDetails;
