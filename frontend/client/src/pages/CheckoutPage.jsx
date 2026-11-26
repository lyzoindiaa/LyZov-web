import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Banknote,
  QrCode,
  Truck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { orderService, addressService, paymentService } from "../services/cartService";
import { resetCartLocal } from "../features/cart/cartSlice";
import { formatCurrency } from "../utils/formatters";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { checkPincode } from "../services/shippingService";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const existingScript = document.getElementById("razorpay-checkout-script");
    if (existingScript) {
      existingScript.onload = () => resolve(true);
      existingScript.onerror = () => resolve(false);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, coupon } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const isAdminOrSeller = user?.role === "admin" || user?.role === "seller";
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cod"); // "cod" | "razorpay"
  const [step, setStep] = useState("address");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [pincodeCheck, setPincodeCheck] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState(null); // { loading, valid, message }
  const prevStepRef = useRef(step);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    if (prevStepRef.current !== step) {
      prevStepRef.current = step;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  useEffect(() => {
    // Preload Razorpay checkout script
    loadRazorpayScript();

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
  const discountFactor = subtotal > 0 ? discountedSubtotal / subtotal : 1;
  const taxPrice = Math.round(
    items.reduce((sum, item) => {
      const rate = parseGstRate(item.gstRate || item.product?.gstRate);
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      return sum + itemTotal * discountFactor * rate;
    }, 0) * 100
  ) / 100;
  const shippingPrice = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
  const total = discountedSubtotal + taxPrice + shippingPrice;

  const getShippingAddress = () => {
    if (showNewAddressForm) return null;
    return savedAddresses.find((a) => a._id === selectedAddressId);
  };

  const proceedToPayment = async (formData) => {
    if (isAdminOrSeller) {
      toast.error(
        `${user?.role === "admin" ? "Admin" : "Seller"} accounts cannot place orders. Please use a customer account.`
      );
      return;
    }

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
  };

  const handleSelectPaymentMethod = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handlePlaceCodOrder = async () => {
    if (isAdminOrSeller) {
      toast.error(
        `${user?.role === "admin" ? "Admin" : "Seller"} accounts cannot place orders. Please use a customer account.`
      );
      return;
    }

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
      });

      dispatch(resetCartLocal());
      toast.success("Order placed successfully with Cash on Delivery!");
      const orderId = res.data?._id || res.data?.order?._id || res.data?.data?._id || res.data?.id;
      navigate(`/dashboard/orders/${orderId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not place COD order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePlaceRazorpayOrder = async () => {
    if (isAdminOrSeller) {
      toast.error(
        `${user?.role === "admin" ? "Admin" : "Seller"} accounts cannot place orders. Please use a customer account.`
      );
      return;
    }

    const address = getShippingAddress() || savedAddresses.find((a) => a._id === selectedAddressId);
    if (!address) {
      toast.error("Please select a valid delivery address");
      setStep("address");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        toast.error("Failed to load Razorpay payment gateway. Please check your connection or try COD.");
        setIsPlacingOrder(false);
        return;
      }

      const res = await paymentService.createRazorpayOrder({
        shippingAddress: address,
      });

      const sessionData = res.data || res;

      const options = {
        key: sessionData.keyId,
        amount: sessionData.amount,
        currency: sessionData.currency || "INR",
        name: "LyZov Gentlemen",
        description: `Order #${sessionData.razorpayOrderId}`,
        image: "/lyzov-logo-dark.png",
        order_id: sessionData.razorpayOrderId,
        prefill: {
          name: sessionData.prefill?.name || address.fullName || "",
          email: sessionData.prefill?.email || "",
          contact: sessionData.prefill?.contact || address.phone || "",
        },
        theme: {
          color: "#0f172a",
        },
        method: {
          card: false,
          upi: true,
          netbanking: false,
          wallet: false,
          emi: false,
          paylater: false,
        },
        config: {
          display: {
            hide: [
              { method: "card" },
              { method: "netbanking" },
              { method: "wallet" },
              { method: "emi" },
              { method: "paylater" },
            ],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        modal: {
          ondismiss: () => {
            setIsPlacingOrder(false);
            toast.info("Payment cancelled. You can retry whenever you are ready.");
          },
        },
        handler: async (response) => {
          setIsPlacingOrder(true);
          try {
            const verifyRes = await paymentService.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            dispatch(resetCartLocal());
            toast.success("Payment confirmed! Your order has been placed.");
            const orderId =
              verifyRes.data?.orderId ||
              verifyRes.orderId ||
              verifyRes.data?._id ||
              verifyRes.data?.order?._id;
            navigate(orderId ? `/dashboard/orders/${orderId}` : "/dashboard/orders");
          } catch (err) {
            toast.error(
              err.response?.data?.message ||
                "Payment was received, but order confirmation is taking longer than usual. Please check your orders page."
            );
            navigate("/dashboard/orders");
          } finally {
            setIsPlacingOrder(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setIsPlacingOrder(false);
        toast.error(response.error?.description || "Payment failed. Please try again or switch to COD.");
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not initialize Razorpay payment");
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
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-5">
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="shrink-0"
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
              {step === "payment" ? <CheckCircle2 size={16} className="shrink-0" /> : "1"}
            </div>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap" }}>Shipping Address</span>
          </div>

          <div style={{ width: "2rem", height: "2px", flexShrink: 0, backgroundColor: step === "payment" ? "var(--green)" : "var(--border)" }} />

          <div className="flex items-center gap-2 shrink-0">
            <div
              className="shrink-0"
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
            <span style={{ fontSize: "0.8125rem", fontWeight: step === "payment" ? 700 : 500, color: step === "payment" ? "var(--ink)" : "var(--ink-muted)", whiteSpace: "nowrap" }}>
              Payment Method
            </span>
          </div>
        </div>
      </div>

      {isAdminOrSeller && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1rem 1.25rem",
            borderRadius: "0.75rem",
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
          }}
        >
          <AlertCircle size={20} style={{ color: "var(--error)", flexShrink: 0, marginTop: "0.15rem" }} />
          <div>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--error)", margin: 0 }}>
              {user?.role === "admin" ? "Admin" : "Seller"} Account Restriction
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", marginTop: "0.25rem", lineHeight: 1.5 }}>
              You are currently logged in with an <strong>{user?.role === "admin" ? "Admin" : "Seller"}</strong> account. Admin and seller accounts cannot place customer orders. Please log in with a customer account to purchase.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        {/* Left Step Form */}
        <div>
          {step === "address" ? (
            <div className="card-surface p-4 sm:p-8">
              {/* PINCODE CHECK — commented out for now, re-enable when Delhivery API is ready
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
              */}


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
                <form onSubmit={handleSubmit(proceedToPayment)} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <button type="submit" disabled={isAdminOrSeller} className="btn-accent flex-1">
                      Continue to Payment
                    </button>
                  </div>
                </form>
              )}

              {!showNewAddressForm && savedAddresses.length > 0 && (
                <button
                  type="button"
                  disabled={isAdminOrSeller}
                  onClick={handleSubmit(proceedToPayment)}
                  className="btn-accent w-full mt-2"
                  style={{ padding: "0.85rem" }}
                >
                  Continue to Payment
                </button>
              )}
            </div>
          ) : (
            <div className="card-surface p-4 sm:p-8">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-5">
                <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--ink)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <QrCode size={18} className="shrink-0" style={{ color: "var(--accent)" }} /> Choose Payment Method
                </h2>
                <button
                  type="button"
                  onClick={() => setStep("address")}
                  className="whitespace-nowrap shrink-0"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
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

                {/* Online Payment (Razorpay) Option */}
                <div
                  onClick={() => handleSelectPaymentMethod("razorpay")}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    border: `1.5px solid ${selectedPaymentMethod === "razorpay" ? "var(--accent)" : "var(--border)"}`,
                    backgroundColor: selectedPaymentMethod === "razorpay" ? "var(--accent-bg)" : "var(--surface)",
                    cursor: "pointer",
                    transition: "all 0.18s",
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedPaymentMethod === "razorpay"}
                    onChange={() => handleSelectPaymentMethod("razorpay")}
                    style={{ marginTop: "0.25rem", accentColor: "var(--accent)" }}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <QrCode size={16} style={{ color: "var(--accent)" }} />
                      <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--ink)" }}>Pay Online (UPI)</span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "0.25rem", lineHeight: 1.4 }}>
                      Instant payment via UPI (GPay, PhonePe, Paytm, or QR).
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
                    disabled={isPlacingOrder || isAdminOrSeller}
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
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                    <ShieldCheck size={20} style={{ color: "var(--green)", marginTop: "0.15rem", flexShrink: 0 }} />
                    <div style={{ fontSize: "0.8125rem", color: "var(--ink)" }}>
                      <p style={{ fontWeight: 700 }}>Razorpay 100% Secure Checkout</p>
                      <p style={{ color: "var(--ink-muted)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                        Your UPI payment is processed with 256-bit bank-grade encryption. LyZov never stores your UPI PIN or banking passwords.
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
                        {["UPI / QR", "Google Pay", "PhonePe", "Paytm"].map((method) => (
                          <span
                            key={method}
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                              backgroundColor: "var(--surface)",
                              border: "1px solid var(--border)",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.375rem",
                              color: "var(--ink)",
                            }}
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handlePlaceRazorpayOrder}
                    isLoading={isPlacingOrder}
                    disabled={isPlacingOrder || isAdminOrSeller}
                    className="w-full mt-5"
                    style={{ padding: "0.85rem", fontSize: "0.875rem", fontWeight: 700 }}
                  >
                    Pay {formatCurrency(total)} Online via UPI
                  </Button>
                  <p style={{ marginTop: "0.625rem", fontSize: "0.7rem", color: "var(--ink-subtle)", textAlign: "center" }}>
                    🔒 Powered by Razorpay &middot; Instant Order Confirmation
                  </p>
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
                  <span style={{ fontWeight: 700, color: "var(--ink)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", flexShrink: 0 }}>
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
