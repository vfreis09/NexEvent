import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../context/UserContext";

const RequireVerifiedUser = () => {
  const { hasFetchedUser, isLoggedIn, isVerified } = useUser();

  if (!hasFetchedUser) return <div>Loading...</div>;

  if (!isLoggedIn) return <Navigate to="/login" />;
  if (!isVerified) return <Navigate to="/settings" />;

  return <Outlet />;
};

export default RequireVerifiedUser;
