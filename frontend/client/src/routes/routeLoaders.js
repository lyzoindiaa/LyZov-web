// Centralized dynamic import loaders for route code-splitting and instant prefetching.
export const routeLoaders = {
  ProductDetailsPage: () => import("../pages/ProductDetailsPage"),
  CartPage: () => import("../pages/CartPage"),
  CheckoutPage: () => import("../pages/CheckoutPage"),
  LoginPage: () => import("../pages/LoginPage"),
  RegisterPage: () => import("../pages/RegisterPage"),
  ForgotPasswordPage: () => import("../pages/ForgotPasswordPage"),
  ResetPasswordPage: () => import("../pages/ResetPasswordPage"),
  VerifyEmailPage: () => import("../pages/VerifyEmailPage"),
  ContactPage: () => import("../pages/ContactPage"),
  PolicyPage: () => import("../pages/PolicyPage"),
  NotFoundPage: () => import("../pages/NotFoundPage"),
  TrackOrderPage: () => import("../pages/TrackOrderPage"),
  CompleteProfilePage: () => import("../pages/CompleteProfilePage"),

  DashboardLayout: () => import("../pages/dashboard/DashboardLayout"),
  OrdersPage: () => import("../pages/dashboard/OrdersPage"),
  OrderDetailsPage: () => import("../pages/dashboard/OrderDetailsPage"),
  WishlistPage: () => import("../pages/dashboard/WishlistPage"),
  ProfilePage: () => import("../pages/dashboard/ProfilePage"),
  AddressesPage: () => import("../pages/dashboard/AddressesPage"),
  EmailHistoryPage: () => import("../pages/dashboard/EmailHistoryPage"),

  AdminLayout: () => import("../pages/admin/AdminLayout"),
  AdminAnalyticsPage: () => import("../pages/admin/AdminAnalyticsPage"),
  AdminProductsPage: () => import("../pages/admin/AdminProductsPage"),
  AdminProductAddPage: () => import("../pages/admin/AdminProductAddPage"),
  AdminProductEditPage: () => import("../pages/admin/AdminProductEditPage"),
  AdminCategoriesPage: () => import("../pages/admin/AdminCategoriesPage"),
  AdminCategoryAddPage: () => import("../pages/admin/AdminCategoryAddPage"),
  AdminCategoryEditPage: () => import("../pages/admin/AdminCategoryEditPage"),
  AdminBrandsPage: () => import("../pages/admin/AdminBrandsPage"),
  AdminOrdersPage: () => import("../pages/admin/AdminOrdersPage"),
  AdminOrderDetailsPage: () => import("../pages/admin/AdminOrderDetailsPage"),
  AdminEmailsPage: () => import("../pages/admin/AdminEmailsPage"),
  AdminProfilePage: () => import("../pages/admin/AdminProfilePage"),
  SellerSettingsPage: () => import("../pages/admin/SellerSettingsPage"),
  AdminCouponsPage: () => import("../pages/admin/AdminCouponsPage"),

  SuperAdminLayout: () => import("../pages/superadmin/SuperAdminLayout"),
  AdminDashboardPage: () => import("../pages/superadmin/AdminDashboardPage"),
  AdminCustomersPage: () => import("../pages/superadmin/AdminCustomersPage"),
  AdminSettingsPage: () => import("../pages/admin/AdminSettingsPage"),
};

const prefetchedKeys = new Set();

const warmLoaders = (keys = []) => {
  for (const key of keys) {
    if (prefetchedKeys.has(key) || !routeLoaders[key]) continue;
    prefetchedKeys.add(key);
    routeLoaders[key]().catch(() => {
      // Allow retry if a transient network glitch aborted prefetch
      prefetchedKeys.delete(key);
    });
  }
};

const scheduleIdle = (fn) => {
  if (typeof window === "undefined") return () => {};
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(fn, { timeout: 1500 });
    return () => window.cancelIdleCallback(id);
  }
  const timer = window.setTimeout(fn, 350);
  return () => window.clearTimeout(timer);
};

