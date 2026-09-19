import { useState } from "react";
import { Truck, Package, CheckCircle, Clock, XCircle, Search, MapPin, MessageCircle } from "lucide-react";

/* ── Status stepper config ─────────────────────────────────── */
const STEPS = [
  { key: "pending",    label: "Order Placed",   icon: Package },
  { key: "processing", label: "Processing",     icon: Clock },
  { key: "shipped",    label: "Shipped",        icon: Truck },
  { key: "delivered",  label: "Delivered",      icon: CheckCircle },
];

const TERMINAL_STATUSES = ["cancelled", "refunded"];

function getStepIndex(status) {
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function StatusBadge({ status }) {
  const colors = {
    pending:    { bg: "#fff3cd", color: "#856404" },
    processing: { bg: "#cff4fc", color: "#055160" },
    shipped:    { bg: "#d1ecf1", color: "#0c5460" },
    delivered:  { bg: "#d4edda", color: "#155724" },
    cancelled:  { bg: "#f8d7da", color: "#721c24" },
    refunded:   { bg: "#f8d7da", color: "#721c24" },
  };
  const c = colors[status] || { bg: "#e9ecef", color: "#495057" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.3rem 0.875rem",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 700,
        textTransform: "capitalize",
        backgroundColor: c.bg,
        color: c.color,
        letterSpacing: "0.03em",
      }}
    >
      {status}
    </span>
  );
}

function TrackingStepper({ status }) {
  const currentStep = getStepIndex(status);
  const isTerminal = TERMINAL_STATUSES.includes(status);

  if (isTerminal) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "1rem",
          borderRadius: "0.875rem",
          backgroundColor: "#fff5f5",
          border: "1px solid #fecaca",
          color: "#991b1b",
        }}
      >
        <XCircle size={20} />
        <div>
          <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>
            Order {status === "refunded" ? "Refunded" : "Cancelled"}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#b91c1c", marginTop: "0.125rem" }}>
            This order has been {status}. Contact support for any queries.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0.5rem 0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          const Icon = step.icon;

          return (
            <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                <div style={{ flex: 1, height: "2px", backgroundColor: idx === 0 ? "transparent" : (isCompleted || isActive ? "var(--accent)" : "var(--border)"), transition: "background-color 0.4s" }} />
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "9999px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    backgroundColor: isCompleted ? "var(--accent)" : isActive ? "var(--accent-bg)" : "var(--bg-subtle)",
                    border: isActive || isCompleted ? "2px solid var(--accent)" : "2px solid var(--border)",
                    transition: "all 0.4s",
                    boxShadow: isActive ? "0 0 0 4px var(--accent-bg)" : "none",
                  }}
                >
                  <Icon size={15} style={{ color: isCompleted ? "#fff" : isActive ? "var(--accent)" : "var(--ink-subtle)" }} />
                </div>
                <div style={{ flex: 1, height: "2px", backgroundColor: idx === STEPS.length - 1 ? "transparent" : (isCompleted ? "var(--accent)" : "var(--border)"), transition: "background-color 0.4s" }} />
              </div>
              <p style={{ marginTop: "0.5rem", fontSize: "0.6875rem", fontWeight: isActive ? 700 : 500, color: isCompleted ? "var(--ink)" : isActive ? "var(--accent)" : "var(--ink-subtle)", textAlign: "center", lineHeight: 1.3 }}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
