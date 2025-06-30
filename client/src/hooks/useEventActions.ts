import { useNavigate } from "react-router-dom";
import { useState } from "react";

export const useEventActions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const cancelEvent = async (eventId: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/events/${eventId}/cancel`,
        {
          method: "PUT",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to cancel");
      alert("Event cancelled successfully");
    } catch (err) {
      console.error(err);
      alert("Error cancelling event");
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      alert("Event deleted successfully");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Error deleting event");
    } finally {
      setLoading(false);
    }
  };

  return { cancelEvent, deleteEvent, loading };
};
