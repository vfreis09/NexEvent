import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useEventActions } from "../../hooks/useEventActions";
import { EventData } from "../../types/EventData";
import "./EventList.css";

interface EventListProps {
  events: EventData[];
  onEventUpdate: (updatedEvent: EventData) => void;
  showNotification: (
    message: string,
    header: string,
    bg: string,
    textColor?: string
  ) => void;
}

const EventList: React.FC<EventListProps> = ({
  events,
  onEventUpdate,
  showNotification,
}) => {
  const { user, isVerified } = useUser();
  const { cancelEvent } = useEventActions(showNotification);

  if (!Array.isArray(events) || events.length === 0) {
    return <div>No events available. Try again later!</div>;
  }

  const handleCancelClick = async (eventId: number) => {
    await cancelEvent(eventId, (data) => {
      onEventUpdate(data.event);
    });
  };

  return (
    <div>
      {events.map((event) => {
        const isOwner = user && event.author_id === user.id;

        return (
          <div key={event.id} className="event-card">
            <div className="event-card-header">
              <span>
                Posted by:{" "}
                <Link
                  to={`/user/${event.author_username}`}
                  className="author-link"
                >
                  {event.author_username}
                </Link>
              </span>
            </div>
            <div className="event-card-header">
              <Link to={`/event/${event.id}`} className="event-title-link">
                <h3>{event.title}</h3>
              </Link>
            </div>
            <div className="event-card-details">
              <div className="event-card-date">
                {new Date(event.event_datetime).toLocaleString()}
              </div>
              {event.address && (
                <div className="event-card-address">
                  {event.address.split(",")[0]}
                </div>
              )}
              <div>
                <strong>Attendees:</strong> {event.number_of_attendees}
              </div>
              <div className="event-card-description">
                {event.description.slice(0, 100)}
              </div>
            </div>
            <div className="event-card-footer">
              <strong>Status:</strong>{" "}
              {event.status === "canceled"
                ? "Canceled"
                : event.max_attendees !== null &&
                  event.number_of_attendees >= event.max_attendees
                ? "Full"
                : new Date(event.event_datetime) < new Date()
                ? "Expired"
                : "Active"}
            </div>
            {isVerified && user?.role !== "banned" && isOwner && (
              <div className="event-card-actions">
                <Link to={`/edit/${event.id}`} className="edit-btn">
                  Edit
                </Link>
                {event.status !== "canceled" && (
                  <button
                    className="cancel-btn"
                    onClick={() => handleCancelClick(event.id)}
                  >
                    Cancel Event
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EventList;
