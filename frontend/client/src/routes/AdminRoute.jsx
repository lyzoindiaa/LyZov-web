import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthBootstrapFallback } from "../components/skeletons/Skeletons";

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isSeller, isAdmin, bootstrapped } = useAuth();

  if (!bootstrapped) {
    return <AuthBootstrapFallback message="Loading seller portal..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin has dedicated console at /admin
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (!isSeller) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
