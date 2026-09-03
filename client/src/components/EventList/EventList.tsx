import React from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useEventActions } from "../../hooks/useEventActions";
import { EventData } from "../../types/EventData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PaginationControls from "../PaginationControls/PaginationControls";

interface EventListProps {
  events: EventData[];
  onEventUpdate: (updatedEvent: EventData) => void;
  showNotification: (
    message: string,
    header: string,
    bg: string,
    textColor?: string,
  ) => void;
  isPast?: boolean;
  isCompact?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const defaultAvatar = "/images/default-avatar.png";

const statusStyles: Record<string, string> = {
  active: "text-success border-success",
  upcoming: "text-success border-success",
  full: "text-warning border-warning",
  expired: "text-muted-foreground border-muted-foreground",
  completed: "text-muted-foreground border-muted-foreground",
  canceled: "text-destructive border-destructive",
};

const tagStyles = ["bg-secondary text-secondary-foreground", "bg-accent text-accent-foreground"];

const EventList: React.FC<EventListProps> = ({
  events,
  onEventUpdate,
  showNotification,
  isPast = false,
  isCompact = false,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const { user, isVerified } = useUser();
  const { cancelEvent } = useEventActions(showNotification);

  if (!Array.isArray(events) || events.length === 0) {
    return (
      <div className="my-10 text-center text-sm italic text-muted-foreground">
        No events available. Try again later!
      </div>
    );
  }

  const handleCancelClick = async (eventId: number) => {
    await cancelEvent(eventId, (data) => {
      onEventUpdate(data.event);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {events.map((event) => {
        const isOwner = user && event.author_id === user.id;
        const eventIsExpired = new Date(event.event_datetime) < new Date();
        const isPrivate = event.visibility === "private";

        const imageSrc = event.author?.profile_picture_base64
          ? event.author.profile_picture_base64
          : defaultAvatar;

        const statusLabel =
          event.status === "canceled"
            ? "Canceled"
            : eventIsExpired && isPast
              ? "Completed"
              : event.max_attendees !== null &&
                  event.number_of_attendees >= event.max_attendees
                ? "Full"
                : isCompact
                  ? "Upcoming"
                  : eventIsExpired
                    ? "Expired"
                    : "Active";

        const eventDate = new Date(event.event_datetime);
        const month = eventDate
          .toLocaleDateString(undefined, { month: "short" })
          .toUpperCase();
        const day = eventDate.getDate().toString().padStart(2, "0");
        const time = eventDate.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        });

        const descLimit = isCompact ? 50 : 100;
        const truncatedDescription =
          event.description.length > descLimit
            ? `${event.description.slice(0, descLimit)}...`
            : event.description;

        return (
          <div
            key={event.id}
            className={cn(
              "relative rounded border bg-card p-5",
              isPast
                ? "border-dashed border-border/70 bg-muted/20 opacity-70"
                : "border-border",
            )}
          >
            <div className="flex gap-4">
              <div className="hidden min-w-[64px] shrink-0 border-r border-dashed border-border pr-4 text-center font-mono sm:block">
                <div className="text-[11px] tracking-wide text-muted-foreground">
                  {month}
                </div>
                <div className="text-2xl font-medium leading-none text-card-foreground">
                  {day}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {time}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/user/${event.author_username}`}
                      className="size-6 shrink-0 overflow-hidden rounded-full"
                    >
                      <img
                        src={imageSrc}
                        alt={event.author_username}
                        className="size-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultAvatar;
                        }}
                      />
                    </Link>
                    <Link
                      to={`/user/${event.author_username}`}
                      className="text-xs font-medium text-muted-foreground no-underline hover:text-foreground"
                    >
                      {event.author_username}
                    </Link>
                  </div>
                  {isPrivate && (
                    <Badge
                      variant="outline"
                      className="gap-1 rounded-full text-accent-foreground"
                    >
                      <Lock size={11} /> Private
                    </Badge>
                  )}
                </div>

                <Link
                  to={`/event/${event.id}`}
                  className="mb-1.5 block text-base font-medium text-card-foreground no-underline hover:text-primary"
                >
                  {event.title}
                </Link>

                <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground sm:hidden">
                  <span className="font-mono">
                    {month} {day}, {time}
                  </span>
                </div>

                <div className="mb-2 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  {event.address && <span>{event.address.split(",")[0]}</span>}
                  {!isCompact && event.address && <span className="text-muted-foreground/50">·</span>}
                  {!isCompact && <span>{event.number_of_attendees} attendees</span>}
                </div>

                <p className="mb-3 truncate text-sm italic text-muted-foreground">
                  {truncatedDescription}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded border px-2 py-0.5 font-mono text-[11px] font-medium",
                      statusStyles[statusLabel.toLowerCase()],
                    )}
                  >
                    {statusLabel}
                  </span>

                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {event.tags.map((tag, idx) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className={cn("rounded-full", tagStyles[idx % tagStyles.length])}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {isVerified &&
                  user?.role !== "banned" &&
                  isOwner &&
                  !isPast &&
                  !isCompact && (
                    <div className="mt-4 flex gap-2 border-t border-border pt-4">
                      <Link to={`/edit/${event.id}`}>
                        <Button size="sm">Edit</Button>
                      </Link>
                      {event.status !== "canceled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive/10"
                          onClick={() => handleCancelClick(event.id)}
                        >
                          Cancel event
                        </Button>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>
        );
      })}

      {currentPage !== undefined &&
        totalPages !== undefined &&
        onPageChange && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
    </div>
  );
};

export default EventList;