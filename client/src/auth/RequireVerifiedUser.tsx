import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../context/UserContext";

const RequireVerifiedUser = () => {
  const { hasFetchedUser, isLoggedIn, isVerified } = useUser();

  if (!hasFetchedUser) return <div>Loading...</div>;

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isVerified) return <Navigate to="/settings" replace />;

  return <Outlet />;
};

export default RequireVerifiedUser;
