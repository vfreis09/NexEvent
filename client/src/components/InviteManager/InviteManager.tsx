import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Invite } from "../../types/Invite";
import { useTheme } from "../../context/ThemeContext";
import "./InviteManager.css";

interface InviteManagerProps {
  eventId: number;
  status: string;
  eventDateTime: string;
  maxAttendees: number | null;
  currentAttendees: number;
}

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `https://${rawUrl}/api` : "http://localhost:3000/api";

const InviteManager: React.FC<InviteManagerProps> = ({
  eventId,
  status,
  eventDateTime,
  maxAttendees,
  currentAttendees,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useTheme();

  const isInviteDisabled =
    status === "canceled" ||
    new Date(eventDateTime) < new Date() ||
    (maxAttendees !== null && currentAttendees >= maxAttendees);

  const { data: invites = [] } = useQuery<Invite[]>({
    queryKey: ["invites", eventId],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/events/${eventId}/invites`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch invites");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${BASE_URL}/events/${eventId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send invite");
      setMessage("User invited successfully!");
      setIdentifier("");
      queryClient.invalidateQueries({ queryKey: ["invites", eventId] });
    } catch (err: any) {
      setMessage(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const disabledReason =
    status === "canceled"
      ? "canceled"
      : new Date(eventDateTime) < new Date()
        ? "expired"
        : "full";

  return (
    <div className="invite-manager">
      <div className="invite-header">
        <h3>Invitations</h3>
        {isInviteDisabled && (
          <p className="invite-disabled-text">
            Inviting is disabled — this event is {disabledReason}.
          </p>
        )}
      </div>
      {!isInviteDisabled && (
        <form onSubmit={handleInvite} className="invite-form">
          <input
            type="text"
            placeholder="Username or email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Inviting..." : "Send"}
          </button>
        </form>
      )}
      {message && <p className="invite-message">{message}</p>}
      <div className="invite-list">
        <h4>Current Invites</h4>
        {invites.length === 0 ? (
          <p className="invite-empty">No invites sent yet.</p>
        ) : (
          <ul>
            {invites.map((invite) => (
              <li key={invite.id}>
                <strong>{invite.username}</strong> – {invite.status} (
                {new Date(invite.created_at).toLocaleString()})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default InviteManager;
