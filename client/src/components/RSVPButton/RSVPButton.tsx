import React, { useState, useEffect } from "react";

type RSVPProps = {
  eventId: number;
  userId: number | undefined;
};

const RSVPButton: React.FC<RSVPProps> = ({ eventId, userId }) => {
  const [status, setStatus] = useState<string | null>(null);
  const [isEventFull, setIsEventFull] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRSVPStatus = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/events/${eventId}/rsvp?userId=${userId}`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setStatus(data.status || null); // Set status if found, or null otherwise
          setIsEventFull(data.isEventFull); // Set event full status from backend
        } else if (response.status === 404) {
          const errorData = await response.json();
          setStatus(null); // User has no RSVP
          setIsEventFull(errorData.isEventFull || false); // Handle full status on 404
        } else {
          console.error("Failed to fetch RSVP status.");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRSVPStatus();
  }, [eventId, userId]);

  const handleRSVP = async (rsvpStatus: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/events/${eventId}/rsvp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            status: rsvpStatus,
          }),
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStatus(rsvpStatus);
        alert(data.message); // Message from server after updating RSVP
      } else {
        alert("Failed to update RSVP.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update RSVP.");
    }
  };

  if (!userId) {
    return <p>Please log in to RSVP for this event.</p>;
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      {isEventFull && !status ? (
        <p>Sorry, this event is already full.</p>
      ) : (
        <>
          <button
            onClick={() => handleRSVP("Accepted")}
            disabled={status === "Accepted"} // Disable if already accepted
          >
            Accept
          </button>
          <button
            onClick={() => handleRSVP("Declined")}
            disabled={status === "Declined"} // Disable if already declined
          >
            Decline
          </button>
        </>
      )}
      {status && <p>You have {status.toLowerCase()} the invitation.</p>}
    </div>
  );
};

export default RSVPButton;
