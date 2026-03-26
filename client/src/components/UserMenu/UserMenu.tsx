import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../hooks/useToast";
import { User } from "../../types/User";
import "./UserMenu.css";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `https://${rawUrl}/api` : "http://localhost:3000/api";

interface UserMenuProps {
  user: User;
}

const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setUser, setIsLoggedIn } = useUser();
  const { showNotification } = useToast();

  const handleLogout = async () => {
    try {
      const response = await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Logout failed");
      setUser(null);
      setIsLoggedIn(false);
      queryClient.clear();
      navigate("/");
      showNotification("Successfully logged out.", "Success", "success");
    } catch {
      showNotification("Error logging out.", "Error", "danger");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="user-menu-wrapper" ref={userMenuRef}>
      <button
        className="nav-button user-menu-button"
        onClick={() => setShowUserMenu((prev) => !prev)}
      >
        {user.username}
      </button>
      {showUserMenu && (
        <div className="user-menu-dropdown">
          <Link to={`/user/${user.username}`} className="user-menu-item">
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
          <button onClick={handleLogout} className="user-menu-item logout-item">
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
