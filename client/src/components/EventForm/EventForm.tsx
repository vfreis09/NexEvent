import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { Globe, Lock } from "lucide-react";
import Map from "../Map/Map";
import Places from "../Places/Places";
import { useMapContext } from "../../context/MapProvider";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useToast } from "../../hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
const BASE_URL = rawUrl ? `${rawUrl}/api` : "http://localhost:3000/api";

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

  const queryClient = useQueryClient();
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

      await queryClient.invalidateQueries({ queryKey: ["events"] });
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto mb-16 mt-4 max-w-2xl px-4"
    >
      <div className="rounded border border-border bg-card p-6">
        <h2 className="mb-6 text-xl font-medium text-card-foreground">
          {isEditing ? "Edit event" : "Create event"}
        </h2>

        <div className="mb-4">
          <Label htmlFor="title" className="mb-1.5 block">
            Title
          </Label>
          <Input
            id="title"
            aria-invalid={!!errors.title}
            {...register("title", { required: "Title is required" })}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-destructive">
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <Label htmlFor="description" className="mb-1.5 block">
            Description
          </Label>
          <Textarea
            id="description"
            rows={4}
            aria-invalid={!!errors.description}
            {...register("description", {
              required: "Description is required",
            })}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <Label htmlFor="eventDateTime" className="mb-1.5 block">
            Event date and time
          </Label>
          <Input
            id="eventDateTime"
            type="datetime-local"
            disabled={isEditing && isEventExpired}
            aria-invalid={hasTimeError}
            {...register("eventDateTime", {
              required: "Date and time is required",
            })}
          />
          {hasTimeError && (
            <p className="mt-1 text-xs text-destructive">
              Event time must be in the future.
            </p>
          )}
          {isEditing && isEventExpired && (
            <p className="mt-1 text-xs text-muted-foreground">
              The date and time of a past event cannot be changed.
            </p>
          )}
        </div>

        <div className="mb-4">
          <Label htmlFor="maxAttendees" className="mb-1.5 block">
            Max attendees
          </Label>
          <Input id="maxAttendees" type="number" {...register("maxAttendees")} />
        </div>

        <div className="mb-4">
          <Label className="mb-1.5 block">Visibility</Label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setVisibility("public")}
              className={cn(
                "flex flex-1 flex-col items-start gap-1 rounded border p-3 text-left transition-colors",
                visibility === "public"
                  ? "border-primary bg-secondary"
                  : "border-border hover:bg-muted",
              )}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Globe size={14} /> Public
              </span>
              <span className="text-xs text-muted-foreground">
                Anyone can see this event
              </span>
            </button>
            <button
              type="button"
              onClick={() => setVisibility("private")}
              className={cn(
                "flex flex-1 flex-col items-start gap-1 rounded border p-3 text-left transition-colors",
                visibility === "private"
                  ? "border-primary bg-secondary"
                  : "border-border hover:bg-muted",
              )}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Lock size={14} /> Private
              </span>
              <span className="text-xs text-muted-foreground">
                Only you can see this event
              </span>
            </button>
          </div>
        </div>

        <div className="mb-4">
          <Label className="mb-1.5 block">Tags</Label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const selected = selectedTagIds.includes(tag.id);
              return (
                <Badge
                  key={tag.id}
                  variant={selected ? "default" : "outline"}
                  className="cursor-pointer rounded-full"
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <Label className="mb-1.5 block">Search location</Label>
          <div
            className={cn(
              "rounded border border-border p-2",
              isEditing && isEventExpired && "opacity-50",
            )}
          >
            <Places
              setPosition={handleLocationChange}
              isDisabled={isEditing && isEventExpired}
            />
          </div>
          {isEditing && isEventExpired && (
            <p className="mt-1 text-xs text-muted-foreground">
              The location of a past event cannot be changed.
            </p>
          )}
        </div>

        <div className="mb-4 overflow-hidden rounded border border-border">
          <Map location={location} isLoaded={isLoaded} />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isFormInvalid || isSubmitting}>
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
                ? "Update event"
                : "Create event"}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default EventForm;