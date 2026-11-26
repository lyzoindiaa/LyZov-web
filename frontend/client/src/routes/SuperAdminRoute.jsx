import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthBootstrapFallback } from "../components/skeletons/Skeletons";

const SuperAdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, bootstrapped } = useAuth();

  if (!bootstrapped) {
    return <AuthBootstrapFallback message="Verifying Admin Privileges..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default SuperAdminRoute;
