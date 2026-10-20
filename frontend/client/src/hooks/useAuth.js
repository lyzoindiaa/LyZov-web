import { useSelector } from "react-redux";

export const useAuth = () => {
  const { user, isAuthenticated, status, bootstrapped } = useSelector((state) => state.auth);
  return {
    user,
    isAuthenticated,
    isSeller: user?.role === "seller",
    isAdmin: user?.role === "admin",
    canAccessSeller: user?.role === "seller" || user?.role === "admin",
    isCustomer: !user?.role || user?.role === "customer",
    status,
    bootstrapped,
  };
};

