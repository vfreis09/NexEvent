import { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { PublicUser } from "../../types/PublicUser";
import "./OverviewTab.css";
import { useToast } from "../../hooks/useToast";

const MAX_EVENTS_TO_SHOW = 3;

const OverviewTab = () => {
  const { profileUser } = useOutletContext<{ profileUser: PublicUser }>();
  const [createdEvents, setCreatedEvents] = useState<EventData[]>([]);
  const [rsvpedEvents, setRsvpedEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  const { showNotification } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const createdRes = await fetch(
          `http://localhost:3000/api/user/${profileUser.username}/events`
        );
        const rsvpRes = await fetch(
          `http://localhost:3000/api/rsvps/user/${profileUser.username}`
        );

        const createdData: EventData[] = await createdRes.json();
        const rsvpData: EventData[] = await rsvpRes.json();

        const now = new Date();

        const filterAndSort = (events: EventData[]) =>
          events
            .filter(
              (event) =>
                new Date(event.event_datetime) >= now &&
                event.status !== "canceled"
            )
            .sort(
              (a, b) =>
                new Date(a.event_datetime).getTime() -
                new Date(b.event_datetime).getTime()
            )
            .slice(0, MAX_EVENTS_TO_SHOW);

        setCreatedEvents(filterAndSort(createdData || []));
        setRsvpedEvents(filterAndSort(rsvpData || []));
      } catch (err) {
        console.error("Error loading overview data", err);
        showNotification("Failed to load overview data.", "Error", "danger");
        setCreatedEvents([]);
        setRsvpedEvents([]);
      } finally {
        setLoading(false);
      }
    };

    if (profileUser?.username) {
      fetchData();
    }
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

  if (loading) return <p>Loading summary...</p>;

  return (
    <div className="overview-tab-view">
      <div className="overview-section">
        <h4 className="overview-header">Your Next Created Events</h4>
        {createdEvents.length > 0 ? (
          <EventList
            events={createdEvents}
            onEventUpdate={handleCreatedEventUpdate}
            showNotification={showNotification}
            isCompact={true}
          />
        ) : (
          <p className="no-events-message">No upcoming created events. </p>
        )}
      </div>
      <div className="overview-section">
        <h4 className="overview-header">Your Next RSVPs</h4>
        {rsvpedEvents.length > 0 ? (
          <EventList
            events={rsvpedEvents}
            onEventUpdate={handleRsvpedEventUpdate}
            showNotification={showNotification}
            isCompact={true}
          />
        ) : (
          <p className="no-events-message">
            No upcoming RSVPs. Go find something fun!
          </p>
        )}
      </div>
      <div className="overview-footer">
        <Link to="events">View All Created Events</Link> |
        <Link to="rsvps">View All RSVPs</Link>
      </div>
    </div>
  );
};

export default OverviewTab;
