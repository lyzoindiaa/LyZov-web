import { useEffect, useState } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { IndianRupee, ShoppingBag, Package, Users, Wrench, ExternalLink } from "lucide-react";
import { adminService } from "../../services/cartService";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import Badge from "../../components/ui/Badge";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const statusTones = {
  pending: "warning",
  processing: "gold",
  shipped: "neutral",
  delivered: "success",
  cancelled: "danger",
  refunded: "danger",
};

const statMeta = [
  { key: "revenue", cls: "stat-revenue", icon: IndianRupee },
  { key: "orders", cls: "stat-orders", icon: ShoppingBag },
  { key: "products", cls: "stat-products", icon: Package },
  { key: "users", cls: "stat-users", icon: Users },
];

const StatCard = ({ icon: Icon, label, value, colorClass }) => (
  <div className={`card-surface flex items-center gap-4 p-5 ${colorClass}`} style={{ position: "relative", overflow: "hidden" }}>
    {/* Decorative top-right glow */}
    <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", borderRadius: "9999px", background: "var(--stat-bg)", opacity: 0.6, pointerEvents: "none" }} />
    <div className="stat-card-icon">
      <Icon size={18} />
    </div>
    <div>
      <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: "1.375rem", fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "var(--stat-color)" }}>{value}</p>
    </div>
  </div>
);

const AdminAnalyticsPage = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminService.getDashboardStats();
        const payload = res?.data ?? res ?? {};
        setStats({
          totalRevenue: payload.totalRevenue ?? 0,
          totalOrders: payload.totalOrders ?? 0,
          totalProducts: payload.totalProducts ?? 0,
          totalUsers: payload.totalUsers ?? 0,
          revenueByDay: Array.isArray(payload.revenueByDay) ? payload.revenueByDay : [],
          ordersByStatus: Array.isArray(payload.ordersByStatus) ? payload.ordersByStatus : [],
          recentOrders: Array.isArray(payload.recentOrders) ? payload.recentOrders : [],
        });
      } catch (error) {
        setStats({
          totalRevenue: 0,
          totalOrders: 0,
          totalProducts: 0,
          totalUsers: 0,
          revenueByDay: [],
          ordersByStatus: [],
          recentOrders: [],
        });
      }
    })();
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const revenueChartData = {
    labels: (stats.revenueByDay || []).map((d) => d._id),
    datasets: [
      {
        label: "Revenue",
        data: (stats.revenueByDay || []).map((d) => d.revenue),
        borderColor: "#B08D57",
        backgroundColor: "rgba(176,141,87,0.12)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const statusChartData = {
    labels: (stats.ordersByStatus || []).map((s) => s._id),
    datasets: [
      {
        data: (stats.ordersByStatus || []).map((s) => s.count),
        backgroundColor: ["#B08D57", "#0B0B0A", "#8A8580", "#C9A66B", "#E8E5DE", "#6B6560"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <span className="eyebrow">Overview</span>
        <h1 className="mt-1 font-display text-3xl tracking-tightest">Analytics</h1>
      </div>

      {/* External Seller Tools Quick Banner */}
      <div
        className="card-surface p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{
          borderLeft: "4px solid var(--accent)",
          background: "linear-gradient(90deg, var(--accent-bg) 0%, var(--surface) 100%)",
        }}
      >
        <div className="flex items-center gap-3.5">
          <div
            style={{
              width: "2.75rem",
              height: "2.75rem",
              borderRadius: "0.75rem",
              backgroundColor: "var(--accent)",
              color: "#000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Wrench size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "var(--ink)" }}>LyZov Seller Toolkit</h2>
              <span className="badge badge-accent" style={{ fontSize: "0.625rem", padding: "0.1rem 0.4rem" }}>tools.lyzov.com</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "0.15rem" }}>
              Access HSN lookup, GST calculators, and seller productivity tools.
            </p>
          </div>
        </div>
        <a
          href="https://tools.lyzov.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-accent flex items-center gap-1.5 shrink-0"
          style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem", fontWeight: 700 }}
        >
          <span>Explore Tools</span>
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={IndianRupee} label="Total Revenue" value={formatCurrency(stats.totalRevenue)} colorClass="stat-revenue" />
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats.totalOrders} colorClass="stat-orders" />
        <StatCard icon={Package} label="Total Products" value={stats.totalProducts} colorClass="stat-products" />
        <StatCard icon={Users} label="Total Customers" value={stats.totalUsers} colorClass="stat-users" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card-surface p-6">
          <h3 className="mb-4 font-display text-lg">Revenue (Last 14 Days)</h3>
          <Line
            data={revenueChartData}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }}
          />
        </div>
        <div className="card-surface p-6">
          <h3 className="mb-4 font-display text-lg">Orders by Status</h3>
          <Doughnut data={statusChartData} options={{ plugins: { legend: { position: "bottom" } } }} />
        </div>
      </div>

      <div className="card-surface p-6">
        <h3 className="mb-4 font-display text-lg">Recent Orders</h3>
        <div className="flex flex-col divide-y divide-hairline dark:divide-hairline-dark">
          {(stats.recentOrders || []).length === 0 ? (
            <p className="py-3 text-sm text-stone">No recent orders yet.</p>
          ) : (
            stats.recentOrders.map((order) => (
              <div key={order._id} className="flex items-center justify-between py-3 text-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--accent-bg)] text-[var(--accent)]">
                    {order.items?.find((item) => item.image)?.image ? (
                      <img
                        src={order.items.find((item) => item.image).image}
                        alt={order.items.find((item) => item.image).name || "Ordered product"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package size={18} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{order.orderNumber || `Order #${String(order._id || "").slice(-6)}`}</p>
                    <p className="text-xs text-stone">
                      {order.user?.name || "Customer"} · {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge tone={statusTones[order.orderStatus] || "neutral"}>{order.orderStatus || "pending"}</Badge>
                  <span className="font-semibold tabular-nums">{formatCurrency(order.totalPrice || 0)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
