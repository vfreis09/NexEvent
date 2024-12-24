import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Map from "../Map/Map";
import Places from "../Places/Places";
import { useMapContext } from "../../context/MapProvider";

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

  useEffect(() => {
    if (isEditing && eventId && !isNaN(eventId)) {
      const fetchEvent = async () => {
        try {
          const response = await fetch(
            `http://localhost:3000/api/events/${eventId}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch event details");
          }
          const data = await response.json();
          const formattedDateTime = new Date(data.event_datetime)
            .toISOString()
            .slice(0, 16);
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
  }, [isEditing, eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = `http://localhost:3000/api/events/${
        isEditing ? `${eventId}` : ""
      }`;
      const method = isEditing ? "PUT" : "POST";

      // Extract latitude and longitude from location object
      const latitude = location?.lat ?? null;
      const longitude = location?.lng ?? null;

      // Format the location as a POINT (longitude latitude)
      const locationPoint =
        latitude && longitude ? `${longitude} ${latitude}` : null;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          eventDateTime,
          location: locationPoint,
          max_attendees: maxAttendees,
        }),
      });

      if (!response.ok) {
        throw new Error(
          isEditing ? "Event update failed" : "Event creation failed"
        );
      }

      const result = await response.json();
      console.log("Success:", result);
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

  const handleLocationChange = async (position: google.maps.LatLngLiteral) => {
    setLocation(position);
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Description:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Event Date and Time:</label>
        <input
          type="datetime-local"
          value={eventDateTime}
          onChange={(e) => setEventDateTime(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Max Attendees:</label>
        <input
          type="number"
          value={maxAttendees}
          onChange={(e) => setMaxAttendees(e.target.value)}
          min="1"
          required
        />
      </div>
      <Places setPosition={handleLocationChange} />
      <Map location={location} isLoaded={isLoaded} />
      <button type="submit">
        {isEditing ? "Update Event" : "Create Event"}
      </button>
    </form>
  );
};

export default EventForm;
