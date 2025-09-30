import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { PublicUser } from "../../types/PublicUser";
import { useToast } from "../../hooks/useToast";

const RsvpTab = () => {
  const { profileUser } = useOutletContext<{ profileUser: PublicUser }>();
  const [rsvpEvents, setRsvpEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  const { showNotification } = useToast();

  useEffect(() => {
    const fetchRsvpEvents = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/user/${profileUser.username}/rsvps?includeExpired=true`
        );

        const data = await res.json();
        setRsvpEvents(data || []);
      } catch (err) {
        console.error("Failed to load RSVP'd events", err);
        showNotification("Failed to load RSVP'd events.", "Error", "danger");
      } finally {
        setLoading(false);
      }
    };

    fetchRsvpEvents();
  }, [profileUser.username, showNotification]);

  const handleEventUpdate = (updatedEvent: EventData) => {
    setRsvpEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  if (loading) return <p>Loading RSVP'd events...</p>;

  return (
    <div>
      <EventList
        events={rsvpEvents}
        onEventUpdate={handleEventUpdate}
        showNotification={showNotification}
      />
    </div>
  );
};

export default RsvpTab;
