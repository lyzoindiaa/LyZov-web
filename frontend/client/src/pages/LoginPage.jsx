import { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { loginUser, clearAuthError } from "../features/auth/authSlice";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

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
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg)", padding: "3rem 1rem" }}>
      <div style={{ width: "100%", maxWidth: "22rem" }}>
        
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "9999px", backgroundColor: "var(--ink)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
              L<span style={{ color: "#F59E0B" }}>Z</span>
            </div>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)" }}>LyZov</span>
          </Link>
          <h1 style={{ marginTop: "1rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--ink)" }}>Welcome back</h1>
          <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "var(--ink-muted)" }}>Sign in to continue to your account</p>
        </div>

        {/* Form Card */}
        <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "var(--shadow-md)" }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Input label="Email" type="email" {...register("email", { required: "Email is required" })} error={errors.email?.message} />
            <Input label="Password" type="password" {...register("password", { required: "Password is required" })} error={errors.password?.message} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Link to="/forgot-password" style={{ fontSize: "0.75rem", color: "var(--ink-muted)", textDecoration: "none" }} onMouseEnter={(e) => e.target.style.color = "var(--accent)"} onMouseLeave={(e) => e.target.style.color = "var(--ink-muted)"}>
                Forgot password?
              </Link>
            </div>
            {error && <p style={{ fontSize: "0.75rem", color: "var(--red)", backgroundColor: "var(--red-bg)", padding: "0.5rem 0.75rem", borderRadius: "0.5rem" }}>{error}</p>}
            <Button type="submit" isLoading={status === "loading"} className="mt-1 w-full">Sign In</Button>
          </form>
        </div>

        <p style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ fontWeight: 600, color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: "2px" }}>Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;