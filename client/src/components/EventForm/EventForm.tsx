import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Map from "../Map/Map";
import Places from "../Places/Places";
import { useMapContext } from "../../context/MapProvider";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useToast } from "../../hooks/useToast";
import { Badge } from "react-bootstrap";
import "./EventForm.css";

interface EventFormProps {
  isEditing: boolean;
}

interface Tag {
  id: number;
  name: string;
}

type LatLngLiteral = google.maps.LatLngLiteral;

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `https://${rawUrl}/api` : "http://localhost:3000/api";

const isTimeInPast = (dateTimeString: string): boolean => {
  if (!dateTimeString) return false;

  const selectedTime = new Date(dateTimeString).getTime();
  const now = new Date().getTime();

  return selectedTime < now - 60000;
};

const EventForm: React.FC<EventFormProps> = ({ isEditing }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDateTime, setEventDateTime] = useState("");
  const [location, setLocation] = useState<LatLngLiteral | null>(null);
  const [address, setAddress] = useState<string>("");
  const [maxAttendees, setMaxAttendees] = useState<number | string>("");
  const [isEventExpired, setIsEventExpired] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isLoaded } = useMapContext();
  const { showNotification } = useToast();

  const eventId = id ? parseInt(id) : null;

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const hasTimeError = useMemo(() => {
    if (!isEditing || (isEditing && !isEventExpired)) {
      return isTimeInPast(eventDateTime);
    }
    return false;
  }, [eventDateTime, isEditing, isEventExpired]);

  const isFormInvalid = useMemo(() => {
    const hasRequiredFields =
      title.trim() !== "" &&
      description.trim() !== "" &&
      eventDateTime.trim() !== "" &&
      location !== null;
    return !hasRequiredFields || hasTimeError;
  }, [title, description, eventDateTime, location, hasTimeError]);

  useEffect(() => {
    fetch(`${BASE_URL}/tags`)
      .then((r) => r.json())
      .then((data) => setAvailableTags(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load tags", err));
  }, []);

  useEffect(() => {
    if (isEditing && eventId && !isNaN(eventId)) {
      const fetchEvent = async () => {
        try {
          const response = await fetch(`${BASE_URL}/events/${eventId}`);
          if (!response.ok) throw new Error("Failed to fetch event details");

          const data = await response.json();

          const eventDate = new Date(data.event_datetime);
          const now = new Date();

          if (eventDate < now) {
            setIsEventExpired(true);
            showNotification(
              "This event has passed. Date/Location editing is disabled.",
              "Notice",
              "warning",
            );
          }

          const localDate = toZonedTime(eventDate, timeZone);
          setTitle(data.title);
          setDescription(data.description);
          setEventDateTime(format(localDate, "yyyy-MM-dd'T'HH:mm"));
          setLocation({
            lat: data.location?.y ?? 37.7749,
            lng: data.location?.x ?? -122.4194,
          });
          setAddress(data.address ?? "");
          setMaxAttendees(data.max_attendees ?? "");
          setSelectedTagIds((data.tags ?? []).map((t: Tag) => t.id));
        } catch (error) {
          console.error("Error fetching event:", error);
          showNotification("Failed to load event details.", "Error", "danger");
        }
      };
      fetchEvent();
    }
  }, [isEditing, eventId, timeZone, showNotification]);

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isFormInvalid) {
      showNotification(
        "Please correct the form errors before submitting.",
        "Warning",
        "warning",
      );
      return;
    }

    try {
      const url = `${BASE_URL}/events/${isEditing ? `${eventId}` : ""}`;
      const method = isEditing ? "PUT" : "POST";

      const latitude = location?.lat ?? null;
      const longitude = location?.lng ?? null;
      const locationPoint =
        latitude && longitude ? `${longitude} ${latitude}` : null;

      let finalEventDateTime = eventDateTime;

      if (!isEditing || !isEventExpired) {
        const localDate = new Date(eventDateTime);
        const utcDate = toZonedTime(localDate, timeZone);
        finalEventDateTime = utcDate.toISOString();
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          eventDateTime: finalEventDateTime,
          location: locationPoint,
          max_attendees: maxAttendees,
          address,
          tagIds: selectedTagIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            (isEditing ? "Event update failed" : "Event creation failed"),
        );
      }

      navigate("/", {
        state: {
          successMessage: isEditing
            ? "Event updated successfully"
            : "Event created successfully",
        },
      });
    } catch (error: any) {
      showNotification(
        error.message ||
          (isEditing ? "Event update failed" : "Event creation failed"),
        "Error",
        "danger",
      );
    }
  };

  const handleLocationChange = (position: LatLngLiteral, addr: string) => {
    if (isEditing && isEventExpired) {
      showNotification(
        "Cannot change location for a past event.",
        "Warning",
        "warning",
      );
      return;
    }
    setLocation(position);
    setAddress(addr);
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <>
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
              className={`form-control ${hasTimeError ? "is-invalid" : ""}`}
              value={eventDateTime}
              onChange={(e) => setEventDateTime(e.target.value)}
              required
              disabled={isEditing && isEventExpired}
            />
            {hasTimeError && (
              <div className="invalid-feedback d-block">
                Error: Event time must be in the future.
              </div>
            )}
            {isEditing && isEventExpired && (
              <small className="text-danger">
                The date and time of a past event cannot be changed.
              </small>
            )}
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
            <label className="form-label">Tags:</label>
            <div className="d-flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Badge
                  key={tag.id}
                  pill
                  bg={selectedTagIds.includes(tag.id) ? "primary" : "light"}
                  style={{
                    cursor: "pointer",
                    color: selectedTagIds.includes(tag.id) ? "white" : "black",
                  }}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Search Location:</label>
            <div
              className={`border p-2 rounded ${isEditing && isEventExpired ? "disabled-search" : ""}`}
            >
              <Places
                setPosition={handleLocationChange}
                isDisabled={isEditing && isEventExpired}
              />
            </div>
            {isEditing && isEventExpired && (
              <small className="text-danger">
                The location of a past event cannot be changed.
              </small>
            )}
          </div>
          <div className="mb-3">
            <div className="map-container mb-3">
              <Map location={location} isLoaded={isLoaded} />
            </div>
          </div>
          <div className="text-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isFormInvalid}
            >
              {isEditing ? "Update Event" : "Create Event"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default EventForm;
