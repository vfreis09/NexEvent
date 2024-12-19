import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLoadScript } from "@react-google-maps/api";
import Map from "../Map/Map";
import Places from "../Places/Places";

interface EventFormProps {
  isEditing: boolean;
}

type LatLngLiteral = google.maps.LatLngLiteral;

const apiKey = import.meta.env.VITE_PUBLIC_API_KEY as string;

const EventForm: React.FC<EventFormProps> = ({ isEditing }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDateTime, setEventDateTime] = useState("");
  const [location, setLocation] = useState<LatLngLiteral | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: ["places"],
  });

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

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

          if (
            data.location &&
            typeof data.location.x === "number" &&
            typeof data.location.y === "number"
          ) {
            setLocation({ lat: data.location.y, lng: data.location.x });
          } else {
            console.warn("No valid location data found.");
            setLocation(null);
          }
        } catch (error) {
          console.error("Error fetching event:", error);
        }
      };

      fetchEvent();
    }
  }, [isEditing, eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location || !location.lat || !location.lng) {
      alert("Please select a valid location.");
      return;
    }

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
      <Places setPosition={handleLocationChange} />
      <Map location={location} />
      <button type="submit">
        {isEditing ? "Update Event" : "Create Event"}
      </button>
    </form>
  );
};

export default EventForm;
