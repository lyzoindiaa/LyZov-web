import { NavLink, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ClipboardList, HeartHandshake, UserCircle2, MapPinned, LogOut } from "lucide-react";
import { logoutUser } from "../../features/auth/authSlice";

const navItems = [
  { label: "Orders", to: "/dashboard/orders", icon: ClipboardList },
  { label: "Wishlist", to: "/dashboard/wishlist", icon: HeartHandshake },
  { label: "Profile", to: "/dashboard/profile", icon: UserCircle2 },
  { label: "Addresses", to: "/dashboard/addresses", icon: MapPinned },
];


const DashboardLayout = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="container-page py-8 lg:py-12">
      <div className="mb-8">
        <span className="eyebrow">My Account</span>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em", marginTop: "0.25rem" }}>
          Hi, {user?.name?.split(" ")[0] || "there"}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "1rem",
            padding: "0.75rem",
            boxShadow: "var(--shadow-sm)",
          }}
          className="flex flex-row gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible no-scrollbar"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <div style={{ borderTop: "1px solid var(--border)", margin: "0.5rem 0" }} className="hidden lg:block" />
          <button
            onClick={() => dispatch(logoutUser())}
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
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--red-bg)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </aside>

        <div className="card-surface p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
