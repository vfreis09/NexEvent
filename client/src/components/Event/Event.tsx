import React from "react";
import { Link } from "react-router-dom";
import { EventType } from "../../types/EventType";
import "./Event.css";

interface EventProps {
  event: EventType;
  onDelete: (id: number) => void;
}

const Event: React.FC<EventProps> = ({ event, onDelete }) => {
  return (
    <div className="event-container">
      <h2>{event.title}</h2>
      <p>{event.description}</p>
      <p>
        <strong>Event Date:</strong>{" "}
        {new Date(event.event_datetime).toLocaleString()}
      </p>
      <p>
        <strong>Number of Attendees:</strong> {event.number_of_attendees}
      </p>
      <p>
        <strong>Created At:</strong>{" "}
        {new Date(event.created_at).toLocaleString()}
      </p>
      <p>
        <strong>Event Status:</strong> {event.status}
      </p>
      <Link to={`/edit/${event.id}`}>Edit</Link>
      <button onClick={() => onDelete(event.id)}>Delete</button>
    </div>
  );
};

export default Event;
