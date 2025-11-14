import { PublicUser } from "../../types/PublicUser";
import { useTheme } from "../../context/ThemeContext";
import "./UserProfileCard.css";

interface Props {
  profileUser: PublicUser;
  isOwner?: boolean;
}

const UserProfileCard = ({ profileUser, isOwner }: Props) => {
  useTheme();

  return (
    <div className="profile-card">
      <h1>{profileUser.username}</h1>
      <p>{profileUser.email ?? "Not public"}</p>
      {isOwner && <p>This is you</p>}
      <p>
        <strong>Joined:</strong>{" "}
        {new Date(profileUser.created_at).toLocaleDateString()}
      </p>
      <p>
        <strong>Total created events:</strong>{" "}
        {profileUser.total_created_events}
      </p>
      <p>
        <strong>Total accepted RSVPs:</strong>{" "}
        {profileUser.total_accepted_rsvps}
      </p>
    </div>
  );
};

export default UserProfileCard;
