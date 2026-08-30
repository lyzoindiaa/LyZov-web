import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { authService } from "../services/authService";
import { ArrowLeft, Lock } from "lucide-react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ui/ThemeToggle";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ mode: "onTouched" });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await authService.resetPassword(token, data.password);
      toast.success("Password reset successfully! Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password. Link may be invalid or expired.");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordVal = watch("password");

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

          {/* Title */}
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
              Create New Password
            </h1>
            <p style={{ marginTop: "0.35rem", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
              Please enter and confirm your new secure password
            </p>
          </div>

          {/* Form */}
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
                label="New Password"
                type="password"
                placeholder="At least 6 characters"
                leftIcon={Lock}
                required
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "Password must be at least 6 characters" },
                })}
                error={errors.password?.message}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Repeat new password"
                leftIcon={Lock}
                required
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (val) => val === passwordVal || "Passwords do not match",
                })}
                error={errors.confirmPassword?.message}
              />

              <Button type="submit" isLoading={isLoading} className="mt-1 w-full btn-ripple">
                Update Password
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
