import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../hooks/useToast";
import AppToast from "../ToastComponent/ToastComponent";
import { useTheme } from "../../context/ThemeContext";
import Loading from "../../components/Loading/Loading";
import "./RSVP.css";

type RSVPProps = {
  eventId: number;
  userId: number | undefined;
  status: string;
};

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `https://${rawUrl}/api` : "http://localhost:3000/api";

const RSVPButton: React.FC<RSVPProps> = ({ eventId, userId, status }) => {
  const { showToast, toastInfo, showNotification, hideToast } = useToast();
  const queryClient = useQueryClient();
  useTheme();

  const { data: rsvpStatus = null, isLoading: loading } = useQuery<
    string | null
  >({
    queryKey: ["rsvp-status", eventId, userId],
    queryFn: async () => {
      const response = await fetch(
        `${BASE_URL}/rsvps/events/${eventId}/rsvp?userId=${userId}`,
        { credentials: "include" },
      );
      if (response.status === 404) return null;
      if (!response.ok)
        throw new Error("Could not load your current RSVP status.");
      const data = await response.json();
      return data.status ? data.status.toLowerCase() : null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const handleRSVP = async (newRsvpStatus: string) => {
    try {
      const lowerStatus = newRsvpStatus.toLowerCase();

      const response = await fetch(`${BASE_URL}/rsvps/events/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: lowerStatus }),
        credentials: "include",
      });

      if (response.ok) {
        queryClient.setQueryData(["rsvp-status", eventId, userId], lowerStatus);
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
          "danger",
        );
      }
    } catch {
      showNotification(
        "Failed to connect and update your RSVP.",
        "Error",
        "danger",
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
          <Loading variant="spinner" text="Loading RSVP status..." />
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
