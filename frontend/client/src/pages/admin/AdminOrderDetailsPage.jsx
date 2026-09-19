import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft, ExternalLink, Truck, RefreshCw, AlertCircle,
  CheckCircle, AlertTriangle, MessageCircle, Lock, Copy, Edit2, Send, Check
} from "lucide-react";
import { orderService } from "../../services/cartService";
// import { shippingService } from "../../services/shippingService"; // [DELHIVERY PAUSED]
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";

const ALL_STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];

/**
 * Returns available status options.
 * Delivered orders cannot revert to pending/processing/shipped.
 */
function getAvailableStatuses(currentStatus) {
  if (currentStatus === "delivered") {
    return ["delivered", "cancelled", "refunded"];
  }
  return ALL_STATUS_OPTIONS;
}

const AdminOrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApprovingReturn, setIsApprovingReturn] = useState(false);
  const [isProcessingExchange, setIsProcessingExchange] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delivered confirmation modal
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);

  // Manual tracking assignment state
  const [trackingInput, setTrackingInput] = useState("");
  const [markAsShipped, setMarkAsShipped] = useState(true);
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [isSendingShippingEmail, setIsSendingShippingEmail] = useState(false);
  const [shippingEmailSent, setShippingEmailSent] = useState(false);

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      const res = await orderService.getOrderById(orderId);
      setOrder(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load order");
      navigate("/seller/orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  useEffect(() => {
    if (order?.trackingNumber) {
      setTrackingInput(order.trackingNumber);
    } else {
      setTrackingInput("");
    }
  }, [order?.trackingNumber]);

  const handleSaveTracking = async (e) => {
    e?.preventDefault();
    const clean = trackingInput.trim();
    if (!clean) {
      toast.error("Please enter a valid tracking or AWB number");
      return;
    }
    try {
      setIsSavingTracking(true);
      const payload = { trackingNumber: clean };
      if (markAsShipped && order.orderStatus !== "shipped" && order.orderStatus !== "delivered") {
        payload.status = "shipped";
      }
      const res = await orderService.updateOrderStatus(orderId, payload);
      setOrder(res.data);
      toast.success("Tracking ID assigned & automated email dispatched to customer! ✓");
      setIsEditingTracking(false);
      setShippingEmailSent(true);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to assign tracking number";
      toast.error(errMsg);
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleSendShippingEmail = async () => {
    if (!order?.trackingNumber) {
      toast.error("Please assign a tracking / AWB number first");
      return;
    }
    try {
      setIsSendingShippingEmail(true);
      const res = await orderService.sendTrackingEmail(orderId);
      toast.success(res.message || "Shipping email sent successfully to customer! ✓");
      setShippingEmailSent(true);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to send shipping email";
      toast.error(errMsg);
    } finally {
      setIsSendingShippingEmail(false);
    }
  };

  const handleCopyTracking = () => {
    if (order?.trackingNumber) {
      navigator.clipboard.writeText(order.trackingNumber);
      toast.success("Tracking / AWB copied to clipboard!");
    }
  };

  const updateOrder = async (payload, message) => {
    try {
      setIsUpdatingStatus(true);
      const res = await orderService.updateOrderStatus(orderId, payload);
      setOrder(res.data);
      toast.success(message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update order");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStatusSelectChange = (newStatus) => {
    if (newStatus === "delivered") {
      setShowDeliveredModal(true);
      return;
    }
    updateOrder({ status: newStatus }, "Order status updated");
  };

  const handleConfirmDelivered = async () => {
    await updateOrder({ status: "delivered" }, "Order marked as delivered ✓");
    setShowDeliveredModal(false);
  };

  /* [DELHIVERY PAUSED] — Delhivery manifest handler commented out.
  const handleManifest = async () => {
    try {
      setIsManifesting(true);
      await shippingService.manifestOrder(orderId);
      toast.success("Manifested successfully with Delhivery!");
      loadOrder();
    } catch (err) {
      toast.error("Manifestation failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsManifesting(false);
    }
  };
  */

  const handleApproveReturn = async () => {
    try {
      setIsApprovingReturn(true);
      await orderService.approveReturn(orderId);
      // [DELHIVERY PAUSED] Previously: "Return approved! Reverse pickup scheduled with Delhivery."
      toast.success("Return approved! Coordinate pickup manually with your courier.");
      loadOrder();
    } catch (err) {
      toast.error("Approval failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsApprovingReturn(false);
    }
  };

  const handleProcessExchange = async () => {
    try {
      setIsProcessingExchange(true);
      const res = await orderService.processExchange(orderId);
      toast.success(`Exchange processed! New replacement order: ${res.data.replacementOrder?.orderNumber}`);
      loadOrder();
    } catch (err) {
      toast.error("Exchange processing failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsProcessingExchange(false);
    }
  };

  /** Build a WhatsApp deep-link with pre-filled tracking message for the customer */
  const buildWhatsAppLink = () => {
    if (!order) return "#";
    const phone = order.shippingAddress?.phone?.replace(/\D/g, "") || "";
    const intlPhone = phone.startsWith("91") ? phone : `91${phone}`;
    const lines = [
      `Hi ${order.user?.name?.split(" ")[0] || "there"}! 👋`,
      ``,
      `Your *LyZov* order *#${order.orderNumber}* has been ${order.orderStatus === "shipped" ? "shipped! 🚚" : "updated."}`,
      order.trackingNumber
        ? `Tracking / AWB: *${order.trackingNumber}*`
        : `Your tracking ID will be shared within 2 business days.`,
      `Estimated delivery: 7–10 business days from order date.`,
      ``,
      `Track your order anytime: ${window.location.origin}/track`,
      ``,
      `Thank you for shopping with LyZov! 🛍️`,
    ];
    return `https://wa.me/${intlPhone}?text=${encodeURIComponent(lines.join("\n"))}`;
  };

  if (isLoading) return <div className="py-12 text-center text-sm text-stone">Loading order details...</div>;
  if (!order) return null;

  const isDelivered = order.orderStatus === "delivered";

  return (
    <>
      {/* ── Delivered confirmation modal (uses app's Modal component) ── */}
      <Modal
        isOpen={showDeliveredModal}
        onClose={() => !isUpdatingStatus && setShowDeliveredModal(false)}
        title="Mark as Delivered?"
        size="sm"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-900 dark:text-amber-200">
              This action <strong>cannot be undone.</strong> Once delivered, this order cannot be reverted to shipped, processing, or pending.
            </p>
          </div>

          <div className="rounded-lg border border-hairline bg-[var(--bg-subtle)] px-4 py-3 dark:border-hairline-dark">
            <p className="text-sm font-semibold">Order {order.orderNumber}</p>
            <p className="text-xs text-stone mt-0.5">Customer: {order.user?.name || "—"}</p>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button
              variant="secondary"
              onClick={() => setShowDeliveredModal(false)}
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button
              id="admin-order-detail-confirm-delivered-btn"
              variant="primary"
              isLoading={isUpdatingStatus}
              onClick={handleConfirmDelivered}
            >
              Yes, Mark Delivered
            </Button>
          </div>
        </div>
      </Modal>

      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate("/seller/orders")}
              className="mb-3 inline-flex items-center gap-2 text-sm text-stone hover:text-[var(--accent)]"
            >
              <ArrowLeft size={15} /> Back to Orders
            </button>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-3xl tracking-tightest">{order.orderNumber}</h1>
              {order.returnStatus && order.returnStatus !== "Not Requested" && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  Return: {order.returnStatus}
                </span>
              )}
              {isDelivered && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Lock size={11} /> Delivered &amp; Locked
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-stone">Placed on {formatDateTime(order.createdAt)}</p>
          </div>

          {/* Status selector + WhatsApp button */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={order.orderStatus}
              disabled={isUpdatingStatus}
              onChange={(e) => handleStatusSelectChange(e.target.value)}
              className="rounded-lg border border-ink/12 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-cream/15 dark:bg-[var(--bg-raised)] dark:text-[var(--ink)]"
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

            {/* 1-click WhatsApp update button — free, opens WhatsApp with pre-filled message */}
            <a
              id="admin-order-detail-whatsapp-btn"
              href={buildWhatsAppLink()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85"
              style={{ backgroundColor: "#25d366" }}
              title="Opens WhatsApp with pre-filled tracking message for the customer"
            >
              <MessageCircle size={15} /> Send WhatsApp Update
            </a>
          </div>
        </div>

        {/* Return / Exchange Alert Banner */}
        {order.returnStatus && order.returnStatus !== "Not Requested" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" size={20} />
                <div>
                  <h3 className="text-sm font-semibold">
                    Customer requested a {order.isExchange ? "Product Exchange" : "Return & Refund"} ({order.returnStatus})
                  </h3>
                  <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">
                    Reason: <strong>{order.returnReason || "No reason provided"}</strong>
                  </p>
                  {order.exchangeDetails && (
                    <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-300">
                      Exchange Details:{" "}
                      <strong>
                        {typeof order.exchangeDetails === "object"
                          ? JSON.stringify(order.exchangeDetails)
                          : order.exchangeDetails}
                      </strong>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {order.returnStatus === "Requested" && (
                  <button
                    type="button"
                    disabled={isApprovingReturn}
                    onClick={handleApproveReturn}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle size={14} />
                    {isApprovingReturn ? "Approving..." : "Approve Return & Coordinate Pickup"}
                  </button>
                )}
                {order.isExchange &&
                  ["Approved", "Picked Up", "Returned"].includes(order.returnStatus) && (
                    <button
                      type="button"
                      disabled={isProcessingExchange}
                      onClick={handleProcessExchange}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isProcessingExchange ? "animate-spin" : ""} />
                      {isProcessingExchange ? "Creating Replacement..." : "Process Exchange (Create Replacement Order)"}
                    </button>
                  )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Products section */}
          <section className="card-surface p-5">
            <h2 className="mb-4 text-lg font-semibold">Products</h2>
            <div className="flex flex-col divide-y divide-hairline dark:divide-hairline-dark">
              {order.items.map((item, index) => {
                const product = item.product && typeof item.product === "object" ? item.product : null;
                const image = item.image || product?.images?.[0]?.url;
                return (
                  <div
                    key={`${item.product?._id || item.product || item.name}-${index}`}
                    className="flex gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <img
                      src={image || "https://via.placeholder.com/96?text=Product"}
                      alt={item.name}
                      className="h-24 w-20 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      {product?.slug ? (
                        <Link
                          to={`/product/${product.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold hover:text-[var(--accent)]"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <p className="font-semibold">{item.name}</p>
                      )}
                      <p className="mt-1 text-sm text-stone">
                        Qty {item.quantity}
                        {item.color ? ` · ${item.color}` : ""}
                        {item.size ? ` · ${item.size}` : ""}
                      </p>
                      <p className="mt-2 font-semibold tabular-nums">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      {product?.slug && (
                        <Link
                          to={`/product/${product.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                        >
                          View product <ExternalLink size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex flex-col gap-6">
            {/*
              ── Shipment & Courier Card ──
              [DELHIVERY PAUSED] Previously showed Delhivery manifest button.
              Now shows generic manual courier tracking assignment.
              Admin should update order status to "Shipped" after dispatching manually.
            */}
            <section className="card-surface p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Truck size={18} className="text-[var(--accent)]" /> Shipment &amp; Courier
                </h2>
                {order.trackingNumber && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    AWB Assigned
                  </span>
                )}
              </div>

              {order.trackingNumber && !isEditingTracking ? (
                <div className="flex flex-col gap-3">
                  <div className="p-3.5 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-bg,rgba(197,160,89,0.08))] flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone block">Tracking / AWB Number</span>
                      <p className="font-mono font-extrabold text-base text-[var(--accent)] tracking-wide mt-0.5">
                        {order.trackingNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCopyTracking}
                        title="Copy AWB Number"
                        className="p-2 rounded-lg border border-border bg-white text-xs font-semibold text-[var(--ink)] hover:bg-[var(--bg-subtle)] dark:bg-stone-900 transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingTracking(true)}
                        title="Edit AWB Number"
                        className="p-2 rounded-lg border border-border bg-white text-xs font-semibold text-[var(--ink)] hover:bg-[var(--bg-subtle)] dark:bg-stone-900 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Link
                      to={`/track`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline"
                    >
                      <ExternalLink size={13} /> View Live Tracking Page (/track)
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsEditingTracking(true)}
                      className="text-xs text-stone hover:text-[var(--ink)] underline"
                    >
                      Change AWB
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSendShippingEmail}
                      disabled={isSendingShippingEmail || shippingEmailSent}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      {isSendingShippingEmail ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Sending Shipping Mail...
                        </>
                      ) : shippingEmailSent ? (
                        <>
                          <Check size={14} />
                          Shipping Mail Sent
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          Send Shipping Mail to Customer
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-stone">
                    ✓ Automated tracking email with this AWB was sent to <strong>{order.shippingAddress?.email || order.user?.email}</strong>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSaveTracking} className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone mb-1.5">
                      Enter Courier Tracking / AWB ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={trackingInput}
                        onChange={(e) => setTrackingInput(e.target.value)}
                        placeholder="e.g. 142371908234 or BLUEDART-88219"
                        className="w-full rounded-xl border border-border bg-[var(--bg-subtle)] px-3.5 py-2.5 font-mono text-sm font-semibold text-[var(--ink)] placeholder:text-stone/60 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        disabled={isSavingTracking}
                      />
                    </div>
                    <span className="text-[11px] text-stone mt-1 block">
                      Compatible with any courier (Delhivery, BlueDart, DTDC, India Post, etc.)
                    </span>
                  </div>

                  {/* Mark as shipped toggle if not yet shipped/delivered */}
                  {!["shipped", "delivered"].includes(order.orderStatus) && (
                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border bg-[var(--bg-subtle)] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={markAsShipped}
                        onChange={(e) => setMarkAsShipped(e.target.checked)}
                        className="mt-0.5 rounded accent-[var(--accent)]"
                        disabled={isSavingTracking}
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-[var(--ink)] block">
                          Also update status to "Shipped"
                        </span>
                        <span className="text-stone">
                          Transitions the order progress stepper and notifies customer of dispatch.
                        </span>
                      </div>
                    </label>
                  )}

                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300">
                    ✉️ <strong>Automatic Email:</strong> Saving will immediately send an order tracking email with this AWB number to <strong>{order.shippingAddress?.email || order.user?.email || "the customer"}</strong>.
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSavingTracking || !trackingInput.trim()}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-white hover:opacity-95 disabled:opacity-50 transition-opacity shadow-sm"
                    >
                      {isSavingTracking ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Assigning &amp; Sending Email...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          {order.trackingNumber ? "Update AWB & Dispatch Email" : "Save AWB & Dispatch Email"}
                        </>
                      )}
                    </button>
                    {isEditingTracking && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingTracking(false);
                          setTrackingInput(order.trackingNumber || "");
                        }}
                        disabled={isSavingTracking}
                        className="rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-stone hover:text-[var(--ink)]"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </section>

            {/* Customer */}
            <section className="card-surface p-5">
              <h2 className="mb-3 text-lg font-semibold">Customer</h2>
              <p className="font-medium">{order.user?.name}</p>
              <p className="text-sm text-stone">{order.user?.email}</p>
              <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-stone">Shipping Address</h3>
              <p className="mt-2 text-sm">
                {order.shippingAddress.fullName}, {order.shippingAddress.phone}
              </p>
              <p className="text-sm text-stone">
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""},{" "}
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.postalCode}, {order.shippingAddress.country}
              </p>
            </section>

            {/* Payment Summary */}
            <section className="card-surface p-5">
              <h2 className="mb-3 text-lg font-semibold">Payment Summary</h2>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between text-stone">
                  <span>Payment</span>
                  <span className="capitalize">
                    {order.paymentMethod} · {order.paymentResult?.currency?.toUpperCase() || "INR"}
                  </span>
                </div>
                <div className="flex justify-between text-stone">
                  <span>Items</span>
                  <span>{formatCurrency(order.itemsPrice)}</span>
                </div>
                <div className="flex justify-between text-stone">
                  <span>Tax</span>
                  <span>{formatCurrency(order.taxPrice)}</span>
                </div>
                <div className="flex justify-between text-stone">
                  <span>Shipping</span>
                  <span>{order.shippingPrice ? formatCurrency(order.shippingPrice) : "Free"}</span>
                </div>
                <div className="flex justify-between border-t border-hairline pt-2 font-semibold dark:border-hairline-dark">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalPrice)}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminOrderDetailsPage;
