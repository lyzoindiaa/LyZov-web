import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ShoppingBag, X, Tag, ArrowRight, ShieldCheck, Truck } from "lucide-react";
import {
  fetchCart,
  updateCartItem,
  removeCartItem,
  applyCoupon,
  removeCoupon,
} from "../features/cart/cartSlice";
import { formatCurrency } from "../utils/formatters";
import QuantityStepper from "../components/ui/QuantityStepper";
import Button from "../components/ui/Button";
import SEO from "../components/common/SEO";

const parseGstRate = (rateStr) => {
  if (!rateStr) return 0;
  if (typeof rateStr === "number") return rateStr > 1 ? rateStr / 100 : rateStr;
  const match = String(rateStr).match(/\d+(\.\d+)?/);
  if (!match) return 0;
  const num = parseFloat(match[0]);
  return num > 1 ? num / 100 : num;
};

const FREE_SHIPPING_THRESHOLD = 999;
const FLAT_SHIPPING_RATE = 49;

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, coupon, status } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [couponInput, setCouponInput] = useState("");

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchCart());
  }, [dispatch, isAuthenticated]);

  const discountAmount =
    coupon?.code && coupon.discountType === "percentage"
      ? (subtotal * coupon.discountValue) / 100
      : coupon?.code
      ? coupon.discountValue
      : 0;

  const discountedSubtotal = Math.max(subtotal - discountAmount, 0);
  const discountFactor = subtotal > 0 ? discountedSubtotal / subtotal : 1;
  const taxPrice = Math.round(
    items.reduce((sum, item) => {
      const rate = parseGstRate(item.gstRate || item.product?.gstRate);
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      return sum + itemTotal * discountFactor * rate;
    }, 0) * 100
  ) / 100;
  const shippingPrice =
    discountedSubtotal >= FREE_SHIPPING_THRESHOLD || discountedSubtotal === 0 ? 0 : FLAT_SHIPPING_RATE;
  const total = discountedSubtotal + taxPrice + shippingPrice;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    dispatch(applyCoupon(couponInput.trim()));
    setCouponInput("");
  };

  if (!isAuthenticated) {
    return (
      <div className="container-page py-20">
        <SEO title="Shopping Cart | LyZov" noIndex={true} />
        <div className="empty-state card-surface max-w-md mx-auto">
          <div
            style={{
              width: "4rem",
              height: "4rem",
              borderRadius: "9999px",
              backgroundColor: "var(--accent-bg)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingBag size={28} />
          </div>
          <h2 className="empty-state-title">Sign in to view your cart</h2>
          <p className="empty-state-desc">Access your saved items, cart, and exclusive member discounts.</p>
          <Link to="/login" className="btn-primary mt-2">
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  if (status !== "loading" && items.length === 0) {
    return (
      <div className="container-page py-20">
        <SEO title="Shopping Cart | LyZov" noIndex={true} />
        <div className="empty-state card-surface max-w-md mx-auto">
          <div
            style={{
              width: "4.5rem",
              height: "4.5rem",
              borderRadius: "9999px",
              backgroundColor: "var(--bg-raised)",
              color: "var(--ink-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingBag size={32} />
          </div>
          <h2 className="empty-state-title">Your shopping cart is empty</h2>
          <p className="empty-state-desc">Explore our latest arrivals and premium curated collections.</p>
          <Link to="/shop" className="btn-accent mt-3">
            Start Shopping Now <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8 lg:py-12">
      <SEO title="Shopping Cart | LyZov" noIndex={true} />
      <div className="mb-8">
        <span className="eyebrow">Shopping Cart</span>
        <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.025em", marginTop: "0.25rem" }}>
          Your Cart ({items.length} {items.length === 1 ? "item" : "items"})
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        {/* Items List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {items.map((item) => (
            <div
              key={item._id}
              className="card-surface"
              style={{
                display: "flex",
                gap: "1.25rem",
                padding: "1.25rem",
                position: "relative",
              }}
            >
              <img
                src={item.image || "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=300"}
                alt={item.name}
                style={{
                  height: "7.5rem",
                  width: "6rem",
                  borderRadius: "0.75rem",
                  objectFit: "cover",
                  backgroundColor: "var(--img-tile)",
                  border: "1px solid var(--border)",
                  flexShrink: 0,
                }}
              />
              <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)" }}>{item.name}</h3>
                    {(item.color || item.size) && (
                      <p style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                        {item.color && `${item.color} `}
                        {item.size && `· Size: ${item.size}`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => dispatch(removeCartItem(item._id))}
                    className="btn-icon"
                    style={{ width: "2rem", height: "2rem", color: "var(--ink-subtle)" }}
                    aria-label="Remove item"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem" }}>
                  <QuantityStepper
                    quantity={item.quantity}
                    onIncrease={() =>
                      dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity + 1 }))
                    }
                    onDecrease={() =>
                      dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity - 1 }))
                    }
                  />
                  <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--ink)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Guarantee info */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "1rem",
              borderRadius: "0.75rem",
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              fontSize: "0.75rem",
              color: "var(--ink-muted)",
            }}
          >
            <ShieldCheck size={18} style={{ color: "var(--green)", flexShrink: 0 }} />
            <span>All transactions are 100% encrypted & secure. 7-day hassle-free replacement.</span>
          </div>
        </div>

        {/* Order Summary Box */}
        <div>
          <div className="cart-summary sticky top-24">
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--ink)", marginBottom: "1rem" }}>
              Order Summary
            </h3>

            {/* Coupon input */}
            <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Tag size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--ink-subtle)" }} />
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Coupon code"
                  className="input-field"
                  style={{ paddingLeft: "2.375rem", paddingRight: "0.75rem", paddingTop: "0.55rem", paddingBottom: "0.55rem", fontSize: "0.8125rem" }}
                />
              </div>
              <button
                type="submit"
                className="btn-secondary"
                style={{ padding: "0.55rem 1rem", fontSize: "0.75rem", fontWeight: 700 }}
              >
                Apply
              </button>
            </form>

            {coupon?.code && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "var(--accent-bg)",
                  border: "1px solid var(--accent)",
                  borderRadius: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  marginBottom: "1rem",
                  fontSize: "0.75rem",
                  color: "var(--accent)",
                  fontWeight: 600,
                }}
              >
                <span>Coupon "{coupon.code}" applied!</span>
                <button onClick={() => dispatch(removeCoupon())} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)" }}>
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Cost Breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
              <div className="price-row">
                <span>Subtotal</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="price-row discount">
                  <span>Discount</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="price-row">
                <span>Estimated GST</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(taxPrice)}</span>
              </div>

              <div className="price-row">
                <span>Shipping</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {shippingPrice === 0 ? <span style={{ color: "var(--green)", fontWeight: 700 }}>Free</span> : formatCurrency(shippingPrice)}
                </span>
              </div>

              <div className="price-row total">
                <span>Total Amount</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="btn-accent w-full mt-6"
              style={{ padding: "0.85rem 1.5rem", fontSize: "0.9375rem" }}
            >
              Proceed to Checkout <ArrowRight size={15} />
            </button>

            <Link
              to="/shop"
              style={{
                display: "block",
                textAlign: "center",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--ink-muted)",
                textDecoration: "none",
                marginTop: "1rem",
              }}
              onMouseEnter={(e) => (e.target.style.color = "var(--ink)")}
              onMouseLeave={(e) => (e.target.style.color = "var(--ink-muted)")}
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
