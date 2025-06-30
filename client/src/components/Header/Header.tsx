import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "react-bootstrap";
import { FaBell } from "react-icons/fa";
import { useUser } from "../../context/UserContext";
import "./Header.css";

const Header: React.FC = () => {
  const {
    user,
    isLoggedIn,
    setUser,
    setIsLoggedIn,
    loadUser,
    isVerified,
    hasFetchedUser,
  } = useUser();

  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<
    { id: number; message: string; event_id: number; is_read: boolean }[]
  >([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoggedIn && !user && !hasFetchedUser) {
      loadUser();
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isLoggedIn, user, hasFetchedUser]);

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

  const toggleNotifications = async () => {
    setShowNotifications((prev) => !prev);

    if (!showNotifications) {
      setLoadingNotifications(true);
      try {
        const res = await fetch("http://localhost:3000/api/notifications", {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch notifications");

        const data = await res.json();
        const limitedNotifications = data.slice(0, 5);
        setNotifications(limitedNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoadingNotifications(false);
      }
    }
  };

  return (
    <Navbar sticky="top" expand="lg" className="custom-navbar">
      <div className="header-wrapper">
        <div className="header-left">
          <Link to="/" className="logo-text">
            NexEvent
          </Link>
          {user && isVerified && (
            <Link to="/create" className="nav-link create-event">
              Create Event
            </Link>
          )}
        </div>

        <div className="header-right">
          {user && (
            <div className="notification-wrapper" ref={notificationRef}>
              <button
                className="nav-button bell-button"
                onClick={toggleNotifications}
              >
                <FaBell />
              </button>
              {showNotifications && (
                <div className="notification-dropdown">
                  {loadingNotifications ? (
                    <div className="notification-item">Loading...</div>
                  ) : notifications.length > 0 ? (
                    notifications.map((note) => (
                      <button
                        key={note.id}
                        className={`notification-item ${
                          note.is_read ? "read" : "unread"
                        }`}
                        onClick={async () => {
                          try {
                            await fetch(
                              `http://localhost:3000/api/notifications/${note.id}/read`,
                              {
                                method: "PATCH",
                                credentials: "include",
                              }
                            );
                            setNotifications((prev) =>
                              prev.map((n) =>
                                n.id === note.id ? { ...n, is_read: true } : n
                              )
                            );
                          } catch (err) {
                            console.error(
                              "Failed to mark notification as read",
                              err
                            );
                          } finally {
                            setShowNotifications(false);
                            navigate(`/event/${note.event_id}`);
                          }
                        }}
                      >
                        {note.message}
                      </button>
                    ))
                  ) : (
                    <div className="notification-item">No notifications</div>
                  )}
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="user-menu-wrapper" ref={userMenuRef}>
              <button
                className="nav-button user-menu-button"
                onClick={() => setShowUserMenu((prev) => !prev)}
              >
                {user.username}
              </button>
              {showUserMenu && (
                <div className="user-menu-dropdown">
                  <Link
                    to={`/user/${user.username}`}
                    className="user-menu-item"
                  >
                    Profile
                  </Link>
                  <Link to="/settings" className="user-menu-item">
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="user-menu-item logout-item"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
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
