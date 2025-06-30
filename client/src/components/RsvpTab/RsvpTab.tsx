import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { PublicUser } from "../../types/PublicUser";

const RsvpTab = () => {
  const { profileUser } = useOutletContext<{ profileUser: PublicUser }>();
  const [rsvpEvents, setRsvpEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    fetchRsvpEvents();
  }, [profileUser.username]);

  if (loading) return <p>Loading RSVP'd events...</p>;

  return (
    <div>
      <EventList events={rsvpEvents} />
    </div>
  );
};

export default RsvpTab;
