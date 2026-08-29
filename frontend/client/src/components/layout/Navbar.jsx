import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Search, ShoppingBag, Heart, User, Menu, X,
  ChevronDown, LogOut, LayoutDashboard, Settings,
  Tag, SunMedium, MoonStar
} from "lucide-react";
import { toggleMobileMenu, closeMobileMenu, toggleTheme } from "../../features/ui/uiSlice";
import { openMiniCart } from "../../features/cart/cartSlice";
import { categoryService } from "../../services/categoryService";

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
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800 shadow-nav"
          : "bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800"
      }`}
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
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
            <Link
              to="/?sort=popular"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Featured Products
            </Link>

            {/* Categories Dropdown */}
            <div className="relative" ref={catRef}>
              <button
                onClick={() => setCatMenuOpen((v) => !v)}
                className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span>Categories</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${catMenuOpen ? "rotate-180 text-gray-900 dark:text-white" : "text-gray-400"}`} />
              </button>

              {catMenuOpen && (
                <div className="absolute top-full left-0 mt-3 w-56 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-2 shadow-card z-50">
                  <Link
                    to="/"
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span>All Categories</span>
                    <Tag size={13} className="text-amber-600" />
                  </Link>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                  {categories.length > 0 ? (
                    categories.map((c) => (
                      <Link
                        key={c._id}
                        to={`/?category=${c._id}`}
                        className="block px-3 py-2 rounded-xl text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {c.name}
                      </Link>
                    ))
                  ) : (
                    <>
                      <Link to="/?category=equipment" className="block px-3 py-2 rounded-xl text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Gym & Fitness</Link>
                      <Link to="/?category=spiritual" className="block px-3 py-2 rounded-xl text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">God Idols & Decor</Link>
                      <Link to="/?category=accessories" className="block px-3 py-2 rounded-xl text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Accessories</Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <Link
              to="/"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              All Products
            </Link>
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

          {/* Cart with count badge */}
          <button
            onClick={() => dispatch(openMiniCart())}
            className="btn-icon relative"
            aria-label="Cart"
          >
            <ShoppingBag size={19} />
            {totalItems > 0 && (
              <span className="absolute 1 top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-black dark:bg-amber-500 text-[10px] font-bold text-white dark:text-black shadow-soft">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </button>

          {/* Wishlist */}
          <Link
            to={isAuthenticated ? "/dashboard/wishlist" : "/login"}
            className="btn-icon hidden sm:flex"
            aria-label="Wishlist"
          >
            <Heart size={19} />
          </Link>

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
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-2 shadow-card z-50">
                    <div className="p-2.5 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1 space-y-0.5 text-xs">
                      {user?.role === "admin" && (
                        <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-xl text-amber-700 dark:text-amber-400 font-semibold hover:bg-amber-50 dark:hover:bg-gray-700">
                          <Settings size={14} /> Admin Dashboard
                        </Link>
                      )}
                      <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                        <LayoutDashboard size={14} /> My Dashboard
                      </Link>
                      <Link to="/dashboard/orders" className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Tag size={14} /> My Orders
                      </Link>
                      <Link to="/dashboard/wishlist" className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Heart size={14} /> Wishlist
                      </Link>
                    </div>
                    <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
                      <Link to="/logout" className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs">
                        <LogOut size={14} /> Log Out
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
        <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4 py-3 animate-fade-in">
          <form onSubmit={handleSearchSubmit} className="container-page flex items-center gap-3">
            <Search size={18} className="text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products across LyZov Store..."
              className="w-full bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm("")} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 lg:hidden p-5 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-transparent text-xs text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
            />
          </form>

          <nav className="flex flex-col space-y-1">
            <Link to="/?sort=popular" className="px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
              Featured Products
            </Link>
            <Link to="/" className="px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
              All Products
            </Link>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Categories</p>
              {categories.map((c) => (
                <Link
                  key={c._id}
                  to={`/?category=${c._id}`}
                  className="block px-3 py-2 rounded-xl text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </nav>

          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
            {isAuthenticated ? (
              <Link to={user?.role === "admin" ? "/admin" : "/dashboard"} className="btn-secondary w-full text-xs">
                {user?.role === "admin" ? "Admin Dashboard" : "My Dashboard"}
              </Link>
            ) : (
              <Link to="/login" className="btn-primary w-full text-xs">
                Login / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;