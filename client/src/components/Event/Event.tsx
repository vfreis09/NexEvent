import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { EventData } from "../../types/EventData";
import { useTheme } from "../../context/ThemeContext";
import "./Event.css";

interface EventProps {
  event: EventData;
  onCancel: (id: number) => void;
  hostPicture: string | null | undefined;
  hostUsername: string;
}

const defaultAvatar = "/images/default-avatar.png";

const Event: React.FC<EventProps> = ({
  event,
  onCancel,
  hostPicture,
  hostUsername,
}) => {
  const { isVerified, user } = useUser();
  useTheme();

  const isOwner = user && event.author_id === user.id;

  const imageSrc = hostPicture || defaultAvatar;

  return (
    <div className="event-container">
      <h2>{event.title}</h2>
      <div className="event-host-details">
        <div className="host-avatar-frame-small">
          <img
            src={imageSrc}
            alt={`${hostUsername}'s profile picture`}
            className="host-avatar-image-small"
            onError={(e) => {
              console.warn(
                "Profile picture failed to load → using default avatar"
              );
              e.currentTarget.src = defaultAvatar;
            }}
          />
        </div>
        <p className="event-author">
          <Link to={`/user/${hostUsername}`} className="host-username-link">
            {hostUsername}
          </Link>
        </p>
      </div>
      <p className="event-description">{event.description}</p>
      <p>
        <strong>Date & Time:</strong>{" "}
        {new Date(event.event_datetime).toLocaleString()}
      </p>
      <p>
        <strong>Location:</strong> {event.address}
      </p>
      <p>
        <strong>Attendees:</strong> {event.number_of_attendees}
        {event.max_attendees !== null && ` / ${event.max_attendees}`}
      </p>
      <p>
        <strong>Status:</strong>{" "}
        <span className={`status-${event.status.toLowerCase()}`}>
          {event.status}
        </span>
      </p>
      {isVerified && isOwner && user?.role !== "banned" && (
        <div className="event-owner-actions">
          <Link to={`/edit/${event.id}`} className="edit-event-link">
            Edit
          </Link>
          {event.status !== "canceled" && (
            <button onClick={() => onCancel(event.id)}>Cancel Event</button>
          )}
        </div>
      )}
    </div>
  );
};

export default Event;
