import React, { useState } from "react";
import { useUser } from "../../context/UserContext";

const EditUser: React.FC = () => {
  //email, name, bio, contact
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [contact, setContact] = useState("");
  const { user, setUser } = useUser();

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

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label>Name:</label>
        <input
          type="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label>Bio:</label>
        <input
          type="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>
      <div>
        <label>Contact:</label>
        <input
          type="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
      </div>
      <button type="submit">Update User</button>
    </form>
  );
};

export default EditUser;
