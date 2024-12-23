import React, { useState, useEffect } from "react";

type RSVPProps = {
  eventId: number;
  userId: number | undefined;
};

const RSVPButton: React.FC<RSVPProps> = ({ eventId, userId }) => {
  const [status, setStatus] = useState<string | null>(null);
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
          setStatus(data.status);
        } else if (response.status === 404) {
          setStatus(null);
        } else {
          console.error("Failed to fetch RSVP status.");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchRSVPStatus();
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
        alert(data.message);
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
      <button
        onClick={() => handleRSVP("Accepted")}
        disabled={status === "Accepted"}
      >
        Accept
      </button>
      <button
        onClick={() => handleRSVP("Declined")}
        disabled={status === "Declined"}
      >
        Decline
      </button>
      {status && <p>You have {status.toLowerCase()} the invitation.</p>}
    </div>
  );
};

export default RSVPButton;
