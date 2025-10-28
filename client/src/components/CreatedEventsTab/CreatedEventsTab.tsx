import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import EventList from "../../components/EventList/EventList";
import { EventData } from "../../types/EventData";
import { PublicUser } from "../../types/PublicUser";
import { useToast } from "../../hooks/useToast";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { PaginatedResponse } from "../../types/PaginationTypes";

const EventsPerPage = 10;

const CreatedEventsTab = () => {
  const { profileUser } = useOutletContext<{ profileUser: PublicUser }>();

  const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);
  const [pastEvents, setPastEvents] = useState<EventData[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingPast, setLoadingPast] = useState(true);

  const [upcPage, setUpcPage] = useState(1);
  const [upcTotalPages, setUpcTotalPages] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const [pastTotalPages, setPastTotalPages] = useState(1);

  const { showNotification } = useToast();

  const fetchEvents = useCallback(
    async (page: number, type: "upcoming" | "past") => {
      const isUpcoming = type === "upcoming";
      if (isUpcoming) setLoadingUpcoming(true);
      else setLoadingPast(true);

      const url = `http://localhost:3000/api/user/${profileUser.username}/events?page=${page}&limit=${EventsPerPage}&type=${type}`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch events.");

        const data: PaginatedResponse = await res.json();

        if (isUpcoming) {
          setUpcomingEvents(data.events);
          setUpcPage(data.pagination.currentPage);
          setUpcTotalPages(data.pagination.totalPages);
        } else {
          setPastEvents(data.events);
          setPastPage(data.pagination.currentPage);
          setPastTotalPages(data.pagination.totalPages);
        }
      } catch (err) {
        console.error(`Failed to load ${type} events`, err);
        showNotification(
          `Failed to load ${type} created events.`,
          "Error",
          "danger"
        );
        if (isUpcoming) setUpcomingEvents([]);
        else setPastEvents([]);
      } finally {
        if (isUpcoming) setLoadingUpcoming(false);
        else setLoadingPast(false);
      }
    },
    [profileUser.username, showNotification]
  );

  useEffect(() => {
    if (profileUser?.username) {
      fetchEvents(upcPage, "upcoming");
    }
  }, [profileUser.username, upcPage, fetchEvents]);

  useEffect(() => {
    if (profileUser?.username) {
      fetchEvents(pastPage, "past");
    }
  }, [profileUser.username, pastPage, fetchEvents]);

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

    setUpcomingEvents(updateList);
    setPastEvents(updateList);
  };

  if (loadingUpcoming && loadingPast) return <p>Loading created events...</p>;

  return (
    <div className="created-events-tab-view">
      <h3>Upcoming Created Events</h3>
      {loadingUpcoming ? (
        <p>Loading upcoming events...</p>
      ) : upcomingEvents.length > 0 ? (
        <>
          <EventList
            events={upcomingEvents}
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
        <p className="no-events-message">
          This user has no upcoming created events.
        </p>
      )}

      <h3 className="past-events-header">Past & Canceled History</h3>
      {loadingPast ? (
        <p>Loading history...</p>
      ) : pastEvents.length > 0 ? (
        <>
          <EventList
            events={pastEvents}
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
        <p className="no-events-message">
          No past or canceled created events to display.
        </p>
      )}
    </div>
  );
};

export default CreatedEventsTab;
