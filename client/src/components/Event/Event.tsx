import React, { useState } from "react";
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
  const [showCancelModal, setShowCancelModal] = useState(false);

  const isOwner = user && event.author_id === user.id;
  const isPrivate = event.visibility === "private";
  const imageSrc = hostPicture || defaultAvatar;

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    onCancel(event.id);
    setShowCancelModal(false);
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
  };

  return (
    <>
      <div className="event-container">
        {isPrivate && (
          <div className="private-event-banner">
            {isOwner
              ? "🔒 This event is private — only you and invited users can see it"
              : "🔒 This is a private event — you were invited"}
          </div>
        )}
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
        <div className="event-info-grid">
          <div className="event-info-row">
            <strong>Date & Time</strong>
            <span>{new Date(event.event_datetime).toLocaleString()}</span>
          </div>
          <div className="event-info-row">
            <strong>Location</strong>
            <span>{event.address}</span>
          </div>
          <div className="event-info-row">
            <strong>Attendees</strong>
            <span>
              {event.number_of_attendees}
              {event.max_attendees !== null && ` / ${event.max_attendees}`}
            </span>
          </div>
          <div
            className={`event-info-row status-${event.status.toLowerCase()}-card`}
          >
            <strong>Status</strong>
            <span>{event.status}</span>
          </div>
          {event.tags && event.tags.length > 0 && (
            <div className="event-info-row">
              <strong>Tags</strong>
              <div className="event-detail-tags">
                {event.tags.map((tag) => (
                  <span key={tag.id} className="event-tag">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        {isVerified && isOwner && user?.role !== "banned" && (
          <div className="event-owner-actions">
            <Link to={`/edit/${event.id}`} className="edit-event-link">
              Edit Details
            </Link>
            {event.status !== "canceled" && (
              <button className="cancel-event-btn" onClick={handleCancelClick}>
                Cancel Event
              </button>
            )}
          </div>
        )}
      </div>
      {showCancelModal && (
        <div className="modal-overlay" onClick={handleCloseCancelModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Event?</h3>
            <p>
              Are you sure you want to cancel <strong>{event.title}</strong>?
              {event.number_of_attendees > 0 && (
                <span className="modal-warning">
                  <br />
                  This will notify {event.number_of_attendees} attendee
                  {event.number_of_attendees !== 1 ? "s" : ""}.
                </span>
              )}
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-secondary"
                onClick={handleCloseCancelModal}
              >
                Keep Event
              </button>
              <button
                className="modal-btn modal-btn-danger"
                onClick={handleConfirmCancel}
              >
                Yes, Cancel Event
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Event;
