import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Notification } from "../../types/Notification";
import { useToast } from "../../hooks/useToast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `${rawUrl}/api` : "http://localhost:3000/api";

interface NotificationDropdownProps {
  isLoggedIn: boolean;
  userId?: number;
  label?: string; // when set, renders a full-width trigger with label (mobile drawer)
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isLoggedIn,
  userId,
  label,
}) => {
  const [open, setOpen] = useState(false);
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

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }}
    >
      <DropdownMenuTrigger
        className={
          label
            ? "relative bg-transparent border-none cursor-pointer w-full h-11 rounded-lg flex items-center justify-center gap-2 font-mono text-xs font-bold tracking-wider uppercase outline-none"
            : "relative bg-transparent border-none cursor-pointer w-10 h-10 rounded-md flex items-center justify-center hover:bg-[#f0f0f0] dark:hover:bg-[#2a2a2a] outline-none"
        }
      >
        <Bell size={20} />
        {label && <span>{label}</span>}
        {notifications.some((n) => !n.is_read) && (
          <span
            className={
              label
                ? "absolute top-2 right-6 w-2 h-2 rounded-full bg-red-500"
                : "absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"
            }
          />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="center"
        sideOffset={12}
        className="w-[calc(100vw-2rem)] sm:w-[340px] !p-0"
      >
        <div className="flex items-center justify-between !px-4 !py-3 border-b border-border">
          <h6 className="m-0 font-semibold text-sm">Notifications</h6>
          {notifications.length > 0 && (
            <button
              onClick={markAllRead}
              className="bg-transparent border-none text-xs font-medium text-primary hover:underline cursor-pointer"
            >
              Mark all read
            </button>
          )}
        </div>

        {notifications.length > 0 ? (
          <div className="max-h-[320px] overflow-y-auto !p-2">
            {notifications.map((note) => {
              const isInvite =
                note.invite_id !== undefined &&
                note.invite_status?.toLowerCase() === "pending";
              return (
                <div
                  key={note.id}
                  className={`rounded-lg !px-4 !py-3 ${
                    note.is_read ? "" : "bg-secondary"
                  }`}
                >
                  <div
                    className="cursor-pointer"
                    onClick={async () => {
                      await markNotificationRead(note.id);
                      setOpen(false);
                      navigate(`/event/${note.event_id}`);
                    }}
                  >
                    <p className="m-0 text-sm">{note.message}</p>
                  </div>

                  {isInvite && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          respondToInvite(
                            note.invite_id!,
                            note.id,
                            note.event_id,
                            "accepted",
                          );
                        }}
                        className="px-3 py-1 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          respondToInvite(
                            note.invite_id!,
                            note.id,
                            note.event_id,
                            "declined",
                          );
                        }}
                        className="px-3 py-1 text-xs font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="!px-4 !py-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;