import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../hooks/useToast";
import { User } from "../../types/User";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `${rawUrl}/api` : "http://localhost:3000/api";

interface UserMenuProps {
  user: User;
}

const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group bg-transparent border-none text-[#333] dark:text-[#f0f0f0] text-base font-medium cursor-pointer w-22! h-10! rounded-md leading-tight hover:bg-[#f0f0f0] dark:hover:bg-[#2a2a2a] flex items-center justify-center gap-1 outline-none">
        {user.username.split(" ")[0]}
        <ChevronDown
          size={14}
          className="text-muted-foreground transition-transform group-data-popup-open:rotate-180"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="center" 
        sideOffset={8} 
        className="w-[calc(100vw-2rem)] sm:w-[220px]"
      >
        <DropdownMenuItem render={<Link to={`/user/${user.username}`} />}>
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem render={<Link to="/settings" />}>
          Settings
        </DropdownMenuItem>

        {user.role === "admin" && (
          <DropdownMenuItem render={<Link to="/admin" />}>
            Admin Dashboard
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;