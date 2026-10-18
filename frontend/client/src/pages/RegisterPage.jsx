import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, clearAuthError } from "../features/auth/authSlice";
import { ShieldCheck, Truck, Award, Sparkles, ArrowLeft, Mail, User } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import ThemeToggle from "../components/ui/ThemeToggle";
import Logo from "../components/ui/Logo";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

const trustBullets = [
  { icon: ShieldCheck, text: "Fast & easy sign up in under 30s" },
  { icon: Truck, text: "Exclusive member deals & tracking" },
  { icon: Award, text: "100% verified customer guarantee" },
];

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, status, error } = useSelector((state) => state.auth);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    if (isAuthenticated) {
      const isSeller = user?.role === "seller" || user?.role === "admin";
      navigate(isSeller ? "/seller" : "/complete-profile", { replace: true });
    }
    return () => dispatch(clearAuthError());
  }, [isAuthenticated, user?.role, navigate, dispatch]);

  const startGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL ||
      (import.meta.env.MODE === "production" ? "/api" : "http://localhost:5000/api");
    window.location.assign(`${apiUrl}/auth/google`);
  };

  const onSubmit = async (data) => {
    try {
      // Only send name and email (no password)
      const result = await dispatch(registerUser({ name: data.name, email: data.email }));
      if (result.payload) {
        toast.success("Account created! Redirecting to complete your profile...");
        navigate("/complete-profile", { replace: true });
      }
    } catch (err) {
      toast.error(error || "Registration failed. Please try again.");
    }
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", backgroundColor: "var(--bg)", position: "relative", overflowX: "hidden", overflowY: "auto" }}>
      {/* ── Top Bar ──────────────────────────────────────── */}
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
            <Sparkles size={11} /> Join the LyZov Family
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
            Your journey to
            <br />
            <span style={{ color: "#F59E0B" }}>better living</span> starts here.
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
            Create your free LyZov account to track shipments, build wishlists, and get early access to new arrivals and member-only deals.
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
              Create an account
            </h1>
            <p style={{ marginTop: "0.35rem", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
              Join LyZov — track orders, save favorites, shop smarter
            </p>
          </div>

          {/* Email/password registration - Quick signup with name + email only */}
          {/* <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "1.25rem",
              padding: "1.75rem",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)" }}>
                  Full Name
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "0.5rem 0.75rem" }}>
                  <User size={16} style={{ color: "var(--ink-muted)" }} />
                  <input
                    type="text"
                    placeholder="John Doe"
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      backgroundColor: "transparent",
                      color: "var(--ink)",
                      fontSize: "0.875rem",
                    }}
                    {...register("name", {
                      required: "Name is required",
                      minLength: { value: 2, message: "Name must be at least 2 characters" },
                      maxLength: { value: 60, message: "Name cannot exceed 60 characters" },
                    })}
                  />
                </div>
                {errors.name && (
                  <span style={{ fontSize: "0.75rem", color: "var(--red)", marginTop: "0.25rem", display: "block" }}>
                    {errors.name.message}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)" }}>
                  Email Address
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "0.5rem 0.75rem" }}>
                  <Mail size={16} style={{ color: "var(--ink-muted)" }} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      backgroundColor: "transparent",
                      color: "var(--ink)",
                      fontSize: "0.875rem",
                    }}
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address format",
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <span style={{ fontSize: "0.75rem", color: "var(--red)", marginTop: "0.25rem", display: "block" }}>
                    {errors.email.message}
                  </span>
                )}
              </div>

              <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", textAlign: "center" }}>
                You'll complete your profile after signing up
              </p>

              {error && (
                <div
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
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  width: "100%",
                  padding: "0.8rem 1rem",
                  backgroundColor: status === "loading" ? "var(--ink)/40" : "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: status === "loading" ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                {status === "loading" ? "Creating account..." : "Create Account"}
              </button>
            </form>
          </div>

          <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.8125rem", color: "var(--ink-muted)" }}>
            or continue with
          </p> */}

          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "1.25rem",
              padding: "1.25rem",
              boxShadow: "var(--shadow-md)",
              textAlign: "center",
            }}
          >
            <button
              type="button"
              onClick={startGoogleLogin}
              style={{
                width: "100%",
                border: "1px solid var(--border)",
                borderRadius: "0.75rem",
                backgroundColor: "var(--surface)",
                color: "var(--ink)",
                padding: "0.75rem 1rem",
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
              Google
            </button>
          </div>

          <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
