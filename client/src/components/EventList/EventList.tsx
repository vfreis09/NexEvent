import React from "react";

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
          <p>{event.title}</p>
        </li>
      ))}
    </ul>
  );
};

export default EventList;
