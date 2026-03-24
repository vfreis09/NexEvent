import { useParams, NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "../../context/UserContext";
import UserProfileCard from "../../components/UserProfileCard/UserProfileCard";
import { PublicUser } from "../../types/PublicUser";
import { useTheme } from "../../context/ThemeContext";
import Loading from "../../components/Loading/Loading";
import "./UserProfilePage.css";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `https://${rawUrl}/api` : "http://localhost:3000/api";

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
    return <p className="profile-error-message">User not found</p>;

  return (
    <div className="user-profile-container">
      <UserProfileCard
        profileUser={profileUser}
        isOwner={user?.username === profileUser.username}
      />
      <nav className="tab-nav">
        <NavLink to="." end>
          Overview
        </NavLink>
        <NavLink to="events">Created Events</NavLink>
        <NavLink to="rsvps">RSVPs</NavLink>
      </nav>
      <div className="tab-content">
        <Outlet context={{ profileUser }} />
      </div>
    </div>
  );
};

export default UserProfilePage;
