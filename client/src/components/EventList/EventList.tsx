import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useEventActions } from "../../hooks/useEventActions";
import { EventData } from "../../types/EventData";
import "./EventList.css";

interface EventListProps {
  events: EventData[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  const { user, isVerified } = useUser();
  const { deleteEvent, cancelEvent } = useEventActions();

  if (!Array.isArray(events) || events.length === 0) {
    return <div>No events available. Try again later!</div>;
  }

  return (
    <div>
      {events.map((event) => {
        const isOwner = user && event.author_id === user.id;

        return (
          <Link
            key={event.id}
            to={`/event/${event.id}`}
            className="event-card-link"
          >
            <div className="event-card">
              <div className="event-card-header">
                <span>Posted by: {event.author_username}</span>
              </div>
              <div className="event-card-header">
                <h3>{event.title}</h3>
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

              {isVerified && isOwner && (
                <div className="event-card-actions">
                  <Link to={`/edit/${event.id}`} className="edit-btn">
                    Edit
                  </Link>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      deleteEvent(event.id);
                    }}
                  >
                    Delete
                  </button>
                  {event.status !== "canceled" && (
                    <button
                      className="cancel-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        cancelEvent(event.id);
                      }}
                    >
                      Cancel Event
                    </button>
                  )}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default EventList;
