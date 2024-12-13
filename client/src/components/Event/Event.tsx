import React from "react";

interface Event {
  id: number;
  title: string;
  description: string;
  event_datetime: string;
  number_of_attendees: number;
  author_id: number;
  created_at: string;
}

interface EventProps {
  event: Event;
  onDelete: (id: number) => void;
}

const Event: React.FC<EventProps> = ({ event, onDelete }) => {
  return (
    <div>
      <h2>{event.title}</h2>
      <p>{event.description}</p>
      <p>Event Date: {new Date(event.event_datetime).toLocaleString()}</p>
      <p>Number of Attendees: {event.number_of_attendees}</p>
      <p>Created At: {new Date(event.created_at).toLocaleString()}</p>
      <button onClick={() => onDelete(event.id)}>delete event</button>
    </div>
  );
};

export default Event;
