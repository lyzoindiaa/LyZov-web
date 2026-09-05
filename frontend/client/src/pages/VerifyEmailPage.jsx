import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CheckCircle2, AlertCircle, ArrowLeft, Mail, RefreshCw, ShoppingBag } from "lucide-react";
import { authService } from "../services/authService";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Logo from "../components/ui/Logo";
import ThemeToggle from "../components/ui/ThemeToggle";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying"); // "verifying" | "success" | "error"
  const [errorMessage, setErrorMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      if (!token) {
        setStatus("error");
        setErrorMessage("Verification token is missing from the link.");
        return;
      }

      try {
        await authService.verifyEmail(token);
        if (isMounted) {
          setStatus("success");
          toast.success("Email verified successfully!");
        }
      } catch (err) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage(
            err.response?.data?.message || "Verification link is invalid or has expired."
          );
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) {
      toast.error("Please enter your account email address.");
      return;
    }

    setIsResending(true);
    try {
      await authService.resendVerification(resendEmail);
      setResendSent(true);
      toast.success("A fresh verification link has been sent to your email.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend verification link.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg)",
        position: "relative",
      }}
    >
      {/* ── Top Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem 2rem",
        }}
      >
        <Link
          to="/"
          className="btn-secondary flex items-center gap-1.5 text-xs font-semibold"
          style={{ padding: "0.45rem 0.95rem", borderRadius: "9999px" }}
        >
          <ArrowLeft size={14} />
          <span>Return to Store</span>
        </Link>
        <ThemeToggle size={16} />
      </div>

      {/* ── Main Center Area ── */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div style={{ width: "100%", maxWidth: "28rem" }}>
          
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
              <Logo size="lg" />
            </div>
          </div>

          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "1.25rem",
              padding: "2.5rem 2rem",
              boxShadow: "var(--shadow-lg)",
              textAlign: "center",
            }}
          >
            {/* 1. Verifying State */}
            {status === "verifying" && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div
                  style={{
                    width: "3.5rem",
                    height: "3.5rem",
                    borderRadius: "9999px",
                    border: "3px solid var(--border)",
                    borderTopColor: "var(--accent)",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)", marginTop: "0.5rem" }}>
                  Verifying Your Email
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", maxWidth: "20rem" }}>
                  Please hold on while we validate your token with the LyZov security registry...
                </p>
              </div>
            )}

            {/* 2. Success State */}
            {status === "success" && (
              <div className="flex flex-col items-center gap-4">
                <div
                  style={{
                    width: "4rem",
                    height: "4rem",
                    borderRadius: "9999px",
                    backgroundColor: "var(--green-bg)",
                    color: "var(--green)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)" }}>
                    Account Verified!
                  </h2>
                  <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", marginTop: "0.5rem", lineHeight: 1.6 }}>
                    Your email address has been authenticated. You now have privileged access to order updates, express checkout, and exclusive collections.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
                  <Button
                    onClick={() => navigate("/login")}
                    className="flex-1 btn-ripple flex items-center justify-center gap-2"
                  >
                    <span>Sign In</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/shop")}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={15} />
                    <span>Explore Shop</span>
                  </Button>
                </div>
              </div>
            )}

            {/* 3. Error State */}
            {status === "error" && (
              <div className="flex flex-col items-center gap-4">
                <div
                  style={{
                    width: "4rem",
                    height: "4rem",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                    color: "#EF4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertCircle size={36} />
                </div>

                <div>
                  <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--ink)" }}>
                    Verification Link Expired
                  </h2>
                  <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", marginTop: "0.5rem", lineHeight: 1.6 }}>
                    {errorMessage || "The link you clicked is invalid or has expired after 24 hours."}
                  </p>
                </div>

                {/* Resend Section */}
                <div
                  style={{
                    width: "100%",
                    marginTop: "1rem",
                    paddingTop: "1.25rem",
                    borderTop: "1px solid var(--border)",
                    textAlign: "left",
                  }}
                >
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.5rem" }}>
                    Need a new link?
                  </h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginBottom: "0.875rem" }}>
                    Enter your email below and we will send a new verification link immediately.
                  </p>

                  {resendSent ? (
                    <div
                      style={{
                        padding: "0.875rem 1rem",
                        backgroundColor: "var(--green-bg)",
                        color: "var(--green)",
                        borderRadius: "0.5rem",
                        fontSize: "0.8125rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Verification link sent! Please check your inbox.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleResend} className="flex flex-col gap-3">
                      <Input
                        type="email"
                        placeholder="your-email@example.com"
                        leftIcon={Mail}
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        required
                      />
                      <Button
                        type="submit"
                        isLoading={isResending}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={14} />
                        <span>Send New Verification Link</span>
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            )}

          </div>

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
              Need assistance? Reach out to{" "}
              <Link to="/contact" style={{ color: "var(--accent)", fontWeight: 600 }}>
                LyZov Concierge
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
