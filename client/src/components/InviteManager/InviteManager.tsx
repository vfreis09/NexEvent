import React, { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Invite } from "../../types/Invite";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../hooks/useToast";
import Loading from "../../components/Loading/Loading";
import "./InviteManager.css";

interface UserSuggestion {
  id: number;
  username: string;
}

interface InviteManagerProps {
  eventId: number;
  status: string;
  eventDateTime: string;
  maxAttendees: number | null;
  currentAttendees: number;
}

interface InviteFormData {
  identifier: string;
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
  const queryClient = useQueryClient();
  const { showNotification } = useToast();
  const { theme } = useTheme();

  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isSubmitting },
  } = useForm<InviteFormData>();

  const identifier = useWatch({
    control,
    name: "identifier",
    defaultValue: "",
  });

  useEffect(() => {
    const controller = new AbortController();

    if (identifier.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`${BASE_URL}/search?q=${identifier}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          const users = (
            Array.isArray(data.users) ? data.users : data.users?.results || []
          ) as UserSuggestion[];
          setSuggestions(users);
          setShowDropdown(users.length > 0);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") console.error(err);
      } finally {
        if (!controller.signal.aborted) setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [identifier]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectUser = (username: string) => {
    setValue("identifier", username);
    setShowDropdown(false);
  };

  const onSubmit = async (data: InviteFormData) => {
    try {
      const res = await fetch(`${BASE_URL}/events/${eventId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier: data.identifier }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "Failed to send invite");

      reset();
      queryClient.invalidateQueries({ queryKey: ["invites", eventId] });
      showNotification(
        `Invite sent to ${data.identifier}!`,
        "Success",
        "success",
      );
    } catch (err: any) {
      showNotification(err.message, "Error", "danger");
    }
  };

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
      return res.json();
    },
  });

  return (
    <div
      className={`invite-manager ${theme === "dark" ? "dark-mode" : ""}`}
      ref={dropdownRef}
    >
      <h3>Invitations</h3>
      {!isInviteDisabled && (
        <form onSubmit={handleSubmit(onSubmit)} className="invite-form">
          <div className="input-container">
            <input
              type="text"
              placeholder="Type a username..."
              autoComplete="off"
              {...register("identifier", { required: true })}
            />
            {showDropdown && (
              <div className="invite-suggestions shadow rounded">
                {loadingSuggestions && (
                  <div className="p-2 text-center">
                    <Loading variant="spinner" />
                  </div>
                )}
                <ul className="list-unstyled mb-0">
                  {suggestions.map((user) => (
                    <li
                      key={user.id}
                      className="suggestion-item"
                      onClick={() => handleSelectUser(user.username)}
                    >
                      {user.username}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send"}
          </button>
        </form>
      )}
      <div className="invite-list mt-4">
        <h4>Current Invites</h4>
        <ul>
          {invites.map((invite) => (
            <li key={invite.id}>
              <strong>{invite.username}</strong> – {invite.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default InviteManager;
