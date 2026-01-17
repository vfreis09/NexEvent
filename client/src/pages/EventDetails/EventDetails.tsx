import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Event from "../../components/Event/Event";
import Map from "../../components/Map/Map";
import RSVPButton from "../../components/RSVPButton/RSVPButton";
import InviteManager from "../../components/InviteManager/InviteManager";
import { useMapContext } from "../../context/MapProvider";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import { EventData } from "../../types/EventData";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";
import "./EventDetails.css";

const fetchProfilePicture = async (
  username: string
): Promise<string | null> => {
  try {
    const response = await fetch(`http://localhost:3000/api/user/${username}`);
    if (!response.ok) {
      console.error(
        `Failed to fetch profile for @${username}: ${response.status}`
      );
      return null;
    }
    const userData = await response.json();
    return userData.profile_picture_base64 || null;
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    return null;
  }
};

function EventDetails() {
  const [event, setEvent] = useState<EventData | null>(null);
  const { user, isVerified } = useUser();
  const { id } = useParams<{ id: string }>();
  const eventId = parseInt(id ?? "");

  const { isLoaded } = useMapContext();
  useTheme();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastHeader, setToastHeader] = useState("");
  const [toastBg, setToastBg] = useState("success");

  const showNotification = (message: string, header: string, bg: string) => {
    setToastMessage(message);
    setToastHeader(header);
    setToastBg(bg);
    setShowToast(true);
  };

  if (isNaN(eventId)) {
    return <p className="event-detail-error">Invalid event ID</p>;
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
      if (!response.ok) throw new Error("Failed to cancel");
      const updatedEvent = await response.json();
      setEvent(updatedEvent);
      showNotification("Event cancelled successfully", "Success", "success");
    } catch (error) {
      showNotification("Failed to cancel event", "Error", "danger");
    }
  };

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const eventRes = await fetch(
          `http://localhost:3000/api/events/${eventId}`
        );
        if (!eventRes.ok) throw new Error("Event not found");
        const fetchedEvent = await eventRes.json();

        const pictureBase64 = await fetchProfilePicture(
          fetchedEvent.author_username
        );

        const fullEvent: EventData = {
          ...fetchedEvent,
          author: {
            id: fetchedEvent.author_id,
            username: fetchedEvent.author_username,
            profile_picture_base64: pictureBase64,
          },
        };

        setEvent(fullEvent);
      } catch (err) {
        console.error("Error loading event:", err);
      }
    };
    fetchEventData();
  }, [eventId]);

  const location = {
    lat: event?.location?.y ?? 37.7749,
    lng: event?.location?.x ?? -122.4194,
  };

  return (
    <>
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 1050 }}
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
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
      {event ? (
        <>
          {event.author && (
            <Event
              event={event}
              onCancel={() => handleCancel(eventId)}
              hostPicture={event.author.profile_picture_base64}
              hostUsername={event.author_username}
            />
          )}
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
        <p className="event-detail-error">Loading event...</p>
      )}
    </>
  );
}

export default EventDetails;
