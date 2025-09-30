import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Event from "../../components/Event/Event";
import Map from "../../components/Map/Map";
import RSVPButton from "../../components/RSVPButton/RSVPButton";
import InviteManager from "../../components/InviteManager/InviteManager";
import { useMapContext } from "../../context/MapProvider";
import { useUser } from "../../context/UserContext";
import { EventData } from "../../types/EventData";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";

function EventDetails() {
  const [event, setEvent] = useState<EventData | null>(null);
  const { user, isVerified } = useUser();
  const { id } = useParams<{ id: string }>();
  const eventId = parseInt(id ?? "");

  const { isLoaded } = useMapContext();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastHeader, setToastHeader] = useState("");
  const [toastBg, setToastBg] = useState("success");
  const [toastTextColor, setToastTextColor] = useState("white");

  const showNotification = (
    message: string,
    header: string,
    bg: string,
    textColor: string = "white"
  ) => {
    setToastMessage(message);
    setToastHeader(header);
    setToastBg(bg);
    setToastTextColor(textColor);
    setShowToast(true);
  };

  if (isNaN(eventId)) {
    console.error("Invalid eventId:", eventId);
    return <p>Invalid post ID</p>;
  }

  const handleCancel = async (eventId: number) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/events/${eventId}/cancel`,
        {
          method: "PUT",
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to cancel event");
      }

      const updatedEvent = await response.json();
      setEvent(updatedEvent);
      showNotification("Event cancelled successfully", "Success", "success");
    } catch (error) {
      console.error("Failed to cancel event", error);
      showNotification("Failed to cancel event", "Error", "danger");
    }
  };

  useEffect(() => {
    const fetchEvent = async (eventId: number) => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/events/${eventId}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setEvent(data);
      } catch (error) {
        console.error("Error fetching event details:", error);
      }
    };
    fetchEvent(eventId);
  }, [eventId]);

  const location = {
    lat: event?.location?.y ?? 37.7749,
    lng: event?.location?.x ?? -122.4194,
  };

  return (
    <>
      <ToastContainer
        className="p-3"
        position="top-end"
        style={{ position: "fixed", zIndex: 1050 }}
      >
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          bg={toastBg}
          delay={3000}
          autohide
        >
          <Toast.Header>
            <strong className="me-auto">{toastHeader}</strong>
          </Toast.Header>
          <Toast.Body className={`text-${toastTextColor}`}>
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
      {event ? (
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
          {isVerified &&
            user?.role !== "banned" &&
            event.status !== "canceled" && (
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
      )}
    </>
  );
}

export default EventDetails;
