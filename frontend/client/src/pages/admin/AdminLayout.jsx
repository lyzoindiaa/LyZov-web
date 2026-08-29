import { NavLink, Outlet, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { BarChart3, Boxes, ClipboardList, Tags, LogOut, ArrowLeftCircle } from "lucide-react";
import { logoutUser } from "../../features/auth/authSlice";

const navItems = [
  { label: "Analytics", to: "/admin", icon: BarChart3, end: true },
  { label: "Products", to: "/admin/products", icon: Boxes },
  { label: "Categories", to: "/admin/categories", icon: Tags },
  { label: "Orders", to: "/admin/orders", icon: ClipboardList },
];

const AdminLayout = () => {
  const dispatch = useDispatch();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-primary text-white">
      <aside className="w-full lg:w-60 shrink-0 flex-col border-r border-border bg-surface p-5 lg:flex">
        <Link to="/" className="flex items-center gap-1.5">
          <span className="text-xl font-black text-white">
            Ly<span className="text-accent">Zov</span>
          </span>
          <span className="badge badge-accent text-[8px]">Admin</span>
        </Link>
        <span className="text-[11px] text-stone mt-0.5">Store Management</span>

        <nav className="mt-6 flex lg:flex-col lg:gap-1 overflow-x-auto lg:overflow-visible flex-row gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive
                  ? "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold bg-accent text-white"
                  : "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-stone hover:bg-raised hover:text-white"
              }
            >
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-1 pt-6 border-t border-border">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-stone hover:bg-raised hover:text-white"
          >
            <ArrowLeftCircle size={15} />
            Back to Store
          </Link>
          <button
            onClick={() => dispatch(logoutUser())}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
          >
            <LogOut size={15} />
            Log Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden p-5 lg:p-8 bg-primary">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;