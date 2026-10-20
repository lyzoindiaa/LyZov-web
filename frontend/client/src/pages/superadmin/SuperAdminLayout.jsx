import { useState, useEffect } from "react";
import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  BarChart3,
  Users,
  Store,
  ExternalLink,
  ShieldAlert,
  Crown,
  Menu,
  X,
  LogOut,
  ShoppingBag,
  ArrowLeft,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { logoutUser } from "../../features/auth/authSlice";
import ThemeToggle from "../../components/ui/ThemeToggle";
import Logo from "../../components/ui/Logo";

const navItems = [
  { label: "Dashboard Overview", to: "/admin", icon: BarChart3, end: true },
  { label: "Sellers Directory", to: "/admin/sellers", icon: Store },
  { label: "Customer Accounts", to: "/admin/customers", icon: Users },
];

const SuperAdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Keyboard navigation: Alt + Left Arrow to go back
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        navigate(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg)", color: "var(--ink)" }} className="flex-col lg:flex-row">
      {/* ── Sidebar ── */}
      <aside
        style={{
          borderRight: "1px solid var(--border)",
          backgroundColor: "var(--surface)",
          padding: "1.25rem",
        }}
        className={`w-full lg:w-64 shrink-0 flex flex-col justify-between ${
          mobileOpen ? "block" : "hidden lg:flex"
        }`}
      >
        <div>
          {/* Brand / Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <Logo size="sm" />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Crown size={11} className="text-amber-500" />
                  <p style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Super Admin
                  </p>
                </div>
                <p style={{ fontSize: "9px", color: "var(--ink-muted)", fontWeight: 600 }}>Console & Governance</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden btn-icon p-1 text-[var(--ink-muted)]"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Section: Platform Management */}
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-subtle)", marginBottom: "0.5rem", paddingLeft: "0.875rem" }}>
            Administration
          </p>

          {/* Navigation Links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Section: Shortcuts */}
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-subtle)", marginTop: "1.5rem", marginBottom: "0.5rem", paddingLeft: "0.875rem" }}>
            Portals
          </p>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <Link
              to="/seller"
              className="sidebar-nav-item"
              style={{ color: "var(--ink-muted)" }}
            >
              <ShoppingBag size={16} />
              <span>Seller Hub (Products)</span>
              <ExternalLink size={12} style={{ marginLeft: "auto", opacity: 0.6 }} />
            </Link>
            <Link
              to="/"
              className="sidebar-nav-item"
              style={{ color: "var(--ink-muted)" }}
            >
              <ExternalLink size={16} />
              <span>Customer Storefront</span>
            </Link>
          </nav>
        </div>

        {/* Footer: User Profile & Actions */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0 }}>
              <div
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "9999px",
                  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {user?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.name || "Admin"}
                </p>
                <p style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 700, textTransform: "uppercase" }}>
                  Administrator
                </p>
              </div>
            </div>
            <ThemeToggle size={16} />
          </div>

          <button
            onClick={() => dispatch(logoutUser())}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--red)",
              background: "none",
              border: "1px solid var(--border)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--red-bg)";
              e.currentTarget.style.borderColor = "var(--red)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header
          style={{
            borderBottom: "1px solid var(--border)",
            backgroundColor: "var(--surface)",
            padding: "0.75rem 1.25rem",
          }}
          className="lg:hidden flex items-center justify-between"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={() => setMobileOpen(true)}
              className="btn-icon p-1"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <Logo size="sm" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase" }}>
              Super Admin
            </span>
            <ThemeToggle size={16} />
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main style={{ flex: 1, padding: "1.5rem", maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
