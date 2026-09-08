import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { PublicUser } from "../../types/PublicUser";
import { useToast } from "../../hooks/useToast";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import Loading from "../../components/Loading/Loading";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `${rawUrl}/api` : "http://localhost:3000/api";

const EventsPerPage = 10;

const fetchEvents = async (
  username: string,
  page: number,
  type: "upcoming" | "past",
) => {
  const res = await fetch(
    `${BASE_URL}/user/${username}/events?page=${page}&limit=${EventsPerPage}&type=${type}`,
    { credentials: "include" },
  );
  if (!res.ok) throw new Error("Failed to fetch events.");
  const data = await res.json();
  return {
    events: Array.isArray(data) ? data : data.events || [],
    totalPages: data.pagination?.totalPages || 1,
    currentPage: data.pagination?.currentPage || page,
  };
};

const CreatedEventsTab = () => {
  const { profileUser } = useOutletContext<{ profileUser: PublicUser }>();
  const [upcPage, setUpcPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const queryClient = useQueryClient();
  const { showNotification } = useToast();

  const { data: upcomingData, isLoading: loadingUpcoming } = useQuery({
    queryKey: ["created-events", profileUser.username, "upcoming", upcPage],
    queryFn: () => fetchEvents(profileUser.username, upcPage, "upcoming"),
    enabled: !!profileUser.username,
    staleTime: 1000 * 60 * 5,
  });

  const { data: pastData, isLoading: loadingPast } = useQuery({
    queryKey: ["created-events", profileUser.username, "past", pastPage],
    queryFn: () => fetchEvents(profileUser.username, pastPage, "past"),
    enabled: !!profileUser.username,
    staleTime: 1000 * 60 * 5,
  });

  const upcomingEvents: EventData[] = upcomingData?.events ?? [];
  const pastEvents: EventData[] = pastData?.events ?? [];
  const upcTotalPages = upcomingData?.totalPages ?? 1;
  const pastTotalPages = pastData?.totalPages ?? 1;

  const handleUpcomingPageChange = (page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setUpcPage(page);
  };

  const handlePastPageChange = (page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPastPage(page);
  };

  const handleEventUpdate = (_updatedEvent: EventData) => {
    queryClient.invalidateQueries({
      queryKey: ["created-events", profileUser.username],
    });
  };

  return (
    <div className="flex flex-col">
      <h3 className="mb-5 text-center text-lg font-bold text-foreground">
        Upcoming Created Events
      </h3>
      {loadingUpcoming ? (
        <Loading variant="spinner" text="Loading upcoming events..." />
      ) : upcomingEvents.length > 0 ? (
        <>
          <EventList
            events={upcomingEvents}
            onEventUpdate={handleEventUpdate}
            showNotification={showNotification}
          />
          <div className="mt-6 flex justify-center">
            <PaginationControls
              currentPage={upcPage}
              totalPages={upcTotalPages}
              onPageChange={handleUpcomingPageChange}
            />
          </div>
        </>
      ) : (
        <p className="rounded-lg border-l-4 border-primary bg-primary/10 px-4 py-3 text-sm italic text-muted-foreground">
          This user has no upcoming created events.
        </p>
      )}

      <h3 className="mb-5 mt-12 border-t border-dashed border-border pt-8 text-center text-lg font-bold text-muted-foreground">
        Past & Canceled History
      </h3>
      {loadingPast ? (
        <Loading variant="spinner" text="Loading history..." />
      ) : pastEvents.length > 0 ? (
        <>
          <EventList
            events={pastEvents}
            onEventUpdate={handleEventUpdate}
            showNotification={showNotification}
            isPast={true}
          />
          <div className="mt-6 flex justify-center">
            <PaginationControls
              currentPage={pastPage}
              totalPages={pastTotalPages}
              onPageChange={handlePastPageChange}
            />
          </div>
        </>
      ) : (
        <p className="rounded-lg border-l-4 border-primary bg-primary/10 px-4 py-3 text-sm italic text-muted-foreground">
          No past or canceled created events to display.
        </p>
      )}
    </div>
  );
};

export default CreatedEventsTab;