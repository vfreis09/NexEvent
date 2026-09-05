import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../hooks/useToast";
import { useTheme } from "../../context/ThemeContext";
import Loading from "../../components/Loading/Loading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RSVPProps = {
  eventId: number;
  userId: number | undefined;
  status: string;
};

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `${rawUrl}/api` : "http://localhost:3000/api";

const RSVPButton: React.FC<RSVPProps> = ({ eventId, userId, status }) => {
  const { showNotification } = useToast();
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
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          This event has expired. You can no longer RSVP.
        </p>
      </div>
    );
  }

  if (status === "full") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          This event is full. RSVP is closed.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center">
      {loading ? (
        <Loading variant="spinner" text="Loading RSVP status..." />
      ) : !userId ? (
        <p className="text-sm text-muted-foreground">
          Please log in to RSVP for this event.
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm font-medium text-card-foreground">
            Please let us know if you'll be attending:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => handleRSVP("accepted")}
              className={cn(
                rsvpStatus === "accepted" &&
                  "ring-2 ring-primary ring-offset-2 ring-offset-background",
              )}
            >
              Accept
            </Button>
            <Button
              variant="outline"
              onClick={() => handleRSVP("declined")}
              className={cn(
                rsvpStatus === "declined" &&
                  "ring-2 ring-destructive ring-offset-2 ring-offset-background",
              )}
            >
              Decline
            </Button>
          </div>
          {rsvpStatus && (
            <p className="mt-4 text-sm text-muted-foreground">
              You have{" "}
              <span className="font-medium text-foreground">
                {rsvpStatus === "accepted" ? "accepted" : "declined"}
              </span>{" "}
              the invitation.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default RSVPButton;