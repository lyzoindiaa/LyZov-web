import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Package } from "lucide-react";
import { orderService } from "../../services/cartService";
import { shippingService } from "../../services/shippingService";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

const statusOptions = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];

const AdminOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [manifestingId, setManifestingId] = useState(null);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await orderService.getAllOrders(statusFilter ? { status: statusFilter } : {});
      setOrders(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleStatusChange = async (orderId, status) => {
    try {
      await orderService.updateOrderStatus(orderId, { status });
      toast.success("Order status updated");
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update order status");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow">Fulfillment</span>
          <h1 className="mt-1 font-display text-3xl tracking-tightest">Orders</h1>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-full border border-ink/12 bg-transparent px-4 py-2.5 text-sm outline-none dark:border-cream/15"
        >
          <option value="">All Statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="card-surface overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-xs uppercase tracking-wide text-stone dark:border-hairline-dark">
              <th className="px-5 py-4">Order</th>
              <th className="px-5 py-4">Customer</th>
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4">Total</th>
              <th className="px-5 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-stone">
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-stone">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id} className="border-b border-hairline last:border-0 dark:border-hairline-dark">
                  <td className="px-5 py-4 font-medium">
                    <button type="button" onClick={() => navigate(`/seller/orders/${order._id}`)} className="flex items-center gap-3 text-left hover:text-[var(--accent)] hover:underline">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--accent-bg)] text-[var(--accent)]">
                        {order.items?.find((item) => item.image)?.image ? (
                          <img
                            src={order.items.find((item) => item.image).image}
                            alt={order.items.find((item) => item.image).name || "Ordered product"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package size={18} />
                        )}
                      </span>
                      {order.orderNumber}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-stone">{order.user?.name}</td>
                  <td className="px-5 py-4 text-stone">{formatDateTime(order.createdAt)}</td>
                  <td className="px-5 py-4 tabular-nums">{formatCurrency(order.totalPrice)}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-2">
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="rounded-full border border-ink/12 bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--ink)] outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-cream/15 dark:bg-[var(--bg-raised)] dark:text-[var(--ink)]"
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s} className="bg-[var(--surface)] text-[var(--ink)] dark:bg-[var(--bg-raised)] dark:text-[var(--ink)]">
                            {s}
                          </option>
                        ))}
                      </select>
                      {order.trackingNumber ? (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--accent)] font-semibold">
                          <span>AWB:</span>
                          <span className="font-mono">{order.trackingNumber}</span>
                        </div>
                      ) : ["pending", "processing"].includes(order.orderStatus) ? (
                        <button
                          type="button"
                          disabled={manifestingId === order._id}
                          onClick={async () => {
                            try {
                              setManifestingId(order._id);
                              await shippingService.manifestOrder(order._id);
                              toast.success("Manifested with Delhivery!");
                              loadOrders();
                            } catch (err) {
                              toast.error("Delhivery error: " + (err.response?.data?.message || err.message));
                            } finally {
                              setManifestingId(null);
                            }
                          }}
                          className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-3 py-1 text-xs font-semibold hover:bg-blue-200 disabled:opacity-50"
                        >
                          {manifestingId === order._id ? "Shipping..." : "Ship via Delhivery"}
                        </button>
                      ) : null}

                      {order.returnStatus && order.returnStatus !== "Not Requested" && (
                        <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                          Return: {order.returnStatus}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
