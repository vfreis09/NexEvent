import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { PublicUser } from "../../types/PublicUser";
import { useToast } from "../../hooks/useToast";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { PaginatedResponse } from "../../types/PaginationTypes";
import "./RsvpTab.css";

const EventsPerPage = 10;

const RsvpTab = () => {
  const { profileUser } = useOutletContext<{ profileUser: PublicUser }>();

  const [upcomingRsvps, setUpcomingRsvps] = useState<EventData[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);

  const [upcPage, setUpcPage] = useState(1);
  const [upcTotalPages, setUpcTotalPages] = useState(1);

  const { showNotification } = useToast();

  const fetchRsvps = useCallback(
    async (page: number) => {
      setLoadingUpcoming(true);

      const url = `http://localhost:3000/api/rsvps/user/${profileUser.username}?page=${page}&limit=${EventsPerPage}&type=upcoming`;

      try {
        const res = await fetch(url, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch RSVPs.");
        }

        const data: PaginatedResponse = await res.json();

        const eventsList = Array.isArray(data) ? data : data.events || [];
        const totalPages = data.pagination?.totalPages || 1;
        const currentPage = data.pagination?.currentPage || page;

        setUpcomingRsvps(eventsList);
        setUpcPage(currentPage);
        setUpcTotalPages(totalPages);
      } catch (err) {
        console.error(`Failed to load upcoming RSVPs`, err);
        showNotification(`Failed to load RSVPs.`, "Error", "danger");
        setUpcomingRsvps([]);
      } finally {
        setLoadingUpcoming(false);
      }
    },
    [profileUser.username, showNotification]
  );

  useEffect(() => {
    if (profileUser?.username) {
      fetchRsvps(upcPage);
    }
  }, [profileUser.username, upcPage, fetchRsvps]);

  const handleUpcomingPageChange = (page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setUpcPage(page);
  };

  const handleEventUpdate = (updatedEvent: EventData) => {
    setUpcomingRsvps((prevEvents) =>
      prevEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  return (
    <div className="rsvps-tab-view">
      <h3>Upcoming RSVPs</h3>
      {loadingUpcoming ? (
        <p className="loading-text">Loading upcoming RSVPs...</p>
      ) : upcomingRsvps.length > 0 ? (
        <>
          <EventList
            events={upcomingRsvps}
            onEventUpdate={handleEventUpdate}
            showNotification={showNotification}
          />
          <PaginationControls
            currentPage={upcPage}
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
