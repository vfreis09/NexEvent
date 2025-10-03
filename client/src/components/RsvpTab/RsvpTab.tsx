import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { PublicUser } from "../../types/PublicUser";
import { useToast } from "../../hooks/useToast";

const RsvpTab = () => {
  const { profileUser } = useOutletContext<{ profileUser: PublicUser }>();

  const [upcomingRsvps, setUpcomingRsvps] = useState<EventData[]>([]);
  const [pastRsvps, setPastRsvps] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  const { showNotification } = useToast();

  useEffect(() => {
    const fetchRsvpEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:3000/api/rsvps/user/${profileUser.username}`
        );

        if (!res.ok) throw new Error("Failed to fetch RSVPs.");

        const data: EventData[] = await res.json();
        const allRsvps: EventData[] = Array.isArray(data) ? data : [];
        const now = new Date();

        const sortedUpcoming = allRsvps
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

        const sortedPast = allRsvps
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

        setUpcomingRsvps(sortedUpcoming);
        setPastRsvps(sortedPast);
      } catch (err) {
        console.error("Failed to load RSVP'd events", err);
        showNotification("Failed to load RSVP'd events.", "Error", "danger");
        setUpcomingRsvps([]);
        setPastRsvps([]);
      } finally {
        setLoading(false);
      }
    };

    if (profileUser?.username) {
      fetchRsvpEvents();
    }
  }, [profileUser.username, showNotification]);

  const handleEventUpdate = (updatedEvent: EventData) => {
    const updateList = (prevEvents: EventData[]): EventData[] =>
      prevEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      );

    setUpcomingRsvps(updateList);
    setPastRsvps(updateList);
  };

  if (loading) return <p>Loading RSVP'd events...</p>;

  return (
    <div className="rsvps-tab-view">
      <h3>Upcoming RSVPs</h3>
      {upcomingRsvps.length > 0 ? (
        <EventList
          events={upcomingRsvps}
          onEventUpdate={handleEventUpdate}
          showNotification={showNotification}
        />
      ) : (
        <p className="no-events-message">This user has no upcoming RSVPs.</p>
      )}
      <h3 className="past-rsvps-header">Past & Canceled History</h3>
      {pastRsvps.length > 0 ? (
        <EventList
          events={pastRsvps}
          onEventUpdate={handleEventUpdate}
          showNotification={showNotification}
          isPast={true}
        />
      ) : (
        <p className="no-events-message">No past or canceled RSVPs.</p>
      )}
    </div>
  );
};

export default RsvpTab;
