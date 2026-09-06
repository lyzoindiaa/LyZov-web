import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthError } from "../features/auth/authSlice";
import { ShieldCheck, Truck, Award, Sparkles, ArrowLeft } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import ThemeToggle from "../components/ui/ThemeToggle";
import Logo from "../components/ui/Logo";

const trustBullets = [
  { icon: ShieldCheck, text: "100% secure checkout & payments" },
  { icon: Truck, text: "Free express delivery on orders ₹999+" },
  { icon: Award, text: "Authentic & quality guaranteed items" },
];

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [googleError, setGoogleError] = useState("");
  // Capture location once on mount — never re-read it so navigate() doesn't
  // re-trigger this effect and cause a redirect loop.
  const fromRef = useRef(location.state?.from?.pathname || null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const isSeller = user?.role === "seller" || user?.role === "admin";
    const targetPath = isSeller ? "/seller" : fromRef.current || "/dashboard";
    navigate(targetPath, { replace: true });
  }, [isAuthenticated, user?.role, navigate]);

  // Clear any stale auth error only when this page unmounts
  useEffect(() => {
    return () => dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    const error = new URLSearchParams(location.search).get("google_error");
    if (!error) return;

    const messages = {
      invalid_oauth_state: "Your Google sign-in session expired. Please try again.",
      consent_denied: "Google sign-in was cancelled. Please try again when you are ready.",
      unverified_google_account: "Google could not verify this account. Please use a verified Google account.",
      account_conflict: "This Google account is linked to a different user account. Please contact support.",
      account_deactivated: "This account is deactivated. Please contact support.",
      google_auth_failed: "Google sign-in could not be completed. Please try again.",
    };

    setGoogleError(messages[error] || "Google sign-in could not be completed. Please try again.");
    navigate("/login", { replace: true });
  }, [location.search, navigate]);

  const startGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL ||
      (import.meta.env.MODE === "production" ? "https://lyzov.onrender.com/api" : "http://localhost:5000/api");
    window.location.assign(`${apiUrl}/auth/google`);
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", backgroundColor: "var(--bg)", position: "relative", overflowX: "hidden", overflowY: "auto" }}>
      {/* ── Top Bar with Back Link & Single Theme Toggle ────────── */}
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
        <Link
          to="/"
          className="btn-secondary flex items-center gap-1.5 text-xs font-semibold"
          style={{ padding: "0.45rem 1rem", borderRadius: "9999px" }}
        >
          <ArrowLeft size={14} />
          <span>Back to Store</span>
        </Link>
        <ThemeToggle size={16} />
      </div>

      {/* ── Left 60% Brand Showcase Panel (Desktop) ───────────── */}
      <div
        className="auth-panel-left hidden lg:flex"
        style={{
          width: "60%",
          flexDirection: "column",
          justifyContent: "center",
          padding: "5rem 4.5rem",
          flexShrink: 0,
        }}
      >
        <div className="auth-orb-1" />
        <div className="auth-orb-2" />

        {/* Headline */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: "34rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              backgroundColor: "rgba(245,158,11,0.2)",
              color: "#F59E0B",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              padding: "0.35rem 0.85rem",
              borderRadius: "9999px",
              marginBottom: "1.5rem",
            }}
          >
            <Sparkles size={11} /> LyZov Premium Store
          </div>
          <h2
            style={{
              fontSize: "clamp(2.25rem, 3.5vw, 3.25rem)",
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              marginBottom: "1.25rem",
            }}
          >
            Welcome back to
            <br />
            <span style={{ color: "#F59E0B" }}>LyZov Store.</span>
          </h2>
          <p
            style={{
              fontSize: "1rem",
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.75,
              maxWidth: "28rem",
              marginBottom: "3rem",
            }}
          >
            Sign in to track orders, manage your wishlist, and enjoy a seamless shopping experience — fitness gear, spiritual idols, and lifestyle essentials all in one place.
          </p>

          {/* Trust bullets */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            {trustBullets.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "9999px",
                    background: "rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={15} color="rgba(255,255,255,0.9)" />
                </div>
                <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right 40% Form Panel (Desktop) ──────────────────── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "5rem 1rem 2rem",
          minWidth: 0,
        }}
        className="w-full lg:w-[40%]"
      >
        <div style={{ width: "100%", maxWidth: "23rem" }}>
          <div className="auth-form-logo" style={{ marginBottom: "1.5rem" }}>
            <Logo size="md" variant="elevated" />
          </div>

          {/* Title & subtitle */}
          <div style={{ marginBottom: "1.75rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.025em" }}>
              Welcome back
            </h1>
            <p style={{ marginTop: "0.35rem", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
              Sign in to continue to your account
            </p>
          </div>

          {/* Email/password login is temporarily disabled while Google-only authentication is integrated.
              The previous form is intentionally kept in this comment for the upcoming auth migration. */}
          {/*
          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "1.25rem",
              padding: "1.75rem",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                leftIcon={Mail}
                required
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address format",
                  },
                })}
                error={errors.email?.message}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                leftIcon={Lock}
                required
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "Password must be at least 6 characters" },
                })}
                error={errors.password?.message}
              />

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--ink-muted)",
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "var(--accent)")}
                  onMouseLeave={(e) => (e.target.style.color = "var(--ink-muted)")}
                >
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div
                  className="input-error"
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--red)",
                    backgroundColor: "var(--red-bg)",
                    border: "1px solid var(--red)/20",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "0.625rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" isLoading={status === "loading"} className="mt-1 w-full btn-ripple">
                Sign In
              </Button>
            </form>
          </div>

          <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>
              Create one
            </Link>
          </p>
          */}

          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "1.25rem",
              padding: "1.75rem",
              boxShadow: "var(--shadow-md)",
              textAlign: "center",
            }}
          >
            {googleError && (
              <div
                role="alert"
                style={{
                  marginBottom: "1rem",
                  padding: "0.75rem 0.875rem",
                  borderRadius: "0.625rem",
                  backgroundColor: "var(--red-bg)",
                  border: "1px solid var(--red)",
                  color: "var(--red)",
                  fontSize: "0.8125rem",
                  lineHeight: 1.5,
                  textAlign: "left",
                }}
              >
                {googleError}
              </div>
            )}
            <div style={{ fontSize: "0.875rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
              <button
                type="button"
                onClick={startGoogleLogin}
                style={{
                  width: "100%",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                  backgroundColor: "var(--surface)",
                  color: "var(--ink)",
                  padding: "0.8rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.625rem",
                }}
              >
                <FaGoogle size={16} aria-hidden="true" />
                Continue with Google
              </button>
            </div>
          </div>

          <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
            New to LyZov?{" "}
            <Link to="/register" style={{ fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
