import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { PublicUser } from "../../types/PublicUser";
import "./OverviewTab.css";
import { useToast } from "../../hooks/useToast";

const OverviewTab = () => {
  const { profileUser } = useOutletContext<{ profileUser: PublicUser }>();
  const [createdEvents, setCreatedEvents] = useState<EventData[]>([]);
  const [rsvpedEvents, setRsvpedEvents] = useState<EventData[]>([]);

  const { showNotification } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const createdRes = await fetch(
          `http://localhost:3000/api/user/${profileUser.username}/events?limit=3`
        );
        const rsvpRes = await fetch(
          `http://localhost:3000/api/user/${profileUser.username}/rsvps?limit=3`
        );

        const created = await createdRes.json();
        const rsvps = await rsvpRes.json();

        setCreatedEvents(created || []);
        setRsvpedEvents(rsvps || []);
      } catch (err) {
        console.error("Error loading overview data", err);
        showNotification("Failed to load overview data.", "Error", "danger");
      }
    };

    fetchData();
  }, [profileUser.username, showNotification]);

  const handleCreatedEventUpdate = (updatedEvent: EventData) => {
    setCreatedEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  const handleRsvpedEventUpdate = (updatedEvent: EventData) => {
    setRsvpedEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  return (
    <div>
      <div className="overview-section">
        <h2>Recent Created Events</h2>
        <EventList
          events={createdEvents}
          onEventUpdate={handleCreatedEventUpdate}
          showNotification={showNotification}
        />
      </div>
      <div className="overview-section">
        <h2>Recent RSVP'd Events</h2>
        <EventList
          events={rsvpedEvents}
          onEventUpdate={handleRsvpedEventUpdate}
          showNotification={showNotification}
        />
      </div>
    </div>
  );
};

export default OverviewTab;
