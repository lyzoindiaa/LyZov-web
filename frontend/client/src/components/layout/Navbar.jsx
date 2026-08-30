import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Search, ShoppingBag, Heart, User, Menu, X,
  ChevronDown, LogOut, LayoutDashboard, Settings,
  Tag, SunMedium, MoonStar, FolderPlus, PackagePlus, ShoppingCart
} from "lucide-react";
import { toggleMobileMenu, closeMobileMenu, toggleTheme } from "../../features/ui/uiSlice";
import { openMiniCart } from "../../features/cart/cartSlice";
import { categoryService } from "../../services/categoryService";

/* ── Helper sub-components ─────────────────────────────────── */
const DropItem = ({ to, icon: Icon, children, accent }) => (
  <Link
    to={to}
    style={{
      display: "flex", alignItems: "center", gap: "0.5rem",
      padding: "0.5rem 0.75rem", borderRadius: "0.625rem",
      fontSize: "0.75rem", fontWeight: accent ? 700 : 500,
      color: accent ? "var(--accent)" : "var(--ink-muted)",
      textDecoration: "none", transition: "all 0.15s",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-raised)"; if (!accent) e.currentTarget.style.color = "var(--ink)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; if (!accent) e.currentTarget.style.color = "var(--ink-muted)"; }}
  >
    {Icon && <Icon size={13} />}
    {children}
  </Link>
);

const MobileNavLink = ({ to, children, accent }) => (
  <Link
    to={to}
    style={{
      padding: "0.625rem 0.75rem", borderRadius: "0.75rem",
      fontSize: "0.875rem", fontWeight: 600,
      color: accent ? "var(--accent)" : "var(--ink)",
      textDecoration: "none", transition: "background 0.15s",
    }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-raised)"}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
  >
    {children}
  </Link>
);


