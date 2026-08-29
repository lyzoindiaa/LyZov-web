import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Search, ShoppingCart, Heart, User, Menu, X,
  ChevronDown, Flame, LogOut, LayoutDashboard, Settings,
  Truck, ShieldCheck, Tag, Sparkles, Grid, ArrowRight
} from "lucide-react";
import { toggleMobileMenu, closeMobileMenu } from "../../features/ui/uiSlice";
import { openMiniCart } from "../../features/cart/cartSlice";
import { categoryService } from "../../services/categoryService";

const defaultCategories = [
  { _id: "equipment", name: "Gym & Fitness" },
  { _id: "spiritual", name: "God Idols & Decor" },
  { _id: "accessories", name: "Accessories" },
  { _id: "bestsellers", name: "Bestsellers" },
];

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState(defaultCategories);
  const [searchTerm, setSearchTerm] = useState("");
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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
        if (res?.data?.length > 0) {
          setCategories(res.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    setCatMenuOpen(false);
    setUserMenuOpen(false);
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
    }
  };

  return (
    <header className="w-full z-50 sticky top-0 bg-primary/95 backdrop-blur-md border-b border-border shadow-card transition-all">
      
      {/* â”€â”€ Top Announcement Strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="hidden sm:flex border-b border-border bg-surface/70 text-stone text-[11px] py-1.5 px-4 sm:px-6 lg:px-10 items-center justify-between font-medium">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-white">
            <Truck size={13} className="text-accent" /> Pan-India Free Delivery on orders &gt; â‚¹999
          </span>
          <span className="text-border-light">â€¢</span>
          <span className="flex items-center gap-1 text-stone">
            <ShieldCheck size={13} className="text-accent" /> 100% Quality Inspected
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/dashboard/orders" className="hover:text-white transition-colors">
            Track Order
          </Link>
          <span className="text-border-light">â€¢</span>
          <Link to="/#faq" className="hover:text-white transition-colors">
            Support & FAQ
          </Link>
        </div>
      </div>

      {/* â”€â”€ Main Navigation Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="container-page flex h-16 items-center justify-between gap-4">
        
        {/* Mobile menu trigger */}
        <button
          onClick={() => dispatch(toggleMobileMenu())}
          className="btn-icon lg:hidden flex-shrink-0"
          aria-label="Open menu"
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Brand Logo: LyZov Store */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0" aria-label="LyZov Store">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1">
            Ly<span className="text-accent">Zov</span>
            <span className="text-[10px] font-bold tracking-widest text-stone uppercase ml-1 px-1.5 py-0.5 rounded bg-raised border border-border">
              Store
            </span>
          </span>
        </Link>

        {/* Universal Search Bar */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-lg items-center rounded-full border border-border bg-surface px-3 py-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all mx-4"
        >
          <Search size={15} className="text-stone mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search gym equipment, God idols, home decor..."
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-stone"
          />
        </form>

        {/* Right Hub */}
        <div className="flex items-center gap-2 flex-shrink-0">
          
          <Link
            to={isAuthenticated ? "/dashboard/wishlist" : "/login"}
            className="btn-icon hidden sm:flex"
            aria-label="Wishlist"
          >
            <Heart size={17} />
          </Link>

          <button
            onClick={() => dispatch(openMiniCart())}
            className="btn-icon relative"
            aria-label="Cart"
          >
            <ShoppingCart size={17} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white shadow-accent">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </button>

          {/* Account Dropdown */}
          <div className="relative" ref={userRef}>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-white hover:border-accent transition-colors"
                >
                  <User size={14} className="text-accent" />
                  <span className="hidden sm:inline max-w-[85px] truncate">{user?.name?.split(" ")[0]}</span>
                  <ChevronDown size={12} className="text-stone" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 glass-panel p-2 shadow-lift animate-fade-up z-50">
                    <div className="p-2.5 border-b border-border">
                      <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                      <p className="text-[10px] text-stone truncate">{user?.email}</p>
                    </div>
                    <div className="py-1 space-y-0.5 text-xs">
                      {user?.role === "admin" && (
                        <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-accent font-semibold hover:bg-raised">
                          <Settings size={14} /> Admin Dashboard
                        </Link>
                      )}
                      <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-stone hover:text-white hover:bg-raised">
                        <LayoutDashboard size={14} /> My Dashboard
                      </Link>
                      <Link to="/dashboard/orders" className="flex items-center gap-2 px-3 py-2 rounded-lg text-stone hover:text-white hover:bg-raised">
                        <Tag size={14} /> My Orders
                      </Link>
                      <Link to="/dashboard/wishlist" className="flex items-center gap-2 px-3 py-2 rounded-lg text-stone hover:text-white hover:bg-raised">
                        <Heart size={14} /> Wishlist
                      </Link>
                    </div>
                    <div className="pt-1 border-t border-border">
                      <Link to="/logout" className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-raised text-xs">
                        <LogOut size={14} /> Log Out
                      </Link>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link to="/login" className="btn-primary !py-2 !px-4 !text-xs">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ Category Quick-Link Strip (Desktop) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="border-t border-border bg-surface/80 hidden lg:block">
        <div className="container-page flex items-center justify-between gap-6 py-2">
          
          <div className="flex items-center gap-1.5" ref={catRef}>
            
            {/* All Products Dropdown */}
            <div className="relative">
              <button
                onClick={() => setCatMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 bg-raised border border-border text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:border-accent transition-colors mr-2"
              >
                <Grid size={13} className="text-accent" />
                <span>Categories</span>
                <ChevronDown size={12} className={`transition-transform ${catMenuOpen ? "rotate-180 text-accent" : ""}`} />
              </button>

              {catMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-60 glass-panel p-2 shadow-lift animate-fade-up z-50">
                  <Link
                    to="/shop"
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-white hover:bg-raised hover:text-accent transition-colors"
                  >
                    <span>All Products</span>
                    <ArrowRight size={12} />
                  </Link>
                  {categories.map((c) => (
                    <Link
                      key={c._id}
                      to={`/shop?category=${c._id}`}
                      className="block px-3 py-2 rounded-lg text-xs text-stone hover:text-white hover:bg-raised transition-colors"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/shop"
              className="text-xs font-medium text-stone hover:text-white px-2.5 py-1 rounded-md hover:bg-raised transition-colors"
            >
              All Items
            </Link>

            {categories.slice(0, 5).map((cat) => (
              <Link
                key={cat._id}
                to={`/shop?category=${cat._id}`}
                className="text-xs font-medium text-stone hover:text-white px-2.5 py-1 rounded-md hover:bg-raised transition-colors"
              >
                {cat.name}
              </Link>
            ))}

            <Link
              to="/shop?sort=bestseller"
              className="text-xs font-semibold text-accent px-2.5 py-1 rounded-md hover:bg-raised transition-colors flex items-center gap-1"
            >
              <Flame size={13} /> Bestsellers
            </Link>
          </div>

          <div className="text-[11px] text-stone font-medium">
            Customer Care: <span className="text-white">support@lyzov.com</span>
          </div>
        </div>
      </div>

      {/* â”€â”€ Mobile Menu Drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {isMobileMenuOpen && (
        <div className="border-t border-border bg-surface lg:hidden p-4 space-y-3">
          <form onSubmit={handleSearch} className="flex items-center rounded-full border border-border bg-raised px-3 py-2">
            <Search size={14} className="text-stone mr-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search LyZov Store..."
              className="w-full bg-transparent text-xs text-white outline-none placeholder:text-stone"
            />
          </form>

          <div className="space-y-1">
            <p className="eyebrow px-2 pt-2">Shop Categories</p>
            <Link
              to="/shop"
              onClick={() => dispatch(closeMobileMenu())}
              className="block px-3 py-2 rounded-lg text-xs font-semibold text-white hover:bg-raised"
            >
              All Products Catalog
            </Link>
            {categories.map((c) => (
              <Link
                key={c._id}
                to={`/shop?category=${c._id}`}
                onClick={() => dispatch(closeMobileMenu())}
                className="block px-3 py-2 rounded-lg text-xs text-stone hover:text-white hover:bg-raised"
              >
                {c.name}
              </Link>
            ))}
            <Link
              to="/shop?sort=bestseller"
              onClick={() => dispatch(closeMobileMenu())}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-accent hover:bg-raised"
            >
              <Flame size={14} /> Bestsellers & Top Deals
            </Link>
          </div>

          <div className="pt-3 border-t border-border space-y-2">
            {isAuthenticated ? (
              <Link
                to={user?.role === "admin" ? "/admin" : "/dashboard"}
                onClick={() => dispatch(closeMobileMenu())}
                className="btn-secondary w-full text-xs"
              >
                {user?.role === "admin" ? "Admin Control Panel" : "My Account Dashboard"}
              </Link>
            ) : (
              <Link to="/login" onClick={() => dispatch(closeMobileMenu())} className="btn-primary w-full text-xs">
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