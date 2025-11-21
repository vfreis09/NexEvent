import { PublicUser } from "../../types/PublicUser";
import { useTheme } from "../../context/ThemeContext";
import "./UserProfileCard.css";

interface Props {
  profileUser: PublicUser;
  isOwner?: boolean;
}

const UserProfileCard = ({ profileUser, isOwner }: Props) => {
  useTheme();

  const defaultAvatar = "/images/default-avatar.png";
  const avatarSrc =
    profileUser.profile_picture_base64 &&
    profileUser.profile_picture_base64.startsWith("data:image/")
      ? profileUser.profile_picture_base64
      : defaultAvatar;

  return (
    <div className="profile-card">
      <div className="profile-picture-container">
        <img
          src={avatarSrc}
          alt={`${profileUser.username}'s profile picture`}
          className="profile-avatar"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultAvatar;
          }}
        />
      </div>
      <h1>{profileUser.username}</h1>
      <p>{profileUser.email ?? "Email not public"}</p>
      {isOwner && <p className="is-owner-tag">✦ This is you</p>}
      <p>
        <strong>Member since:</strong>{" "}
        {new Date(profileUser.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
      <p>
        <strong>Events Created:</strong> {profileUser.total_created_events}
      </p>
      <p>
        <strong>Events Attended:</strong> {profileUser.total_accepted_rsvps}
      </p>
    </div>
  );
};

export default UserProfileCard;
