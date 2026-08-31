import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ArrowRight, ChevronRight, Clock } from "lucide-react";
import { orderService } from "../../services/cartService";
import { formatCurrency, formatDate } from "../../utils/formatters";
import Badge from "../../components/ui/Badge";

const statusTones = {
  pending: "warning",
  processing: "gold",
  shipped: "neutral",
  delivered: "success",
  cancelled: "danger",
  refunded: "danger",
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    orderService
      .getMyOrders()
      .then((res) => setOrders(res.data || []))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="empty-state py-12">
        <div
          style={{
            width: "3.5rem",
            height: "3.5rem",
            borderRadius: "9999px",
            backgroundColor: "var(--bg-raised)",
            color: "var(--ink-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Package size={26} />
        </div>
        <h3 className="empty-state-title">No orders placed yet</h3>
        <p className="empty-state-desc">Your past orders and delivery progress will appear here.</p>
        <Link to="/shop" className="btn-accent mt-2">
          Start Shopping <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-2">
        <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--ink)" }}>
          Order History ({orders.length})
        </h2>
      </div>

      {orders.map((order) => (
        <Link
          key={order._id}
          to={`/dashboard/orders/${order._id}`}
          className="card-surface flex flex-col gap-3 p-5 transition-all hover:shadow-md hover:border-[var(--border-hover)] sm:flex-row sm:items-center sm:justify-between text-inherit no-underline"
          style={{ textDecoration: "none" }}
        >
          <div className="flex items-center gap-3.5">
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "0.75rem",
                backgroundColor: "var(--accent-bg)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Package size={18} />
            </div>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)" }}>
                {order.orderNumber || `Order #${order._id.slice(-6).toUpperCase()}`}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "0.15rem" }}>
                Placed on {formatDate(order.createdAt)} · {order.items?.length || 1} item(s)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
            <Badge tone={statusTones[order.orderStatus] || "neutral"}>{order.orderStatus}</Badge>
            <span style={{ fontSize: "0.9375rem", fontWeight: 800, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
              {formatCurrency(order.totalPrice || order.total || 0)}
            </span>
            <ChevronRight size={16} style={{ color: "var(--ink-subtle)" }} className="hidden sm:inline" />
          </div>
        </Link>
      ))}
    </div>
  );
};

export default OrdersPage;
