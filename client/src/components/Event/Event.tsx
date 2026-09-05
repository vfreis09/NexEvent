import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Tag as TagIcon, Lock } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { EventData } from "../../types/EventData";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EventProps {
  event: EventData;
  onCancel: (id: number) => void;
  hostPicture: string | null | undefined;
  hostUsername: string;
}

const defaultAvatar = "/images/default-avatar.png";

const statusStyles: Record<string, string> = {
  active:
    "bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-900",
  canceled:
    "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900",
  expired:
    "bg-muted border-border",
  full: "bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-900",
};

const statusLabelStyles: Record<string, string> = {
  active: "text-green-700 dark:text-green-400",
  canceled: "text-red-700 dark:text-red-400",
  expired: "text-muted-foreground",
  full: "text-orange-700 dark:text-orange-400",
};

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
  const statusKey = event.status.toLowerCase();

  const handleCancelClick = () => setShowCancelModal(true);
  const handleConfirmCancel = () => {
    onCancel(event.id);
    setShowCancelModal(false);
  };
  const handleCloseCancelModal = () => setShowCancelModal(false);

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        {isPrivate && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border-l-4 border-primary bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
            <Lock size={16} className="flex-shrink-0" />
            {isOwner
              ? "This event is private — only you and invited users can see it"
              : "This is a private event — you were invited"}
          </div>
        )}

        <h2 className="mb-5 text-2xl font-bold leading-tight tracking-tight text-card-foreground sm:text-3xl">
          {event.title}
        </h2>

        <div className="mb-6 flex items-center gap-3 border-b border-border pb-5">
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-border">
            <img
              src={imageSrc}
              alt={`${hostUsername}'s profile`}
              className="h-full w-full object-cover"
            />
          </div>
          <Link
            to={`/user/${hostUsername}`}
            className="text-base font-semibold text-foreground hover:underline"
          >
            {hostUsername}
          </Link>
        </div>

        <p className="mb-7 whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
          {event.description}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-4">
            <strong className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
              <Calendar size={13} /> Date &amp; Time
            </strong>
            <span className="text-sm font-medium text-foreground">
              {new Date(event.event_datetime).toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-4">
            <strong className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
              <MapPin size={13} /> Location
            </strong>
            <span className="text-sm font-medium text-foreground">
              {event.address}
            </span>
          </div>

          <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-4">
            <strong className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
              <Users size={13} /> Attendees
            </strong>
            <span className="text-sm font-medium text-foreground">
              {event.number_of_attendees}
              {event.max_attendees !== null && ` / ${event.max_attendees}`}
            </span>
          </div>

          <div
            className={cn(
              "flex flex-col gap-1 rounded-lg border p-4",
              statusStyles[statusKey] ?? "bg-muted/30 border-border",
            )}
          >
            <strong
              className={cn(
                "text-xs font-bold uppercase tracking-wide",
                statusLabelStyles[statusKey] ?? "text-muted-foreground",
              )}
            >
              Status
            </strong>
            <span
              className={cn(
                "text-sm font-semibold capitalize",
                statusLabelStyles[statusKey] ?? "text-foreground",
              )}
            >
              {event.status}
            </span>
          </div>

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4 sm:col-span-2">
              <strong className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
                <TagIcon size={13} /> Tags
              </strong>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="rounded-full">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {isVerified && isOwner && user?.role !== "banned" && (
          <div className="mt-7 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
            <Link
              to={`/edit/${event.id}`}
              className="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Edit Details
            </Link>
            {event.status !== "canceled" && (
              <Button
                variant="outline"
                className="h-auto flex-1 whitespace-nowrap border-destructive px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleCancelClick}
              >
                Cancel Event
              </Button>
            )}
          </div>
        )}
      </div>

      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleCloseCancelModal}
        >
          <div
            className="w-[90%] max-w-[440px] rounded-xl border border-border bg-card p-7 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-xl font-bold text-card-foreground">
              Cancel Event?
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              Are you sure you want to cancel{" "}
              <strong className="text-foreground">{event.title}</strong>?
              {event.number_of_attendees > 0 && (
                <span className="mt-2 block font-semibold text-orange-600 dark:text-orange-400">
                  This will notify {event.number_of_attendees} attendee
                  {event.number_of_attendees !== 1 ? "s" : ""}.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={handleCloseCancelModal}>
                Keep Event
              </Button>
              <Button variant="destructive" onClick={handleConfirmCancel}>
                Yes, Cancel Event
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Event;