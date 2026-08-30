import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { registerUser, clearAuthError } from "../features/auth/authSlice";
import { ShieldCheck, Truck, Award, Sparkles, ArrowLeft, User, Mail, Lock } from "lucide-react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ui/ThemeToggle";

const trustBullets = [
  { icon: ShieldCheck, text: "Fast & easy sign up in under 30s" },
  { icon: Truck,       text: "Exclusive member deals & tracking" },
  { icon: Award,       text: "100% verified customer guarantee" },
];

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, isAuthenticated } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ mode: "onTouched" });

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
    return () => dispatch(clearAuthError());
  }, [isAuthenticated, navigate, dispatch]);

  const onSubmit = (data) => {
    dispatch(registerUser({ name: data.name, email: data.email, password: data.password }));
  };

  const passwordVal = watch("password");

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "var(--bg)", position: "relative" }}>

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
          padding: "1rem 1.5rem",
        }}
      >
        <Link
          to="/"
          className="btn-secondary flex items-center gap-1.5 text-xs font-semibold"
          style={{ padding: "0.4rem 0.85rem", borderRadius: "9999px" }}
        >
          <ArrowLeft size={14} />
          <span>Back to Store</span>
        </Link>
        <ThemeToggle size={16} />
      </div>

      {/* ── Left Brand Showcase Panel (Desktop) ───────────── */}
      <div
        className="auth-panel-left hidden lg:flex"
        style={{
          width: "45%",
          flexDirection: "column",
          justifyContent: "center",
          padding: "4rem 3.5rem",
          flexShrink: 0,
        }}
      >
        <div className="auth-orb-1" />
        <div className="auth-orb-2" />

        {/* Logo */}
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.75rem",
            textDecoration: "none",
            marginBottom: "3rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: "2.75rem",
              height: "2.75rem",
              borderRadius: "0.875rem",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "1rem",
              color: "#fff",
            }}
          >
            L<span style={{ color: "#F59E0B" }}>Z</span>
          </div>
          <span style={{ fontSize: "1.375rem", fontWeight: 800, color: "#fff" }}>LyZov</span>
        </Link>

        {/* Headline */}
        <div style={{ position: "relative", zIndex: 1 }}>
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
              padding: "0.3rem 0.75rem",
              borderRadius: "9999px",
              marginBottom: "1.25rem",
            }}
          >
            <Sparkles size={11} /> Join Our Community
          </div>
          <h2
            style={{
              fontSize: "2.5rem",
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: "1rem",
            }}
          >
            Start your journey<br />
            <span style={{ color: "#F59E0B" }}>with LyZov</span> today.
          </h2>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "rgba(255,255,255,0.65)",
              lineHeight: 1.7,
              maxWidth: "22rem",
              marginBottom: "2.5rem",
            }}
          >
            Create an account to track your orders, save items to your wishlist, and enjoy a personalized shopping experience.
          </p>

          {/* Trust bullets */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {trustBullets.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "9999px",
                    background: "rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} color="rgba(255,255,255,0.8)" />
                </div>
                <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.8)" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ──────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "5rem 1.5rem 2rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: "23rem" }}>

          {/* Mobile brand header */}
          <div className="lg:hidden" style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "var(--ink)",
                  color: "var(--bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                }}
              >
                L<span style={{ color: "#F59E0B" }}>Z</span>
              </div>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)" }}>LyZov</span>
            </Link>
          </div>

          {/* Title & subtitle */}
          <div style={{ marginBottom: "1.75rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.025em" }}>
              Create Account
            </h1>
            <p style={{ marginTop: "0.35rem", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
              Join LyZov for an elevated shopping experience
            </p>
          </div>

          {/* Form container */}
          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "1.25rem",
              padding: "1.75rem",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
              <Input
                label="Full Name"
                placeholder="John Doe"
                leftIcon={User}
                required
                {...register("name", {
                  required: "Full name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" },
                })}
                error={errors.name?.message}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
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
                placeholder="At least 6 characters"
                leftIcon={Lock}
                required
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "Must be at least 6 characters" },
                })}
                error={errors.password?.message}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat password"
                leftIcon={Lock}
                required
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (val) => val === passwordVal || "Passwords do not match",
                })}
                error={errors.confirmPassword?.message}
              />

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
                  }}
                >
                  {error}
                </div>
              )}

              <Button type="submit" isLoading={status === "loading"} className="mt-1 w-full btn-ripple">
                Create Account
              </Button>
            </form>
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
};

export default RegisterPage;
