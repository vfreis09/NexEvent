import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Notification } from "../../types/Notification";
import { useToast } from "../../hooks/useToast";
import "./NotificationDropdown.css";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `https://${rawUrl}/api` : "http://localhost:3000/api";

interface NotificationDropdownProps {
  isLoggedIn: boolean;
  userId?: number;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isLoggedIn,
  userId,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showNotification } = useToast();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/notifications`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    enabled: !!userId && isLoggedIn,
    staleTime: 1000 * 30,
  });

  const markNotificationRead = async (notificationId: number) => {
    try {
      const res = await fetch(
        `${BASE_URL}/notifications/${notificationId}/read`,
        { method: "PATCH", credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to mark notification as read");
      queryClient.setQueryData<Notification[]>(["notifications"], (prev) =>
        (prev ?? []).map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );
      return true;
    } catch (error) {
      console.error("Error marking notification read:", error);
      return false;
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch(`${BASE_URL}/notifications/read-all`, {
        method: "PUT",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to clear notifications");
      queryClient.setQueryData<Notification[]>(["notifications"], (prev) =>
        (prev ?? []).map((n) => ({ ...n, is_read: true })),
      );
      showNotification(
        "All notifications marked as read.",
        "Success",
        "success",
      );
    } catch {
      showNotification("Could not clear notifications.", "Error", "danger");
    }
  };

  const respondToInvite = async (
    inviteId: number,
    notificationId: number,
    eventId: number,
    status: "accepted" | "declined" | "banned",
  ) => {
    try {
      const res = await fetch(`${BASE_URL}/invites/${inviteId}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to respond to invite");

      if (status === "accepted") {
        const rsvpRes = await fetch(`${BASE_URL}/events/${eventId}/rsvp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: "accepted" }),
        });
        if (!rsvpRes.ok) throw new Error("Failed to create RSVP");
        showNotification(
          "Invite accepted! You are now RSVP'd.",
          "Success",
          "success",
        );
      } else {
        showNotification("Invite declined.", "Success", "success");
      }

      const markRes = await markNotificationRead(notificationId);
      if (markRes) {
        queryClient.setQueryData<Notification[]>(["notifications"], (prev) =>
          (prev ?? []).filter((n) => n.id !== notificationId),
        );
      }
    } catch {
      showNotification(
        "Something went wrong while processing your response.",
        "Error",
        "danger",
      );
    }
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    if (!showNotifications) {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="notification-wrapper" ref={notificationRef}>
      <button className="nav-button bell-button" onClick={toggleNotifications}>
        <FaBell />
        {notifications.some((n) => !n.is_read) && (
          <span className="notification-badge-dot"></span>
        )}
      </button>
      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notification-header-actions">
            <h6 className="m-0">Notifications</h6>
            {notifications.length > 0 && (
              <button onClick={markAllRead} className="mark-all-btn">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length > 0 ? (
            notifications.map((note) => {
              const isInvite =
                note.invite_id !== undefined &&
                note.invite_status?.toLowerCase() === "pending";
              return (
                <div
                  key={note.id}
                  className={`notification-item ${note.is_read ? "read" : "unread"}`}
                >
                  <p
                    className="mb-2"
                    onClick={async () => {
                      await markNotificationRead(note.id);
                      setShowNotifications(false);
                      navigate(`/event/${note.event_id}`);
                    }}
                  >
                    {note.message}
                  </p>
                  {isInvite && (
                    <div className="d-flex gap-2">
                      <button
                        onClick={() =>
                          respondToInvite(
                            note.invite_id!,
                            note.id,
                            note.event_id,
                            "accepted",
                          )
                        }
                        className="nav-button invite-accept-btn"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() =>
                          respondToInvite(
                            note.invite_id!,
                            note.id,
                            note.event_id,
                            "declined",
                          )
                        }
                        className="nav-button invite-reject-btn"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="notification-item">No notifications</div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
