import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "react-bootstrap";
import { useUser } from "../../context/UserContext";
import "./Header.css";

const Header: React.FC = () => {
  const { user, setUser, setIsLoggedIn, loadUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadUser();
    }
  }, [user, loadUser]);

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      await response.json();
      setUser(null);
      setIsLoggedIn(false);
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <Navbar sticky="top" expand="lg" className="custom-navbar">
      <div className="header-wrapper">
        <div className="header-left">
          <Link to="/" className="logo-text">
            Home
          </Link>
          {user && (
            <Link to="/create" className="nav-link create-event">
              Create Event
            </Link>
          )}
        </div>

        <div className="header-right">
          {user ? (
            <>
              <Link to="/settings" className="nav-link">
                {user.email}
              </Link>
              <button onClick={handleLogout} className="nav-button">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-button login-button">
                Login
              </Link>
              <Link to="/signup" className="nav-button signup-button">
                Start for Free
              </Link>
            </>
          )}
        </div>
      </div>
    </Navbar>
  );
};

export default Header;
