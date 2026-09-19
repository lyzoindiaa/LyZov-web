import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  MapPin,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Banknote,
  QrCode,
  Truck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { orderService, addressService } from "../services/cartService";
import { resetCartLocal } from "../features/cart/cartSlice";
import { formatCurrency } from "../utils/formatters";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import StripePaymentForm from "../components/checkout/StripePaymentForm";
import { checkPincode } from "../services/shippingService";

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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cod"); // "cod" | "stripe"
  const [clientSecret, setClientSecret] = useState(null);
  const [isLoadingPaymentIntent, setIsLoadingPaymentIntent] = useState(false);
  const [paymentIntentError, setPaymentIntentError] = useState(null);
  const [step, setStep] = useState("address");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [pincodeCheck, setPincodeCheck] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState(null); // { loading, valid, message }

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

  const fetchPaymentIntent = async () => {
    setIsLoadingPaymentIntent(true);
    setPaymentIntentError(null);
    try {
      const res = await orderService.createPaymentIntent();
      setClientSecret(res.data.clientSecret);
    } catch (err) {
      const msg = err.response?.data?.message || "Could not initialize online payment gateway";
      setPaymentIntentError(msg);
      toast.error(msg);
    } finally {
      setIsLoadingPaymentIntent(false);
    }
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

    setStep("payment");

    if (selectedPaymentMethod === "stripe" && !clientSecret) {
      fetchPaymentIntent();
    }
  };

  const handleSelectPaymentMethod = (method) => {
    setSelectedPaymentMethod(method);
    if (method === "stripe" && !clientSecret && !isLoadingPaymentIntent) {
      fetchPaymentIntent();
    }
  };

  const handlePlaceCodOrder = async () => {
    const address = getShippingAddress() || savedAddresses.find((a) => a._id === selectedAddressId);
    if (!address) {
      toast.error("Please select a valid delivery address");
      setStep("address");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const res = await orderService.createOrder({
        shippingAddress: address,
        paymentMethod: "cod",
        items,
        subtotal,
        discountAmount,
        taxPrice,
        shippingPrice,
        total,
      });

      dispatch(resetCartLocal());
      toast.success("Order placed successfully with Cash on Delivery!");
      navigate(`/dashboard/orders/${res.data._id || res.data.order?._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not place COD order");
    } finally {
      setIsPlacingOrder(false);
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
      toast.success("Payment confirmed & Order placed successfully!");
      navigate(`/dashboard/orders/${res.data._id || res.data.order?._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleVerifyPincode = async () => {
    if (!pincodeCheck || pincodeCheck.length < 6) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }
    setPincodeStatus({ loading: true, valid: null, message: "" });
    try {
      /*
      // Delhivery API pincode check paused
      const res = await checkPincode(pincodeCheck);
      if (res.data?.data?.delivery_codes?.length > 0) {
        const info = res.data.data.delivery_codes[0].postal_code;
        if (info.is_odd === "Y") {
          setPincodeStatus({ loading: false, valid: true, message: "Delivery available!" });
          toast.success("Delivery available to this pincode!");
        } else {
          setPincodeStatus({ loading: false, valid: false, message: "Pincode is unserviceable." });
          toast.error("Pincode is currently unserviceable.");
        }
      } else {
        setPincodeStatus({ loading: false, valid: false, message: "Invalid pincode." });
      }
      */
      const isValid = /^[1-9][0-9]{5}$/.test(pincodeCheck.trim());
      if (isValid) {
        setPincodeStatus({ loading: false, valid: true, message: "Standard delivery available (7-10 business days)" });
        toast.success("Delivery available to this pincode!");
      } else {
        setPincodeStatus({ loading: false, valid: false, message: "Invalid 6-digit postal code." });
        toast.error("Please enter a valid 6-digit postal code.");
      }
    } catch (err) {
      setPincodeStatus({ loading: false, valid: false, message: "Error verifying pincode." });
      toast.error("Could not verify pincode serviceability.");
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
              Payment Method
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        {/* Left Step Form */}
        <div>
          {step === "address" ? (
            <div className="card-surface p-6 sm:p-8">
              <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--ink)" }}>Check Delivery Serviceability</h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Input 
                    placeholder="Enter 6-digit Pincode" 
                    value={pincodeCheck} 
                    onChange={(e) => setPincodeCheck(e.target.value)} 
                    maxLength={6}
                    style={{ flex: 1 }}
                  />
                  <Button onClick={handleVerifyPincode} disabled={pincodeStatus?.loading}>
                    {pincodeStatus?.loading ? <Loader2 className="animate-spin" size={16} /> : "Verify"}
                  </Button>
                </div>
                {pincodeStatus && pincodeStatus.message && (
                  <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", fontWeight: 500, color: pincodeStatus.valid ? "var(--green)" : "var(--error)" }}>
                    {pincodeStatus.message}
                  </p>
                )}
              </div>

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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--ink)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CreditCard size={18} style={{ color: "var(--accent)" }} /> Choose Payment Method
                </h2>
                <button
                  type="button"
                  onClick={() => setStep("address")}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--accent)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Change Address
                </button>
              </div>

              {/* Payment Method Selector Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.85rem", marginBottom: "1.5rem" }}>
                {/* Cash on Delivery Option */}
                <div
                  onClick={() => handleSelectPaymentMethod("cod")}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    border: `1.5px solid ${selectedPaymentMethod === "cod" ? "var(--accent)" : "var(--border)"}`,
                    backgroundColor: selectedPaymentMethod === "cod" ? "var(--accent-bg)" : "var(--surface)",
                    cursor: "pointer",
                    transition: "all 0.18s",
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedPaymentMethod === "cod"}
                    onChange={() => handleSelectPaymentMethod("cod")}
                    style={{ marginTop: "0.25rem", accentColor: "var(--accent)" }}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Banknote size={16} style={{ color: "var(--green)" }} />
                      <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--ink)" }}>Cash on Delivery</span>
                      <span
                        style={{
                          fontSize: "0.625rem",
                          fontWeight: 700,
                          backgroundColor: "var(--green)",
                          color: "#ffffff",
                          padding: "0.1rem 0.4rem",
                          borderRadius: "9999px",
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                        }}
                      >
                        Available
                      </span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "0.25rem", lineHeight: 1.4 }}>
                      Pay with cash or any UPI app upon delivery at your doorstep.
                    </p>
                  </div>
                </div>

                {/* Online Payment (Stripe) Option */}
                <div
                  onClick={() => handleSelectPaymentMethod("stripe")}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    border: `1.5px solid ${selectedPaymentMethod === "stripe" ? "var(--accent)" : "var(--border)"}`,
                    backgroundColor: selectedPaymentMethod === "stripe" ? "var(--accent-bg)" : "var(--surface)",
                    cursor: "pointer",
                    transition: "all 0.18s",
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedPaymentMethod === "stripe"}
                    onChange={() => handleSelectPaymentMethod("stripe")}
                    style={{ marginTop: "0.25rem", accentColor: "var(--accent)" }}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <QrCode size={16} style={{ color: "var(--accent)" }} />
                      <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--ink)" }}>Pay Online (UPI / Card)</span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "0.25rem", lineHeight: 1.4 }}>
                      Instant payment via UPI QR, Cards, NetBanking via Stripe gateway.
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected Method Details */}
              {selectedPaymentMethod === "cod" ? (
                <div
                  style={{
                    padding: "1.25rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "var(--bg-subtle)",
                    border: "1px solid var(--border)",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                    <Truck size={18} style={{ color: "var(--accent)", marginTop: "0.15rem", flexShrink: 0 }} />
                    <div style={{ fontSize: "0.8125rem", color: "var(--ink)" }}>
                      <p style={{ fontWeight: 700 }}>How Cash on Delivery works:</p>
                      <ul style={{ listStyleType: "disc", paddingLeft: "1.25rem", marginTop: "0.4rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
                        <li>No advance payment required.</li>
                        <li>Pay <strong style={{ color: "var(--ink)" }}>{formatCurrency(total)}</strong> to the courier executive when receiving your parcel.</li>
                        <li>Most couriers also accept UPI scan & pay upon arrival.</li>
                      </ul>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handlePlaceCodOrder}
                    isLoading={isPlacingOrder}
                    disabled={isPlacingOrder}
                    className="w-full mt-4"
                    style={{ padding: "0.85rem", fontSize: "0.875rem", fontWeight: 700 }}
                  >
                    Place Order with Cash on Delivery ({formatCurrency(total)})
                  </Button>
                </div>
              ) : (
                <div
                  style={{
                    padding: "1.25rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "var(--bg-subtle)",
                    border: "1px solid var(--border)",
                    marginBottom: "1.5rem",
                  }}
                >
                  {isLoadingPaymentIntent && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 0", gap: "0.75rem" }}>
                      <Loader2 className="animate-spin" size={28} style={{ color: "var(--accent)" }} />
                      <span style={{ fontSize: "0.8125rem", color: "var(--ink-muted)" }}>Initializing secure payment gateway...</span>
                    </div>
                  )}

                  {paymentIntentError && !isLoadingPaymentIntent && (
                    <div style={{ padding: "1rem", borderRadius: "0.5rem", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: "0.8125rem", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                        <AlertCircle size={16} /> Online Gateway Notice
                      </div>
                      <p>{paymentIntentError}</p>
                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod("cod")}
                        className="underline font-bold mt-2 inline-block"
                        style={{ color: "#b91c1c" }}
                      >
                        Switch to Cash on Delivery (COD) instead →
                      </button>
                    </div>
                  )}

                  {clientSecret && !isLoadingPaymentIntent && (
                    <div>
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <StripePaymentForm onSuccess={handlePaymentSuccess} isPlacingOrder={isPlacingOrder} />
                      </Elements>
                      <p style={{ marginTop: "0.75rem", fontSize: "0.7rem", color: "var(--ink-subtle)", textAlign: "center" }}>
                        🔒 256-bit encrypted Stripe checkout. For simulation in test mode, you can use standard Stripe test cards or enable UPI simulation in Stripe Dashboard.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep("address")}
                style={{
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
