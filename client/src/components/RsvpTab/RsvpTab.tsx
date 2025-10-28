import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { PublicUser } from "../../types/PublicUser";
import { useToast } from "../../hooks/useToast";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { PaginatedResponse } from "../../types/PaginationTypes";

const EventsPerPage = 10;

const RsvpTab = () => {
  const { profileUser } = useOutletContext<{ profileUser: PublicUser }>();

  const [upcomingRsvps, setUpcomingRsvps] = useState<EventData[]>([]);
  const [pastRsvps, setPastRsvps] = useState<EventData[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingPast, setLoadingPast] = useState(true);

  const [upcPage, setUpcPage] = useState(1);
  const [upcTotalPages, setUpcTotalPages] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const [pastTotalPages, setPastTotalPages] = useState(1);

  const { showNotification } = useToast();

  const fetchRsvps = useCallback(
    async (page: number, type: "upcoming" | "past") => {
      const isUpcoming = type === "upcoming";
      if (isUpcoming) setLoadingUpcoming(true);
      else setLoadingPast(true);

      const url = `http://localhost:3000/api/rsvps/user/${profileUser.username}?page=${page}&limit=${EventsPerPage}&type=${type}`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch RSVPs.");

        const data: PaginatedResponse = await res.json();

        if (isUpcoming) {
          setUpcomingRsvps(data.events);
          setUpcPage(data.pagination.currentPage);
          setUpcTotalPages(data.pagination.totalPages);
        } else {
          setPastRsvps(data.events);
          setPastPage(data.pagination.currentPage);
          setPastTotalPages(data.pagination.totalPages);
        }
      } catch (err) {
        console.error(`Failed to load ${type} RSVPs`, err);
        showNotification(`Failed to load ${type} RSVPs.`, "Error", "danger");
        if (isUpcoming) setUpcomingRsvps([]);
        else setPastRsvps([]);
      } finally {
        if (isUpcoming) setLoadingUpcoming(false);
        else setLoadingPast(false);
      }
    },
    [profileUser.username, showNotification]
  );

  useEffect(() => {
    if (profileUser?.username) {
      fetchRsvps(upcPage, "upcoming");
    }
  }, [profileUser.username, upcPage, fetchRsvps]);

  useEffect(() => {
    if (profileUser?.username) {
      fetchRsvps(pastPage, "past");
    }
  }, [profileUser.username, pastPage, fetchRsvps]);

  const handleUpcomingPageChange = (page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setUpcPage(page);
  };

  const handlePastPageChange = (page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPastPage(page);
  };

  const handleEventUpdate = (updatedEvent: EventData) => {
    const updateList = (prevEvents: EventData[]): EventData[] =>
      prevEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      );

    setUpcomingRsvps(updateList);
    setPastRsvps(updateList);
  };

  if (loadingUpcoming && loadingPast) return <p>Loading RSVP'd events...</p>;

  return (
    <div className="rsvps-tab-view">
      <h3>Upcoming RSVPs</h3>
      {loadingUpcoming ? (
        <p>Loading upcoming RSVPs...</p>
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

      <h3 className="past-rsvps-header">Past & Canceled History</h3>
      {loadingPast ? (
        <p>Loading history...</p>
      ) : pastRsvps.length > 0 ? (
        <>
          <EventList
            events={pastRsvps}
            onEventUpdate={handleEventUpdate}
            showNotification={showNotification}
            isPast={true}
          />
          <PaginationControls
            currentPage={pastPage}
            totalPages={pastTotalPages}
            onPageChange={handlePastPageChange}
          />
        </>
      ) : (
        <p className="no-events-message">No past or canceled RSVPs.</p>
      )}
    </div>
  );
};

export default RsvpTab;
