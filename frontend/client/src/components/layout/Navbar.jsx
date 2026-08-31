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
import { logoutUser } from "../../features/auth/authSlice";
import { categoryService } from "../../services/categoryService";
import ThemeToggle from "../ui/ThemeToggle";
import Logo from "../ui/Logo";
import { toast } from "react-toastify";

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
      .catch(() => { });
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

  const handleCartClick = () => {
    if (!isAuthenticated) {
      toast.info("Please sign in to access your shopping bag");
      navigate("/login", { state: { from: { pathname: "/cart" } } });
      return;
    }
    dispatch(openMiniCart());
  };

  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 50, width: "100%",
        backgroundColor: scrolled ? "var(--glass-bg)" : "var(--bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        boxShadow: scrolled ? "var(--shadow-sm)" : "none",
        transition: "background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
      }}
    >
      <div className="container-page flex min-h-[4.75rem] items-center justify-between gap-4 py-3 lg:gap-6 lg:py-3.5">

        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
          <button
            onClick={() => dispatch(toggleMobileMenu())}
            className="btn-icon lg:hidden"
            aria-label="Open menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Logo size="nav" className="navbar-logo" />

          <span style={{ color: "var(--border)", fontSize: "1.25rem", userSelect: "none" }} className="hidden xl:inline">|</span>

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
                <Link to="/" className="nav-link-animated">Home</Link>
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
                      <Link to="/shop" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", borderRadius: "0.625rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--ink)", textDecoration: "none", transition: "background 0.15s" }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-raised)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
                      >
                        <span>All Categories</span>
                        <Tag size={12} style={{ color: "var(--accent)" }} />
                      </Link>
                      <div style={{ borderTop: "1px solid var(--border)", margin: "0.25rem 0" }} />
                      {categories.length > 0 ? (
                        categories.map((c) => (
                          <Link key={c._id} to={`/shop?category=${c._id}`}
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

                <Link to="/shop" className="nav-link-animated">All Products</Link>

                {/* Shop CTA */}
                <Link
                  to="/shop"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.35rem",
                    padding: "0.45rem 1rem",
                    background: "var(--accent)",
                    color: "#fff",
                    borderRadius: "9999px",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; e.currentTarget.style.transform = "scale(1.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.transform = ""; }}
                >
                  <ShoppingBag size={13} /> Shop
                </Link>
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

          {/* Cart & Wishlist — ONLY shown for non-admin users */}
          {!isAdmin && (
            <>
              <button
                type="button"
                onClick={handleCartClick}
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

          {/* Universal Dark / Light Mode Toggle Button */}
          <ThemeToggle size={18} />

          {/* Account / Login */}
          <div className="relative" ref={userRef}>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.45rem 0.875rem 0.45rem 0.5rem",
                    borderRadius: "9999px",
                    border: "1.5px solid var(--border)",
                    backgroundColor: "var(--surface)",
                    color: "var(--ink)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.backgroundColor = "var(--bg-raised)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.backgroundColor = "var(--surface)"; }}
                >
                  <div
                    style={{
                      width: "1.75rem", height: "1.75rem",
                      borderRadius: "9999px",
                      background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.6875rem", fontWeight: 800, color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:inline" style={{ maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name?.split(" ")[0]}</span>
                  <ChevronDown size={12} style={{ color: "var(--ink-subtle)", transition: "transform 0.2s", transform: userMenuOpen ? "rotate(180deg)" : "none" }} />
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
                      <button onClick={() => dispatch(logoutUser())} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.625rem", fontSize: "0.75rem", color: "var(--red)", background: "none", border: "none", cursor: "pointer", transition: "background 0.15s", width: "100%", textAlign: "left" }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--red-bg)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
                      >
                        <LogOut size={13} /> Log Out
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link
                to="/login"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--ink)",
                  textDecoration: "none",
                  padding: "0.45rem 1rem",
                  borderRadius: "9999px",
                  border: "1.5px solid var(--border)",
                  backgroundColor: "var(--surface)",
                  transition: "all 0.2s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--ink)"; e.currentTarget.style.backgroundColor = "var(--bg-raised)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.backgroundColor = "var(--surface)"; }}
              >
                <User size={14} style={{ color: "var(--accent)" }} /> Login
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
                <MobileNavLink to="/">Home Storefront</MobileNavLink>
                <MobileNavLink to="/?sort=popular">Featured Products</MobileNavLink>
                <MobileNavLink to="/shop">All Products</MobileNavLink>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;