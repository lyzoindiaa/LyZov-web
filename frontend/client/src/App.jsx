import { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import PublicLayout from "./components/layout/PublicLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

import LandingPage from "./pages/LandingPage";
import ShopPage from "./pages/ShopPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";

import DashboardLayout from "./pages/dashboard/DashboardLayout";
import OrdersPage from "./pages/dashboard/OrdersPage";
import OrderDetailsPage from "./pages/dashboard/OrderDetailsPage";
import WishlistPage from "./pages/dashboard/WishlistPage";
import ProfilePage from "./pages/dashboard/ProfilePage";
import AddressesPage from "./pages/dashboard/AddressesPage";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminProductAddPage from "./pages/admin/AdminProductAddPage";
import AdminProductEditPage from "./pages/admin/AdminProductEditPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminCategoryAddPage from "./pages/admin/AdminCategoryAddPage";
import AdminCategoryEditPage from "./pages/admin/AdminCategoryEditPage";
import AdminBrandsPage from "./pages/admin/AdminBrandsPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";

import { fetchCurrentUser } from "./features/auth/authSlice";
import { fetchCart } from "./features/cart/cartSlice";
import { useAuth } from "./hooks/useAuth";

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
      if (pathname.startsWith("/dashboard") || pathname.startsWith("/checkout") || pathname.startsWith("/admin")) {
        navigate("/login");
      }
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [navigate]);

  return (
    <>
      <Routes>
        {/* ── Standalone Auth Routes (No duplicate Navbar/Footer) ── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* ── Public & Storefront Routes with Navbar & Footer ── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />

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
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ── Admin Portal ── */}
        <Route
          path="/admin"
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
        </Route>
      </Routes>

      <ToastContainer position="bottom-right" autoClose={3000} theme={theme === "dark" ? "dark" : "light"} />
    </>
  );
}

export default App;