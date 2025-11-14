import React, { useState, useEffect } from "react";
import { useToast } from "../../hooks/useToast";
import AppToast from "../ToastComponent/ToastComponent";
import { useTheme } from "../../context/ThemeContext";
import "./RSVP.css";

type RSVPProps = {
  eventId: number;
  userId: number | undefined;
  status: string;
};

const RSVPButton: React.FC<RSVPProps> = ({ eventId, userId, status }) => {
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const { showToast, toastInfo, showNotification, hideToast } = useToast();

  useTheme();

  useEffect(() => {
    const fetchRSVPStatus = async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `http://localhost:3000/api/rsvps/events/${eventId}/rsvp?userId=${userId}`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setRsvpStatus(data.status ? data.status.toLowerCase() : null);
        } else if (response.status === 404) {
          setRsvpStatus(null);
        } else {
          showNotification(
            "Could not load your current RSVP status.",
            "Error",
            "danger"
          );
          setRsvpStatus(null);
        }
      } catch (err) {
        showNotification(
          "Could not load your current RSVP status.",
          "Error",
          "danger"
        );
        setRsvpStatus(null);
      } finally {
        setLoading(false);
      }
    };

    if (userId === undefined) return;
    if (userId === null) {
      setRsvpStatus(null);
      setLoading(false);
      return;
    }

    fetchRSVPStatus();
  }, [eventId, userId]);

  const handleRSVP = async (newRsvpStatus: string) => {
    try {
      const lowerStatus = newRsvpStatus.toLowerCase();

      const response = await fetch(
        `http://localhost:3000/api/rsvps/events/${eventId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            status: lowerStatus,
          }),
          credentials: "include",
        }
      );

      if (response.ok) {
        await response.json();
        setRsvpStatus(lowerStatus);

        const message =
          lowerStatus === "accepted"
            ? "You're in! Event spot secured."
            : "Invitation declined. We hope to see you next time!";

        showNotification(message, "Success", "success");
      } else {
        const errorData = await response.json();

        showNotification(
          errorData.message || "Failed to update your RSVP. Please try again.",
          "Error",
          "danger"
        );
      }
    } catch (err) {
      showNotification(
        "Failed to connect and update your RSVP.",
        "Error",
        "danger"
      );
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
    <>
      {showToast && toastInfo && (
        <AppToast
          show={showToast}
          message={toastInfo.message}
          header={toastInfo.header}
          bg={toastInfo.bg}
          textColor={toastInfo.textColor}
          onClose={hideToast}
        />
      )}
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
                onClick={() => handleRSVP("accepted")}
                className={
                  rsvpStatus === "accepted" ? "active accept-btn" : "accept-btn"
                }
              >
                Accept
              </button>
              <button
                onClick={() => handleRSVP("declined")}
                className={
                  rsvpStatus === "declined"
                    ? "active decline-btn"
                    : "decline-btn"
                }
              >
                Decline
              </button>
            </div>
            {rsvpStatus && (
              <p>
                You have {rsvpStatus === "accepted" ? "accepted" : "declined"}{" "}
                the invitation.
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default RSVPButton;
