import { useEffect } from "react";
import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Tags,
  LogOut,
  ArrowLeft,
  Award,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { logoutUser } from "../../features/auth/authSlice";
import { resetCartLocal } from "../../features/cart/cartSlice";
import ThemeToggle from "../../components/ui/ThemeToggle";
import Logo from "../../components/ui/Logo";
import { useState } from "react";

const navItems = [
  { label: "Analytics", to: "/seller", icon: BarChart3, end: true },
  { label: "Products", to: "/seller/products", icon: Boxes },
  { label: "Categories", to: "/seller/categories", icon: Tags },
  { label: "Brands", to: "/seller/brands", icon: Award },
  { label: "Orders", to: "/seller/orders", icon: ClipboardList },
];

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Determine breadcrumb title
  const currentPath = location.pathname;
  let activeTitle = "Overview";
  if (currentPath.includes("/products")) activeTitle = "Products Management";
  else if (currentPath.includes("/categories")) activeTitle = "Categories Management";
  else if (currentPath.includes("/brands")) activeTitle = "Brands Management";
  else if (currentPath.includes("/orders")) activeTitle = "Orders Management";

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

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside
        style={{
          borderRight: "1px solid var(--border)",
          backgroundColor: "var(--surface)",
          padding: "1.25rem",
        }}
        className={`w-full lg:w-64 shrink-0 flex flex-col justify-between ${mobileOpen ? "block" : "hidden lg:flex"
          }`}
      >
        <div>
          {/* Brand / Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <Logo size="sm" />
              <div>
                {/* <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--ink-muted)", lineHeight: 1, textTransform: "uppercase", letterSpacing: "0.06em" }}>Admin Panel</p> */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.2rem" }}>
                  <ShieldAlert size={10} className="text-amber-500" />
                  <p style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Seller Portal</p>
                </div>
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

          {/* Section: Main */}
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-subtle)", marginBottom: "0.5rem", paddingLeft: "0.875rem" }}>
            Management
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
        </div>

        {/* Sidebar Footer */}
        <div style={{ paddingTop: "1rem", marginTop: "1.5rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-subtle)", marginBottom: "0.25rem", paddingLeft: "0.875rem" }}>
            Account
          </p>

          <Link
            to="/"
            className="sidebar-nav-item"
            style={{ color: "var(--ink)" }}
          >
            <ExternalLink size={15} />
            <span>Store Front</span>
          </Link>

          <button
            onClick={() => {
              dispatch(logoutUser());
              dispatch(resetCartLocal());
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              borderRadius: "0.75rem",
              padding: "0.625rem 0.875rem",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--red)",
              background: "none",
              border: "none",
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--red-bg)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
          >
            <LogOut size={15} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area with Header ────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* ── Top Header Bar ─────────────────────────────── */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            backgroundColor: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            padding: "0.75rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          {/* Left: Back Button & Breadcrumbs */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden btn-icon p-1.5 text-[var(--ink)]"
              aria-label="Open mobile menu"
            >
              <Menu size={20} />
            </button>

            {/* Back Button with History Navigation */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary flex items-center gap-1.5"
              title="Go back to previous screen (Alt + Left Arrow)"
              style={{
                padding: "0.45rem 0.85rem",
                fontSize: "0.75rem",
                borderRadius: "0.625rem",
              }}
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Back</span>
            </button>

            {/* Breadcrumb path */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
              <Link to="/seller" className="hover:text-[var(--ink)] transition-colors">Seller</Link>
              <ChevronRight size={12} className="text-[var(--ink-subtle)]" />
              <span className="font-semibold text-[var(--ink)]">{activeTitle}</span>
            </div>
          </div>

          {/* Right: Actions (Theme Toggle, Live Store, User Profile) */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            {/* View Live Store */}
            <Link
              to="/"
              className="btn-secondary hidden md:inline-flex items-center gap-1.5"
              style={{
                padding: "0.45rem 0.85rem",
                fontSize: "0.75rem",
                borderRadius: "0.625rem",
              }}
            >
              <ExternalLink size={13} />
              <span>View Store</span>
            </Link>

            {/* Universal Theme Toggle in Admin */}
            <ThemeToggle size={16} />

            {/* Admin User Chip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.3rem 0.65rem 0.3rem 0.35rem",
                borderRadius: "9999px",
                backgroundColor: "var(--bg-raised)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: "1.75rem",
                  height: "1.75rem",
                  borderRadius: "9999px",
                  backgroundColor: "var(--accent-bg)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                }}
              >
                {user?.name ? user.name[0].toUpperCase() : "A"}
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ink)" }} className="hidden sm:inline">
                {user?.name || "Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* ── Page Content ───────────────────────────────── */}
        <main style={{ flex: 1, padding: "1.5rem", backgroundColor: "var(--bg)", overflowX: "hidden" }} className="lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