export const prefetchPublicRoutes = () =>
  scheduleIdle(() => {
    warmLoaders([
      "ProductDetailsPage",
      "CartPage",
      "LoginPage",
      "TrackOrderPage",
      "ContactPage",
      "PolicyPage",
    ]);
  });

export const prefetchPortalRoutes = (role) =>
  scheduleIdle(() => {
    if (role === "seller") {
      warmLoaders([
        "AdminLayout",
        "AdminAnalyticsPage",
        "AdminProductsPage",
        "AdminProductAddPage",
        "AdminCategoriesPage",
        "AdminCategoryAddPage",
        "AdminBrandsPage",
        "AdminOrdersPage",
        "AdminCouponsPage",
        "AdminEmailsPage",
        "AdminProfilePage",
        "SellerSettingsPage",
      ]);
      return;
    }

    if (role === "admin") {
      warmLoaders([
        "SuperAdminLayout",
        "AdminDashboardPage",
        "AdminCouponsPage",
        "AdminBrandsPage",
        "AdminCategoriesPage",
        "AdminCategoryAddPage",
        "AdminCustomersPage",
        "AdminSettingsPage",
      ]);
      return;
    }

    if (role) {
      warmLoaders([
        "DashboardLayout",
        "OrdersPage",
        "WishlistPage",
        "ProfilePage",
        "AddressesPage",
        "CheckoutPage",
      ]);
    }
  });

const pathLoaderMap = [
  ["/product/", ["ProductDetailsPage"]],
  ["/cart", ["CartPage"]],
  ["/checkout", ["CheckoutPage"]],
  ["/login", ["LoginPage"]],
  ["/register", ["RegisterPage"]],
  ["/track", ["TrackOrderPage"]],
  ["/contact", ["ContactPage"]],
  ["/policies", ["PolicyPage"]],
  ["/dashboard/orders", ["OrdersPage", "OrderDetailsPage"]],
  ["/dashboard/wishlist", ["WishlistPage"]],
  ["/dashboard/profile", ["ProfilePage"]],
  ["/dashboard/addresses", ["AddressesPage"]],
  ["/dashboard/emails", ["EmailHistoryPage"]],
  ["/dashboard/support", ["ContactPage"]],
  ["/dashboard", ["DashboardLayout", "OrdersPage"]],
  ["/seller/products/add", ["AdminProductAddPage"]],
  ["/seller/products", ["AdminProductsPage", "AdminProductAddPage", "AdminProductEditPage"]],
  ["/seller/categories/add", ["AdminCategoryAddPage"]],
  ["/seller/categories", ["AdminCategoriesPage", "AdminCategoryAddPage", "AdminCategoryEditPage"]],
  ["/seller/brands", ["AdminBrandsPage"]],
  ["/seller/orders", ["AdminOrdersPage", "AdminOrderDetailsPage"]],
  ["/seller/coupons", ["AdminCouponsPage"]],
  ["/seller/profile", ["AdminProfilePage"]],
  ["/seller/emails", ["AdminEmailsPage"]],
  ["/seller/settings", ["SellerSettingsPage"]],
  ["/seller", ["AdminLayout", "AdminAnalyticsPage"]],
  ["/admin/categories/add", ["AdminCategoryAddPage"]],
  ["/admin/categories", ["AdminCategoriesPage", "AdminCategoryAddPage", "AdminCategoryEditPage"]],
  ["/admin/brands", ["AdminBrandsPage"]],
  ["/admin/coupons", ["AdminCouponsPage"]],
  ["/admin/customers", ["AdminCustomersPage"]],
  ["/admin/settings", ["AdminSettingsPage"]],
  ["/admin", ["SuperAdminLayout", "AdminDashboardPage"]],
];

export const prefetchByPath = (path) => {
  if (!path || typeof path !== "string") return;
  const match = pathLoaderMap.find(([prefix]) => path.startsWith(prefix));
  if (match) warmLoaders(match[1]);
};