const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const catRef = useRef(null);
  const userRef = useRef(null);

  const { isMobileMenuOpen, theme } = useSelector((s) => s.ui);
  const { totalItems } = useSelector((s) => s.cart);
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  const isAdmin = isAuthenticated && user?.role === "admin";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    categoryService
      .getCategories()
      .then((res) => {
        if (res?.data?.length > 0) setCategories(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setUserMenuOpen(false);
    setCatMenuOpen(false);
    dispatch(closeMobileMenu());
  }, [location.pathname]);

  useEffect(() => {
    const h = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setCatMenuOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchOpen(false);
      setSearchTerm("");
    }
  };

  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 50, width: "100%",
        backgroundColor: scrolled ? "rgba(var(--bg-rgb, 255,255,255), 0.96)" : "var(--bg)",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: "1px solid var(--border)",
        boxShadow: scrolled ? "var(--shadow-sm)" : "none",
        transition: "all 0.25s",
      }}
    >
      <div className="container-page flex h-18 items-center justify-between gap-6 py-3">
        
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-6 sm:gap-8">
          <button
            onClick={() => dispatch(toggleMobileMenu())}
            className="btn-icon lg:hidden"
            aria-label="Open menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-lg">
              L<span className="text-amber-500">Z</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              LyZov
            </span>
          </Link>

          <span className="hidden sm:inline text-gray-300 dark:text-gray-700">|</span>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-6">
            {isAdmin ? (
              <>
                <Link to="/admin/categories" className="nav-link-animated" style={{ color: "var(--accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <FolderPlus size={14} /> Manage Categories
                </Link>
                <Link to="/admin/products" className="nav-link-animated" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <PackagePlus size={14} /> Manage Products
                </Link>
                <Link to="/admin/orders" className="nav-link-animated" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <ShoppingCart size={14} /> Orders
                </Link>
                <Link to="/admin" className="nav-link-animated">Dashboard</Link>
              </>
            ) : (
              <>
                <Link to="/?sort=popular" className="nav-link-animated">Featured</Link>

                {/* Categories Dropdown */}
                <div style={{ position: "relative" }} ref={catRef}>
                  <button
                    onClick={() => setCatMenuOpen((v) => !v)}
                    style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem", fontWeight: 500, color: catMenuOpen ? "var(--ink)" : "var(--ink-muted)", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s" }}
                  >
                    <span>Categories</span>
                    <ChevronDown size={13} style={{ transition: "transform 0.2s", transform: catMenuOpen ? "rotate(180deg)" : "none", color: "var(--ink-subtle)" }} />
                  </button>

                  {catMenuOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 0.75rem)", left: 0, width: "14rem", borderRadius: "1rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "0.5rem", boxShadow: "var(--shadow-lg)", zIndex: 50, animation: "fadeIn 0.18s ease" }}>
                      <Link to="/" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", borderRadius: "0.625rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--ink)", textDecoration: "none", transition: "background 0.15s" }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-raised)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
                      >
                        <span>All Categories</span>
                        <Tag size={12} style={{ color: "var(--accent)" }} />
                      </Link>
                      <div style={{ borderTop: "1px solid var(--border)", margin: "0.25rem 0" }} />
                      {categories.length > 0 ? (
                        categories.map((c) => (
                          <Link key={c._id} to={`/?category=${c._id}`}
                            style={{ display: "block", padding: "0.5rem 0.75rem", borderRadius: "0.625rem", fontSize: "0.75rem", color: "var(--ink-muted)", textDecoration: "none", transition: "all 0.15s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-raised)"; e.currentTarget.style.color = "var(--ink)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.color = "var(--ink-muted)"; }}
                          >
                            {c.name}
                          </Link>
                        ))
                      ) : (
                        <div style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "var(--ink-subtle)" }}>No categories yet</div>
                      )}
                    </div>
                  )}
                </div>

                <Link to="/" className="nav-link-animated">All Products</Link>
              </>
            )}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          
          {/* Search Trigger */}
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="btn-icon"
            aria-label="Search"
          >
            <Search size={19} />
          </button>

          {/* Cart & Wishlist â€” ONLY shown for non-admin users */}
          {!isAdmin && (
            <>
              <button
                onClick={() => dispatch(openMiniCart())}
                className="btn-icon relative"
                aria-label="Cart"
              >
                <ShoppingBag size={19} />
                {totalItems > 0 && (
                  <span className="cart-badge-pulse absolute top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-black dark:bg-amber-500 text-[10px] font-bold text-white dark:text-black shadow-soft">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </button>

              <Link
                to={isAuthenticated ? "/dashboard/wishlist" : "/login"}
                className="btn-icon hidden sm:flex"
                aria-label="Wishlist"
              >
                <Heart size={19} />
              </Link>
            </>
          )}

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={() => dispatch(toggleTheme())}
            className="btn-icon"
            aria-label="Toggle dark/light theme"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <SunMedium size={19} className="text-amber-400" />
            ) : (
              <MoonStar size={19} className="text-gray-700" />
            )}
          </button>

          {/* Account / Login */}
          <div className="relative" ref={userRef}>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:border-gray-300 transition-colors"
                >
                  <User size={15} className="text-amber-600" />
                  <span className="hidden sm:inline max-w-[80px] truncate">{user?.name?.split(" ")[0]}</span>
                  <ChevronDown size={12} className="text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 0.5rem)", width: "13rem", borderRadius: "1rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "0.375rem", boxShadow: "var(--shadow-lg)", zIndex: 50, animation: "fadeIn 0.18s ease" }}>
                    <div style={{ padding: "0.625rem 0.75rem", borderBottom: "1px solid var(--border)", marginBottom: "0.25rem" }}>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</p>
                      <p style={{ fontSize: "11px", color: "var(--ink-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</p>
                    </div>
                    {isAdmin && (
                      <>
                        <DropItem to="/admin/categories" icon={FolderPlus} accent>{"Manage Categories"}</DropItem>
                        <DropItem to="/admin/products" icon={PackagePlus} accent>{"Manage Products"}</DropItem>
                        <DropItem to="/admin" icon={Settings}>{"Admin Overview"}</DropItem>
                      </>
                    )}
                    {!isAdmin && (
                      <>
                        <DropItem to="/dashboard" icon={LayoutDashboard}>{"My Dashboard"}</DropItem>
                        <DropItem to="/dashboard/orders" icon={Tag}>{"My Orders"}</DropItem>
                        <DropItem to="/dashboard/wishlist" icon={Heart}>{"Wishlist"}</DropItem>
                      </>
                    )}
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.25rem", marginTop: "0.25rem" }}>
                      <Link to="/logout" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.625rem", fontSize: "0.75rem", color: "var(--red)", textDecoration: "none", transition: "background 0.15s" }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--red-bg)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
                      >
                        <LogOut size={13} /> Log Out
                      </Link>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link to="/login" className="text-sm font-semibold text-gray-900 dark:text-white hover:text-amber-600 transition-colors px-2 py-1">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {searchOpen && (
        <div className="search-bar-enter" style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-subtle)", padding: "0.875rem 1rem" }}>
          <form onSubmit={handleSearchSubmit} className="container-page" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Search size={17} style={{ color: "var(--ink-subtle)", flexShrink: 0 }} />
            <input
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products across LyZov Store..."
              style={{ flex: 1, background: "transparent", fontSize: "0.875rem", color: "var(--ink)", outline: "none", border: "none" }}
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm("")} style={{ color: "var(--ink-subtle)", background: "none", border: "none", cursor: "pointer", transition: "color 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-subtle)"}
              >
                <X size={15} />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="search-bar-enter lg:hidden" style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg)", padding: "1.25rem" }}>
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", borderRadius: "0.875rem", border: "1px solid var(--border)", backgroundColor: "var(--bg-subtle)", padding: "0.625rem 0.875rem", marginBottom: "1rem", gap: "0.5rem" }}>
            <Search size={15} style={{ color: "var(--ink-subtle)", flexShrink: 0 }} />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search products..." style={{ flex: 1, background: "transparent", fontSize: "0.8rem", color: "var(--ink)", outline: "none", border: "none" }} />
          </form>

          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {isAdmin ? (
              <>
                <MobileNavLink to="/admin/categories" accent>Manage Categories</MobileNavLink>
                <MobileNavLink to="/admin/products">Manage Products</MobileNavLink>
                <MobileNavLink to="/admin/orders">Manage Orders</MobileNavLink>
              </>
            ) : (
              <>
                <MobileNavLink to="/?sort=popular">Featured Products</MobileNavLink>
                <MobileNavLink to="/">All Products</MobileNavLink>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;