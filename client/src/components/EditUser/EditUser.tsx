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

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setName(user.name || "");
      setBio(user.bio || "");
      setContact(user.contact || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
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
      setUser(updatedUser);
      alert("User updated successfully");
    } catch (error) {
      console.error("Failed to update user", error);
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
      {user.is_verified ? (
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

      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
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
        <button type="submit">Update User</button>
      </form>
    </div>
  );
};

export default EditUser;
