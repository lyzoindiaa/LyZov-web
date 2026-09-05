import { useSelector } from "react-redux";

export const useAuth = () => {
  const { user, isAuthenticated, status, bootstrapped } = useSelector((state) => state.auth);
  return {
    user,
    isAuthenticated,
    isSeller: user?.role === "seller" || user?.role === "admin",
    isAdmin: user?.role === "seller" || user?.role === "admin",
    status,
    bootstrapped,
  };
};
