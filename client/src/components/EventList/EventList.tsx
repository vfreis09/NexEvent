import React from "react";
import { Link } from "react-router-dom";
import { EventData } from "../../types/EventData";
import "./EventList.css";

interface EventListProps {
  events: EventData[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  if (!Array.isArray(events) || events.length === 0) {
    return <div>No events available. Try again later!</div>;
  }

  return (
    <div>
      {events.map((event) => (
        <div key={event.id} className="event-card">
          <div className="event-card-header">
            <Link to={`/event/${event.id}`}>{event.title}</Link>
          </div>
          <div className="event-card-details">
            <div className="event-card-date">
              {new Date(event.event_datetime).toLocaleString()}
            </div>
            <div>
              <strong>Attendees:</strong> {event.number_of_attendees}
            </div>
            <div className="event-card-description">
              {event.description.slice(0, 100)}
            </div>
          </div>
          <div className="event-card-footer">
            <strong>Status:</strong>{" "}
            {event.max_attendees !== null &&
            event.number_of_attendees >= event.max_attendees
              ? "Full"
              : new Date(event.event_datetime) < new Date()
              ? "Expired"
              : "Active"}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventList;
