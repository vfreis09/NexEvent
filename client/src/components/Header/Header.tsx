import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "react-bootstrap";
import { FaMoon } from "react-icons/fa";
import { FiSun } from "react-icons/fi";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../hooks/useToast";
import AppToast from "../ToastComponent/ToastComponent";
import NotificationDropdown from "../NotificationDropdown/NotificationDropdown";
import UserMenu from "../UserMenu/UserMenu";
import SearchBar from "../SearchBar/SearchBar";
import "./Header.css";

const Header: React.FC = () => {
  const { user, isLoggedIn, loadUser, isVerified, hasFetchedUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { showToast, toastInfo, hideToast } = useToast();

  useEffect(() => {
    if (isLoggedIn && !user && !hasFetchedUser) {
      loadUser();
    }
  }, [isLoggedIn, user, hasFetchedUser]);

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
      <Navbar expand="lg" className="custom-navbar">
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
          <SearchBar />
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
              <NotificationDropdown isLoggedIn={isLoggedIn} userId={user.id} />
            )}
            {user ? (
              <UserMenu user={user} />
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
