import React from "react";
import { Link } from "react-router-dom";

interface Event {
  id: number;
  title: string;
}

interface EventListProps {
  events: Event[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  return (
    <ul>
      {events.map((event) => (
        <li key={event.id}>
          <Link to={`/event/${event.id}`}>
            {event.title}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default EventList;
