import React, { useState, useEffect } from "react";
import { Invite } from "../../types/Invite";
import "./InviteManager.css";

interface InviteManagerProps {
  eventId: number;
  status: string;
  eventDateTime: string;
  maxAttendees: number | null;
  currentAttendees: number;
}

const InviteManager: React.FC<InviteManagerProps> = ({
  eventId,
  status,
  eventDateTime,
  maxAttendees,
  currentAttendees,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isInviteDisabled =
    status === "canceled" ||
    new Date(eventDateTime) < new Date() ||
    (maxAttendees !== null && currentAttendees >= maxAttendees);

  const fetchInvites = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/events/${eventId}/invites`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to fetch invites");
      const data = await res.json();
      setInvites(data);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load invites.");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(
        `http://localhost:3000/api/events/${eventId}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ identifier }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to send invite");

      setMessage("User invited successfully!");
      setIdentifier("");
      fetchInvites();
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, [eventId]);

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
