import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";

const Header: React.FC = () => {
  const { user, setUser, setIsLoggedIn } = useUser();

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <header>
      <nav>
        <Link to="/">Home</Link>
        {user && <Link to="/create">Create</Link>}
        {user ? (
          <>
            <span>Welcome {user.email}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login or Signup</Link>
        )}
      </nav>
    </header>
  );
};

export default Header;
