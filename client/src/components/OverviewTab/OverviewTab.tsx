import { useOutletContext, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { PublicUser } from "../../types/PublicUser";
import { useToast } from "../../hooks/useToast";
import { useTheme } from "../../context/ThemeContext";
import Loading from "../../components/Loading/Loading";

const MAX_EVENTS_TO_SHOW = 3;
const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `${rawUrl}/api` : "http://localhost:3000/api";

const OverviewTab = () => {
  const { profileUser } = useOutletContext<{ profileUser: PublicUser }>();
  const { showNotification } = useToast();
  const queryClient = useQueryClient();
  useTheme();

  const { data: createdEvents = [], isLoading: loadingCreated } = useQuery<
    EventData[]
  >({
    queryKey: ["overview-created", profileUser.username],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/user/${profileUser.username}/events?limit=${MAX_EVENTS_TO_SHOW}&type=upcoming`,
        { credentials: "include" },
      );
      const data = await res.json();
      return Array.isArray(data) ? data : data.events || [];
    },
    enabled: !!profileUser.username,
    staleTime: 1000 * 60 * 5,
  });

  const { data: rsvpedEvents = [], isLoading: loadingRsvp } = useQuery<
    EventData[]
  >({
    queryKey: ["overview-rsvps", profileUser.username],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/rsvps/user/${profileUser.username}?limit=${MAX_EVENTS_TO_SHOW}&type=upcoming`,
        { credentials: "include" },
      );
      const data = await res.json();
      return Array.isArray(data) ? data : data.events || [];
    },
    enabled: !!profileUser.username,
    staleTime: 1000 * 60 * 5,
  });

  const handleCreatedEventUpdate = (_updatedEvent: EventData) => {
    queryClient.invalidateQueries({
      queryKey: ["overview-created", profileUser.username],
    });
  };

  const handleRsvpedEventUpdate = (_updatedEvent: EventData) => {
    queryClient.invalidateQueries({
      queryKey: ["overview-rsvps", profileUser.username],
    });
  };

  if (loadingCreated || loadingRsvp)
    return <Loading variant="page" text="Loading summary..." />;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h4 className="mb-4 text-center text-lg font-bold text-foreground">
          Your Next Created Events
        </h4>
        {createdEvents.length > 0 ? (
          <EventList
            events={createdEvents}
            onEventUpdate={handleCreatedEventUpdate}
            showNotification={showNotification}
            isCompact={true}
          />
        ) : (
          <p className="rounded-lg border-l-4 border-primary bg-primary/10 px-4 py-3 text-sm italic text-muted-foreground">
            No upcoming created events.
          </p>
        )}
      </div>

      <div>
        <h4 className="mb-4 text-center text-lg font-bold text-foreground">
          Your Next RSVPs
        </h4>
        {rsvpedEvents.length > 0 ? (
          <EventList
            events={rsvpedEvents}
            onEventUpdate={handleRsvpedEventUpdate}
            showNotification={showNotification}
            isCompact={true}
          />
        ) : (
          <p className="rounded-lg border-l-4 border-primary bg-primary/10 px-4 py-3 text-sm italic text-muted-foreground">
            No upcoming RSVPs. Go find something fun!
          </p>
        )}
      </div>

      <div className="flex justify-center gap-2 border-t border-border pt-6 text-sm">
        <Link
          to="events"
          className="font-semibold text-primary hover:underline"
        >
          View All Created Events
        </Link>
        <span className="text-muted-foreground">|</span>
        <Link to="rsvps" className="font-semibold text-primary hover:underline">
          View All RSVPs
        </Link>
      </div>
    </div>
  );
};

export default OverviewTab;