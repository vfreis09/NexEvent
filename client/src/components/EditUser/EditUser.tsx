import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import "./EditUser.css";

const EditUser: React.FC = () => {
  const { user, setUser } = useUser();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [contact, setContact] = useState("");
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [wantsNotifications, setWantsNotifications] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setUsername(user.username || "");
      setBio(user.bio || "");
      setContact(user.contact || "");
      setWantsNotifications(user.wants_notifications ?? false);
      setIsVerified(user.is_verified ?? false);
    }
  }, [user]);

  const handleUserUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:3000/api/user/${user?.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, username, bio, contact }),
        }
      );

      if (!response.ok) throw new Error("Failed to update user");

      const updatedUser = await response.json();
      const fixedUser = {
        ...updatedUser,
        is_verified: updatedUser.is_verified ?? user?.is_verified,
      };

      setUser(fixedUser);
      setIsVerified(fixedUser.is_verified ?? false);
      alert("User updated successfully");
    } catch (error) {
      console.error("Failed to update user", error);
    }
  };

  const handleNotificationToggle = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ wants_notifications: !wantsNotifications }),
      });

      if (!response.ok)
        throw new Error("Failed to update notification settings");

      setWantsNotifications(!wantsNotifications);
    } catch (error) {
      console.error("Error updating notification preference:", error);
    }
  };

  const handleSendVerificationEmail = async () => {
    setVerifyMessage(null);
    try {
      const response = await fetch(
        "http://localhost:3000/api/send-verification-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Failed to send verification email");

      setVerifyMessage("Verification email sent successfully!");
    } catch (error) {
      console.error("Error sending verification email:", error);
      setVerifyMessage("Failed to send verification email.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage("⚠ New passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3000/api/user/change-password",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ oldPassword, newPassword }),
        }
      );

      if (!response.ok) throw new Error("Failed to change password");

      setPasswordMessage("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordMessage("Failed to change password.");
    }
  };

  if (!user) {
    return (
      <div className="text-center mt-5">
        <h2>You have to login to access this content</h2>
        <Link to="/login" className="btn btn-primary mt-3">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="container edit-user-container">
      <div
        className={`alert ${
          isVerified ? "alert-success" : "alert-danger"
        } verification-status`}
      >
        {isVerified
          ? "Your email is verified."
          : "Your email is not verified. Please verify it to access all features."}
      </div>
      {!isVerified && (
        <div className="mb-3">
          <button
            onClick={handleSendVerificationEmail}
            className="btn btn-warning btn-sm"
          >
            Send Verification Email
          </button>
          {verifyMessage && <p className="mt-2">{verifyMessage}</p>}
        </div>
      )}
      <form onSubmit={handleUserUpdate} className="card p-4 shadow-sm mb-4">
        <h4 className="mb-3">Edit Profile</h4>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Bio</label>
          <input
            type="text"
            className="form-control"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Contact</label>
          <input
            type="text"
            className="form-control"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>
        {user?.role !== "banned" && (
          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              checked={wantsNotifications}
              onChange={handleNotificationToggle}
            />
            <label className="form-check-label">
              Receive event notification emails
            </label>
          </div>
        )}
        <button type="submit" className="btn btn-primary w-100">
          Update User
        </button>
      </form>
      <form
        onSubmit={handleChangePassword}
        className="card p-4 shadow-sm change-password-form"
      >
        <h4 className="mb-3">Change Password</h4>
        <div className="mb-3">
          <label className="form-label">Old Password</label>
          <input
            type="password"
            className="form-control"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">New Password</label>
          <input
            type="password"
            className="form-control"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Confirm New Password</label>
          <input
            type="password"
            className="form-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-secondary w-100">
          Change Password
        </button>
        {passwordMessage && (
          <p className="mt-3 text-center">{passwordMessage}</p>
        )}
      </form>
    </div>
  );
};

export default EditUser;
