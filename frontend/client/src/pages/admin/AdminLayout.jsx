import { NavLink, Outlet, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { BarChart3, Boxes, ClipboardList, Tags, LogOut, ArrowLeftCircle, Award } from "lucide-react";
import { logoutUser } from "../../features/auth/authSlice";

const navItems = [
  { label: "Analytics", to: "/admin", icon: BarChart3, end: true },
  { label: "Products", to: "/admin/products", icon: Boxes },
  { label: "Categories", to: "/admin/categories", icon: Tags },
  { label: "Brands", to: "/admin/brands", icon: Award },
  { label: "Orders", to: "/admin/orders", icon: ClipboardList },
];

const AdminLayout = () => {
  const dispatch = useDispatch();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--bg)", color: "var(--ink)" }} className="lg:flex-row">
      
      {/* Sidebar */}
      <aside style={{ borderRight: "1px solid var(--border)", backgroundColor: "var(--surface)", padding: "1.25rem" }} className="w-full lg:w-64 shrink-0 flex flex-col justify-between">
        <div>
          {/* Header Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
              <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "9999px", backgroundColor: "var(--ink)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.875rem" }}>
                L<span style={{ color: "#F59E0B" }}>Z</span>
              </div>
              <div>
                <p style={{ fontSize: "1rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>LyZov</p>
                <p style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Admin Portal</p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  borderRadius: "0.75rem",
                  padding: "0.625rem 0.875rem",
                  fontSize: "0.8125rem",
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? "var(--ink)" : "transparent",
                  color: isActive ? "var(--bg)" : "var(--ink-muted)",
                  textDecoration: "none",
                  transition: "all 0.15s",
                })}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Actions */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "2rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <Link
            to="/"
            style={{ display: "flex", alignItems: "center", gap: "0.625rem", borderRadius: "0.75rem", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", color: "var(--ink-muted)", textDecoration: "none" }}
          >
            <ArrowLeftCircle size={16} />
            <span>Back to Store</span>
          </Link>
          <button
            onClick={() => dispatch(logoutUser())}
            style={{ display: "flex", alignItems: "center", gap: "0.625rem", borderRadius: "0.75rem", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", color: "#EF4444", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Page Content */}
      <main style={{ flex: 1, padding: "1.5rem", backgroundColor: "var(--bg)", overflowX: "hidden" }} className="lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;