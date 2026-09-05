import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { MapPin, CreditCard, ShieldCheck, CheckCircle2, Plus } from "lucide-react";
import { orderService, addressService } from "../services/cartService";
import { resetCartLocal } from "../features/cart/cartSlice";
import { formatCurrency } from "../utils/formatters";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import StripePaymentForm from "../components/checkout/StripePaymentForm";

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 999;
const FLAT_SHIPPING_RATE = 49;

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, coupon } = useSelector((state) => state.cart);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [step, setStep] = useState("address");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
      return;
    }
    addressService.getAddresses().then((res) => {
      setSavedAddresses(res.data || []);
      const def = res.data?.find((a) => a.isDefault) || res.data?.[0];
      if (def) setSelectedAddressId(def._id);
      else setShowNewAddressForm(true);
    });
  }, [items.length, navigate]);

  const discountAmount =
    coupon?.code && coupon.discountType === "percentage"
      ? (subtotal * coupon.discountValue) / 100
      : coupon?.code
        ? coupon.discountValue
        : 0;
  const discountedSubtotal = Math.max(subtotal - discountAmount, 0);
  const taxPrice = Math.round(discountedSubtotal * TAX_RATE * 100) / 100;
  const shippingPrice = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
  const total = discountedSubtotal + taxPrice + shippingPrice;

  const getShippingAddress = () => {
    if (showNewAddressForm) return null;
    return savedAddresses.find((a) => a._id === selectedAddressId);
  };

  const proceedToPayment = async (formData) => {
    let shippingAddress = getShippingAddress();

    if (showNewAddressForm) {
      try {
        const res = await addressService.createAddress(formData);
        shippingAddress = res.data;
        setSavedAddresses((prev) => [...prev, res.data]);
        setSelectedAddressId(res.data._id);
        setShowNewAddressForm(false);
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not save address");
        return;
      }
    }

    if (!shippingAddress) {
      toast.error("Please select or add a shipping address");
      return;
    }

    try {
      const res = await orderService.createPaymentIntent();
      setClientSecret(res.data.clientSecret);
      setStep("payment");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not initialize payment");
    }
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    setIsPlacingOrder(true);
    try {
      const address = getShippingAddress() || savedAddresses.find((a) => a._id === selectedAddressId);
      const res = await orderService.createOrder({
        shippingAddress: address,
        paymentMethod: "stripe",
        paymentIntentId,
        items,
        subtotal,
        discountAmount,
        taxPrice,
        shippingPrice,
        total,
      });
      dispatch(resetCartLocal());
      toast.success("Order placed successfully!");
      navigate(`/dashboard/orders/${res.data._id || res.data.order?._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="container-page py-8 lg:py-12">
      {/* Header & Step progress */}
      <div className="mb-8">
        <span className="eyebrow">Secure Checkout</span>
        <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.025em", marginTop: "0.25rem" }}>
          Complete Your Order
        </h1>

        {/* Steps Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "9999px",
                backgroundColor: step === "address" ? "var(--brand)" : "var(--green)",
                color: "var(--bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.8125rem",
              }}
            >
              {step === "payment" ? <CheckCircle2 size={16} /> : "1"}
            </div>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ink)" }}>Shipping Address</span>
          </div>

          <div style={{ width: "3rem", height: "2px", backgroundColor: step === "payment" ? "var(--green)" : "var(--border)" }} />

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "9999px",
                backgroundColor: step === "payment" ? "var(--brand)" : "var(--bg-raised)",
                color: step === "payment" ? "var(--bg)" : "var(--ink-muted)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.8125rem",
              }}
            >
              2
            </div>
            <span style={{ fontSize: "0.8125rem", fontWeight: step === "payment" ? 700 : 500, color: step === "payment" ? "var(--ink)" : "var(--ink-muted)" }}>
              Payment
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        {/* Left Step Form */}
        <div>
          {step === "address" ? (
            <div className="card-surface p-6 sm:p-8">
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--ink)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MapPin size={18} style={{ color: "var(--accent)" }} /> Select Delivery Address
              </h2>

              {savedAddresses.length > 0 && !showNewAddressForm && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr._id;
                    return (
                      <label
                        key={addr._id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.75rem",
                          padding: "1rem",
                          borderRadius: "0.75rem",
                          border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                          backgroundColor: isSelected ? "var(--accent-bg)" : "var(--surface)",
                          cursor: "pointer",
                          transition: "all 0.18s",
                        }}
                      >
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => setSelectedAddressId(addr._id)}
                          style={{ marginTop: "0.25rem", accentColor: "var(--accent)" }}
                        />
                        <div style={{ fontSize: "0.8125rem" }}>
                          <p style={{ fontWeight: 700, color: "var(--ink)" }}>{addr.fullName}</p>
                          <p style={{ color: "var(--ink-muted)", marginTop: "0.2rem" }}>
                            {addr.addressLine1}, {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
                          </p>
                          <p style={{ color: "var(--ink-subtle)", marginTop: "0.2rem", fontSize: "0.75rem" }}>📞 {addr.phone}</p>
                        </div>
                      </label>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      color: "var(--accent)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0.5rem 0",
                    }}
                  >
                    <Plus size={15} /> Add a new address
                  </button>
                </div>
              )}

              {showNewAddressForm && (
                <form onSubmit={handleSubmit(proceedToPayment)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Full Name"
                    {...register("fullName", { required: "Full name is required" })}
                    error={errors.fullName?.message}
                  />
                  <Input
                    label="Phone"
                    {...register("phone", { required: "Phone is required" })}
                    error={errors.phone?.message}
                  />
                  <Input
                    label="Address Line 1"
                    className="sm:col-span-2"
                    {...register("addressLine1", { required: "Address is required" })}
                    error={errors.addressLine1?.message}
                  />
                  <Input label="Address Line 2 (optional)" {...register("addressLine2")} />
                  <Input
                    label="City"
                    {...register("city", { required: "City is required" })}
                    error={errors.city?.message}
                  />
                  <Input
                    label="State"
                    {...register("state", { required: "State is required" })}
                    error={errors.state?.message}
                  />
                  <Input
                    label="Postal Code"
                    {...register("postalCode", { required: "Postal code is required" })}
                    error={errors.postalCode?.message}
                  />
                  <Input
                    label="Country"
                    {...register("country", { required: "Country is required" })}
                    error={errors.country?.message}
                  />
                  <div className="sm:col-span-2 flex gap-3 pt-2">
                    {savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowNewAddressForm(false)}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="btn-accent flex-1">
                      Continue to Payment
                    </button>
                  </div>
                </form>
              )}

              {!showNewAddressForm && savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={handleSubmit(proceedToPayment)}
                  className="btn-accent w-full mt-2"
                  style={{ padding: "0.85rem" }}
                >
                  Continue to Payment
                </button>
              )}
            </div>
          ) : (
            <div className="card-surface p-6 sm:p-8">
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--ink)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CreditCard size={18} style={{ color: "var(--accent)" }} /> Payment Details
              </h2>
              {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentForm onSuccess={handlePaymentSuccess} isPlacingOrder={isPlacingOrder} />
                </Elements>
              )}
              <button
                type="button"
                onClick={() => setStep("address")}
                style={{
                  marginTop: "1.25rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--ink-muted)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ← Back to shipping address
              </button>
            </div>
          )}
        </div>

        {/* Right Summary */}
        <div>
          <div className="cart-summary sticky top-24">
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--ink)", marginBottom: "1rem" }}>
              Order Review
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "1rem" }}>
              {items.map((item) => (
                <div key={item._id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}>
                  <span style={{ color: "var(--ink-muted)", maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.name} × {item.quantity}
                  </span>
                  <span style={{ fontWeight: 700, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
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
                <span>Estimated Tax</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(taxPrice)}</span>
              </div>
              <div className="price-row">
                <span>Shipping</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {shippingPrice === 0 ? <span style={{ color: "var(--green)", fontWeight: 700 }}>Free</span> : formatCurrency(shippingPrice)}
                </span>
              </div>
              <div className="price-row total">
                <span>Total</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(total)}</span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "1.25rem",
                fontSize: "0.6875rem",
                color: "var(--ink-subtle)",
              }}
            >
              <ShieldCheck size={14} style={{ color: "var(--green)" }} />
              <span>Encrypted 256-bit SSL transaction</span>
            </div>

            <p
              style={{
                marginTop: "0.85rem",
                fontSize: "0.6875rem",
                color: "var(--ink-subtle)",
                lineHeight: 1.5,
                borderTop: "1px solid var(--border)",
                paddingTop: "0.85rem",
              }}
            >
              By completing your order, you agree to LyZov's{" "}
              <Link to="/terms-and-conditions" target="_blank" className="underline hover:text-accent" style={{ color: "var(--ink-muted)" }}>
                Terms & Conditions
              </Link>
              ,{" "}
              <Link to="/privacy-policy" target="_blank" className="underline hover:text-accent" style={{ color: "var(--ink-muted)" }}>
                Privacy Policy
              </Link>
              , and{" "}
              <Link to="/refund-cancellation-policy" target="_blank" className="underline hover:text-accent" style={{ color: "var(--ink-muted)" }}>
                Refund & Cancellation Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
