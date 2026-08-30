import { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { loginUser, clearAuthError } from "../features/auth/authSlice";
import { ShieldCheck, Truck, Award, Sparkles } from "lucide-react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

const trustBullets = [
  { icon: ShieldCheck, text: "100% secure checkout" },
  { icon: Truck,       text: "Free delivery on orders ₹999+" },
  { icon: Award,       text: "Quality guaranteed products" },
];

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error, isAuthenticated } = useSelector((state) => state.auth);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    if (isAuthenticated) navigate(location.state?.from?.pathname || "/", { replace: true });
    return () => dispatch(clearAuthError());
  }, [isAuthenticated]);

  const onSubmit = (data) => dispatch(loginUser(data));

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "var(--bg)" }}>

      {/* ── Left Brand Panel ──────────────────────────── */}
      <div className="auth-panel-left hidden lg:flex" style={{ width: "45%", flexDirection: "column", justifyContent: "center", padding: "3rem 3.5rem", flexShrink: 0 }}>
        {/* Decorative orbs */}
        <div className="auth-orb-1" />
        <div className="auth-orb-2" />

        {/* Logo */}
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", marginBottom: "3rem", position: "relative", zIndex: 1 }}>
          <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.875rem", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "1rem", color: "#fff" }}>
            L<span style={{ color: "#F59E0B" }}>Z</span>
          </div>
          <span style={{ fontSize: "1.375rem", fontWeight: 800, color: "#fff" }}>LyZov</span>
        </Link>

        {/* Headline */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", backgroundColor: "rgba(245,158,11,0.2)", color: "#F59E0B", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "0.3rem 0.75rem", borderRadius: "9999px", marginBottom: "1.25rem" }}>
            <Sparkles size={11} /> Premium Store
          </div>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "1rem" }}>
            Your premium<br />
            <span style={{ color: "#F59E0B" }}>shopping</span> destination.
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: "22rem", marginBottom: "2.5rem" }}>
            Discover curated fitness gear, handcrafted decor, and lifestyle essentials — all in one place.
          </p>

          {/* Trust bullets */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {trustBullets.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "2rem", height: "2rem", borderRadius: "9999px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={14} color="rgba(255,255,255,0.7)" />
                </div>
                <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.7)" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ──────────────────────────── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem" }}>
        <div style={{ width: "100%", maxWidth: "22rem" }}>

          {/* Mobile logo */}
          <div className="lg:hidden" style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
              <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", backgroundColor: "var(--ink)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                L<span style={{ color: "#F59E0B" }}>Z</span>
              </div>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)" }}>LyZov</span>
            </Link>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.025em" }}>Welcome back</h1>
            <p style={{ marginTop: "0.375rem", fontSize: "0.875rem", color: "var(--ink-muted)" }}>Sign in to continue to your account</p>
          </div>

          {/* Form card */}
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "var(--shadow-md)" }}>
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Input label="Email" type="email" {...register("email", { required: "Email is required" })} error={errors.email?.message} />
              <Input label="Password" type="password" {...register("password", { required: "Password is required" })} error={errors.password?.message} />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: "0.75rem", color: "var(--ink-muted)", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => e.target.style.color = "var(--accent)"}
                  onMouseLeave={(e) => e.target.style.color = "var(--ink-muted)"}
                >
                  Forgot password?
                </Link>
              </div>
              {error && (
                <p className="input-error" style={{ fontSize: "0.75rem", color: "var(--red)", backgroundColor: "var(--red-bg)", padding: "0.625rem 0.875rem", borderRadius: "0.625rem" }}>
                  {error}
                </p>
              )}
              <Button type="submit" isLoading={status === "loading"} className="mt-1 w-full">Sign In</Button>
            </form>
          </div>

          <p style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link to="/register" style={{ fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
