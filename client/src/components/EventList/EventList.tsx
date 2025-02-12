import React from "react";
import { Link } from "react-router-dom";
import { EventTitle } from "../../types/EventTitle";

interface EventListProps {
  events: EventTitle[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  return (
    <ul>
      {events.map((event) => (
        <li key={event.id}>
          <Link to={`/event/${event.id}`}>{event.title}</Link>
        </li>
      ))}
    </ul>
  );
};

export default EventList;
