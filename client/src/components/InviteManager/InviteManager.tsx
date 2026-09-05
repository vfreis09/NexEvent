import React, { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { Invite } from "../../types/Invite";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../hooks/useToast";
import Loading from "../../components/Loading/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
const BASE_URL = rawUrl ? `${rawUrl}/api` : "http://localhost:3000/api";

const statusBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  accepted: "default",
  declined: "outline",
  pending: "secondary",
};

const InviteManager: React.FC<InviteManagerProps> = ({
  eventId,
  status,
  eventDateTime,
  maxAttendees,
  currentAttendees,
}) => {
  const queryClient = useQueryClient();
  const { showNotification } = useToast();
  useTheme();

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
    <div className="rounded-xl border border-border bg-card p-6" ref={dropdownRef}>
      <h3 className="mb-4 flex items-center gap-1.5 text-base font-medium text-card-foreground">
        <UserPlus size={16} /> Invitations
      </h3>

      {!isInviteDisabled && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-5 flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Type a username..."
              autoComplete="off"
              {...register("identifier", { required: true })}
            />
            {showDropdown && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-52 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
                {loadingSuggestions && (
                  <div className="flex justify-center p-2">
                    <Loading variant="spinner" />
                  </div>
                )}
                <ul className="m-0 list-none p-0">
                  {suggestions.map((user) => (
                    <li
                      key={user.id}
                      className="cursor-pointer px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-muted"
                      onClick={() => handleSelectUser(user.username)}
                    >
                      {user.username}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send"}
          </Button>
        </form>
      )}

      {isInviteDisabled && (
        <p className="mb-5 text-sm text-muted-foreground">
          Invitations are closed for this event.
        </p>
      )}

      <div>
        <h4 className="mb-2 text-sm font-medium text-card-foreground">
          Current Invites
        </h4>
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No invites sent yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <span className="text-sm font-medium text-foreground">
                  {invite.username}
                </span>
                <Badge
                  variant={
                    statusBadgeVariant[invite.status.toLowerCase()] ??
                    "secondary"
                  }
                  className="capitalize"
                >
                  {invite.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default InviteManager;