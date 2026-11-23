import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import PublicLayout from "./components/layout/PublicLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import SuperAdminRoute from "./routes/SuperAdminRoute";

// Core eager pages for instant initial paint
import LandingPage from "./pages/LandingPage";
import ShopPage from "./pages/ShopPage";

// ── Lazy-loaded Route Chunks ──
// Customer & Public Pages
const ProductDetailsPage = lazy(() => import("./pages/ProductDetailsPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PolicyPage = lazy(() => import("./pages/PolicyPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const TrackOrderPage = lazy(() => import("./pages/TrackOrderPage"));
// [SINGLE-SELLER MODE] const SellerStorefrontPage = lazy(() => import("./pages/SellerStorefrontPage"));
// [SINGLE-SELLER MODE] const SellerRegisterPage = lazy(() => import("./pages/SellerRegisterPage"));
const CompleteProfilePage = lazy(() => import("./pages/CompleteProfilePage"));

// Customer Dashboard
const DashboardLayout = lazy(() => import("./pages/dashboard/DashboardLayout"));
const OrdersPage = lazy(() => import("./pages/dashboard/OrdersPage"));
const OrderDetailsPage = lazy(() => import("./pages/dashboard/OrderDetailsPage"));
const WishlistPage = lazy(() => import("./pages/dashboard/WishlistPage"));
const ProfilePage = lazy(() => import("./pages/dashboard/ProfilePage"));
const AddressesPage = lazy(() => import("./pages/dashboard/AddressesPage"));
const EmailHistoryPage = lazy(() => import("./pages/dashboard/EmailHistoryPage"));

// Seller Portal
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminAnalyticsPage = lazy(() => import("./pages/admin/AdminAnalyticsPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminProductAddPage = lazy(() => import("./pages/admin/AdminProductAddPage"));
const AdminProductEditPage = lazy(() => import("./pages/admin/AdminProductEditPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategoriesPage"));
const AdminCategoryAddPage = lazy(() => import("./pages/admin/AdminCategoryAddPage"));
const AdminCategoryEditPage = lazy(() => import("./pages/admin/AdminCategoryEditPage"));
const AdminBrandsPage = lazy(() => import("./pages/admin/AdminBrandsPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminOrderDetailsPage = lazy(() => import("./pages/admin/AdminOrderDetailsPage"));
// [SINGLE-SELLER MODE] const SellerPayoutsPage = lazy(() => import("./pages/admin/SellerPayoutsPage"));
const AdminEmailsPage = lazy(() => import("./pages/admin/AdminEmailsPage"));
const AdminProfilePage = lazy(() => import("./pages/admin/AdminProfilePage"));
const SellerSettingsPage = lazy(() => import("./pages/admin/SellerSettingsPage"));
const AdminCouponsPage = lazy(() => import("./pages/admin/AdminCouponsPage"));

// SuperAdmin Console
const SuperAdminLayout = lazy(() => import("./pages/superadmin/SuperAdminLayout"));
const AdminDashboardPage = lazy(() => import("./pages/superadmin/AdminDashboardPage"));
// [SINGLE-SELLER MODE] const AdminSellersPage = lazy(() => import("./pages/superadmin/AdminSellersPage"));
// [SINGLE-SELLER MODE] const AdminSellerDetailsPage = lazy(() => import("./pages/superadmin/AdminSellerDetailsPage"));
const AdminCustomersPage = lazy(() => import("./pages/superadmin/AdminCustomersPage"));
// [SINGLE-SELLER MODE] const AdminProductModerationPage = lazy(() => import("./pages/superadmin/AdminProductModerationPage"));
// [SINGLE-SELLER MODE] const AdminMarketplacePayoutsPage = lazy(() => import("./pages/superadmin/AdminMarketplacePayoutsPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));

import { fetchCurrentUser } from "./features/auth/authSlice";
import { fetchCart } from "./features/cart/cartSlice";
import { useAuth } from "./hooks/useAuth";

const RouteLoadingFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-8">
    <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
    <span className="text-xs font-semibold text-[var(--ink-muted)]">Loading view...</span>
  </div>
);

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const theme = useSelector((state) => state.ui.theme);

  // Global Theme Sync across entire app
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

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
      <Suspense fallback={<RouteLoadingFallback />}>
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
              <ProtectedRoute>
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
        position="top-right"
        autoClose={5000}
        pauseOnHover
        pauseOnFocusLoss={false}
        theme={theme === "dark" ? "dark" : "light"}
      />
    </>
  );
}

export default App;