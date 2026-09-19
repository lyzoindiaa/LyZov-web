import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Package, AlertTriangle } from "lucide-react";
import { orderService } from "../../services/cartService";
// import { shippingService } from "../../services/shippingService"; // [DELHIVERY PAUSED]
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";

const ALL_STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];

/**
 * Returns the status options available for a given current status.
 * Once an order is 'delivered', it cannot revert to earlier stages.
 */
function getAvailableStatuses(currentStatus) {
  if (currentStatus === "delivered") {
    return ["delivered", "cancelled", "refunded"];
  }
  return ALL_STATUS_OPTIONS;
}

const AdminOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [manifestingId, setManifestingId] = useState(null);

  // Delivered confirmation modal state
  const [pendingDelivery, setPendingDelivery] = useState(null); // { orderId, order }
  const [isConfirming, setIsConfirming] = useState(false);

  // [DELHIVERY PAUSED] const [manifestingId, setManifestingId] = useState(null);

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

  const handleStatusChange = async (orderId, newStatus, order) => {
    // Intercept "delivered" — show confirmation modal first
    if (newStatus === "delivered") {
      setPendingDelivery({ orderId, order });
      return;
    }
    try {
      await orderService.updateOrderStatus(orderId, { status: newStatus });
      toast.success("Order status updated");
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update order status");
    }
  };

  const handleConfirmDelivered = async () => {
    if (!pendingDelivery) return;
    setIsConfirming(true);
    try {
      await orderService.updateOrderStatus(pendingDelivery.orderId, { status: "delivered" });
      toast.success("Order marked as delivered ✓");
      setPendingDelivery(null);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update order status");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      {/* ── Delivered confirmation modal (uses app's Modal component) ── */}
      <Modal
        isOpen={!!pendingDelivery}
        onClose={() => !isConfirming && setPendingDelivery(null)}
        title="Mark as Delivered?"
        size="sm"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-900 dark:text-amber-200">
              This action <strong>cannot be undone.</strong> Once delivered, the order cannot be reverted to shipped, processing, or pending.
            </p>
          </div>

          {pendingDelivery && (
            <div className="rounded-lg border border-hairline bg-[var(--bg-subtle)] px-4 py-3 dark:border-hairline-dark">
              <p className="text-sm font-semibold">Order {pendingDelivery.order.orderNumber}</p>
              <p className="text-xs text-stone mt-0.5">Customer: {pendingDelivery.order.user?.name || "—"}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button
              variant="secondary"
              onClick={() => setPendingDelivery(null)}
              disabled={isConfirming}
            >
              Cancel
            </Button>
            <Button
              id="admin-orders-confirm-delivered-btn"
              variant="primary"
              isLoading={isConfirming}
              onClick={handleConfirmDelivered}
            >
              Yes, Mark Delivered
            </Button>
          </div>
        </div>
      </Modal>

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
            {ALL_STATUS_OPTIONS.map((s) => (
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
                orders.map((order) => {
                  const isDelivered = order.orderStatus === "delivered";
                  return (
                    <tr key={order._id} className="border-b border-hairline last:border-0 dark:border-hairline-dark">
                      <td className="px-5 py-4 font-medium">
                        <button
                          type="button"
                          onClick={() => navigate(`/seller/orders/${order._id}`)}
                          className="flex items-center gap-3 text-left hover:text-[var(--accent)] hover:underline"
                        >
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
                            onChange={(e) => handleStatusChange(order._id, e.target.value, order)}
                            className="rounded-full border border-ink/12 bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--ink)] outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-cream/15 dark:bg-[var(--bg-raised)] dark:text-[var(--ink)]"
                          >
                            {getAvailableStatuses(order.orderStatus).map((s) => (
                              <option
                                key={s}
                                value={s}
                                className="bg-[var(--surface)] text-[var(--ink)] dark:bg-[var(--bg-raised)] dark:text-[var(--ink)]"
                              >
                                {s}
                              </option>
                            ))}
                          </select>

                          {/* Delivered lock indicator */}
                          {isDelivered && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                              ✓ Delivered &amp; Locked
                            </span>
                          )}

                          {/* Tracking number */}
                          {order.trackingNumber && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)]">
                              <span>AWB:</span>
                              <span className="font-mono">{order.trackingNumber}</span>
                            </div>
                          )}

                          {/*
                            [DELHIVERY PAUSED] — "Ship via Delhivery" button commented out.
                            Manual tracking assignment is now done from the order detail page.

                          {!order.trackingNumber && ["pending", "processing"].includes(order.orderStatus) && (
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
                          )}
                          */}

                          {order.returnStatus && order.returnStatus !== "Not Requested" && (
                            <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                              Return: {order.returnStatus}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AdminOrdersPage;
