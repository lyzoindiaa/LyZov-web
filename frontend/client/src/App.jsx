import { useEffect, useState, lazy, Suspense } from "react";
import { Routes, Route, useNavigate, Navigate, useLocation, useNavigationType } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import PublicLayout from "./components/layout/PublicLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import SuperAdminRoute from "./routes/SuperAdminRoute";
import { AuthBootstrapFallback } from "./components/skeletons/Skeletons";
import {
  routeLoaders,
  prefetchPublicRoutes,
  prefetchPortalRoutes,
} from "./routes/routeLoaders";

// Core eager pages for instant initial paint
import LandingPage from "./pages/LandingPage";
import ShopPage from "./pages/ShopPage";

// ── Lazy-loaded Route Chunks (backed by shared prefetchable loaders) ──
const ProductDetailsPage = lazy(routeLoaders.ProductDetailsPage);
const CartPage = lazy(routeLoaders.CartPage);
const CheckoutPage = lazy(routeLoaders.CheckoutPage);
const LoginPage = lazy(routeLoaders.LoginPage);
const RegisterPage = lazy(routeLoaders.RegisterPage);
const ForgotPasswordPage = lazy(routeLoaders.ForgotPasswordPage);
const ResetPasswordPage = lazy(routeLoaders.ResetPasswordPage);
const VerifyEmailPage = lazy(routeLoaders.VerifyEmailPage);
const ContactPage = lazy(routeLoaders.ContactPage);
const PolicyPage = lazy(routeLoaders.PolicyPage);
const NotFoundPage = lazy(routeLoaders.NotFoundPage);
const TrackOrderPage = lazy(routeLoaders.TrackOrderPage);
// [SINGLE-SELLER MODE] const SellerStorefrontPage = lazy(() => import("./pages/SellerStorefrontPage"));
// [SINGLE-SELLER MODE] const SellerRegisterPage = lazy(() => import("./pages/SellerRegisterPage"));
const CompleteProfilePage = lazy(routeLoaders.CompleteProfilePage);

// Customer Dashboard
const DashboardLayout = lazy(routeLoaders.DashboardLayout);
const OrdersPage = lazy(routeLoaders.OrdersPage);
const OrderDetailsPage = lazy(routeLoaders.OrderDetailsPage);
const WishlistPage = lazy(routeLoaders.WishlistPage);
const ProfilePage = lazy(routeLoaders.ProfilePage);
const AddressesPage = lazy(routeLoaders.AddressesPage);
const EmailHistoryPage = lazy(routeLoaders.EmailHistoryPage);

// Seller Portal
const AdminLayout = lazy(routeLoaders.AdminLayout);
const AdminAnalyticsPage = lazy(routeLoaders.AdminAnalyticsPage);
const AdminProductsPage = lazy(routeLoaders.AdminProductsPage);
const AdminProductAddPage = lazy(routeLoaders.AdminProductAddPage);
const AdminProductEditPage = lazy(routeLoaders.AdminProductEditPage);
const AdminCategoriesPage = lazy(routeLoaders.AdminCategoriesPage);
const AdminCategoryAddPage = lazy(routeLoaders.AdminCategoryAddPage);
const AdminCategoryEditPage = lazy(routeLoaders.AdminCategoryEditPage);
const AdminBrandsPage = lazy(routeLoaders.AdminBrandsPage);
const AdminOrdersPage = lazy(routeLoaders.AdminOrdersPage);
const AdminOrderDetailsPage = lazy(routeLoaders.AdminOrderDetailsPage);
// [SINGLE-SELLER MODE] const SellerPayoutsPage = lazy(() => import("./pages/admin/SellerPayoutsPage"));
const AdminEmailsPage = lazy(routeLoaders.AdminEmailsPage);
const AdminProfilePage = lazy(routeLoaders.AdminProfilePage);
const SellerSettingsPage = lazy(routeLoaders.SellerSettingsPage);
const AdminCouponsPage = lazy(routeLoaders.AdminCouponsPage);

// SuperAdmin Console
const SuperAdminLayout = lazy(routeLoaders.SuperAdminLayout);
const AdminDashboardPage = lazy(routeLoaders.AdminDashboardPage);
// [SINGLE-SELLER MODE] const AdminSellersPage = lazy(() => import("./pages/superadmin/AdminSellersPage"));
// [SINGLE-SELLER MODE] const AdminSellerDetailsPage = lazy(() => import("./pages/superadmin/AdminSellerDetailsPage"));
const AdminCustomersPage = lazy(routeLoaders.AdminCustomersPage);
// [SINGLE-SELLER MODE] const AdminProductModerationPage = lazy(() => import("./pages/superadmin/AdminProductModerationPage"));
// [SINGLE-SELLER MODE] const AdminMarketplacePayoutsPage = lazy(() => import("./pages/superadmin/AdminMarketplacePayoutsPage"));
const AdminSettingsPage = lazy(routeLoaders.AdminSettingsPage);

