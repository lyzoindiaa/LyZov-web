import { Suspense } from "react";
import { NavLink, Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ClipboardList, HeartHandshake, UserCircle2, MapPinned,
  LogOut, ShoppingBag, ArrowRight, Package, Heart, Star,
  Mail,
} from "lucide-react";
import { logoutUser } from "../../features/auth/authSlice";
import { resetCartLocal } from "../../features/cart/cartSlice";
import { OutletContentSkeleton } from "../../components/skeletons/Skeletons";
import { prefetchByPath } from "../../routes/routeLoaders";

const navItems = [
  { label: "My Orders", to: "/dashboard/orders", icon: ClipboardList },
  { label: "Wishlist", to: "/dashboard/wishlist", icon: HeartHandshake },
  { label: "Profile", to: "/dashboard/profile", icon: UserCircle2 },
  { label: "Addresses", to: "/dashboard/addresses", icon: MapPinned },
  { label: "Email History", to: "/dashboard/emails", icon: Mail },
  { label: "Help & Support", to: "/dashboard/support", icon: Mail },
];

/* ── Avatar placeholder from initials ── */
const Avatar = ({ name }) => {
  const initials = name
    ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  return (
    <div
      style={{
        width: "3rem", height: "3rem", borderRadius: "9999px",
        background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: "1.125rem", color: "#fff",
        flexShrink: 0, boxShadow: "var(--accent-glow)",
      }}
    >
      {initials}
    </div>
  );
};

const DashboardLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items ?? []);
  const wishlist = useSelector((state) => state.wishlist.products ?? []);

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  if (user?.role === "seller") {
    return <Navigate to="/seller" replace />;
  }

  const firstName = user?.name?.split(" ")[0] || "there";

  // Show welcome hero only on the index/orders route
  const isRoot = location.pathname === "/dashboard" || location.pathname === "/dashboard/orders";

  return (
    <div className="container-page py-8 lg:py-12">

      {/* ── Welcome Hero Banner ───────────────────────────── */}
      <div
        style={{
          position: "relative",
          borderRadius: "1.25rem",
          overflow: "hidden",
          marginBottom: "2rem",
          background: "linear-gradient(135deg, var(--bg-raised) 0%, var(--surface) 100%)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
          padding: "1.75rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
        }}
      >
        {/* Decorative accent line */}
        <div
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: "3px",
            background: "linear-gradient(90deg, var(--accent), transparent)",
          }}
        />

        {/* Left — greeting */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Avatar name={user?.name} />
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>
              Welcome back
            </p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              {firstName} 👋
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", marginTop: "0.25rem" }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* Right — quick stats + CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          {/* Quick stats */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>{cartItems.length}</p>
              <p style={{ fontSize: "10px", color: "var(--ink-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "0.15rem" }}>In Cart</p>
            </div>
            <div style={{ width: "1px", background: "var(--border)" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>{wishlist.length}</p>
              <p style={{ fontSize: "10px", color: "var(--ink-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "0.15rem" }}>Saved</p>
            </div>
          </div>

          {/* Shop CTA */}
          <Link
            to="/shop"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.65rem 1.25rem",
              background: "var(--accent)",
              color: "#fff",
              borderRadius: "9999px",
              fontWeight: 700, fontSize: "0.8125rem",
              textDecoration: "none",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-hover)";
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = "var(--shadow-md), var(--accent-glow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            }}
          >
            <ShoppingBag size={14} />
            Browse Products
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* ── Quick Action Cards (shown on root dashboard) ── */}
      {isRoot && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "0.75rem",
            marginBottom: "2rem",
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
          {[
            { label: "Browse Shop", sub: "Discover new products", icon: ShoppingBag, to: "/shop", color: "var(--accent)" },
            { label: "My Orders", sub: "Track your deliveries", icon: Package, to: "/dashboard/orders", color: "var(--blue)" },
            { label: "Wishlist", sub: `${wishlist.length} saved items`, icon: Heart, to: "/dashboard/wishlist", color: "var(--red)" },
            { label: "Profile", sub: "Update your details", icon: UserCircle2, to: "/dashboard/profile", color: "var(--green)" },
            { label: "Send Email / Help", sub: "Contact concierge support", icon: Mail, to: "/dashboard/support", color: "#D4AF37" },
          ].map(({ label, sub, icon: Icon, to, color }) => (
            <Link
              key={to}
              to={to}
              style={{
                display: "flex", flexDirection: "column", gap: "0.5rem",
                padding: "1rem", borderRadius: "0.875rem",
                background: "var(--surface)", border: "1px solid var(--border)",
                boxShadow: "var(--shadow-xs)", textDecoration: "none",
                transition: "all 0.22s cubic-bezier(0.22,1,0.36,1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
                e.currentTarget.style.borderColor = "var(--border-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "var(--shadow-xs)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <div
                style={{
                  width: "2.25rem", height: "2.25rem", borderRadius: "0.625rem",
                  background: `${color}1A`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon size={16} color={color} />
              </div>
              <div>
                <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ink)" }}>{label}</p>
                <p style={{ fontSize: "0.6875rem", color: "var(--ink-muted)", marginTop: "0.1rem" }}>{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Main Layout: Sidebar + Content ──────────────── */}
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-[200px_1fr] lg:grid-cols-[230px_1fr] lg:gap-8">

        {/* Sidebar / Mobile Horizontal Tabs */}
        <aside
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "1rem",
            boxShadow: "var(--shadow-sm)",
            alignSelf: "start",
            minWidth: 0,
            width: "100%",
          }}
          className="dashboard-nav-bar flex min-w-0 flex-row items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth p-2.5 md:flex-col md:items-stretch md:overflow-visible md:p-3 md:sticky md:top-6"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onMouseEnter={() => prefetchByPath(item.to)}
              onFocus={() => prefetchByPath(item.to)}
              className={({ isActive }) => `sidebar-nav-item shrink-0${isActive ? " active" : ""}`}
            >
              <item.icon size={16} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Desktop divider */}
          <div style={{ borderTop: "1px solid var(--border)", margin: "0.5rem 0" }} className="hidden md:block" />
          {/* Mobile vertical divider */}
          <div style={{ width: "1px", height: "1.5rem", backgroundColor: "var(--border)", margin: "0 0.125rem" }} className="block md:hidden shrink-0" />

          {/* Shop link */}
          <Link
            to="/shop"
            className="sidebar-nav-item shrink-0"
            style={{ color: "var(--accent)", fontWeight: 700 }}
          >
            <ShoppingBag size={16} className="shrink-0" />
            <span>Shop Now</span>
          </Link>

          {/* Desktop divider */}
          <div style={{ borderTop: "1px solid var(--border)", margin: "0.5rem 0" }} className="hidden md:block" />
          {/* Mobile vertical divider */}
          <div style={{ width: "1px", height: "1.5rem", backgroundColor: "var(--border)", margin: "0 0.125rem" }} className="block md:hidden shrink-0" />

          {/* Logout */}
          <button
            onClick={() => {
              dispatch(logoutUser());
              dispatch(resetCartLocal());
            }}
            style={{
              display: "flex", alignItems: "center", gap: "0.625rem",
              borderRadius: "0.625rem",
              fontSize: "0.8125rem", fontWeight: 600,
              color: "var(--red)",
              cursor: "pointer", transition: "all 0.15s",
              textAlign: "left",
              whiteSpace: "nowrap",
            }}
            className="shrink-0 w-auto p-2 sm:px-3 sm:py-2 md:p-[0.625rem_0.875rem] md:w-full bg-[var(--bg-raised)] md:bg-transparent border border-[var(--border)] md:border-none"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--red-bg)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
          >
            <LogOut size={16} className="shrink-0" />
            <span>Log Out</span>
          </button>
        </aside>

        {/* Content */}
        <div className="card-surface p-6">
          <Suspense fallback={<OutletContentSkeleton variant="portal" />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
