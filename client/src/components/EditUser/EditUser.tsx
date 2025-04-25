import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";

const EditUser: React.FC = () => {
  const { user, setUser } = useUser();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [contact, setContact] = useState("");
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [wantsNotifications, setWantsNotifications] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setName(user.name || "");
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
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, name, bio, contact }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

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
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ wants_notifications: !wantsNotifications }),
      });

      if (!response.ok) {
        throw new Error("Failed to update notification settings");
      }

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
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send verification email");
      }

      setVerifyMessage("Verification email sent successfully!");
    } catch (error) {
      console.error("Error sending verification email:", error);
      setVerifyMessage("Failed to send verification email.");
    }
  };

  if (!user) {
    return (
      <div>
        <h2>You have to login to access this content</h2>
        <Link to="/login">Login</Link>
      </div>
    );
  }

  return (
    <div>
      {isVerified ? (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ color: "green" }}>Your email is verified.</p>
        </div>
      ) : (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ color: "red" }}>
            Your email is not verified. Please verify it to access all features.
          </p>
          <button onClick={handleSendVerificationEmail}>
            Send Verification Email
          </button>
          {verifyMessage && <p>{verifyMessage}</p>}
        </div>
      )}
      <form onSubmit={handleUserUpdate}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label>Bio:</label>
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div>
          <label>Contact:</label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>
        <div style={{ margin: "10px 0" }}>
          <label>
            <input
              type="checkbox"
              checked={wantsNotifications}
              onChange={handleNotificationToggle}
            />
            &nbsp; Receive event notification emails
          </label>
        </div>
        <button type="submit">Update User</button>
      </form>
    </div>
  );
};

export default EditUser;
