import { NavLink, Outlet, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { BarChart3, Boxes, ClipboardList, Tags, LogOut, ArrowLeftCircle, Award } from "lucide-react";
import { logoutUser } from "../../features/auth/authSlice";

const navItems = [
  { label: "Analytics", to: "/admin",            icon: BarChart3,    end: true },
  { label: "Products",  to: "/admin/products",   icon: Boxes },
  { label: "Categories",to: "/admin/categories", icon: Tags },
  { label: "Brands",    to: "/admin/brands",     icon: Award },
  { label: "Orders",    to: "/admin/orders",     icon: ClipboardList },
];

const AdminLayout = () => {
  const dispatch = useDispatch();

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg)", color: "var(--ink)" }} className="flex-col lg:flex-row">

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside
        style={{ borderRight: "1px solid var(--border)", backgroundColor: "var(--surface)", padding: "1.25rem" }}
        className="w-full lg:w-64 shrink-0 flex flex-col justify-between"
      >
        <div>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem", paddingBottom: "1.25rem", borderBottom: "1px solid var(--border)" }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
              <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.75rem", background: "linear-gradient(135deg,#111827,#1F2937)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.875rem", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                L<span style={{ color: "#F59E0B" }}>Z</span>
              </div>
              <div>
                <p style={{ fontSize: "1rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>LyZov</p>
                <p style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Admin Portal</p>
              </div>
            </Link>
          </div>

          {/* Section label */}
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-subtle)", marginBottom: "0.5rem", paddingLeft: "0.875rem" }}>
            Navigation
          </p>

          {/* Nav items */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer actions */}
        <div style={{ paddingTop: "1rem", marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-subtle)", marginBottom: "0.25rem", paddingLeft: "0.875rem" }}>
            Account
          </p>
          <Link
            to="/"
            className="sidebar-nav-item"
          >
            <ArrowLeftCircle size={16} />
            <span>Back to Store</span>
          </Link>
          <button
            onClick={() => dispatch(logoutUser())}
            style={{ display: "flex", alignItems: "center", gap: "0.625rem", borderRadius: "0.75rem", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", color: "var(--red)", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", transition: "background 0.15s" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--red-bg)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <main style={{ flex: 1, padding: "1.5rem", backgroundColor: "var(--bg)", overflowX: "hidden" }} className="lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
