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
      const limitedNotifications = data.slice(0, 5);
      setNotifications(limitedNotifications);
    } catch (error) {
      showNotification(
        "We couldn't load your recent notifications.",
        "Error",
        "danger"
      );
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

        showNotification(
          "Invite accepted! You are now RSVP'd to the event.",
          "Success",
          "success"
        );
      } else {
        showNotification(
          "Invite declined. You will not receive further reminders.",
          "Success",
          "success"
        );
      }

      const markRes = await markNotificationRead(notificationId);
      if (markRes) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (error) {
      showNotification(
        "Something went wrong while processing your invitation response.",
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
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target as Node)
      ) {
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
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      await response.json();
      setUser(null);
      setIsLoggedIn(false);
      navigate("/");
      showNotification(
        "You've been successfully logged out.",
        "Success",
        "success"
      );
    } catch (error) {
      showNotification(
        "There was an issue logging you out. Please try refreshing.",
        "Error",
        "danger"
      );
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
    if (type === "event") {
      navigate(`/event/${id}`);
    } else if (type === "user" && username) {
      navigate(`/user/${username}`);
    }
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
                  {loadingSearch && searchQuery.length > 1 && (
                    <div className="p-1 text-center text-muted">Loading...</div>
                  )}
                  {suggestions.events.length > 0 && (
                    <>
                      <h6 className="mt-1 mb-1 text-primary search-category-title">
                        Events
                      </h6>
                      <ul className="list-unstyled mb-1">
                        {suggestions.events.map((item) => (
                          <li
                            key={`event-${item.id}`}
                            onClick={() =>
                              handleSuggestionClick("event", item.id)
                            }
                            className="p-1 rounded suggestion-item"
                          >
                            <strong>{item.title}</strong>
                            <small className="text-muted ms-2 suggestion-date">
                              ({formatEventDate(item.event_datetime!)})
                            </small>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {suggestions.users.length > 0 && (
                    <>
                      <h6 className="mt-1 mb-1 text-success search-category-title">
                        Users
                      </h6>
                      <ul className="list-unstyled mb-1">
                        {suggestions.users.map((item) => (
                          <li
                            key={`user-${item.id}`}
                            onClick={() =>
                              handleSuggestionClick(
                                "user",
                                item.id,
                                item.username
                              )
                            }
                            className="p-1 rounded suggestion-item"
                          >
                            {item.username}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </form>
          </div>
          <div className="header-right">
            {!isLoggedIn && (
              <button
                className="nav-button theme-toggle-button"
                onClick={toggleTheme}
                aria-label={
                  theme === "light"
                    ? "Switch to Dark Mode"
                    : "Switch to Light Mode"
                }
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
    </>
  );
};

export default Header;
