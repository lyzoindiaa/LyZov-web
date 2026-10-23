import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft, ExternalLink, Truck, RefreshCw, AlertCircle,
  CheckCircle, AlertTriangle, MessageCircle, Lock, Copy, Edit2, Send, Check, Eye, Mail, FileText
} from "lucide-react";
import { orderService } from "../../services/cartService";
import { SHIPPING_PLATFORMS, buildTrackingUrl } from "../../utils/shipmentPlatforms";
// import { shippingService } from "../../services/shippingService"; // [DELHIVERY PAUSED]
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";

const ALL_STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];
const FORWARD_STATUSES = ["pending", "processing", "shipped", "delivered"];

const EMAIL_TEMPLATES = [
  { key: "standard", label: "Standard Dispatch" },
  { key: "express", label: "Express Shipping" },
  { key: "delayed", label: "Dispatch Note (Delayed)" },
  { key: "custom", label: "Custom Message" },
];

/**
 * Fulfillment statuses only move forward (e.g. processing cannot go back to pending).
 */
function getAvailableStatuses(currentStatus) {
  if (currentStatus === "delivered") {
    return ["delivered", "cancelled", "refunded"];
  }
  if (["cancelled", "refunded"].includes(currentStatus)) {
    return ALL_STATUS_OPTIONS;
  }
  const idx = FORWARD_STATUSES.indexOf(currentStatus);
  if (idx === -1) return ALL_STATUS_OPTIONS;
  const forward = FORWARD_STATUSES.slice(idx);
  return [...new Set([...forward, "cancelled", "refunded"])];
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

  // Manual shipment state (Platform, AWB, Tracking Link, Email Template, Subject, Body)
  const [selectedPlatform, setSelectedPlatform] = useState("delhivery");
  const [customPlatformLabel, setCustomPlatformLabel] = useState("");
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingUrlInput, setTrackingUrlInput] = useState("");
  const [markAsShipped, setMarkAsShipped] = useState(true);

  const [selectedTemplate, setSelectedTemplate] = useState("standard");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [isSavingShipment, setIsSavingShipment] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Email Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const getEffectivePlatformLabel = (platformId = selectedPlatform, customLabel = customPlatformLabel) => {
    if (platformId === "other") return customLabel.trim() || "Courier";
    const found = SHIPPING_PLATFORMS.find((p) => p.id === platformId);
    return found?.label || "Courier";
  };

  const generateEmailContent = (tplKey, orderObj, platformId, customLabel, awb, url) => {
    if (!orderObj) return { subject: "", body: "" };
    const recipientName = orderObj.shippingAddress?.fullName || orderObj.user?.name || "Valued Customer";
    const platformLabel = getEffectivePlatformLabel(platformId, customLabel);
    const tracking = String(awb || "").trim() || "[AWB ID]";
    const trackLink = String(url || "").trim();

    if (tplKey === "standard") {
      return {
        subject: `Order #${orderObj.orderNumber} shipped — ${platformLabel} tracking ${tracking}`,
        body: `Hello ${recipientName},\n\nYour LyZov order #${orderObj.orderNumber} has been dispatched.\n\nCourier / Platform: ${platformLabel}\nTracking / AWB ID: ${tracking}${trackLink ? `\nTrack package: ${trackLink}` : ""}\n\nYou can also check your order progress anytime from your LyZov account.\n\nThank you for choosing LyZov Gentlemen.`,
      };
    }

    if (tplKey === "express") {
      return {
        subject: `🚀 Priority Dispatch: Order #${orderObj.orderNumber} is on its way!`,
        body: `Dear ${recipientName},\n\nExciting news! Your order #${orderObj.orderNumber} has been shipped via Express Delivery (${platformLabel}).\n\nAWB Tracking ID: ${tracking}${trackLink ? `\nLive Tracking Link: ${trackLink}` : ""}\n\nExpected delivery within 2-4 business days.\n\nBest regards,\nTeam LyZov`,
      };
    }

    if (tplKey === "delayed") {
      return {
        subject: `Order #${orderObj.orderNumber} dispatched — Thank you for your patience`,
        body: `Hello ${recipientName},\n\nThank you so much for your patience! Your order #${orderObj.orderNumber} is now fully packed and handed over to ${platformLabel}.\n\nTracking / AWB Number: ${tracking}${trackLink ? `\nTrack your package: ${trackLink}` : ""}\n\nWe appreciate your understanding and support!\n\nWarm regards,\nLyZov Gentlemen`,
      };
    }

    // Custom
    return {
      subject: `Update regarding your LyZov order #${orderObj.orderNumber}`,
      body: `Hello ${recipientName},\n\n`,
    };
  };

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      const res = await orderService.getOrderById(orderId);
      const o = res.data;
      setOrder(o);

      if (o) {
        const plat = o.shippingPlatform || "delhivery";
        setSelectedPlatform(plat);
        setCustomPlatformLabel(o.shippingPlatformLabel || "");
        setTrackingInput(o.trackingNumber || "");
        const computedUrl = buildTrackingUrl(plat, o.trackingNumber, o.trackingUrl);
        setTrackingUrlInput(computedUrl || "");

        const initialTpl = generateEmailContent("standard", o, plat, o.shippingPlatformLabel, o.trackingNumber, computedUrl);
        setEmailSubject(initialTpl.subject);
        setEmailBody(initialTpl.body);
      }
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

  const handlePlatformChange = (newPlatform) => {
    setSelectedPlatform(newPlatform);
    const computed = buildTrackingUrl(newPlatform, trackingInput);
    setTrackingUrlInput(computed);

    const updated = generateEmailContent(selectedTemplate, order, newPlatform, customPlatformLabel, trackingInput, computed);
    setEmailSubject(updated.subject);
    setEmailBody(updated.body);
  };

  const handleAwbChange = (val) => {
    setTrackingInput(val);
    const computed = buildTrackingUrl(selectedPlatform, val);
    setTrackingUrlInput(computed);

    const updated = generateEmailContent(selectedTemplate, order, selectedPlatform, customPlatformLabel, val, computed);
    setEmailSubject(updated.subject);
    setEmailBody(updated.body);
  };

  const handleTemplateSelect = (tplKey) => {
    setSelectedTemplate(tplKey);
    const updated = generateEmailContent(tplKey, order, selectedPlatform, customPlatformLabel, trackingInput, trackingUrlInput);
    setEmailSubject(updated.subject);
    setEmailBody(updated.body);
  };

  const handlePreviewEmail = async () => {
    if (!trackingInput.trim()) {
      toast.error("Please enter a tracking / AWB number first");
      return;
    }
    try {
      setIsGeneratingPreview(true);
      const res = await orderService.previewShipmentEmail(orderId, {
        shippingPlatform: selectedPlatform,
        shippingPlatformLabel: customPlatformLabel,
        trackingNumber: trackingInput.trim(),
        trackingUrl: trackingUrlInput.trim(),
      });
      setPreviewData(res.data);
      setShowPreviewModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not generate email preview");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleSaveShipment = async ({ sendEmail = true }) => {
    const cleanAwb = trackingInput.trim();
    if (!cleanAwb) {
      toast.error("Please enter a valid tracking or AWB number");
      return;
    }

    if (sendEmail && !emailBody.trim()) {
      toast.error("Email message body cannot be empty when sending email");
      return;
    }

    const payload = {
      shippingPlatform: selectedPlatform,
      shippingPlatformLabel: selectedPlatform === "other" ? customPlatformLabel : undefined,
      trackingNumber: cleanAwb,
      trackingUrl: trackingUrlInput.trim(),
      markAsShipped,
      emailSubject: emailSubject.trim(),
      emailBody: emailBody.trim(),
      sendInAppNotification: true,
    };

    try {
      if (sendEmail) {
        setIsSendingEmail(true);
        const res = await orderService.notifyOrderShipment(orderId, payload);
        if (res.data?.order) {
          setOrder(res.data.order);
        }
        if (res.data?.emailSent) {
          toast.success(`Shipment details saved & email sent to customer! ✓`);
        } else if (res.data?.emailError) {
          toast.warning(`Shipment details saved & status updated! (Email issue: ${res.data.emailError})`);
        } else {
          toast.success(`Shipment details saved & status updated! ✓`);
        }
      } else {
        setIsSavingShipment(true);
        const res = await orderService.saveOrderShipment(orderId, payload);
        if (res.data?.order) {
          setOrder(res.data.order);
        }
        toast.success(`Shipment details saved & in-app notification sent to customer! ✓`);
      }
      setIsEditingTracking(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save shipment details");
    } finally {
      setIsSendingEmail(false);
      setIsSavingShipment(false);
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
              {(order.items || order.orderItems || []).map((item, index) => {
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
                  <Truck size={18} className="text-[var(--accent)]" /> Shipment &amp; Dispatch
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
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone block">
                        Carrier: {order.shippingPlatformLabel || getEffectivePlatformLabel(order.shippingPlatform)}
                      </span>
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
                        title="Edit Shipment & Email Message"
                        className="p-2 rounded-lg border border-border bg-white text-xs font-semibold text-[var(--ink)] hover:bg-[var(--bg-subtle)] dark:bg-stone-900 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>

                  {order.trackingUrl && (
                    <div className="text-xs text-stone truncate">
                      <span className="font-semibold">Tracking Link: </span>
                      <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-[var(--accent)] underline">
                        {order.trackingUrl}
                      </a>
                    </div>
                  )}

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
                      Edit Shipment / Resend Email
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Step 1: Courier Platform Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone mb-1">
                      1. Courier / Shipping Platform
                    </label>
                    <select
                      value={selectedPlatform}
                      onChange={(e) => handlePlatformChange(e.target.value)}
                      className="w-full rounded-xl border border-border bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm font-semibold text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
                    >
                      {SHIPPING_PLATFORMS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPlatform === "other" && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone mb-1">
                        Custom Courier Name
                      </label>
                      <input
                        type="text"
                        value={customPlatformLabel}
                        onChange={(e) => {
                          setCustomPlatformLabel(e.target.value);
                          const updated = generateEmailContent(selectedTemplate, order, "other", e.target.value, trackingInput, trackingUrlInput);
                          setEmailSubject(updated.subject);
                          setEmailBody(updated.body);
                        }}
                        placeholder="e.g. Shadowfax, Professional Couriers"
                        className="w-full rounded-xl border border-border bg-[var(--bg-subtle)] px-3.5 py-2 text-sm font-semibold text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Step 2: AWB Tracking Number */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone mb-1">
                      2. Tracking / AWB Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={trackingInput}
                      onChange={(e) => handleAwbChange(e.target.value)}
                      placeholder="e.g. 142371908234 or BLUEDART-88219"
                      className="w-full rounded-xl border border-border bg-[var(--bg-subtle)] px-3.5 py-2.5 font-mono text-sm font-bold text-[var(--ink)] placeholder:text-stone/50 focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>

                  {/* Step 3: Tracking URL */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone mb-1">
                      3. Live Tracking Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={trackingUrlInput}
                      onChange={(e) => setTrackingUrlInput(e.target.value)}
                      placeholder="https://www.courier.com/track/..."
                      className="w-full rounded-xl border border-border bg-[var(--bg-subtle)] px-3.5 py-2 text-xs font-medium text-[var(--ink)] placeholder:text-stone/50 focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>

                  {/* Mark as shipped toggle */}
                  {!["shipped", "delivered"].includes(order.orderStatus) && (
                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border bg-[var(--bg-subtle)] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={markAsShipped}
                        onChange={(e) => setMarkAsShipped(e.target.checked)}
                        className="mt-0.5 rounded accent-[var(--accent)]"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-[var(--ink)] block">
                          Update order status to "Shipped"
                        </span>
                        <span className="text-stone">
                          Advances status stepper &amp; flags order as dispatched.
                        </span>
                      </div>
                    </label>
                  )}

                  {/* Step 4: Customizable Email Body & Templates */}
                  <div className="pt-2 border-t border-hairline dark:border-hairline-dark">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone flex items-center gap-1.5">
                        <Mail size={14} className="text-[var(--accent)]" /> 4. Customer Email Message &amp; Template
                      </label>
                    </div>

                    {/* Template Pills */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {EMAIL_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.key}
                          type="button"
                          onClick={() => handleTemplateSelect(tpl.key)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                            selectedTemplate === tpl.key
                              ? "bg-[var(--accent)] text-white shadow-sm"
                              : "bg-[var(--bg-subtle)] text-stone border border-border hover:bg-stone-200 dark:hover:bg-stone-800"
                          }`}
                        >
                          {tpl.label}
                        </button>
                      ))}
                    </div>

                    {/* Email Subject Line */}
                    <div className="mb-2">
                      <span className="text-[11px] font-semibold text-stone block mb-1">Subject Line</span>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Subject line..."
                        className="w-full rounded-xl border border-border bg-[var(--bg-subtle)] px-3 py-2 text-xs font-semibold text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>

                    {/* Email Body Textarea */}
                    <div>
                      <span className="text-[11px] font-semibold text-stone block mb-1">Email Body Message</span>
                      <textarea
                        rows={4}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="Type custom instructions, delivery notes, or customer message..."
                        className="w-full rounded-xl border border-border bg-[var(--bg-subtle)] p-3 text-xs leading-relaxed font-sans text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* Actions & Live Email Preview */}
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handlePreviewEmail}
                      disabled={isGeneratingPreview || !trackingInput.trim()}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-[var(--bg-subtle)] px-3 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
                    >
                      <Eye size={14} />
                      {isGeneratingPreview ? "Building Email Preview..." : "Preview rendered Email Modal"}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveShipment({ sendEmail: true })}
                        disabled={isSendingEmail || isSavingShipment || !trackingInput.trim()}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-white hover:opacity-95 disabled:opacity-50 transition-opacity shadow-sm"
                      >
                        {isSendingEmail ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            Sending Mail...
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            Send Email &amp; Assign Tracking
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveShipment({ sendEmail: false })}
                        disabled={isSendingEmail || isSavingShipment || !trackingInput.trim()}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-stone hover:text-[var(--ink)] disabled:opacity-50"
                        title="Save tracking to database & send in-app notification without email"
                      >
                        Save (No Mail)
                      </button>
                    </div>

                    {isEditingTracking && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingTracking(false);
                        }}
                        className="text-xs text-center text-stone hover:underline mt-1"
                      >
                        Cancel Editing
                      </button>
                    )}
                  </div>
                </div>
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
