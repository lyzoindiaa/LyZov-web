import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  KeyRound,
  RefreshCw,
  Mail,
  Building2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { adminService } from "../../services/adminService";
import { toast } from "react-toastify";

const SellerCredentialsModal = ({
  isOpen,
  onClose,
  seller,
  initialCredentials = null,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState(initialCredentials);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Sync initialCredentials if provided from parent
  useEffect(() => {
    if (initialCredentials) {
      setCredentials(initialCredentials);
    } else {
      setCredentials(null);
    }
  }, [initialCredentials, isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading]);

  if (!isOpen || !seller) return null;

  const sellerName = seller.name || "Seller";
  const businessName = seller.sellerProfile?.businessName || seller.name || "Business";
  const sellerEmail = seller.email || "";
  const sellerPhone = seller.phone || "";
  const portalUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "https://lyzov.com/login";

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await adminService.resendSellerInvite(seller._id);
      if (res.success && res.data) {
        setCredentials(res.data);
        toast.success("New credentials generated successfully!");
        if (onSuccess) onSuccess(res.data);
      } else {
        toast.error(res.message || "Failed to regenerate credentials");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to regenerate credentials"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (!credentials?.temporaryPassword) return;
    navigator.clipboard.writeText(credentials.temporaryPassword);
    setCopiedPassword(true);
    toast.info("Temporary password copied to clipboard");
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  const getFullCredentialsText = () => {
    return [
      `LyZov Marketplace - Seller Account Credentials`,
      `---------------------------------------------`,
      `Store: ${businessName}`,
      `Seller Name: ${sellerName}`,
      `Login Portal: ${portalUrl}`,
      `Email: ${sellerEmail}`,
      `Temporary Password: ${credentials?.temporaryPassword}`,
      `---------------------------------------------`,
      `Note: Please log in using the temporary password above and update your password in your settings.`,
    ].join("\n");
  };

  const handleCopyAll = () => {
    const text = getFullCredentialsText();
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.info("Full credentials copied to clipboard");
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleClose = () => {
    if (loading) return;
    setCredentials(null);
    setCopiedPassword(false);
    setCopiedAll(false);
    onClose();
  };

  const mailtoSubject = encodeURIComponent(`Your LyZov Seller Credentials - ${businessName}`);
  const mailtoBody = encodeURIComponent(getFullCredentialsText());
  const mailtoUrl = `mailto:${sellerEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
        animation: "modalFadeIn 0.2s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "32rem",
          maxHeight: "90vh",
          backgroundColor: "var(--surface)",
          borderRadius: "1.25rem",
          border: "1px solid var(--border)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--bg-raised)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "0.75rem",
                background: credentials
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: credentials
                  ? "0 4px 12px rgba(16, 185, 129, 0.35)"
                  : "0 4px 12px rgba(0, 0, 0, 0.2)",
              }}
            >
              {credentials ? <ShieldCheck size={18} /> : <KeyRound size={18} />}
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                }}
              >
                {credentials ? "Seller Credentials Generated" : "Regenerate Temporary Password"}
              </h3>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                {credentials
                  ? `Ready to share with ${businessName}`
                  : `Reset access credentials for ${businessName}`}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-muted)",
              cursor: loading ? "not-allowed" : "pointer",
              padding: "0.35rem",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--border)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", overflowY: "auto" }}>
          {!credentials ? (
            /* Step 1: Confirmation Prompt (Replaces window.confirm) */
            <>
              <div
                style={{
                  backgroundColor: "var(--bg-raised)",
                  borderRadius: "0.875rem",
                  border: "1px solid var(--border)",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Building2 size={15} style={{ color: "var(--accent)" }} />
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)" }}>
                    {businessName}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem" }}>
                  <Mail size={13} style={{ color: "var(--ink-muted)" }} />
                  <span style={{ color: "var(--ink-muted)" }}>{sellerEmail}</span>
                </div>
                {sellerPhone && (
                  <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                    Phone: {sellerPhone}
                  </div>
                )}
              </div>

              <div
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                  borderRadius: "0.875rem",
                  padding: "0.875rem 1rem",
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                }}
              >
                <AlertTriangle
                  size={18}
                  style={{ color: "#f59e0b", flexShrink: 0, marginTop: "0.15rem" }}
                />
                <div style={{ fontSize: "0.8125rem", color: "var(--ink)", lineHeight: 1.5 }}>
                  <strong>Are you sure you want to regenerate credentials?</strong>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--ink-muted)" }}>
                    This action will immediately invalidate the seller&apos;s current password and
                    create a new secure temporary password. Once created, you can copy the password
                    to deliver via Email or WhatsApp.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  marginTop: "0.5rem",
                }}
              >
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  style={{
                    padding: "0.625rem 1.25rem",
                    borderRadius: "0.625rem",
                    border: "1px solid var(--border)",
                    backgroundColor: "transparent",
                    color: "var(--ink-muted)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="btn-accent"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.625rem 1.5rem",
                    borderRadius: "0.625rem",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={15} />
                      <span>Generate New Password</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Step 2: Generated Credentials View with Copy Buttons */
            <>
              {/* Success Notification */}
              <div
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "0.875rem",
                  padding: "0.875rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "50%",
                    backgroundColor: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    flexShrink: 0,
                  }}
                >
                  <Check size={16} />
                </div>
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "#10b981",
                    }}
                  >
                    New Temporary Password Ready!
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                    Copy below and send to the seller to grant access.
                  </p>
                </div>
              </div>

              {/* Highlighted Temporary Password Box */}
              <div
                style={{
                  backgroundColor: "var(--bg-raised)",
                  borderRadius: "1rem",
                  border: "1.5px solid var(--accent)",
                  padding: "1.125rem 1.25rem",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--ink-muted)",
                    }}
                  >
                    Temporary Password
                  </span>
                  <span style={{ fontSize: "0.6875rem", color: "var(--ink-muted)" }}>
                    Valid for first sign-in
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    backgroundColor: "var(--surface)",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "0.625rem",
                    border: "1px solid var(--border)",
                  }}
                >
                  <code
                    style={{
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      fontSize: "1.125rem",
                      fontWeight: 800,
                      color: "var(--ink)",
                      letterSpacing: "0.05em",
                      userSelect: "all",
                    }}
                  >
                    {credentials.temporaryPassword}
                  </code>

                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    id="copy-temp-password-btn"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.45rem 0.85rem",
                      borderRadius: "0.5rem",
                      border: "none",
                      backgroundColor: copiedPassword ? "#10b981" : "var(--accent)",
                      color: "#ffffff",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease-out",
                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {copiedPassword ? (
                      <>
                        <Check size={13} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy Password</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Full Credentials Summary */}
              <div
                style={{
                  backgroundColor: "var(--bg-raised)",
                  borderRadius: "0.875rem",
                  border: "1px solid var(--border)",
                  padding: "0.875rem 1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  fontSize: "0.8125rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ink)" }}>
                    Account Details
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    id="copy-full-credentials-btn"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      background: "none",
                      border: "none",
                      color: copiedAll ? "#10b981" : "var(--accent)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {copiedAll ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedAll ? "Copied Full Text" : "Copy Full Credentials"}</span>
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span style={{ color: "var(--ink-muted)" }}>Seller Email:</span>
                  <strong style={{ color: "var(--ink)", wordBreak: "break-all" }}>{sellerEmail}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span style={{ color: "var(--ink-muted)" }}>Login Portal:</span>
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--accent)",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontWeight: 600,
                    }}
                  >
                    <span>{portalUrl}</span>
                    <ExternalLink size={11} />
                  </a>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span style={{ color: "var(--ink-muted)" }}>Automated Email:</span>
                  <span
                    style={{
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      color:
                        credentials.emailStatus === "sent"
                          ? "#10b981"
                          : credentials.emailStatus === "failed"
                          ? "#ef4444"
                          : "var(--ink-muted)",
                    }}
                  >
                    {credentials.emailStatus === "sent" ? (
                      <>
                        <CheckCircle2 size={13} /> Sent to inbox
                      </>
                    ) : credentials.emailStatus === "failed" ? (
                      <>
                        <AlertTriangle size={13} /> Delivery Failed / Not configured
                      </>
                    ) : (
                      "Skipped"
                    )}
                  </span>
                </div>
              </div>

              {/* Manual Sending Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--ink-muted)",
                  }}
                >
                  Send to seller manually:
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  {/* WhatsApp Button */}
                  {credentials.whatsappUrl ? (
                    <a
                      href={credentials.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      id="send-whatsapp-btn"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        padding: "0.625rem 0.875rem",
                        borderRadius: "0.625rem",
                        backgroundColor: "#25D366",
                        color: "#FFFFFF",
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        boxShadow: "0 2px 8px rgba(37, 211, 102, 0.25)",
                        transition: "background-color 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#20ba59")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#25D366")}
                    >
                      <FaWhatsapp size={16} />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        padding: "0.625rem 0.875rem",
                        borderRadius: "0.625rem",
                        backgroundColor: "var(--border)",
                        color: "var(--ink-muted)",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        border: "none",
                        cursor: "not-allowed",
                      }}
                    >
                      <FaWhatsapp size={16} />
                      <span>No Phone</span>
                    </button>
                  )}

                  {/* Mail Client Button */}
                  <a
                    href={mailtoUrl}
                    id="open-mail-client-btn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      padding: "0.625rem 0.875rem",
                      borderRadius: "0.625rem",
                      backgroundColor: "var(--bg-raised)",
                      border: "1px solid var(--border)",
                      color: "var(--ink)",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      textDecoration: "none",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--ink)";
                      e.currentTarget.style.backgroundColor = "var(--surface)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.backgroundColor = "var(--bg-raised)";
                    }}
                  >
                    <Mail size={15} style={{ color: "var(--accent)" }} />
                    <span>Open Email</span>
                  </a>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="btn-accent"
                id="close-credentials-modal-btn"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.625rem",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: "0.25rem",
                }}
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerCredentialsModal;
