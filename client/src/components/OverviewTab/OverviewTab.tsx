import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { PublicUser } from "../../types/PublicUser";
import "./OverviewTab.css";

const OverviewTab = () => {
  const { profileUser } = useOutletContext<{ profileUser: PublicUser }>();
  const [createdEvents, setCreatedEvents] = useState<EventData[]>([]);
  const [rsvpedEvents, setRsvpedEvents] = useState<EventData[]>([]);

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
      }
    };

    fetchData();
  }, [profileUser.username]);

  return (
    <div>
      <div className="overview-section">
        <h2>Recent Created Events</h2>
        <EventList events={createdEvents} />
      </div>
      <div className="overview-section">
        <h2>Recent RSVP'd Events</h2>
        <EventList events={rsvpedEvents} />
      </div>
    </div>
  );
};

export default OverviewTab;
