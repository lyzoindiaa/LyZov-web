import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { orderService } from "../../services/cartService";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import {
  Mail,
  Truck,
  RefreshCw,
  XCircle,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Package,
  MessageCircle,
} from "lucide-react";
import { buildWhatsAppSupportLink } from "../../utils/constants";

const statusTones = {
  pending: "warning",
  processing: "gold",
  shipped: "neutral",
  delivered: "success",
  cancelled: "danger",
  refunded: "danger",
};

const returnReasons = [
  "Size is too small",
  "Size is too large",
  "Item is defective or damaged",
  "Color or style differs from website photo",
  "Quality not as expected",
  "Incorrect item received",
  "Other",
];

const cancelReasons = [
  "Changed my mind",
  "Ordered by mistake",
  "Found a better price elsewhere",
  "Delivery date is too late",
  "Other",
];

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState(cancelReasons[0]);
  const [isCancelling, setIsCancelling] = useState(false);

  // Return / Exchange Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isExchange, setIsExchange] = useState(false);
  const [returnReason, setReturnReason] = useState(returnReasons[0]);
  const [exchangeDetails, setExchangeDetails] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const loadOrder = () => {
    orderService
      .getOrderById(orderId)
      .then((res) => setOrder(res.data))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      await orderService.cancelOrder(orderId, cancelReason);
      toast.success("Order cancelled successfully");
      setIsCancelModalOpen(false);
      loadOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmittingReturn(true);
      await orderService.returnRequest(orderId, {
        reason: returnReason,
        isExchange,
        exchangeDetails: isExchange ? exchangeDetails : null,
      });
      toast.success(
        `${isExchange ? "Exchange" : "Return"} request submitted successfully! Awaiting review.`
      );
      setIsReturnModalOpen(false);
      loadOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit return request");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  if (isLoading) return <div className="skeleton h-64 w-full rounded-xl" />;
  if (!order) return <p className="text-sm text-stone">Order not found.</p>;

  const isDelivered = order.orderStatus === "delivered";
  const deliveredDate = order.deliveredAt || order.updatedAt;
  const isWithin7Days = deliveredDate
    ? Date.now() - new Date(deliveredDate).getTime() <= 7 * 24 * 60 * 60 * 1000
    : false;
  const canRequestReturn =
    isDelivered &&
    isWithin7Days &&
    (!order.returnStatus || order.returnStatus === "Not Requested");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <p className="font-display text-xl">{order.orderNumber}</p>
            {order.returnStatus && order.returnStatus !== "Not Requested" && (
              <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                {order.isExchange ? "Exchange" : "Return"}: {order.returnStatus}
              </span>
            )}
          </div>
          <p className="text-xs text-stone">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <Badge tone={statusTones[order.orderStatus]}>{order.orderStatus}</Badge>
      </div>

      {/* Return/Exchange Status Banner */}
      {order.returnStatus && order.returnStatus !== "Not Requested" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 text-amber-600 shrink-0" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-sm">
                {order.isExchange ? "Product Exchange Status" : "Return & Refund Status"}:{" "}
                {order.returnStatus}
              </span>
              <p>
                Reason: <strong>{order.returnReason}</strong>
              </p>
              {order.returnStatus === "Requested" && (
                <p className="text-stone-600 dark:text-stone-300">
                  Your request has been received and is currently under review by our fulfillment team.
                </p>
              )}
              {order.returnStatus === "Approved" && (
                <p className="text-stone-600 dark:text-stone-300">
                  Your return request was approved! Our team will coordinate a pickup at your address shortly.
                </p>
              )}
              {order.returnStatus === "Picked Up" && (
                <p className="text-stone-600 dark:text-stone-300">
                  Your item was picked up by the courier and is on its way back to our warehouse for inspection.
                </p>
              )}
              {order.returnStatus === "Returned" && (
                <p className="text-stone-600 dark:text-stone-300">
                  Package delivered to warehouse. Inspection in progress before issuing{" "}
                  {order.isExchange ? "your replacement order" : "your refund"}.
                </p>
              )}
              {order.returnStatus === "Exchanged" && (
                <p className="text-emerald-700 font-medium">
                  Exchange completed! Your replacement order has been generated.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Courier Tracking Card */}
      {order.trackingNumber && (
        <div className="card-surface flex flex-wrap items-center justify-between gap-4 p-4 border border-blue-200 dark:border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-xs text-stone">Courier Tracking</p>
              {/* [DELHIVERY PAUSED] Previously branded as 'Delhivery Express'. Now shows generic courier info. */}
              <p className="text-sm font-semibold">Your Order is on the Way!</p>
              <p className="font-mono text-xs text-[var(--accent)] font-bold">
                AWB: {order.trackingNumber}
              </p>
            </div>
          </div>
          {/* [DELHIVERY PAUSED] — 'Track Live on Delhivery' external link commented out.
          <a
            href={`https://www.delhivery.com/track/package/${order.trackingNumber}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            Track Live on Delhivery <ExternalLink size={13} />
          </a>
          */}
          <span className="text-xs text-stone">
            Estimated delivery: <strong>7–10 business days</strong> from order date.
          </span>
        </div>
      )}

      {/* Items Section */}
      <div className="card-surface flex flex-col divide-y divide-hairline p-5 dark:divide-hairline-dark">
        {order.items.map((item, i) => (
          <div key={i} className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <img src={item.image} alt={item.name} className="h-20 w-16 rounded-lg object-cover" />
            <div className="flex flex-1 justify-between">
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-stone">
                  {item.color && `${item.color} `}
                  {item.size && `· ${item.size}`} · Qty {item.quantity}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="card-surface p-5">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone">
            Shipping Address
          </h4>
          <p className="text-sm">{order.shippingAddress.fullName}</p>
          <p className="text-sm text-stone">
            {order.shippingAddress.addressLine1}, {order.shippingAddress.city},{" "}
            {order.shippingAddress.state} {order.shippingAddress.postalCode},{" "}
            {order.shippingAddress.country}
          </p>
          <p className="text-sm text-stone">{order.shippingAddress.phone}</p>
        </div>

        <div className="card-surface p-5">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone">
            Payment Summary
          </h4>
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-stone">
              <span>Payment</span>
              <span
                className="font-semibold"
                style={{
                  color: order.paymentMethod === "cod" ? "var(--green)" : "var(--accent)",
                }}
              >
                {order.paymentMethod === "cod"
                  ? "Cash on Delivery (COD)"
                  : `Online Payment (${order.paymentResult?.currency?.toUpperCase() || "INR"})`}
              </span>
            </div>
            <div className="flex justify-between text-stone">
              <span>Items</span>
              <span className="tabular-nums">{formatCurrency(order.itemsPrice)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="tabular-nums">-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone">
              <span>Tax</span>
              <span className="tabular-nums">{formatCurrency(order.taxPrice)}</span>
            </div>
            <div className="flex justify-between text-stone">
              <span>Shipping</span>
              <span className="tabular-nums">
                {order.shippingPrice === 0 ? "Free" : formatCurrency(order.shippingPrice)}
              </span>
            </div>
            <div className="flex justify-between border-t border-hairline pt-2 font-semibold dark:border-hairline-dark">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(order.totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons: Cancel or Return/Exchange */}
      <div className="flex flex-wrap items-center gap-3">
        {["pending", "processing"].includes(order.orderStatus) && (
          <Button
            variant="secondary"
            onClick={() => setIsCancelModalOpen(true)}
            className="w-fit"
          >
            Cancel Order
          </Button>
        )}

        {canRequestReturn && (
          <Button
            variant="primary"
            onClick={() => setIsReturnModalOpen(true)}
            className="w-fit"
          >
            <RefreshCw size={15} className="mr-1.5" /> Request Return or Exchange
          </Button>
        )}
      </div>

      {/* Cancel Order Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card-surface w-full max-w-md rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold">Cancel Order</h3>
            <p className="mt-1 text-xs text-stone">
              Are you sure you want to cancel order #{order.orderNumber}? Any prepaid amount will be
              refunded.
            </p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-stone">Reason for cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-[var(--surface)] p-2.5 text-sm text-[var(--ink)] outline-none"
              >
                {cancelReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
              >
                Keep Order
              </Button>
              <Button
                variant="danger"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Return / Exchange Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card-surface w-full max-w-lg rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold">Request Return or Exchange</h3>
            <p className="mt-1 text-xs text-stone">
              Under our 7-day policy, you may request a refund or an exchange for a different size/color.
            </p>

            <form onSubmit={handleReturnSubmit} className="mt-4 flex flex-col gap-4">
              {/* Type Selection */}
              <div>
                <label className="text-xs font-semibold text-stone">Resolution Type</label>
                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsExchange(false)}
                    className={`rounded-lg border p-3 text-left text-sm transition-all ${
                      !isExchange
                        ? "border-[var(--accent)] bg-[var(--accent-bg)] font-semibold text-[var(--accent)]"
                        : "border-border text-stone hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    <p className="font-medium">Return & Refund</p>
                    <p className="text-[11px] opacity-80">Refund to original payment method</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExchange(true)}
                    className={`rounded-lg border p-3 text-left text-sm transition-all ${
                      isExchange
                        ? "border-[var(--accent)] bg-[var(--accent-bg)] font-semibold text-[var(--accent)]"
                        : "border-border text-stone hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    <p className="font-medium">Product Exchange</p>
                    <p className="text-[11px] opacity-80">Swap for a different size or fit</p>
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-semibold text-stone">Reason for return</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-[var(--surface)] p-2.5 text-sm text-[var(--ink)] outline-none"
                >
                  {returnReasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exchange Details if Exchange selected */}
              {isExchange && (
                <div>
                  <label className="text-xs font-semibold text-stone">
                    Exchange Preferences (Size / Color desired)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={exchangeDetails}
                    onChange={(e) => setExchangeDetails(e.target.value)}
                    placeholder="e.g. Please exchange size 40 for size 42 in Navy Blue."
                    className="mt-1.5 w-full rounded-lg border border-border bg-[var(--surface)] p-2.5 text-sm text-[var(--ink)] outline-none"
                  />
                </div>
              )}

              <div className="mt-3 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsReturnModalOpen(false)}
                  disabled={isSubmittingReturn}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmittingReturn}
                >
                  {isSubmittingReturn
                    ? "Submitting..."
                    : isExchange
                    ? "Submit Exchange Request"
                    : "Submit Return Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Policy and support guidance banner */}
      <div
        className="card-surface p-4 text-xs text-stone"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          borderRadius: "0.75rem",
          backgroundColor: "var(--bg-subtle)",
          border: "1px solid var(--border)",
        }}
      >
        <span>
          Questions about delivery or returns? Review our{" "}
          <Link
            to="/return-exchange-policy"
            target="_blank"
            className="font-semibold underline hover:text-accent"
            style={{ color: "var(--ink)" }}
          >
            7-Day Return & Exchange Policy
          </Link>{" "}
          and{" "}
          <Link
            to="/shipping-delivery-policy"
            target="_blank"
            className="font-semibold underline hover:text-accent"
            style={{ color: "var(--ink)" }}
          >
            Shipping & Delivery Policy
          </Link>
          .
        </span>
        <span style={{ color: "var(--ink-muted)" }}>Order #{order.orderNumber}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link to="/dashboard/orders" className="text-sm text-stone underline-offset-2 hover:underline">
          &larr; Back to Orders
        </Link>
        <div className="flex flex-wrap gap-2">
          {/* WhatsApp support */}
          <a
            href={buildWhatsAppSupportLink(`Hi! I need help with my LyZov order #${order.orderNumber}.`)}
            target="_blank"
            rel="noreferrer"
            id="customer-order-whatsapp-support-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.875rem",
              borderRadius: "0.75rem",
              backgroundColor: "#25d366",
              color: "#fff",
              fontSize: "0.8125rem",
              fontWeight: 600,
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <MessageCircle size={14} /> WhatsApp Support
          </a>
          <Link
            to={`/dashboard/support?subject=${encodeURIComponent(
              `Inquiry regarding Order #${order.orderNumber}`
            )}&category=Order Tracking & Delivery`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.75rem",
              backgroundColor: "var(--accent-bg)",
              color: "var(--accent)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.2s",
            }}
          >
            <Mail size={15} />
            <span>Email Support</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
