import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { authService } from "../services/authService";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ui/ThemeToggle";

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: "onTouched" });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setIsSubmitted(true);
      toast.success("Password reset instructions have been sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg)", position: "relative" }}>

      {/* ── Top Bar ──────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.5rem",
        }}
      >
        <Link
          to="/login"
          className="btn-secondary flex items-center gap-1.5 text-xs font-semibold"
          style={{ padding: "0.4rem 0.85rem", borderRadius: "9999px" }}
        >
          <ArrowLeft size={14} />
          <span>Back to Sign In</span>
        </Link>
        <ThemeToggle size={16} />
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div style={{ width: "100%", maxWidth: "23rem" }}>

          {/* Logo & Title */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", marginBottom: "1rem" }}>
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
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.025em" }}>
              Forgot Password
            </h1>
            <p style={{ marginTop: "0.35rem", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
              Enter your email and we&apos;ll send a password recovery link
            </p>
          </div>

          {/* Card Container */}
          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "1.25rem",
              padding: "1.75rem",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {isSubmitted ? (
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    width: "3rem",
                    height: "3rem",
                    borderRadius: "9999px",
                    backgroundColor: "var(--green-bg)",
                    color: "var(--green)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ink)" }}>Check your email</h3>
                  <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                    We have dispatched reset instructions if an account with that email exists.
                  </p>
                </div>
                <Link to="/login" className="btn-primary w-full mt-2 btn-ripple">
                  Return to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
                      message: "Invalid email format",
                    },
                  })}
                  error={errors.email?.message}
                />

                <Button type="submit" isLoading={isLoading} className="mt-1 w-full btn-ripple">
                  Send Reset Link
                </Button>

                <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--ink-muted)", marginTop: "0.5rem" }}>
                  Remember your password?{" "}
                  <Link to="/login" style={{ fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>
                    Sign In
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
