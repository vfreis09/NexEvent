import React from "react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  return (
    <>
      <Link to="/">Home</Link>
      <Link to="/create">Create</Link>
      <Link to="/login">Login</Link>
      <Link to="/signup">Signup</Link>
    </>
  );
};

export default Header;
