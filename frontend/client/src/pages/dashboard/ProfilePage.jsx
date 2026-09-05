import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CheckCircle2, AlertTriangle, RefreshCw, Mail } from "lucide-react";
import { userService } from "../../services/cartService";
import { authService } from "../../services/authService";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setIsResending(true);
    try {
      await authService.resendVerification(user.email);
      toast.success("Verification link sent! Please check your inbox.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  const profileForm = useForm({ defaultValues: { name: user?.name, phone: user?.phone } });
  const passwordForm = useForm();

  const onProfileSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("phone", data.phone || "");
      await userService.updateProfile(formData);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update profile");
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      await userService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed. Please log in again.");
      passwordForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change password");
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* ── Email Verification Banner ── */}
      {!user?.isEmailVerified && (
        <div
          style={{
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "1rem",
            padding: "1.25rem 1.5rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "9999px",
                backgroundColor: "rgba(245, 158, 11, 0.2)",
                color: "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)" }}>
                Email Verification Pending
              </h4>
              <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", marginTop: "2px" }}>
                Verify your email to receive order tracking updates and security notifications.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleResendVerification}
            isLoading={isResending}
            className="flex items-center gap-2"
          >
            <RefreshCw size={13} />
            <span>Resend Verification Email</span>
          </Button>
        </div>
      )}

      <div className="card-surface p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl">Personal Information</h3>
          {user?.isEmailVerified ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--green)",
                backgroundColor: "var(--green-bg)",
                padding: "0.25rem 0.65rem",
                borderRadius: "9999px",
              }}
            >
              <CheckCircle2 size={13} />
              <span>Email Verified</span>
            </span>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#D97706",
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                padding: "0.25rem 0.65rem",
                borderRadius: "9999px",
              }}
            >
              <Mail size={13} />
              <span>Unverified</span>
            </span>
          )}
        </div>
        <form
          onSubmit={profileForm.handleSubmit(onProfileSubmit)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <Input label="Full Name" {...profileForm.register("name", { required: true })} />
          <Input label="Email" value={user?.email} disabled className="opacity-60" />
          <Input label="Phone" {...profileForm.register("phone")} />
          <div className="sm:col-span-2">
            <Button type="submit" isLoading={profileForm.formState.isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      <div className="card-surface p-6">
        <h3 className="mb-5 font-display text-xl">Change Password</h3>
        <form
          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <Input
            label="Current Password"
            type="password"
            {...passwordForm.register("currentPassword", { required: "Required" })}
            error={passwordForm.formState.errors.currentPassword?.message}
          />
          <div />
          <Input
            label="New Password"
            type="password"
            {...passwordForm.register("newPassword", {
              required: "Required",
              minLength: { value: 8, message: "Must be at least 8 characters" },
            })}
            error={passwordForm.formState.errors.newPassword?.message}
          />
          <Input
            label="Confirm New Password"
            type="password"
            {...passwordForm.register("confirmPassword", {
              validate: (val) => val === passwordForm.watch("newPassword") || "Passwords do not match",
            })}
            error={passwordForm.formState.errors.confirmPassword?.message}
          />
          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary" isLoading={passwordForm.formState.isSubmitting}>
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
