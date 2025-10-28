import { useParams, NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import UserProfileCard from "../../components/UserProfileCard/UserProfileCard";
import { PublicUser } from "../../types/PublicUser";
import "./UserProfilePage.css";

const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const [profileUser, setProfileUser] = useState<PublicUser | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`http://localhost:3000/api/user/${username}`);
        if (res.status === 404) {
          setNotFound(true);
          setProfileUser(null);
        } else {
          const data = await res.json();
          setProfileUser(data.user);
        }
      } catch (err) {
        console.error("Failed to fetch profile user", err);
        setNotFound(true);
        setProfileUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUser();
    }
  }, [username]);

  if (loading) return <p>Loading profile...</p>;
  if (notFound) return <p>User not found</p>;

  return (
    <div className="user-profile-container">
      <UserProfileCard
        profileUser={profileUser!}
        isOwner={user?.username === profileUser?.username}
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
