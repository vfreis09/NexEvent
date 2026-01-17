import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../context/UserContext";

const RequireAdmin = () => {
  const { user, hasFetchedUser } = useUser();

  if (!hasFetchedUser) {
    return <p>Loading...</p>;
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RequireAdmin;
