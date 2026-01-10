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
            alt={`${hostUsername}'s profile`}
            className="host-avatar-image-small"
          />
        </div>
        <p className="event-author">
          <Link to={`/user/${hostUsername}`} className="host-username-link">
            {hostUsername}
          </Link>
        </p>
      </div>
      <p className="event-description">{event.description}</p>
      <div className="event-info-row">
        <strong>Date & Time:</strong>
        <span>{new Date(event.event_datetime).toLocaleString()}</span>
      </div>
      <div className="event-info-row">
        <strong>Location:</strong>
        <span>{event.address}</span>
      </div>
      <div className="event-info-row">
        <strong>Attendees:</strong>
        <span>
          {event.number_of_attendees}
          {event.max_attendees !== null && ` / ${event.max_attendees}`}
        </span>
      </div>
      <div className="event-info-row">
        <strong>Status:</strong>
        <span className={`status-${event.status.toLowerCase()}`}>
          {event.status}
        </span>
      </div>
      {isVerified && isOwner && user?.role !== "banned" && (
        <div className="event-owner-actions">
          <Link to={`/edit/${event.id}`} className="edit-event-link">
            Edit Details
          </Link>
          {event.status !== "canceled" && (
            <button
              className="cancel-event-btn"
              onClick={() => onCancel(event.id)}
            >
              Cancel Event
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Event;
