import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isSeller, isAdmin, bootstrapped } = useAuth();

  if (!bootstrapped) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--ink)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "9999px", border: "2px solid var(--border)", borderTopColor: "var(--accent)" }} />
          <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isSeller && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
