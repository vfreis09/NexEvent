import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
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

interface EventFormData {
  title: string;
  description: string;
  eventDateTime: string;
  maxAttendees: string;
}

type LatLngLiteral = google.maps.LatLngLiteral;

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `https://${rawUrl}/api` : "http://localhost:3000/api";

const isTimeInPast = (dateTimeString: string): boolean => {
  if (!dateTimeString) return false;
  return new Date(dateTimeString).getTime() < new Date().getTime() - 60000;
};

const EventForm: React.FC<EventFormProps> = ({ isEditing }) => {
  const [location, setLocation] = useState<LatLngLiteral | null>(null);
  const [address, setAddress] = useState<string>("");
  const [isEventExpired, setIsEventExpired] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isLoaded } = useMapContext();
  const { showNotification } = useToast();
  const eventId = id ? parseInt(id) : null;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>();

  const eventDateTime = useWatch({
    control,
    name: "eventDateTime",
    defaultValue: "",
  });
  const hasTimeError = !isEventExpired && isTimeInPast(eventDateTime);
  const isFormInvalid = hasTimeError || !location;

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
          const response = await fetch(`${BASE_URL}/events/${eventId}`, {
            credentials: "include",
          });
          if (!response.ok) throw new Error("Failed to fetch event details");

          const data = await response.json();
          const eventDate = new Date(data.event_datetime);

          if (eventDate < new Date()) {
            setIsEventExpired(true);
            showNotification(
              "This event has passed. Date/Location editing is disabled.",
              "Notice",
              "warning",
            );
          }

          const localDate = toZonedTime(eventDate, timeZone);
          setValue("title", data.title);
          setValue("description", data.description);
          setValue("eventDateTime", format(localDate, "yyyy-MM-dd'T'HH:mm"));
          setValue("maxAttendees", data.max_attendees ?? "");
          setLocation({
            lat: data.location?.y ?? 37.7749,
            lng: data.location?.x ?? -122.4194,
          });
          setAddress(data.address ?? "");
          setSelectedTagIds((data.tags ?? []).map((t: Tag) => t.id));
          setVisibility(data.visibility ?? "public");
        } catch (error) {
          showNotification("Failed to load event details.", "Error", "danger");
        }
      };
      fetchEvent();
    }
  }, [isEditing, eventId, timeZone, showNotification, setValue]);

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const onSubmit = async (data: EventFormData) => {
    if (!location) {
      showNotification("Please select a location.", "Warning", "warning");
      return;
    }

    if (hasTimeError) {
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

      const locationPoint =
        location.lat && location.lng ? `${location.lng} ${location.lat}` : null;

      let finalEventDateTime = data.eventDateTime;
      if (!isEditing || !isEventExpired) {
        const utcDate = toZonedTime(new Date(data.eventDateTime), timeZone);
        finalEventDateTime = utcDate.toISOString();
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          eventDateTime: finalEventDateTime,
          location: locationPoint,
          max_attendees: data.maxAttendees,
          address,
          tagIds: selectedTagIds,
          visibility,
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
      <form onSubmit={handleSubmit(onSubmit)} className="container mt-4 mb-5">
        <div className="card p-4 shadow-sm">
          <h2 className="mb-4">{isEditing ? "Edit Event" : "Create Event"}</h2>
          <div className="mb-3">
            <label className="form-label">Title:</label>
            <input
              type="text"
              className={`form-control ${errors.title ? "is-invalid" : ""}`}
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && (
              <div className="invalid-feedback">{errors.title.message}</div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Description:</label>
            <textarea
              className={`form-control ${errors.description ? "is-invalid" : ""}`}
              rows={4}
              {...register("description", {
                required: "Description is required",
              })}
            />
            {errors.description && (
              <div className="invalid-feedback">
                {errors.description.message}
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Event Date and Time:</label>
            <input
              type="datetime-local"
              className={`form-control ${hasTimeError ? "is-invalid" : ""}`}
              disabled={isEditing && isEventExpired}
              {...register("eventDateTime", {
                required: "Date and time is required",
              })}
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
              {...register("maxAttendees")}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Visibility:</label>
            <div className="d-flex gap-3">
              <div
                className={`visibility-option ${visibility === "public" ? "selected" : ""}`}
                onClick={() => setVisibility("public")}
              >
                <span>🌐 Public</span>
                <small>Anyone can see this event</small>
              </div>
              <div
                className={`visibility-option ${visibility === "private" ? "selected" : ""}`}
                onClick={() => setVisibility("private")}
              >
                <span>🔒 Private</span>
                <small>Only you can see this event</small>
              </div>
            </div>
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
              disabled={isFormInvalid || isSubmitting}
            >
              {isSubmitting
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                  ? "Update Event"
                  : "Create Event"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default EventForm;
