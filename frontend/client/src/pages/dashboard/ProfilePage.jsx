import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Mail,
  Phone,
  Camera,
  User,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { userService } from "../../services/cartService";
import { authService } from "../../services/authService";
import { setUser, fetchCurrentUser } from "../../features/auth/authSlice";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isResending, setIsResending] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar?.url || "");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [activeTab, setActiveTab] = useState("personal"); // "personal" | "security"

  const profileForm = useForm({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });
  const passwordForm = useForm();

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      setAvatarPreview(user.avatar?.url || "");
    }
  }, [user, profileForm]);

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

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const onProfileSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name.trim());
      formData.append("email", data.email.trim());
      formData.append("phone", data.phone ? data.phone.trim() : "");
      if (selectedAvatarFile) {
        formData.append("avatar", selectedAvatarFile);
      }

      const res = await userService.updateProfile(formData);
      if (res.data?.user) {
        dispatch(setUser(res.data.user));
      } else {
        dispatch(fetchCurrentUser());
      }
      toast.success("Profile updated successfully!");
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
      toast.success("Password changed successfully.");
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
                Verify your email ({user?.email}) to receive order tracking updates and security notifications.
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

      {/* ── Profile Tabs Navigation ── */}
      <div className="flex flex-wrap gap-2 border-b border-hairline pb-2 dark:border-hairline-dark mb-6">
        {/* Personal Info Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("personal")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "personal"
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
            }`}
        >
          <User size={16} />
          <span>Personal Information</span>
        </button>

        {/* Security Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "security"
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "text-stone hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
            }`}
        >
          <ShieldCheck size={16} />
          <span>Change Password</span>
        </button>
      </div>

      {/* ── Tab 1: Personal Information Form ── */}
      {activeTab === "personal" && (
        <div className="card-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border)]">
            <div>
              <h3 className="font-display text-xl">Personal Information</h3>
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">Manage your account details and contact information.</p>
            </div>

            <div className="flex items-center gap-2">
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
                  <span>Email Unverified</span>
                </span>
              )}
            </div>
          </div>

          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="flex flex-col gap-6">
            {/* Avatar Upload */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div
                  style={{
                    width: "5rem",
                    height: "5rem",
                    borderRadius: "9999px",
                    overflow: "hidden",
                    backgroundColor: "var(--bg-subtle)",
                    border: "2px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} style={{ color: "var(--ink-muted)" }} />
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  style={{
                    position: "absolute",
                    bottom: "0",
                    right: "0",
                    backgroundColor: "var(--accent)",
                    color: "#ffffff",
                    width: "1.75rem",
                    height: "1.75rem",
                    borderRadius: "9999px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                  }}
                  title="Change Avatar"
                >
                  <Camera size={13} />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
              </div>
              <div>
                <h4 className="text-sm font-semibold">{user?.name || "Customer"}</h4>
                <p className="text-xs text-[var(--ink-muted)] mt-0.5">Click camera icon to change profile photo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Full Name *"
                {...profileForm.register("name", { required: "Name is required" })}
                error={profileForm.formState.errors.name?.message}
              />

              <div>
                <Input
                  label="Email Address *"
                  type="email"
                  {...profileForm.register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: "Please provide a valid email",
                    },
                  })}
                  error={profileForm.formState.errors.email?.message}
                />
                <span className="text-[0.7rem] text-[var(--ink-subtle)] mt-1 block">
                  Changing your email address will require re-verification.
                </span>
              </div>

              <div>
                <Input
                  label="Mobile / Phone Number *"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  {...profileForm.register("phone", {
                    required: "Mobile / Phone number is compulsory",
                    pattern: {
                      value: /^[6-9]\d{9}$/,
                      message: "Please enter a valid 10-digit Indian mobile number",
                    },
                  })}
                  error={profileForm.formState.errors.phone?.message}
                />
                <span className="text-[0.7rem] text-[var(--ink-subtle)] mt-1 block">
                  Compulsory for order confirmation and delivery notifications.
                </span>
              </div>
            </div>

            <div>
              <Button type="submit" isLoading={profileForm.formState.isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Tab 2: Password Security ── */}
      {activeTab === "security" && (
        <div className="card-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border)]">
            <div>
              <h3 className="font-display text-xl">Change Password</h3>
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">Ensure your account is using a long, secure password.</p>
            </div>
          </div>

          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <Input
              label="Current Password"
              type="password"
              {...passwordForm.register("currentPassword", { required: "Current password is required" })}
              error={passwordForm.formState.errors.currentPassword?.message}
            />
            <div className="hidden sm:block" />
            <Input
              label="New Password"
              type="password"
              {...passwordForm.register("newPassword", {
                required: "New password is required",
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
            <div className="sm:col-span-2 mt-2">
              <Button type="submit" variant="secondary" isLoading={passwordForm.formState.isSubmitting}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
