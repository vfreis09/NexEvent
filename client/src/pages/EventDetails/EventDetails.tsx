import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Event from "../../components/Event/Event";
import Map from "../../components/Map/Map";
import RSVPButton from "../../components/RSVPButton/RSVPButton";
import InviteManager from "../../components/InviteManager/InviteManager";
import { useMapContext } from "../../context/MapProvider";
import { useUser } from "../../context/UserContext";
import { EventData } from "../../types/EventData";

function EventDetails() {
  const [event, setEvent] = useState<EventData | null>(null);
  const { user, isVerified } = useUser();
  const { id } = useParams<{ id: string }>();
  const eventId = parseInt(id ?? "");

  const { isLoaded } = useMapContext();

  if (isNaN(eventId)) {
    console.error("Invalid eventId:", eventId);
    return <p>Invalid post ID</p>;
  }

  const handleCancel = async (eventId: number) => {
    const response = await fetch(
      `http://localhost:3000/api/events/${eventId}/cancel`,
      {
        method: "PUT",
        credentials: "include",
      }
    );
    if (!response.ok) {
      alert("Failed to cancel event");
      return;
    }

    const updatedEvent = await response.json();
    setEvent(updatedEvent);
    alert("Event cancelled successfully");
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
      <Event event={event} onCancel={() => handleCancel(eventId)} />
      {isVerified &&
        user?.role !== "banned" &&
        user?.id === event.author_id && (
          <InviteManager
            eventId={event.id}
            status={event.status}
            eventDateTime={event.event_datetime}
            maxAttendees={event.max_attendees}
            currentAttendees={event.number_of_attendees}
          />
        )}
      {isVerified && user?.role !== "banned" && event.status !== "canceled" && (
        <RSVPButton
          eventId={event.id}
          userId={user?.id}
          status={event.status}
        />
      )}
      <Map location={location} isLoaded={isLoaded} />
    </>
  ) : (
    <p>No post found</p>
  );
}

export default EventDetails;
