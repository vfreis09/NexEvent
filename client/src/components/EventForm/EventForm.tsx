import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Map from "../Map/Map";
import Places from "../Places/Places";
import { useMapContext } from "../../context/MapProvider";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import "./EventForm.css";

interface EventFormProps {
  isEditing: boolean;
}

type LatLngLiteral = google.maps.LatLngLiteral;

const EventForm: React.FC<EventFormProps> = ({ isEditing }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDateTime, setEventDateTime] = useState("");
  const [location, setLocation] = useState<LatLngLiteral | null>(null);
  const [maxAttendees, setMaxAttendees] = useState<number | string>("");

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isLoaded } = useMapContext();

  const eventId = id ? parseInt(id) : null;

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    if (isEditing && eventId && !isNaN(eventId)) {
      const fetchEvent = async () => {
        try {
          const response = await fetch(
            `http://localhost:3000/api/events/${eventId}`
          );
          if (!response.ok) throw new Error("Failed to fetch event details");

          const data = await response.json();

          const utcDate = new Date(data.event_datetime);
          const localDate = toZonedTime(utcDate, timeZone);

          const formattedDateTime = format(localDate, "yyyy-MM-dd'T'HH:mm");

          setTitle(data.title);
          setDescription(data.description);
          setEventDateTime(formattedDateTime);

          const myLocation = {
            lat: data.location?.y ?? 37.7749,
            lng: data.location?.x ?? -122.4194,
          };

          setLocation(myLocation);
          setMaxAttendees(data.max_attendees ?? "");
        } catch (error) {
          console.error("Error fetching event:", error);
        }
      };

      fetchEvent();
    }
  }, [isEditing, eventId, timeZone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = `http://localhost:3000/api/events/${
        isEditing ? `${eventId}` : ""
      }`;
      const method = isEditing ? "PUT" : "POST";

      const latitude = location?.lat ?? null;
      const longitude = location?.lng ?? null;

      const locationPoint =
        latitude && longitude ? `${longitude} ${latitude}` : null;

      const localDate = new Date(eventDateTime);
      const utcDate = toZonedTime(localDate, timeZone);
      const utcISOString = utcDate.toISOString();

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          eventDateTime: utcISOString,
          location: locationPoint,
          max_attendees: maxAttendees,
        }),
      });

      if (!response.ok) {
        throw new Error(
          isEditing ? "Event update failed" : "Event creation failed"
        );
      }

      navigate("/");
      alert(
        isEditing ? "Event updated successfully" : "Event created successfully"
      );
    } catch (error) {
      console.error(
        isEditing ? "Event update failed" : "Event creation failed",
        error
      );
    }
  };

  const handleLocationChange = (position: LatLngLiteral) => {
    setLocation(position);
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="container mt-4 mb-5">
      <div className="card p-4 shadow-sm">
        <h2 className="mb-4">{isEditing ? "Edit Event" : "Create Event"}</h2>
        <div className="mb-3">
          <label className="form-label">Title:</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Description:</label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Event Date and Time:</label>
          <input
            type="datetime-local"
            className="form-control"
            value={eventDateTime}
            onChange={(e) => setEventDateTime(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Max Attendees:</label>
          <input
            type="number"
            className="form-control"
            value={maxAttendees}
            onChange={(e) => setMaxAttendees(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Search Location:</label>
          <div className="border p-2 rounded">
            <Places setPosition={handleLocationChange} />
          </div>
        </div>
        <div className="mb-3">
          <div className="map-container mb-3">
            <Map location={location} isLoaded={isLoaded} />
          </div>
        </div>
        <div className="text-end">
          <button type="submit" className="btn btn-primary">
            {isEditing ? "Update Event" : "Create Event"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default EventForm;
