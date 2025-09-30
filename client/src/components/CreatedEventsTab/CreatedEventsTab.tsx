import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { PublicUser } from "../../types/PublicUser";
import { useToast } from "../../hooks/useToast";

const CreatedEventsTab = () => {
  const { profileUser } = useOutletContext<{ profileUser: PublicUser }>();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  const { showNotification } = useToast();

  useEffect(() => {
    const fetchCreatedEvents = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/user/${profileUser.username}/events`
        );
        const data = await res.json();
        setEvents(data || []);
      } catch (err) {
        console.error("Failed to load created events", err);
        showNotification("Failed to load created events.", "Error", "danger");
      } finally {
        setLoading(false);
      }
    };

    fetchCreatedEvents();
  }, [profileUser.username, showNotification]);

  const handleEventUpdate = (updatedEvent: EventData) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  if (loading) return <p>Loading created events...</p>;

  return (
    <div>
      <EventList
        events={events}
        onEventUpdate={handleEventUpdate}
        showNotification={showNotification}
      />
    </div>
  );
};

export default CreatedEventsTab;
