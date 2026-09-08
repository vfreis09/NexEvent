import { useParams, NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "../../context/UserContext";
import UserProfileCard from "../../components/UserProfileCard/UserProfileCard";
import { PublicUser } from "../../types/PublicUser";
import { useTheme } from "../../context/ThemeContext";
import Loading from "../../components/Loading/Loading";
import { cn } from "@/lib/utils";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `${rawUrl}/api` : "http://localhost:3000/api";

const tabs = [
  { to: ".", label: "Overview", end: true },
  { to: "events", label: "Created Events", end: false },
  { to: "rsvps", label: "RSVPs", end: false },
];

const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useUser();
  useTheme();

  const {
    data: profileUser,
    isLoading,
    error,
  } = useQuery<PublicUser>({
    queryKey: ["user-profile", username],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/user/${username}`, {
        credentials: "include",
      });
      if (res.status === 404) throw new Error("User not found");
      if (!res.ok) throw new Error("Network error");
      return res.json();
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return <Loading variant="page" text="Loading profile..." />;

  if (error || !profileUser)
    return (
      <p className="mx-auto mt-10 max-w-3xl px-4 text-center text-sm text-destructive">
        User not found
      </p>
    );

  return (
    <div className="mx-auto mb-16 mt-6 max-w-3xl px-4">
      <UserProfileCard
        profileUser={profileUser}
        isOwner={user?.username === profileUser.username}
      />

      <nav className="mt-8 flex border-b border-border">
      {tabs.map((tab) => (
        <NavLink
          key={tab.label}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              "flex-1 whitespace-nowrap border-b-2 px-2 py-3 text-center text-xs font-medium transition-colors sm:px-4 sm:text-sm",
              isActive
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>

      <div className="mt-6">
        <Outlet context={{ profileUser }} />
      </div>
    </div>
  );
};

export default UserProfilePage;