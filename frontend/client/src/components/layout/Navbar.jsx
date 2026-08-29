import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Search, ShoppingBag, Heart, User, Menu, X,
  ChevronDown, LogOut, LayoutDashboard, Settings,
  Tag, MapPin
} from "lucide-react";
import { toggleMobileMenu, closeMobileMenu } from "../../features/ui/uiSlice";
import { openMiniCart } from "../../features/cart/cartSlice";
import { categoryService } from "../../services/categoryService";

const navCategories = [
  { label: "Featured Products", to: "/shop?sort=bestseller" },
  { label: "Categories", to: "/shop" },
  { label: "All Products", to: "/shop" },
];

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

  const { isMobileMenuOpen } = useSelector((s) => s.ui);
  const { totalItems } = useSelector((s) => s.cart);
  const { isAuthenticated, user } = useSelector((s) => s.auth);

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
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchOpen(false);
      setSearchTerm("");
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-nav"
          : "bg-white border-b border-gray-100"
      }`}
    >
      <div className="container-page flex h-18 items-center justify-between gap-6 py-3">
        
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => dispatch(toggleMobileMenu())}
            className="btn-icon lg:hidden"
            aria-label="Open menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white font-black text-lg tracking-tight">
              L<span className="text-amber-500">Z</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-gray-900 leading-tight">
                LyZov
              </span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest leading-none">
                Store
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Clean Nav Links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link
            to="/shop?sort=bestseller"
            className="hover:text-gray-900 transition-colors"
          >
            Featured Products
          </Link>

          {/* Dynamic Categories Dropdown */}
          <div className="relative" ref={catRef}>
            <button
              onClick={() => setCatMenuOpen((v) => !v)}
              className="flex items-center gap-1 hover:text-gray-900 transition-colors"
            >
              <span>Categories</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${catMenuOpen ? "rotate-180 text-gray-900" : "text-gray-400"}`} />
            </button>

            {catMenuOpen && (
              <div className="absolute top-full left-0 mt-3 w-56 rounded-2xl bg-white border border-gray-100 p-2 shadow-card z-50">
                <Link
                  to="/shop"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <span>All Categories</span>
                  <Tag size={13} className="text-amber-600" />
                </Link>
                <div className="border-t border-gray-100 my-1" />
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <Link
                      key={c._id}
                      to={`/shop?category=${c._id}`}
                      className="block px-3 py-2 rounded-xl text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      {c.name}
                    </Link>
                  ))
                ) : (
                  <>
                    <Link to="/shop?category=equipment" className="block px-3 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-50">Gym & Fitness</Link>
                    <Link to="/shop?category=spiritual" className="block px-3 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-50">God Idols & Decor</Link>
                    <Link to="/shop?category=accessories" className="block px-3 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-50">Accessories</Link>
                  </>
                )}
              </div>
            )}
          </div>

          <Link
            to="/shop"
            className="hover:text-gray-900 transition-colors"
          >
            All Products
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          
          {/* Search Button */}
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="btn-icon"
            aria-label="Search"
          >
            <Search size={19} />
          </button>

          {/* Wishlist */}
          <Link
            to={isAuthenticated ? "/dashboard/wishlist" : "/login"}
            className="btn-icon hidden sm:flex"
            aria-label="Wishlist"
          >
            <Heart size={19} />
          </Link>

          {/* Cart */}
          <button
            onClick={() => dispatch(openMiniCart())}
            className="btn-icon relative"
            aria-label="Cart"
          >
            <ShoppingBag size={19} />
            {totalItems > 0 && (
              <span className="absolute 1 top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white shadow-soft">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </button>

          {/* Account */}
          <div className="relative" ref={userRef}>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-semibold text-gray-800 hover:border-gray-300 transition-colors"
                >
                  <User size={15} className="text-amber-600" />
                  <span className="hidden sm:inline max-w-[80px] truncate">{user?.name?.split(" ")[0]}</span>
                  <ChevronDown size={12} className="text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white border border-gray-100 p-2 shadow-card z-50">
                    <div className="p-2.5 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1 space-y-0.5 text-xs">
                      {user?.role === "admin" && (
                        <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-xl text-amber-700 font-semibold hover:bg-amber-50">
                          <Settings size={14} /> Admin Dashboard
                        </Link>
                      )}
                      <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                        <LayoutDashboard size={14} /> My Dashboard
                      </Link>
                      <Link to="/dashboard/orders" className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                        <Tag size={14} /> My Orders
                      </Link>
                      <Link to="/dashboard/wishlist" className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                        <Heart size={14} /> Wishlist
                      </Link>
                    </div>
                    <div className="pt-1 border-t border-gray-100">
                      <Link to="/logout" className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs">
                        <LogOut size={14} /> Log Out
                      </Link>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link to="/login" className="btn-primary !py-2 !px-5 text-xs">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Search Input */}
      {searchOpen && (
        <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-3 animate-fade-in">
          <form onSubmit={handleSearchSubmit} className="container-page flex items-center gap-3">
            <Search size={18} className="text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name, category, or brand..."
              className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
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
        <div className="border-t border-gray-100 bg-white lg:hidden p-5 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-transparent text-xs text-gray-900 outline-none placeholder:text-gray-400"
            />
          </form>

          <nav className="flex flex-col space-y-1">
            <Link to="/shop?sort=bestseller" className="px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:bg-gray-50">
              Featured Products
            </Link>
            <Link to="/shop" className="px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:bg-gray-50">
              All Products
            </Link>
            <div className="pt-2 border-t border-gray-100">
              <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Categories</p>
              {categories.map((c) => (
                <Link
                  key={c._id}
                  to={`/shop?category=${c._id}`}
                  className="block px-3 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-50"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </nav>

          <div className="pt-3 border-t border-gray-100 space-y-2">
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