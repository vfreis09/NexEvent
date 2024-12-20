import React, { useState } from "react";

type RSVPProps = {
  eventId: number;
  userId: number | undefined;
};

const RSVPButton: React.FC<RSVPProps> = ({ eventId, userId }) => {
  const [status, setStatus] = useState<string | null>(null);

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
