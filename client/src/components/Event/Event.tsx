import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { EventType } from "../../types/EventType";
import { useTheme } from "../../context/ThemeContext";
import "./Event.css";

interface EventProps {
  event: EventType;
  onCancel: (id: number) => void;
}

const Event: React.FC<EventProps> = ({ event, onCancel }) => {
  const { isVerified, user } = useUser();

  useTheme();

  const isOwner = user && event.author_id === user.id;

  return (
    <div className="event-container">
      <h2>{event.title}</h2>
      <p className="event-author">
        <Link
          to={`/user/${event.author_username}`}
          title={`View ${event.author_username}'s profile`}
        >
          {event.author_username}
        </Link>
      </p>
      <p>{event.description}</p>
      <p>
        <strong>Event Date:</strong>{" "}
        {new Date(event.event_datetime).toLocaleString()}
      </p>
      <p>
        <strong>Address:</strong> {event.address}
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
      {isVerified && user?.role !== "banned" && isOwner && (
        <>
          <Link to={`/edit/${event.id}`}>Edit</Link>
          {event.status !== "canceled" && (
            <button onClick={() => onCancel(event.id)}>Cancel Event</button>
          )}
        </>
      )}
    </div>
  );
};

export default Event;
