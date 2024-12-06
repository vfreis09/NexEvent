import React from "react";
import { Link } from "react-router-dom";
import {
  Navbar,
  Container
} from "react-bootstrap";
import { useUser } from "../../context/UserContext";

const Header: React.FC = () => {
  const { user, setUser, setIsLoggedIn } = useUser();

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await response.json();
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <>
      <Navbar sticky="top" bg="light" data-bs-theme="light" expand="lg">
        <Container fluid>
        <Link to="/">Home</Link>
        {user && <Link to="/create">Create</Link>}
        {user ? (
          <>
            <Link to="/dashboard">{user.email}</Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login or Signup</Link>
        )}</Container>
      </Navbar>
    </>
  );
};

export default Header;