import { fetchCurrentUser } from "./features/auth/authSlice";
import { fetchCart } from "./features/cart/cartSlice";
import { useAuth } from "./hooks/useAuth";

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (hash || navigationType === "POP") return;
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, navigationType]);

  return null;
}

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const theme = useSelector((state) => state.ui.theme);
  const [isCompactViewport, setIsCompactViewport] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = (e) => setIsCompactViewport(e.matches);
    setIsCompactViewport(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Global Theme Sync across entire app
  useEffect(() => {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.backgroundColor = isDark ? "#000000" : "#ffffff";
  }, [theme]);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  // Idle-prefetch common public pages after first paint so navigation feels instant
  useEffect(() => prefetchPublicRoutes(), []);

  // Idle-prefetch role-specific portal pages once authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.role) return undefined;
    return prefetchPortalRoutes(user.role);
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchCart());
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    const handleLogout = () => {
      const pathname = window.location.pathname;
      if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/checkout") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/seller")
      ) {
        navigate("/login");
      }
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [navigate]);

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<AuthBootstrapFallback message="Loading view..." />}>
        <Routes>
          {/* ── Standalone Auth Routes (No duplicate Navbar/Footer) ── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* [SINGLE-SELLER MODE] <Route path="/seller/register" element={<SellerRegisterPage />} /> */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute standalone>
                <CompleteProfilePage />
              </ProtectedRoute>
            }
          />

          {/* ── Public & Storefront Routes with Navbar & Footer ── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/products" element={<ShopPage />} />
            <Route path="/product/:slug" element={<ProductDetailsPage />} />
            {/* [SINGLE-SELLER MODE] <Route path="/store/:storeSlug" element={<SellerStorefrontPage />} /> */}
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />

            {/* ── Public Track Order ── */}
            <Route path="/track" element={<TrackOrderPage />} />

            {/* ── Official Store Policies ── */}
            <Route path="/policies" element={<Navigate to="/policies/privacy-policy" replace />} />
            <Route path="/policies/:policySlug" element={<PolicyPage />} />
            <Route path="/privacy-policy" element={<Navigate to="/policies/privacy-policy" replace />} />
            <Route path="/terms-and-conditions" element={<Navigate to="/policies/terms-and-conditions" replace />} />
            <Route path="/return-exchange-policy" element={<Navigate to="/policies/return-exchange-policy" replace />} />
            <Route path="/refund-cancellation-policy" element={<Navigate to="/policies/refund-cancellation-policy" replace />} />
            <Route path="/shipping-delivery-policy" element={<Navigate to="/policies/shipping-delivery-policy" replace />} />

            {/* ── Shorthand & Legacy Aliases ── */}
            <Route path="/privacy" element={<Navigate to="/policies/privacy-policy" replace />} />
            <Route path="/terms" element={<Navigate to="/policies/terms-and-conditions" replace />} />
            <Route path="/returns" element={<Navigate to="/policies/return-exchange-policy" replace />} />
            <Route path="/refund-policy" element={<Navigate to="/policies/refund-cancellation-policy" replace />} />
            <Route path="/shipping" element={<Navigate to="/policies/shipping-delivery-policy" replace />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<OrdersPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:orderId" element={<OrderDetailsPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="addresses" element={<AddressesPage />} />
              <Route path="emails" element={<EmailHistoryPage />} />
              <Route path="support" element={<ContactPage isDashboard={true} />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* ── Seller Portal ── */}
          <Route
            path="/seller"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminAnalyticsPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/add" element={<AdminProductAddPage />} />
            <Route path="products/:id/edit" element={<AdminProductEditPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="categories/add" element={<AdminCategoryAddPage />} />
            <Route path="categories/:id/edit" element={<AdminCategoryEditPage />} />
            <Route path="brands" element={<AdminBrandsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="orders/:orderId" element={<AdminOrderDetailsPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            {/* [SINGLE-SELLER MODE] <Route path="payouts" element={<SellerPayoutsPage />} /> */}
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="emails" element={<AdminEmailsPage />} />
            <Route path="settings" element={<SellerSettingsPage />} />
          </Route>

          {/* ── Super Admin Console ── */}
          <Route
            path="/admin"
            element={
              <SuperAdminRoute>
                <SuperAdminLayout />
              </SuperAdminRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            {/* [SINGLE-SELLER MODE] <Route path="sellers" element={<AdminSellersPage />} /> */}
            {/* [SINGLE-SELLER MODE] <Route path="sellers/:id" element={<AdminSellerDetailsPage />} /> */}
            {/* [SINGLE-SELLER MODE] <Route path="moderation" element={<AdminProductModerationPage />} /> */}
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="brands" element={<AdminBrandsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="categories/add" element={<AdminCategoryAddPage />} />
            <Route path="categories/:id/edit" element={<AdminCategoryEditPage />} />
            {/* [SINGLE-SELLER MODE] <Route path="payouts" element={<AdminMarketplacePayoutsPage />} /> */}
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Routes>
      </Suspense>

      <ToastContainer
        position={isCompactViewport ? "top-center" : "top-right"}
        autoClose={7000}
        newestOnTop
        closeOnClick={false}
        pauseOnHover
        pauseOnFocusLoss={false}
        style={{ zIndex: 99999 }}
        theme={theme === "dark" ? "dark" : "light"}
      />
    </>
  );
}

export default App;
