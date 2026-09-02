import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { registerUser, clearAuthError } from "../features/auth/authSlice";
import { ShieldCheck, Truck, Award, Sparkles, ArrowLeft, User, Mail, Lock } from "lucide-react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ui/ThemeToggle";
import Logo from "../components/ui/Logo";

const trustBullets = [
  { icon: ShieldCheck, text: "Fast & easy sign up in under 30s" },
  { icon: Truck, text: "Exclusive member deals & tracking" },
  { icon: Award, text: "100% verified customer guarantee" },
];

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, isAuthenticated, user } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ mode: "onTouched" });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    }
    return () => dispatch(clearAuthError());
  }, [isAuthenticated, user?.role, navigate, dispatch]);

  const onSubmit = (data) => {
    dispatch(registerUser({ name: data.name, email: data.email, password: data.password }));
  };

  const passwordVal = watch("password");

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
              Join LyZov Store — track orders, save favorites, shop smarter
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
                  required: "Name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" },
                })}
                error={errors.name?.message}
              />

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

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
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

              <Button type="submit" variant="primary" size="lg" isLoading={status === "loading"} className="mt-1 w-full btn-ripple">
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
