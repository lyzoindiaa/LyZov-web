import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { authService } from "../services/authService";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

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

  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="font-display text-3xl tracking-tightest">
            LyZov
          </Link>
          <h1 className="mt-4 font-display text-2xl">Reset Password</h1>
          <p className="mt-1 text-sm text-stone">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="New Password"
            type="password"
            placeholder="At least 8 characters"
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "Password must be at least 8 characters" },
            })}
            error={errors.password?.message}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter password"
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (val) => val === watch("password") || "Passwords do not match",
            })}
            error={errors.confirmPassword?.message}
          />

          <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
            Reset Password
          </Button>

          <p className="mt-4 text-center text-sm text-stone">
            Back to{" "}
            <Link to="/login" className="font-medium text-ink underline dark:text-cream">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;