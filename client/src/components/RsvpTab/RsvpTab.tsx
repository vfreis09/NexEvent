import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { PublicUser } from "../../types/PublicUser";
import { useToast } from "../../hooks/useToast";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { PaginatedResponse } from "../../types/PaginationTypes";
import Loading from "../../components/Loading/Loading";
import "./RsvpTab.css";

const EventsPerPage = 10;
const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `https://${rawUrl}/api` : "http://localhost:3000/api";

const RsvpTab = () => {
  const { profileUser } = useOutletContext<{ profileUser: PublicUser }>();
  const [upcPage, setUpcPage] = useState(1);
  const { showNotification } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading: loadingUpcoming } = useQuery<PaginatedResponse>({
    queryKey: ["rsvp-tab", profileUser.username, upcPage],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/rsvps/user/${profileUser.username}?page=${upcPage}&limit=${EventsPerPage}&type=upcoming`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to fetch RSVPs.");
      return res.json();
    },
    enabled: !!profileUser.username,
    staleTime: 1000 * 60 * 5,
  });

  const upcomingRsvps: EventData[] = Array.isArray(data)
    ? data
    : data?.events || [];
  const upcTotalPages = data?.pagination?.totalPages || 1;
  const currentPage = data?.pagination?.currentPage || upcPage;

  const handleUpcomingPageChange = (page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setUpcPage(page);
  };

  const handleEventUpdate = (_updatedEvent: EventData) => {
    queryClient.invalidateQueries({
      queryKey: ["rsvp-tab", profileUser.username],
    });
  };

  return (
    <div className="rsvps-tab-view">
      <h3>Upcoming RSVPs</h3>
      {loadingUpcoming ? (
        <Loading variant="spinner" text="Loading upcoming RSVPs..." />
      ) : upcomingRsvps.length > 0 ? (
        <>
          <EventList
            events={upcomingRsvps}
            onEventUpdate={handleEventUpdate}
            showNotification={showNotification}
          />
          <PaginationControls
            currentPage={currentPage}
            totalPages={upcTotalPages}
            onPageChange={handleUpcomingPageChange}
          />
        </>
      ) : (
        <p className="no-events-message">This user has no upcoming RSVPs.</p>
      )}
    </div>
  );
};

export default RsvpTab;
