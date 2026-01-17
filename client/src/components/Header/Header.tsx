import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "react-bootstrap";
import { FaBell, FaMoon } from "react-icons/fa";
import { FiSun } from "react-icons/fi";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import { Notification } from "../../types/Notification";
import { useToast } from "../../hooks/useToast";
import AppToast from "../ToastComponent/ToastComponent";
import { SearchType } from "../../types/SearchType";
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

  const { theme, toggleTheme } = useTheme();

  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{
    events: SearchType[];
    users: SearchType[];
  }>({ events: [], users: [] });
  const [loadingSearch, setLoadingSearch] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  const { showToast, toastInfo, showNotification, hideToast } = useToast();

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await fetch("http://localhost:3000/api/notifications", {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch notifications");

      const data: Notification[] = await res.json();
      setNotifications(data);
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

  const markAllRead = async () => {
    try {
      const res = await fetch(
        "http://localhost:3000/api/notifications/read-all",
        {
          method: "PUT",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to clear notifications");

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showNotification(
        "All notifications marked as read.",
        "Success",
        "success"
      );
    } catch (error) {
      console.error("Error marking all read:", error);
      showNotification("Could not clear notifications.", "Error", "danger");
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
            body: JSON.stringify({ status: "accepted" }),
          }
        );
        if (!rsvpRes.ok) throw new Error("Failed to create RSVP");

        showNotification(
          "Invite accepted! You are now RSVP'd.",
          "Success",
          "success"
        );
      } else {
        showNotification("Invite declined.", "Success", "success");
      }

      const markRes = await markNotificationRead(notificationId);
      if (markRes) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (error) {
      showNotification(
        "Something went wrong while processing your response.",
        "Error",
        "danger"
      );
    }
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    if (!showNotifications) {
      fetchNotifications();
    }
  };

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions({ events: [], users: [] });
      setLoadingSearch(false);
      return;
    }

    setLoadingSearch(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/search?q=${query}`
      );
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error("Search suggestion error:", error);
      setSuggestions({ events: [], users: [] });
    } finally {
      setLoadingSearch(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchNotifications();
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    if (searchQuery.length > 1) {
      debounceTimer = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300);
    } else {
      setSuggestions({ events: [], users: [] });
    }
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, fetchSuggestions]);

  useEffect(() => {
    if (isLoggedIn && !user && !hasFetchedUser) {
      loadUser();
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      if (searchBarRef.current && !searchBarRef.current.contains(target)) {
        setSuggestions({ events: [], users: [] });
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
      if (!response.ok) throw new Error("Logout failed");
      setUser(null);
      setIsLoggedIn(false);
      navigate("/");
      showNotification("Successfully logged out.", "Success", "success");
    } catch (error) {
      showNotification("Error logging out.", "Error", "danger");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search/results?q=${searchQuery.trim()}`);
      setSuggestions({ events: [], users: [] });
    }
  };

  const handleSuggestionClick = (
    type: "event" | "user",
    id: number,
    username?: string
  ) => {
    if (type === "event") navigate(`/event/${id}`);
    else if (type === "user" && username) navigate(`/user/${username}`);
    setSuggestions({ events: [], users: [] });
    setSearchQuery("");
  };

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const hasSuggestions =
    suggestions.events.length > 0 || suggestions.users.length > 0;

  return (
    <>
      {showToast && toastInfo && (
        <AppToast
          show={showToast}
          message={toastInfo.message}
          header={toastInfo.header}
          bg={toastInfo.bg}
          textColor={toastInfo.textColor}
          onClose={hideToast}
        />
      )}
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
          <div className="search-bar-container" ref={searchBarRef}>
            <form
              onSubmit={handleSearchSubmit}
              className="position-relative d-flex me-4"
            >
              <input
                type="search"
                className="form-control me-2"
                placeholder="Search events or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-outline-primary">
                Search
              </button>
              {(hasSuggestions ||
                (loadingSearch && searchQuery.length > 1)) && (
                <div className="suggestions-dropdown search-dropdown-base suggestion-list-scroll shadow rounded p-2">
                  {loadingSearch && (
                    <div className="p-1 text-center text-muted">Loading...</div>
                  )}
                  {suggestions.events.map((item) => (
                    <div
                      key={`event-${item.id}`}
                      onClick={() => handleSuggestionClick("event", item.id)}
                      className="p-1 rounded suggestion-item"
                    >
                      <strong>{item.title}</strong>
                      <small className="text-muted ms-2">
                        ({formatEventDate(item.event_datetime!)})
                      </small>
                    </div>
                  ))}
                  {suggestions.users.map((item) => (
                    <div
                      key={`user-${item.id}`}
                      onClick={() =>
                        handleSuggestionClick("user", item.id, item.username)
                      }
                      className="p-1 rounded suggestion-item"
                    >
                      {item.username}
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
          <div className="header-right">
            {!isLoggedIn && (
              <button
                className="nav-button theme-toggle-button"
                onClick={toggleTheme}
              >
                {theme === "light" ? <FaMoon /> : <FiSun />}
              </button>
            )}

            {user && (
              <div className="notification-wrapper" ref={notificationRef}>
                <button
                  className="nav-button bell-button"
                  onClick={toggleNotifications}
                >
                  <FaBell />
                  {notifications.some((n) => !n.is_read) && (
                    <span className="notification-badge-dot"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-header-actions">
                      <h6 className="m-0">Notifications</h6>
                      {notifications.length > 0 && (
                        <button onClick={markAllRead} className="mark-all-btn">
                          Mark all read
                        </button>
                      )}
                    </div>
                    {loadingNotifications ? (
                      <div className="notification-item">Loading...</div>
                    ) : notifications.length > 0 ? (
                      notifications.map((note) => {
                        const isInvite =
                          note.invite_id !== undefined &&
                          note.invite_status?.toLowerCase() === "pending";
                        return (
                          <div
                            key={note.id}
                            className={`notification-item ${
                              note.is_read ? "read" : "unread"
                            }`}
                          >
                            <p
                              className="mb-2"
                              onClick={async () => {
                                await markNotificationRead(note.id);
                                setShowNotifications(false);
                                navigate(`/event/${note.event_id}`);
                              }}
                            >
                              {note.message}
                            </p>
                            {isInvite && (
                              <div className="d-flex gap-2">
                                <button
                                  onClick={() =>
                                    respondToInvite(
                                      note.invite_id!,
                                      note.id,
                                      note.event_id,
                                      "accepted"
                                    )
                                  }
                                  className="nav-button invite-accept-btn"
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
                                  className="nav-button invite-reject-btn"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
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
    </>
  );
};

export default Header;
