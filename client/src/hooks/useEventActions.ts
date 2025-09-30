import { useState } from "react";

export const useEventActions = (
  showNotification: (
    message: string,
    header: string,
    bg: string,
    textColor?: string
  ) => void
) => {
  const [loading, setLoading] = useState(false);

  const cancelEvent = async (
    eventId: number,
    onSuccess: (data: any) => void
  ) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/events/${eventId}/cancel`,
        {
          method: "PUT",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to cancel event.");

      const data = await res.json();

      onSuccess(data);

      showNotification(
        "Event successfully closed. The event status is now Canceled.",
        "Success",
        "success",
        "white"
      );
    } catch (err) {
      showNotification(
        "We couldn't cancel the event. Please try again.",
        "Error",
        "danger",
        "white"
      );
    } finally {
      setLoading(false);
    }
  };

  return { cancelEvent, loading };
};
