import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { User } from "../types/User";

interface UserContextProps {
  user: User | null;
  isLoggedIn: boolean;
  isVerified: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  loadUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasFetchedUser: boolean;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasFetchedUser, setHasFetchedUser] = useState(false);

  const loadUser = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/user", {
        credentials: "include",
      });

      if (res.status === 403) {
        setUser(null);
        setIsLoggedIn(false);
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch user");

      const data = await res.json();
      setUser(data.user);
      setIsLoggedIn(data.isLoggedIn);
    } catch (err) {
      console.error("Load user failed", err);
      setIsLoggedIn(false);
    } finally {
      setHasFetchedUser(true);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        isLoggedIn,
        isVerified: user?.is_verified ?? false,
        setUser,
        setIsLoggedIn,
        loadUser: loadUser,
        refreshUser: loadUser,
        hasFetchedUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
