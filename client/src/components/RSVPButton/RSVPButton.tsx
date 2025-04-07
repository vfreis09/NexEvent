import React, { useState, useEffect } from "react";
import "./RSVP.css";

type RSVPProps = {
  eventId: number;
  userId: number | undefined;
  status: string;
};

const RSVPButton: React.FC<RSVPProps> = ({ eventId, userId, status }) => {
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
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
          setRsvpStatus(data.status || null);
        } else if (response.status === 404) {
          setRsvpStatus(null);
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
        setRsvpStatus(rsvpStatus);
        alert(data.message);
      } else {
        alert("Failed to update RSVP.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update RSVP.");
    }
  };

  if (status === "expired") {
    return (
      <div className="rsvp-container">
        <p>This event has expired. You can no longer RSVP.</p>
      </div>
    );
  }

  if (status === "full") {
    return (
      <div className="rsvp-container">
        <p>This event is full. RSVP is closed.</p>
      </div>
    );
  }

  return (
    <div className="rsvp-container">
      {loading ? (
        <p>Loading RSVP status...</p>
      ) : !userId ? (
        <p>Please log in to RSVP for this event.</p>
      ) : (
        <>
          <p>Please let us know if you'll be attending:</p>
          <div className="rsvp-buttons">
            <button
              onClick={() => handleRSVP("Accepted")}
              className={rsvpStatus === "Accepted" ? "active" : ""}
            >
              Accept
            </button>
            <button
              onClick={() => handleRSVP("Declined")}
              className={rsvpStatus === "Declined" ? "active" : ""}
            >
              Decline
            </button>
          </div>
          {rsvpStatus && (
            <p>You have {rsvpStatus.toLowerCase()} the invitation.</p>
          )}
        </>
      )}
    </div>
  );
};

export default RSVPButton;
