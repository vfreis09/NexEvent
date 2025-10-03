import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { PublicUser } from "../../types/PublicUser";
import { useToast } from "../../hooks/useToast";

const CreatedEventsTab = () => {
  const { profileUser } = useOutletContext<{ profileUser: PublicUser }>();
  const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);
  const [pastEvents, setPastEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  const { showNotification } = useToast();

  useEffect(() => {
    const fetchCreatedEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:3000/api/user/${profileUser.username}/events`
        );

        if (!res.ok) throw new Error("Failed to fetch events.");

        const data: EventData[] = await res.json();
        const allEvents: EventData[] = Array.isArray(data) ? data : [];
        const now = new Date();

        const sortedUpcoming = allEvents
          .filter(
            (event) =>
              new Date(event.event_datetime) >= now &&
              event.status !== "canceled"
          )
          .sort(
            (a, b) =>
              new Date(a.event_datetime).getTime() -
              new Date(b.event_datetime).getTime()
          );

        const sortedPast = allEvents
          .filter(
            (event) =>
              new Date(event.event_datetime) < now ||
              event.status === "canceled"
          )
          .sort(
            (a, b) =>
              new Date(b.event_datetime).getTime() -
              new Date(a.event_datetime).getTime()
          );

        setUpcomingEvents(sortedUpcoming);
        setPastEvents(sortedPast);
      } catch (err) {
        console.error("Failed to load created events", err);
        showNotification("Failed to load created events.", "Error", "danger");
        setUpcomingEvents([]);
        setPastEvents([]);
      } finally {
        setLoading(false);
      }
    };

    if (profileUser?.username) {
      fetchCreatedEvents();
    }
  }, [profileUser.username, showNotification]);

  const handleEventUpdate = (updatedEvent: EventData) => {
    const updateList = (prevEvents: EventData[]): EventData[] =>
      prevEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      );

    setUpcomingEvents(updateList);
    setPastEvents(updateList);
  };

  if (loading) return <p>Loading created events...</p>;

  return (
    <div className="created-events-tab-view">
      <h3>Upcoming Created Events</h3>
      {upcomingEvents.length > 0 ? (
        <EventList
          events={upcomingEvents}
          onEventUpdate={handleEventUpdate}
          showNotification={showNotification}
        />
      ) : (
        <p className="no-events-message">
          This user has no upcoming created events.
        </p>
      )}

      <h3 className="past-events-header">Past & Canceled History</h3>
      {pastEvents.length > 0 ? (
        <EventList
          events={pastEvents}
          onEventUpdate={handleEventUpdate}
          showNotification={showNotification}
          isPast={true}
        />
      ) : (
        <p className="no-events-message">
          No past or canceled created events to display.
        </p>
      )}
    </div>
  );
};

export default CreatedEventsTab;