const TrackOrderPage = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const SUPPORT_WHATSAPP = "919999999999"; // TODO: replace with real WhatsApp number

  const handleTrack = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!orderNumber.trim() || !phoneOrEmail.trim()) {
      setError("Please fill in both fields.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/orders/track-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber.trim().toUpperCase(),
          phoneOrEmail: phoneOrEmail.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Order not found. Please check your details and try again.");
        return;
      }

      setResult(data.data);
    } catch {
      setError("Something went wrong. Please check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError("");
    setOrderNumber("");
    setPhoneOrEmail("");
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 5rem)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "3rem 1rem 4rem",
        background: "var(--bg)",
      }}
    >
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem", maxWidth: "36rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.375rem 1rem",
            borderRadius: "9999px",
            backgroundColor: "var(--accent-bg)",
            color: "var(--accent)",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: "1.25rem",
          }}
        >
          <Truck size={13} /> Real-time Order Tracking
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display, serif)",
            fontSize: "clamp(1.875rem, 5vw, 2.75rem)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--ink)",
            lineHeight: 1.15,
            marginBottom: "0.75rem",
          }}
        >
          Track Your Order
        </h1>
        <p style={{ color: "var(--ink-muted)", fontSize: "0.9375rem", lineHeight: 1.6 }}>
          Enter your order number and the phone or email used at checkout to get live updates.
        </p>
      </div>

      {/* Search card */}
      {!result && (
        <div
          style={{
            width: "100%",
            maxWidth: "28rem",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "1.5rem",
            padding: "2rem",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <form onSubmit={handleTrack} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
            <div>
              <label htmlFor="track-order-number" style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Order Number
              </label>
              <input
                id="track-order-number"
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. LYZ-2024-00042"
                style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.875rem", border: "1.5px solid var(--border)", backgroundColor: "var(--bg-subtle)", color: "var(--ink)", fontSize: "0.9375rem", outline: "none", fontFamily: "var(--font-mono, monospace)", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div>
              <label htmlFor="track-phone-email" style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Phone or Email
              </label>
              <input
                id="track-phone-email"
                type="text"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                placeholder="Mobile number or email address"
                style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.875rem", border: "1.5px solid var(--border)", backgroundColor: "var(--bg-subtle)", color: "var(--ink)", fontSize: "0.9375rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {error && (
              <p style={{ fontSize: "0.8125rem", color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca", padding: "0.625rem 0.875rem", borderRadius: "0.625rem" }}>
                {error}
              </p>
            )}

            <button
              id="track-order-submit-btn"
              type="submit"
              disabled={isLoading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.875rem", borderRadius: "0.875rem", backgroundColor: "var(--accent)", color: "#fff", fontSize: "0.9375rem", fontWeight: 700, border: "none", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.7 : 1, transition: "all 0.2s" }}
              onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.opacity = "1"; }}
            >
              <Search size={17} />
              {isLoading ? "Searching..." : "Track My Order"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.75rem", color: "var(--ink-subtle)", lineHeight: 1.6 }}>
            Your order number is in your confirmation email.{" "}
            <a
              href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent("Hi! I need help tracking my LyZov order.")}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "underline" }}
            >
              Need help?
            </a>
          </p>
        </div>
      )}

      {/* Result card */}
      {result && (
        <div style={{ width: "100%", maxWidth: "34rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Order header */}
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1.5rem", padding: "1.5rem 1.75rem", boxShadow: "var(--shadow-md)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-subtle)", marginBottom: "0.25rem" }}>Order Number</p>
                <p style={{ fontSize: "1.25rem", fontWeight: 800, fontFamily: "var(--font-mono, monospace)", color: "var(--ink)" }}>{result.orderNumber}</p>
              </div>
              <StatusBadge status={result.orderStatus} />
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "0.625rem" }}>
              Placed on {new Date(result.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Stepper */}
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1.5rem", padding: "1.5rem 1.75rem", boxShadow: "var(--shadow-sm)" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-subtle)", marginBottom: "1.25rem" }}>Delivery Progress</p>
            <TrackingStepper status={result.orderStatus} />
          </div>

          {/* Tracking number */}
          {result.trackingNumber ? (
            <div style={{ backgroundColor: "var(--surface)", border: "1.5px solid var(--accent)", borderRadius: "1.25rem", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.625rem", backgroundColor: "var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Truck size={18} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <p style={{ fontSize: "0.6875rem", color: "var(--ink-muted)", fontWeight: 600 }}>Tracking / AWB Number</p>
                  <p style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 800, fontSize: "1rem", color: "var(--accent)" }}>{result.trackingNumber}</p>
                </div>
              </div>
              <span style={{ fontSize: "0.6875rem", padding: "0.25rem 0.75rem", borderRadius: "9999px", backgroundColor: "var(--accent-bg)", color: "var(--accent)", fontWeight: 700 }}>Active</span>
            </div>
          ) : (
            !TERMINAL_STATUSES.includes(result.orderStatus) && (
              <div style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "1.25rem", padding: "1.125rem 1.5rem", display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
                <Clock size={18} style={{ color: "var(--ink-muted)", marginTop: "0.125rem", flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)" }}>Tracking ID Coming Soon</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "0.25rem", lineHeight: 1.6 }}>
                    Your order is confirmed and being prepared. Your courier tracking number will be shared via email within <strong>2 business days</strong>. Estimated delivery: <strong>7–10 business days</strong>.
                  </p>
                </div>
              </div>
            )
          )}

          {/* Items */}
          {result.items && result.items.length > 0 && (
            <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1.25rem", padding: "1.25rem 1.5rem" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-subtle)", marginBottom: "0.875rem" }}>Items in This Order</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {result.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                    {item.image && <img src={item.image} alt={item.name} style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.5rem", objectFit: "cover", flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--ink-muted)" }}>Qty {item.quantity}{item.size ? ` · ${item.size}` : ""}{item.color ? ` · ${item.color}` : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery city */}
          {result.shippingCity && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "1rem" }}>
              <MapPin size={16} style={{ color: "var(--ink-muted)", flexShrink: 0 }} />
              <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)" }}>
                Delivering to <strong style={{ color: "var(--ink)" }}>{result.shippingCity}, {result.shippingState}</strong>
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <a
              id="track-whatsapp-support-btn"
              href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hi! I need help with my LyZov order #${result.orderNumber}.`)}`}
              target="_blank"
              rel="noreferrer"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.75rem", borderRadius: "0.875rem", backgroundColor: "#25d366", color: "#fff", fontSize: "0.875rem", fontWeight: 700, textDecoration: "none", transition: "opacity 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <MessageCircle size={16} /> WhatsApp Support
            </a>

            <button
              id="track-search-again-btn"
              type="button"
              onClick={handleReset}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.75rem", borderRadius: "0.875rem", backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--ink)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-raised)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-subtle)")}
            >
              <Search size={15} /> Track Another Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackOrderPage;
