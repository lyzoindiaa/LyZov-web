import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft, Phone, MapPin, Check } from "lucide-react";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { fetchCurrentUser } from "../features/auth/authSlice";
import ThemeToggle from "../components/ui/ThemeToggle";
import Logo from "../components/ui/Logo";
import { userService } from "../services/cartService";
import { addressService } from "../services/cartService";

const CompleteProfilePage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const { register, handleSubmit, formState: { errors } } = useForm();

    const [step, setStep] = useState(1); // 1: Phone, 2: Address
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if not authenticated or profile already complete
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login", { replace: true });
            return;
        }
        if (user?.profileComplete) {
            navigate("/dashboard", { replace: true });
        }
    }, [isAuthenticated, user?.profileComplete, navigate]);

    // Validate Indian mobile number
    const validateMobileNumber = (value) => {
        const mobileRegex = /^[6-9]\d{9}$/;
        return mobileRegex.test(value) || "Please enter a valid 10-digit Indian mobile number";
    };

    const onPhoneSubmit = async (data) => {
        setIsLoading(true);
        try {
            await userService.updateProfile({ phone: data.phone });
            toast.success("Phone number saved! Now add your delivery address.");
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update phone number");
        } finally {
            setIsLoading(false);
        }
    };

    const onAddressSubmit = async (data) => {
        setIsLoading(true);
        try {
            // Create address
            await addressService.createAddress({
                fullName: data.fullName || user?.name,
                phone: data.phone,
                addressLine1: data.addressLine1,
                addressLine2: data.addressLine2 || "",
                city: data.city,
                state: data.state,
                postalCode: data.postalCode,
                country: data.country || "India",
                type: data.type || "home",
                isDefault: true,
            });

            toast.success("Profile completed! Redirecting to dashboard...");

            // Refresh user data and redirect
            await dispatch(fetchCurrentUser());
            setTimeout(() => navigate("/dashboard", { replace: true }), 1000);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add address");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div style={{ minHeight: "100dvh", display: "flex", backgroundColor: "var(--bg)", position: "relative", overflowX: "hidden", overflowY: "auto" }}>
            {/* Top Bar */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1.25rem 2rem",
                }}
            >
                <button
                    onClick={() => navigate("/")}
                    className="btn-secondary flex items-center gap-1.5 text-xs font-semibold"
                    style={{ padding: "0.45rem 1rem", borderRadius: "9999px", border: "none", cursor: "pointer", backgroundColor: "var(--surface)", color: "var(--ink)" }}
                >
                    <ArrowLeft size={14} />
                    <span>Back to Store</span>
                </button>
                <ThemeToggle size={16} />
            </div>

            {/* Content */}
            <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "5rem 1rem 2rem" }}>
                <div style={{ width: "100%", maxWidth: "28rem" }}>
                    <div style={{ marginBottom: "2rem" }}>
                        <Logo size="md" variant="elevated" />
                    </div>

                    {/* Header */}
                    <div style={{ marginBottom: "2rem" }}>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.025em" }}>
                            Complete Your Profile
                        </h1>
                        <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
                            We need a few details before you can start shopping
                        </p>
                    </div>

                    {/* Progress Indicator */}
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
                        <div
                            style={{
                                flex: 1,
                                height: "0.375rem",
                                backgroundColor: step >= 1 ? "var(--accent)" : "var(--ink)/20",
                                borderRadius: "9999px",
                                transition: "all 0.3s",
                            }}
                        />
                        <div
                            style={{
                                flex: 1,
                                height: "0.375rem",
                                backgroundColor: step >= 2 ? "var(--accent)" : "var(--ink)/20",
                                borderRadius: "9999px",
                                transition: "all 0.3s",
                            }}
                        />
                    </div>

                    {/* Step 1: Phone Number */}
                    {step === 1 && (
                        <div
                            style={{
                                backgroundColor: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: "1.25rem",
                                padding: "2rem",
                                boxShadow: "var(--shadow-md)",
                            }}
                        >
                            <div style={{ marginBottom: "1.5rem" }}>
                                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.5rem" }}>
                                    <Phone size={18} style={{ display: "inline", marginRight: "0.5rem" }} />
                                    Phone Number
                                </h2>
                                <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)" }}>
                                    Required for order confirmation and delivery notifications
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onPhoneSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "0.75rem" }}>
                                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--ink-muted)" }}>+91</span>
                                        <input
                                            type="tel"
                                            placeholder="98765 43210"
                                            style={{
                                                flex: 1,
                                                border: "none",
                                                outline: "none",
                                                backgroundColor: "transparent",
                                                color: "var(--ink)",
                                                fontSize: "0.875rem",
                                            }}
                                            maxLength="10"
                                            {...register("phone", {
                                                required: "Phone number is required",
                                                validate: validateMobileNumber,
                                            })}
                                        />
                                    </div>
                                    {errors.phone && (
                                        <span style={{ fontSize: "0.75rem", color: "var(--red)", marginTop: "0.5rem", display: "block" }}>
                                            {errors.phone.message}
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    style={{
                                        width: "100%",
                                        padding: "0.9rem",
                                        backgroundColor: isLoading ? "var(--ink)/40" : "var(--accent)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "0.75rem",
                                        fontSize: "0.875rem",
                                        fontWeight: 700,
                                        cursor: isLoading ? "not-allowed" : "pointer",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {isLoading ? "Saving..." : "Continue"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step 2: Address */}
                    {step === 2 && (
                        <div
                            style={{
                                backgroundColor: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: "1.25rem",
                                padding: "2rem",
                                boxShadow: "var(--shadow-md)",
                            }}
                        >
                            <div style={{ marginBottom: "1.5rem" }}>
                                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.5rem" }}>
                                    <MapPin size={18} style={{ display: "inline", marginRight: "0.5rem" }} />
                                    Delivery Address
                                </h2>
                                <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)" }}>
                                    We'll use this for shipping your orders
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onAddressSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                {/* Full Name */}
                                <div>
                                    <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "0.5rem" }}>
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={user?.name}
                                        style={{
                                            width: "100%",
                                            border: "1px solid var(--border)",
                                            borderRadius: "0.5rem",
                                            padding: "0.75rem",
                                            fontSize: "0.875rem",
                                            color: "var(--ink)",
                                            outline: "none",
                                        }}
                                        {...register("fullName", {
                                            minLength: { value: 2, message: "Name must be at least 2 characters" },
                                        })}
                                    />
                                </div>

                                {/* Address Line 1 */}
                                <div>
                                    <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "0.5rem" }}>
                                        Address Line 1 *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="House number, building name"
                                        style={{
                                            width: "100%",
                                            border: "1px solid var(--border)",
                                            borderRadius: "0.5rem",
                                            padding: "0.75rem",
                                            fontSize: "0.875rem",
                                            color: "var(--ink)",
                                            outline: "none",
                                        }}
                                        {...register("addressLine1", {
                                            required: "Address is required",
                                            minLength: { value: 5, message: "Address must be at least 5 characters" },
                                        })}
                                    />
                                    {errors.addressLine1 && (
                                        <span style={{ fontSize: "0.75rem", color: "var(--red)", marginTop: "0.25rem", display: "block" }}>
                                            {errors.addressLine1.message}
                                        </span>
                                    )}
                                </div>

                                {/* Address Line 2 */}
                                <div>
                                    <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "0.5rem" }}>
                                        Address Line 2 (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Apartment, suite, etc."
                                        style={{
                                            width: "100%",
                                            border: "1px solid var(--border)",
                                            borderRadius: "0.5rem",
                                            padding: "0.75rem",
                                            fontSize: "0.875rem",
                                            color: "var(--ink)",
                                            outline: "none",
                                        }}
                                        {...register("addressLine2")}
                                    />
                                </div>

                                {/* City */}
                                <div>
                                    <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "0.5rem" }}>
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Mumbai"
                                        style={{
                                            width: "100%",
                                            border: "1px solid var(--border)",
                                            borderRadius: "0.5rem",
                                            padding: "0.75rem",
                                            fontSize: "0.875rem",
                                            color: "var(--ink)",
                                            outline: "none",
                                        }}
                                        {...register("city", {
                                            required: "City is required",
                                        })}
                                    />
                                    {errors.city && (
                                        <span style={{ fontSize: "0.75rem", color: "var(--red)", marginTop: "0.25rem", display: "block" }}>
                                            {errors.city.message}
                                        </span>
                                    )}
                                </div>

                                {/* State */}
                                <div>
                                    <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "0.5rem" }}>
                                        State *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Maharashtra"
                                        style={{
                                            width: "100%",
                                            border: "1px solid var(--border)",
                                            borderRadius: "0.5rem",
                                            padding: "0.75rem",
                                            fontSize: "0.875rem",
                                            color: "var(--ink)",
                                            outline: "none",
                                        }}
                                        {...register("state", {
                                            required: "State is required",
                                        })}
                                    />
                                    {errors.state && (
                                        <span style={{ fontSize: "0.75rem", color: "var(--red)", marginTop: "0.25rem", display: "block" }}>
                                            {errors.state.message}
                                        </span>
                                    )}
                                </div>

                                {/* Postal Code */}
                                <div>
                                    <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "0.5rem" }}>
                                        Postal Code *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="400001"
                                        style={{
                                            width: "100%",
                                            border: "1px solid var(--border)",
                                            borderRadius: "0.5rem",
                                            padding: "0.75rem",
                                            fontSize: "0.875rem",
                                            color: "var(--ink)",
                                            outline: "none",
                                        }}
                                        {...register("postalCode", {
                                            required: "Postal code is required",
                                            pattern: { value: /^[0-9]{6}$/, message: "Please enter a valid 6-digit postal code" },
                                        })}
                                    />
                                    {errors.postalCode && (
                                        <span style={{ fontSize: "0.75rem", color: "var(--red)", marginTop: "0.25rem", display: "block" }}>
                                            {errors.postalCode.message}
                                        </span>
                                    )}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "0.5rem" }}>
                                        Phone Number *
                                    </label>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "0.75rem" }}>
                                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--ink-muted)" }}>+91</span>
                                        <input
                                            type="tel"
                                            placeholder={user?.phone || "98765 43210"}
                                            maxLength="10"
                                            style={{
                                                flex: 1,
                                                border: "none",
                                                outline: "none",
                                                backgroundColor: "transparent",
                                                color: "var(--ink)",
                                                fontSize: "0.875rem",
                                            }}
                                            {...register("phone", {
                                                required: "Phone is required",
                                                validate: validateMobileNumber,
                                            })}
                                        />
                                    </div>
                                    {errors.phone && (
                                        <span style={{ fontSize: "0.75rem", color: "var(--red)", marginTop: "0.25rem", display: "block" }}>
                                            {errors.phone.message}
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    style={{
                                        width: "100%",
                                        padding: "0.9rem",
                                        backgroundColor: isLoading ? "var(--ink)/40" : "var(--accent)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "0.75rem",
                                        fontSize: "0.875rem",
                                        fontWeight: 700,
                                        cursor: isLoading ? "not-allowed" : "pointer",
                                        transition: "all 0.15s",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.5rem",
                                    }}
                                >
                                    {isLoading ? (
                                        "Completing profile..."
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            Complete Profile
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompleteProfilePage;
