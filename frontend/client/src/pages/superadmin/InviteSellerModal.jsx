import { useState } from "react";
import { X, Copy, Check, Send, Sparkles, RefreshCw, AlertCircle, Building2, User, Mail, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { adminService } from "../../services/adminService";
import { toast } from "react-toastify";

const generateRandomPassword = () => {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LyZov#${randomPart}!`;
};

const InviteSellerModal = ({ isOpen, onClose, onSellerCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    commissionRate: 10,
    storeBio: "",
    sendEmail: true,
  });

  const [tempPassword, setTempPassword] = useState(generateRandomPassword());
  const [loading, setLoading] = useState(false);
  const [createdData, setCreatedData] = useState(null); // Result from server
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegeneratePassword = () => {
    setTempPassword(generateRandomPassword());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Please enter seller name and email");
      return;
    }

    try {
      setLoading(true);
      const res = await adminService.inviteSeller({
        ...formData,
        tempPassword,
      });

      if (res.success) {
        setCreatedData(res.data);
        toast.success("Seller account created successfully!");
        if (onSellerCreated) onSellerCreated(res.data.seller);
      } else {
        toast.error(res.message || "Failed to create seller");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to invite seller");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdData) return;
    const credText = `LyZov Seller Credentials:\nPortal: https://lyzov.com/login\nEmail: ${createdData.seller?.email}\nTemporary Password: ${createdData.temporaryPassword}`;
    navigator.clipboard.writeText(credText);
    setCopied(true);
    toast.info("Credentials copied to clipboard");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClose = () => {
    setCreatedData(null);
    setFormData({
      name: "",
      businessName: "",
      email: "",
      phone: "",
      commissionRate: 10,
      storeBio: "",
      sendEmail: true,
    });
    setTempPassword(generateRandomPassword());
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "34rem",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--surface)",
          borderRadius: "1.25rem",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-xl)",
          overflow: "hidden",
          animation: "modalFadeIn 0.2s ease-out",
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div
              style={{
                width: "2.25rem",
                height: "2.25rem",
                borderRadius: "0.75rem",
                background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--ink)" }}>
                {createdData ? "Seller Account Created" : "Invite New Seller"}
              </h3>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                {createdData
                  ? "Share credentials via WhatsApp or email"
                  : "Create seller profile and auto-generate credentials"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-muted)",
              cursor: "pointer",
              padding: "0.25rem",
              borderRadius: "0.5rem",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
          {!createdData ? (
            /* Step 1: Input Form */
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.35rem" }}>
                  Seller Full Name *
                </label>
                <div style={{ position: "relative" }}>
                  <User size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--ink-muted)" }} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Vikram Sharma"
                    required
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.875rem 0.625rem 2.25rem",
                      borderRadius: "0.625rem",
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--bg)",
                      color: "var(--ink)",
                      fontSize: "0.875rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.35rem" }}>
                  Business / Store Name
                </label>
                <div style={{ position: "relative" }}>
                  <Building2 size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--ink-muted)" }} />
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="e.g. Royal Tailors & Co."
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.875rem 0.625rem 2.25rem",
                      borderRadius: "0.625rem",
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--bg)",
                      color: "var(--ink)",
                      fontSize: "0.875rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.35rem" }}>
                    Email Address *
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--ink-muted)" }} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="seller@business.com"
                      required
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem 0.625rem 2.25rem",
                        borderRadius: "0.625rem",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--bg)",
                        color: "var(--ink)",
                        fontSize: "0.875rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.35rem" }}>
                    Phone (for WhatsApp)
                  </label>
                  <div style={{ position: "relative" }}>
                    <Phone size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--ink-muted)" }} />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 9876543210"
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem 0.625rem 2.25rem",
                        borderRadius: "0.625rem",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--bg)",
                        color: "var(--ink)",
                        fontSize: "0.875rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.35rem" }}>
                  Platform Commission Fee (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  name="commissionRate"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, commissionRate: Number(e.target.value) }))}
                  placeholder="10"
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "0.625rem",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--bg)",
                    color: "var(--ink)",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "0.25rem", display: "block" }}>
                  Percentage deducted from merchant order items before weekly payout settlement.
                </span>
              </div>

              {/* Temporary Password Box */}
              <div
                style={{
                  backgroundColor: "var(--bg-raised)",
                  borderRadius: "0.75rem",
                  padding: "0.875rem 1rem",
                  border: "1px dashed var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: "0.6875rem", textTransform: "uppercase", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.05em" }}>
                    Auto-Generated Temp Password
                  </p>
                  <code style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--accent)" }}>
                    {tempPassword}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={handleRegeneratePassword}
                  title="Generate new password"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    background: "none",
                    border: "1px solid var(--border)",
                    padding: "0.35rem 0.6rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                    color: "var(--ink)",
                    cursor: "pointer",
                  }}
                >
                  <RefreshCw size={12} /> Regenerate
                </button>
              </div>

              {/* Email Invitation Checkbox */}
              <label style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer", fontSize: "0.8125rem", color: "var(--ink)" }}>
                <input
                  type="checkbox"
                  name="sendEmail"
                  checked={formData.sendEmail}
                  onChange={handleInputChange}
                  style={{ width: "1rem", height: "1rem", accentColor: "var(--accent)", cursor: "pointer" }}
                />
                <span>Send invitation email immediately with login credentials</span>
              </label>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    padding: "0.625rem 1.25rem",
                    borderRadius: "0.625rem",
                    border: "1px solid var(--border)",
                    backgroundColor: "transparent",
                    color: "var(--ink-muted)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-accent"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.625rem 1.5rem",
                    borderRadius: "0.625rem",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Create & Invite Seller
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Step 2: Success & Credentials Sharing */
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "0.75rem",
                  padding: "0.875rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", backgroundColor: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                  <Check size={16} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#10b981" }}>
                    Seller Added Successfully!
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                    Account is active and ready to log in.
                  </p>
                </div>
              </div>

              {/* Credentials Card */}
              <div
                style={{
                  backgroundColor: "var(--bg-raised)",
                  borderRadius: "0.875rem",
                  border: "1px solid var(--border)",
                  padding: "1rem 1.25rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <p style={{ margin: 0, fontSize: "0.6875rem", textTransform: "uppercase", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.06em" }}>
                    Login Credentials
                  </p>
                  <button
                    onClick={handleCopyCredentials}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      background: "none",
                      border: "none",
                      color: copied ? "#10b981" : "var(--accent)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy All"}
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--ink-muted)" }}>Email:</span>
                    <strong style={{ color: "var(--ink)" }}>{createdData.seller?.email}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--ink-muted)" }}>Temp Password:</span>
                    <code style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--accent)", backgroundColor: "var(--surface)", padding: "0.15rem 0.5rem", borderRadius: "0.375rem" }}>
                      {createdData.temporaryPassword}
                    </code>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--ink-muted)" }}>Email Delivery:</span>
                    <span style={{ fontWeight: 600, color: createdData.emailStatus === "sent" ? "#10b981" : "var(--ink-muted)" }}>
                      {createdData.emailStatus === "sent" ? "Sent Successfully" : createdData.emailStatus === "skipped" ? "Skipped" : "Simulated/Logged"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Share on WhatsApp Button */}
              {createdData.whatsappUrl && (
                <a
                  href={createdData.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.625rem",
                    padding: "0.875rem 1.25rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "#25D366",
                    color: "#FFFFFF",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#20ba59")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#25D366")}
                >
                  <FaWhatsapp size={20} />
                  <span>Send Credentials via WhatsApp</span>
                </a>
              )}

              <button
                onClick={handleClose}
                className="btn-accent"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.625rem",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteSellerModal;
