import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Event from "../../components/Event/Event";
import Map from "../../components/Map/Map";
import RSVPButton from "../../components/RSVPButton/RSVPButton";
import InviteManager from "../../components/InviteManager/InviteManager";
import { useMapContext } from "../../context/MapProvider";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import { EventData } from "../../types/EventData";
import { useToast } from "../../hooks/useToast";
import Loading from "../../components/Loading/Loading";
import "./EventDetails.css";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `https://${rawUrl}/api` : "http://localhost:3000/api";

const fetchProfilePicture = async (
  username: string,
): Promise<string | null> => {
  try {
    const response = await fetch(`${BASE_URL}/user/${username}`);
    if (!response.ok) return null;
    const userData = await response.json();
    return userData.profile_picture_base64 || null;
  } catch {
    return null;
  }
};

function EventDetails() {
  const { user, isVerified } = useUser();
  const { id } = useParams<{ id: string }>();
  const eventId = parseInt(id ?? "");
  const { isLoaded } = useMapContext();
  const { showNotification } = useToast();
  useTheme();

  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useQuery<EventData>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const eventRes = await fetch(`${BASE_URL}/events/${eventId}`, {
        credentials: "include",
      });
      if (!eventRes.ok) throw new Error("Event not found");
      const fetchedEvent = await eventRes.json();
      const pictureBase64 = await fetchProfilePicture(
        fetchedEvent.author_username,
      );

      return {
        ...fetchedEvent,
        author: {
          id: fetchedEvent.author_id,
          username: fetchedEvent.author_username,
          profile_picture_base64: pictureBase64,
        },
      };
    },
    enabled: !isNaN(eventId),
    staleTime: 1000 * 60 * 5,
  });

  if (isNaN(eventId))
    return <p className="event-detail-error">Invalid event ID</p>;
  if (isLoading) return <Loading variant="page" text="Loading event..." />;
  if (error || !event)
    return <p className="event-detail-error">Event not found.</p>;

  const handleCancel = async (eventId: number) => {
    try {
      const response = await fetch(`${BASE_URL}/events/${eventId}/cancel`, {
        method: "PUT",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to cancel");
      await refetch();
      showNotification("Event cancelled successfully", "Success", "success");
    } catch {
      showNotification("Failed to cancel event", "Error", "danger");
    }
  };

  const location = {
    lat: event?.location?.y ?? 37.7749,
    lng: event?.location?.x ?? -122.4194,
  };

  return (
    <>
      <div className="event-details-view">
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
      </div>
    </>
  );
}

export default EventDetails;
