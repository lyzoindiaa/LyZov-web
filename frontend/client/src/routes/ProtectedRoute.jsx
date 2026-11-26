import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthBootstrapFallback, OutletContentSkeleton } from "../components/skeletons/Skeletons";

const ProtectedRoute = ({ children, standalone = false }) => {
  const { isAuthenticated, bootstrapped } = useAuth();
  const location = useLocation();

  if (!bootstrapped) {
    return standalone ? (
      <AuthBootstrapFallback message="Loading your account..." />
    ) : (
      <OutletContentSkeleton variant="storefront" />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
