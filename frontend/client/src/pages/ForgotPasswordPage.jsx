import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { authService } from "../services/authService";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setIsSubmitted(true);
      toast.success("If that email exists, a password reset link has been sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset link");
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
          <h1 className="mt-4 font-display text-2xl">Forgot Password</h1>
          <p className="mt-1 text-sm text-stone">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {isSubmitted ? (
          <div className="rounded-xl border border-hairline bg-ivory p-6 text-center dark:border-hairline-dark dark:bg-charcoal">
            <h3 className="font-display text-lg">Check your email</h3>
            <p className="mt-2 text-sm text-stone">
              We have sent password reset instructions to your email if an account exists.
            </p>
            <Link to="/login" className="mt-6 inline-block text-sm font-medium text-ink underline dark:text-cream">
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="name@example.com"
              {...register("email", { required: "Email is required" })}
              error={errors.email?.message}
            />

            <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
              Send Reset Link
            </Button>

            <p className="mt-4 text-center text-sm text-stone">
              Remember your password?{" "}
              <Link to="/login" className="font-medium text-ink underline dark:text-cream">
                Sign In
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;