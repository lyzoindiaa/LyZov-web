import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Search, ShoppingBag, Heart, User, Menu, X,
  ChevronDown, LogOut, LayoutDashboard, Settings,
  Tag, SunMedium, MoonStar, FolderPlus, PackagePlus, ShoppingCart, Mail, Truck
} from "lucide-react";
import { toggleMobileMenu, closeMobileMenu, toggleTheme, setSearchDraft } from "../../features/ui/uiSlice";
import { openMiniCart } from "../../features/cart/cartSlice";
import { logoutUser } from "../../features/auth/authSlice";
import { categoryService } from "../../services/categoryService";
import ThemeToggle from "../ui/ThemeToggle";
import Logo from "../ui/Logo";
import { toast } from "react-toastify";
import { markCollectionHeroSeen } from "../../utils/collectionHero";

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

  const categoryTree = useMemo(() => {
    const l1 = categories.filter((c) => (c.level || 1) === 1);
    const getChildren = (parentId) =>
      categories.filter((c) => {
        const p = c.parent?._id ? c.parent._id.toString() : c.parent ? c.parent.toString() : "";
        return p === parentId.toString();
      });

    return l1.map((root) => {
      const subcats = getChildren(root._id);
      return {
        ...root,
        children: subcats.map((sub) => ({
          ...sub,
          children: getChildren(sub._id),
        })),
      };
    });
  }, [categories]);

  const { isMobileMenuOpen, theme } = useSelector((s) => s.ui);
  const { totalItems } = useSelector((s) => s.cart);
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  const isSeller = isAuthenticated && (user?.role === "seller" || user?.role === "admin");
  const isAdmin = isSeller;

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

  // Live-draft sync — no auto-navigate; submit is handled explicitly
  useEffect(() => {
    dispatch(setSearchDraft(searchTerm.trim()));
  }, [searchTerm, dispatch]);

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
    const q = searchTerm.trim();
    if (q) {
      markCollectionHeroSeen();
      navigate(`/shop?search=${encodeURIComponent(q)}`);
      dispatch(setSearchDraft(""));
      setSearchOpen(false);
      setSearchTerm("");
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    dispatch(setSearchDraft(value));
  };

  const clearSearch = () => {
    setSearchTerm("");
    dispatch(setSearchDraft(""));
    // If on shop page with an active search param, strip it
    if (location.search.includes("search=")) {
      const next = new URLSearchParams(location.search);
      next.delete("search");
      const qs = next.toString();
      navigate(location.pathname + (qs ? `?${qs}` : ""), { replace: true });
    }
  };

  const handleCartClick = () => {
    if (isAuthenticated) dispatch(openMiniCart());
    navigate("/cart");
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
      <div className="container-page flex w-full max-w-full min-h-[4rem] items-center justify-between gap-4 py-2 lg:gap-6 lg:py-2.5">

        {/* Left: Brand & Navigation */}
        <div className="flex min-w-0 items-center gap-4 sm:gap-6 lg:gap-8">
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
            {isSeller ? (
              <>
                <Link to="/seller/categories" className="nav-link-animated" style={{ color: "var(--accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <FolderPlus size={14} /> Manage Categories
                </Link>
                <Link to="/seller/products" className="nav-link-animated" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <PackagePlus size={14} /> Manage Products
                </Link>
                <Link to="/seller/orders" className="nav-link-animated" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <ShoppingCart size={14} /> Orders
                </Link>
                <Link to="/seller" className="nav-link-animated">Dashboard</Link>
              </>
            ) : (
              <>
                <Link to="/" className="nav-link-animated">Home</Link>
                <Link to="/?sort=popular" className="nav-link-animated">Featured</Link>

                {/* Categories Dropdown & Mega-Menu */}
                <div style={{ position: "relative" }} ref={catRef}>
                  <button
                    onClick={() => setCatMenuOpen((v) => !v)}
                    style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem", fontWeight: 500, color: catMenuOpen ? "var(--ink)" : "var(--ink-muted)", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s" }}
                  >
                    <span>Categories</span>
                    <ChevronDown size={13} style={{ transition: "transform 0.2s", transform: catMenuOpen ? "rotate(180deg)" : "none", color: "var(--ink-subtle)" }} />
                  </button>

                  {catMenuOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 0.75rem)",
                        left: "-6rem",
                        width: "min(46rem, calc(100vw - 2rem))",
                        borderRadius: "1.25rem",
                        backgroundColor: "var(--surface)",
                        border: "1px solid var(--border)",
                        padding: "1.25rem",
                        boxShadow: "var(--shadow-xl)",
                        zIndex: 50,
                        animation: "fadeIn 0.18s ease",
                      }}
                    >
                      {/* Mega Menu Top Header */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)", marginBottom: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Tag size={15} style={{ color: "var(--accent)" }} />
                          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ink)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Product Categories
                          </span>
                        </div>
                        <Link
                          to="/shop"
                          onClick={() => setCatMenuOpen(false)}
                          style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}
                        >
                          All Products →
                        </Link>
                      </div>

                      {/* Mega Menu Columns */}
                      {categoryTree.length > 0 ? (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${Math.min(Math.max(categoryTree.length, 1), 4)}, minmax(0, 1fr))`,
                            gap: "1.25rem",
                          }}
                        >
                          {categoryTree.map((root) => (
                            <div key={root._id} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                              {/* Level 1 Category Header */}
                              <Link
                                to={`/shop?category=${encodeURIComponent(root.slug || root._id)}`}
                                onClick={() => setCatMenuOpen(false)}
                                style={{
                                  fontSize: "0.875rem",
                                  fontWeight: 700,
                                  color: "var(--ink)",
                                  textDecoration: "none",
                                  paddingBottom: "0.35rem",
                                  borderBottom: "1.5px solid var(--border)",
                                  transition: "color 0.15s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink)")}
                              >
                                {root.name}
                              </Link>

                              {/* Subcategories (L2) and Items (L3) */}
                              {root.children && root.children.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                  {root.children.map((sub) => (
                                    <div key={sub._id} style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                      <Link
                                        to={`/shop?category=${encodeURIComponent(sub.slug || sub._id)}`}
                                        onClick={() => setCatMenuOpen(false)}
                                        style={{
                                          fontSize: "0.75rem",
                                          fontWeight: 600,
                                          color: "var(--ink-muted)",
                                          textDecoration: "none",
                                          transition: "color 0.15s",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-muted)")}
                                      >
                                        {sub.name}
                                      </Link>

                                      {/* Level 3 Items */}
                                      {sub.children && sub.children.length > 0 && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", paddingLeft: "0.5rem" }}>
                                          {sub.children.slice(0, 4).map((item) => (
                                            <Link
                                              key={item._id}
                                              to={`/shop?category=${encodeURIComponent(item.slug || item._id)}`}
                                              onClick={() => setCatMenuOpen(false)}
                                              style={{
                                                fontSize: "0.6875rem",
                                                color: "var(--ink-subtle)",
                                                textDecoration: "none",
                                                transition: "color 0.15s",
                                              }}
                                              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
                                              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-subtle)")}
                                            >
                                              • {item.name}
                                            </Link>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <Link
                                  to={`/shop?category=${encodeURIComponent(root.slug || root._id)}`}
                                  onClick={() => setCatMenuOpen(false)}
                                  style={{ fontSize: "0.6875rem", color: "var(--ink-subtle)", textDecoration: "none" }}
                                >
                                  Browse collection
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.75rem", color: "var(--ink-subtle)" }}>
                          No categories found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Link to="/shop" className="nav-link-animated">All Products</Link>
                <Link to="/track" className="nav-link-animated" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Truck size={13} /> Track Order
                </Link>
                <Link to="/contact" className="nav-link-animated">Contact</Link>

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
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">

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
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 0.5rem)",
                      width: "min(14rem, calc(100vw - 2rem))",
                      borderRadius: "1rem",
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                      padding: "0.375rem",
                      boxShadow: "var(--shadow-lg)",
                      zIndex: 50,
                      animation: "fadeIn 0.18s ease",
                    }}
                  >
                    <div style={{ padding: "0.625rem 0.75rem", borderBottom: "1px solid var(--border)", marginBottom: "0.25rem" }}>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</p>
                      <p style={{ fontSize: "11px", color: "var(--ink-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</p>
                    </div>
                    {isSeller && (
                      <>
                        <DropItem to="/seller/categories" icon={FolderPlus} accent>{"Manage Categories"}</DropItem>
                        <DropItem to="/seller/products" icon={PackagePlus} accent>{"Manage Products"}</DropItem>
                        <DropItem to="/seller" icon={Settings}>{"Seller Overview"}</DropItem>
                      </>
                    )}
                    {!isSeller && (
                      <>
                        <DropItem to="/dashboard" icon={LayoutDashboard}>{"My Dashboard"}</DropItem>
                        <DropItem to="/dashboard/orders" icon={Tag}>{"My Orders"}</DropItem>
                        <DropItem to="/dashboard/wishlist" icon={Heart}>{"Wishlist"}</DropItem>
                        <DropItem to="/dashboard/emails" icon={Mail}>{"Email History"}</DropItem>
                        <DropItem to="/dashboard/support" icon={Mail}>{"Help & Support"}</DropItem>
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
              /* Temporarily hidden while Google-only authentication is integrated. */
              /*
              <Link
                to="/login"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "var(--ink)",
                  textDecoration: "none",
                  padding: "0.45rem 0.875rem",
                  borderRadius: "9999px",
                  border: "1.5px solid var(--border)",
                  backgroundColor: "var(--surface)",
                  transition: "all 0.2s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--ink)"; e.currentTarget.style.backgroundColor = "var(--bg-raised)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.backgroundColor = "var(--surface)"; }}
              >
                <User size={14} style={{ color: "var(--accent)" }} /> Login
              </Link>
              */
              null
            )}
          </div>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {searchOpen && (
        <div className="search-bar-enter" style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-subtle)", padding: "0.75rem 1rem" }}>
          <form onSubmit={handleSearchSubmit} className="container-page" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Search size={17} style={{ color: "var(--ink-subtle)", flexShrink: 0 }} />
            <input
              autoFocus
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search products across LyZov..."
              style={{ flex: 1, background: "transparent", fontSize: "0.875rem", color: "var(--ink)", outline: "none", border: "none" }}
            />
            {searchTerm && (
              <button type="button" onClick={clearSearch} style={{ color: "var(--ink-subtle)", background: "none", border: "none", cursor: "pointer", transition: "color 0.15s" }}
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
        <div className="search-bar-enter lg:hidden" style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg)", padding: "1rem 1.25rem 1.5rem", maxHeight: "calc(100vh - 4.75rem)", overflowY: "auto" }}>
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", borderRadius: "0.875rem", border: "1px solid var(--border)", backgroundColor: "var(--bg-subtle)", padding: "0.625rem 0.875rem", marginBottom: "1rem", gap: "0.5rem" }}>
            <Search size={15} style={{ color: "var(--ink-subtle)", flexShrink: 0 }} />
            <input value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Search products..." style={{ flex: 1, background: "transparent", fontSize: "0.8125rem", color: "var(--ink)", outline: "none", border: "none" }} />
          </form>

          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {isSeller ? (
              <>
                <MobileNavLink to="/seller/categories" accent>Manage Categories</MobileNavLink>
                <MobileNavLink to="/seller/products">Manage Products</MobileNavLink>
                <MobileNavLink to="/seller/orders">Manage Orders</MobileNavLink>
                <MobileNavLink to="/seller">Seller Dashboard</MobileNavLink>
              </>
            ) : (
              <>
                <MobileNavLink to="/">Home</MobileNavLink>
                <MobileNavLink to="/?sort=popular">Featured Picks</MobileNavLink>
                <MobileNavLink to="/shop" accent>All Products Catalog</MobileNavLink>

                {/* Mobile Categories Accordion/Links */}
                {categoryTree.length > 0 && (
                  <div style={{ margin: "0.5rem 0", padding: "0.75rem", backgroundColor: "var(--bg-subtle)", borderRadius: "0.875rem", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-subtle)", marginBottom: "0.5rem" }}>
                      Departments & Categories
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {categoryTree.map((root) => (
                        <div key={root._id} style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          <Link
                            to={`/shop?category=${encodeURIComponent(root.slug || root._id)}`}
                            onClick={() => dispatch(closeMobileMenu())}
                            style={{
                              fontSize: "0.8125rem",
                              fontWeight: 700,
                              color: "var(--ink)",
                              padding: "0.2rem 0",
                              textDecoration: "none",
                            }}
                          >
                            📁 {root.name}
                          </Link>

                          {root.children && root.children.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", paddingLeft: "0.75rem", borderLeft: "1.5px solid var(--border)", marginLeft: "0.25rem" }}>
                              {root.children.map((sub) => (
                                <div key={sub._id} style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                                  <Link
                                    to={`/shop?category=${encodeURIComponent(sub.slug || sub._id)}`}
                                    onClick={() => dispatch(closeMobileMenu())}
                                    style={{
                                      fontSize: "0.75rem",
                                      fontWeight: 600,
                                      color: "var(--ink-muted)",
                                      textDecoration: "none",
                                      padding: "0.15rem 0",
                                    }}
                                  >
                                    ↳ {sub.name}
                                  </Link>

                                  {sub.children && sub.children.length > 0 && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", paddingLeft: "0.5rem" }}>
                                      {sub.children.map((item) => (
                                        <Link
                                          key={item._id}
                                          to={`/shop?category=${encodeURIComponent(item.slug || item._id)}`}
                                          onClick={() => dispatch(closeMobileMenu())}
                                          style={{
                                            fontSize: "0.6875rem",
                                            color: "var(--ink-subtle)",
                                            textDecoration: "none",
                                            padding: "0.1rem 0",
                                          }}
                                        >
                                          • {item.name}
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ borderTop: "1px solid var(--border)", margin: "0.5rem 0" }} />
                <MobileNavLink to={isAuthenticated ? "/dashboard/wishlist" : "/login"}>Saved Wishlist</MobileNavLink>
                {isAuthenticated && <MobileNavLink to="/dashboard/orders">My Orders</MobileNavLink>}
                <MobileNavLink to="/track">Track Order</MobileNavLink>
                <MobileNavLink to="/contact">Contact Support</MobileNavLink>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;