import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "react-bootstrap";
import { FaBell } from "react-icons/fa";
import { useUser } from "../../context/UserContext";
import { Notification } from "../../types/Notification";
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await fetch("http://localhost:3000/api/notifications", {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch notifications");

      const data: Notification[] = await res.json();
      const limitedNotifications = data.slice(0, 5);
      setNotifications(limitedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationRead = async (notificationId: number) => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to mark notification as read");

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );

      return true;
    } catch (error) {
      console.error("Error marking notification read:", error);
      return false;
    }
  };

  const respondToInvite = async (
    inviteId: number,
    notificationId: number,
    eventId: number,
    status: "accepted" | "declined" | "banned"
  ) => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/invites/${inviteId}/respond`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) throw new Error("Failed to respond to invite");

      if (status === "accepted") {
        const rsvpRes = await fetch(
          `http://localhost:3000/api/events/${eventId}/rsvp`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ status: "Accepted" }),
          }
        );
        if (!rsvpRes.ok) throw new Error("Failed to create RSVP");

        alert("You have successfully RSVP'd to the event!");
      } else {
        alert("You have declined the invite.");
      }

      const markRes = await markNotificationRead(notificationId);

      if (markRes !== false) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (error) {
      console.error(`Error responding to invite: ${status}`, error);
      alert("Something went wrong while processing your response.");
    }
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    if (!showNotifications) {
      fetchNotifications();
    }
  };

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

  return (
    <Navbar sticky="top" expand="lg" className="custom-navbar">
      <div className="header-wrapper">
        <div className="header-left">
          <Link to="/" className="logo-text">
            NexEvent
          </Link>
          {user && isVerified && user.role !== "banned" && (
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
                    notifications.map((note) => {
                      const isInvite =
                        note.invite_id !== undefined &&
                        note.invite_status?.toLowerCase() === "pending";
                      if (!isInvite) {
                        return (
                          <button
                            key={note.id}
                            className={`notification-item ${
                              note.is_read ? "read" : "unread"
                            }`}
                            onClick={async () => {
                              await markNotificationRead(note.id);
                              setShowNotifications(false);
                              navigate(`/event/${note.event_id}`);
                            }}
                          >
                            {note.message}
                          </button>
                        );
                      }

                      return (
                        <div
                          key={note.id}
                          className={`notification-item ${
                            note.is_read ? "read" : "unread"
                          }`}
                        >
                          <p>{note.message}</p>
                          <button
                            onClick={() =>
                              respondToInvite(
                                note.invite_id!,
                                note.id,
                                note.event_id,
                                "accepted"
                              )
                            }
                            className="nav-button"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              respondToInvite(
                                note.invite_id!,
                                note.id,
                                note.event_id,
                                "declined"
                              )
                            }
                            className="nav-button"
                            style={{ marginLeft: "8px" }}
                          >
                            Reject
                          </button>
                        </div>
                      );
                    })
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
                  {user.role === "admin" && (
                    <Link to="/admin" className="user-menu-item">
                      Admin Dashboard
                    </Link>
                  )}
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
