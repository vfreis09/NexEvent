import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../context/UserContext";

interface ProtectedRouteProps {
  requireVerified?: boolean;
  requireAdmin?: boolean;
  blockBanned?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requireVerified = false,
  requireAdmin = false,
  blockBanned = false,
}) => {
  const { user, isLoggedIn, isVerified } = useUser();

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (blockBanned && user?.role === "banned")
    return <Navigate to="/" replace />;
  if (requireVerified && !isVerified) return <Navigate to="/" replace />;
  if (requireAdmin && user?.role !== "admin")
    return <Navigate to="/" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
