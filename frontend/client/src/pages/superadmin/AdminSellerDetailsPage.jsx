import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  Save,
  X,
  CreditCard,
  FileText,
  MapPin,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { adminService } from "../../services/adminService";
import SellerCredentialsModal from "./SellerCredentialsModal";
import ConfirmActionModal from "./ConfirmActionModal";
import { toast } from "react-toastify";

const AdminSellerDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showMaskedPan, setShowMaskedPan] = useState(false);
  const [showMaskedAadhaar, setShowMaskedAadhaar] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [confirmStatusModalOpen, setConfirmStatusModalOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Editable Form State
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    storeBio: "",
    gstNumber: "",
    businessAddress: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
    },
    bankDetails: {
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
    },
  });

  const fetchSellerDetails = async () => {
    try {
      setLoading(true);
      const res = await adminService.getSellerById(id);
      if (res.success && res.data?.seller) {
        const s = res.data.seller;
        setSeller(s);
        setEditForm({
          name: s.name || "",
          email: s.email || "",
          phone: s.phone || "",
          businessName: s.sellerProfile?.businessName || "",
          storeBio: s.sellerProfile?.storeBio || "",
          gstNumber: s.sellerProfile?.gstNumber || "",
          businessAddress: {
            addressLine1: s.sellerProfile?.businessAddress?.addressLine1 || "",
            addressLine2: s.sellerProfile?.businessAddress?.addressLine2 || "",
            city: s.sellerProfile?.businessAddress?.city || "",
            state: s.sellerProfile?.businessAddress?.state || "",
            postalCode: s.sellerProfile?.businessAddress?.postalCode || "",
            country: s.sellerProfile?.businessAddress?.country || "India",
          },
          bankDetails: {
            accountHolderName: s.sellerProfile?.bankDetails?.accountHolderName || "",
            accountNumber: s.sellerProfile?.bankDetails?.accountNumber || "",
            ifscCode: s.sellerProfile?.bankDetails?.ifscCode || "",
            bankName: s.sellerProfile?.bankDetails?.bankName || "",
          },
        });
      } else {
        toast.error("Seller not found");
        navigate("/admin/sellers");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load seller details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerDetails();
  }, [id]);

  const handlePromptToggleStatus = () => {
    if (!seller) return;
    setConfirmStatusModalOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!seller) return;
    const nextStatus = !seller.isActive;
    const action = nextStatus ? "activate" : "deactivate";

    try {
      setStatusLoading(true);
      const res = await adminService.updateSellerStatus(seller._id, nextStatus);
      if (res.success) {
        toast.success(`Seller ${action}d successfully`);
        setSeller((prev) => ({ ...prev, isActive: nextStatus }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} seller`);
    } finally {
      setStatusLoading(false);
      setConfirmStatusModalOpen(false);
    }
  };

  const handleKycStatusChange = async (status, reason = "") => {
    try {
      const res = await adminService.updateSellerKyc(seller._id, {
        kycStatus: status,
        kycRejectionReason: reason,
      });
      if (res.success) {
        toast.success(`KYC status updated to ${status}`);
        setSeller(res.data.seller);
        setRejectModalOpen(false);
        setRejectionReason("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update KYC status");
    }
  };

  const handleViewKycDoc = async (docType) => {
    try {
      const res = await adminService.getSellerKycDocument(seller._id, docType);
      const docUrl = res.data?.url || res.data?.signedUrl;
      if (res.success && docUrl) {
        window.open(docUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Document link not found");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate document access link");
    }
  };

  const handleConfirmDeleteSeller = async () => {
    if (!seller) return;
    try {
      setDeleteLoading(true);
      const res = await adminService.deleteSeller(seller._id);
      if (res.success) {
        toast.success(res.message || "Seller account deleted and email permanently blacklisted");
        navigate("/admin/sellers");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete seller account");
    } finally {
      setDeleteLoading(false);
      setConfirmDeleteModalOpen(false);
    }
  };


  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await adminService.updateSeller(seller._id, editForm);
      if (res.success) {
        toast.success("Seller profile updated successfully");
        setSeller(res.data.seller);
        setIsEditing(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update seller");
    } finally {
      setSaving(false);
    }
  };

  const handleResendCredentials = () => {
    setCredentialsModalOpen(true);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--ink-muted)" }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.75rem" }} />
        <p>Loading seller details...</p>
      </div>
    );
  }

  if (!seller) return null;

  const kycStatus = seller.sellerProfile?.kycStatus || "pending";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Back button & Title */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => navigate("/admin/sellers")}
            className="btn-icon p-2"
            style={{ borderRadius: "0.5rem", border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
            aria-label="Back to sellers"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.375rem", fontWeight: 800, color: "var(--ink)" }}>
              {seller.sellerProfile?.businessName || seller.name}
            </h1>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--ink-muted)" }}>
              Seller ID: <code style={{ fontSize: "11px", color: "var(--accent)" }}>{seller._id}</code>
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {seller.phone && (
            <a
              href={`https://wa.me/${String(seller.phone).replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 0.875rem",
                borderRadius: "0.5rem",
                backgroundColor: "#25D366",
                color: "#fff",
                fontSize: "0.8125rem",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <FaWhatsapp size={15} /> WhatsApp Chat
            </a>
          )}

          <button
            onClick={handleResendCredentials}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.875rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--ink)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <KeyRound size={14} /> Reset & Resend Invite
          </button>

          <button
            onClick={handlePromptToggleStatus}
            id="seller-details-toggle-status-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.875rem",
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: seller.isActive ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
              color: seller.isActive ? "#ef4444" : "#10b981",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {seller.isActive ? "Deactivate Seller" : "Activate Seller"}
          </button>

          <button
            onClick={() => setConfirmDeleteModalOpen(true)}
            id="seller-details-delete-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.875rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              color: "#ef4444",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Trash2 size={14} /> Delete Account
          </button>
        </div>
      </div>

      {/* Main Grid: Details & Compliance */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "1.5rem" }}>
        {/* Left Column: Business & Profile Information */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Card: Account & Business Profile */}
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "1rem",
              border: "1px solid var(--border)",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Building2 size={16} className="text-amber-500" />
                <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)" }}>
                  Business Information
                </h3>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  background: "none",
                  border: "none",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--accent)",
                  cursor: "pointer",
                }}
              >
                {isEditing ? <><X size={13} /> Cancel</> : <><Edit2 size={13} /> Edit Details</>}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-muted)", marginBottom: "0.25rem" }}>Business Name</label>
                  <input
                    type="text"
                    value={editForm.businessName}
                    onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "0.8125rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-muted)", marginBottom: "0.25rem" }}>Owner Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "0.8125rem" }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-muted)", marginBottom: "0.25rem" }}>Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "0.8125rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-muted)", marginBottom: "0.25rem" }}>Phone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "0.8125rem" }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-muted)", marginBottom: "0.25rem" }}>GSTIN</label>
                  <input
                    type="text"
                    value={editForm.gstNumber}
                    onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "0.8125rem" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-accent"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.35rem",
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    marginTop: "0.5rem",
                  }}
                >
                  <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", fontSize: "0.8125rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-muted)" }}>Owner Name:</span>
                  <strong style={{ color: "var(--ink)" }}>{seller.name}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-muted)" }}>Email:</span>
                  <strong style={{ color: "var(--ink)" }}>{seller.email}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-muted)" }}>Phone:</span>
                  <strong style={{ color: "var(--ink)" }}>{seller.phone || "Not set"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-muted)" }}>GST Number:</span>
                  <strong style={{ color: "var(--ink)" }}>{seller.sellerProfile?.gstNumber || "Not provided"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-muted)" }}>Store Slug:</span>
                  {seller.sellerProfile?.storeSlug ? (
                    <Link
                      to={`/store/${seller.sellerProfile.storeSlug}`}
                      target="_blank"
                      style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                    >
                      /{seller.sellerProfile.storeSlug} <ExternalLink size={12} />
                    </Link>
                  ) : (
                    <span style={{ color: "var(--ink-muted)" }}>Not generated</span>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-muted)" }}>Platform Commission:</span>
                  <strong style={{ color: "var(--ink)" }}>{seller.sellerProfile?.commissionRate ?? 10}%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-muted)" }}>Store Bio:</span>
                  <span style={{ color: "var(--ink)", maxWidth: "60%", textAlign: "right" }}>{seller.sellerProfile?.storeBio || "None"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Card: Business Address */}
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "1rem",
              border: "1px solid var(--border)",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
              <MapPin size={16} className="text-amber-500" />
              <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)" }}>
                Business Address
              </h3>
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--ink)", lineHeight: 1.6 }}>
              {seller.sellerProfile?.businessAddress?.addressLine1 ? (
                <>
                  <p style={{ margin: 0, fontWeight: 600 }}>{seller.sellerProfile.businessAddress.addressLine1}</p>
                  {seller.sellerProfile.businessAddress.addressLine2 && (
                    <p style={{ margin: 0 }}>{seller.sellerProfile.businessAddress.addressLine2}</p>
                  )}
                  <p style={{ margin: 0 }}>
                    {seller.sellerProfile.businessAddress.city}, {seller.sellerProfile.businessAddress.state} - {seller.sellerProfile.businessAddress.postalCode}
                  </p>
                  <p style={{ margin: 0, color: "var(--ink-muted)" }}>{seller.sellerProfile.businessAddress.country}</p>
                </>
              ) : (
                <p style={{ margin: 0, color: "var(--ink-muted)" }}>No business address registered yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: KYC Verification & Banking */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Card: KYC Verification */}
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "1rem",
              border: "1px solid var(--border)",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ShieldCheck size={16} className="text-amber-500" />
                <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)" }}>
                  KYC Verification Status
                </h3>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "9999px",
                  backgroundColor:
                    kycStatus === "verified"
                      ? "rgba(16, 185, 129, 0.15)"
                      : kycStatus === "rejected"
                      ? "rgba(239, 68, 68, 0.15)"
                      : "rgba(245, 158, 11, 0.15)",
                  color:
                    kycStatus === "verified"
                      ? "#10b981"
                      : kycStatus === "rejected"
                      ? "#ef4444"
                      : "#f59e0b",
                }}
              >
                {kycStatus}
              </span>
            </div>

            {/* Documents & Identification Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", fontSize: "0.8125rem", marginBottom: "1.25rem" }}>
              {/* PAN */}
              <div style={{ backgroundColor: "var(--bg)", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-muted)" }}>PAN Card</span>
                  {(seller.sellerProfile?.panDocument || seller.sellerProfile?.panNumber) && (
                    <button
                      type="button"
                      onClick={() => handleViewKycDoc("pan")}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "11px", color: "var(--accent)", fontWeight: 600 }}
                    >
                      View Secure Doc <ExternalLink size={11} />
                    </button>
                  )}
                </div>
                <strong style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "var(--ink)" }}>
                  {seller.sellerProfile?.panNumber || "No PAN recorded"}
                </strong>
              </div>

              {/* Aadhaar */}
              <div style={{ backgroundColor: "var(--bg)", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-muted)" }}>Aadhaar Card</span>
                  {(seller.sellerProfile?.aadhaarDocument || seller.sellerProfile?.aadhaarNumber) && (
                    <button
                      type="button"
                      onClick={() => handleViewKycDoc("aadhaar")}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "11px", color: "var(--accent)", fontWeight: 600 }}
                    >
                      View Secure Doc <ExternalLink size={11} />
                    </button>
                  )}
                </div>
                <strong style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "var(--ink)" }}>
                  {seller.sellerProfile?.aadhaarNumber || "No Aadhaar recorded"}
                </strong>
              </div>

              {seller.sellerProfile?.kycRejectionReason && (
                <div style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#ef4444" }}>Rejection Reason:</span>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--ink)", fontSize: "0.75rem" }}>
                    {seller.sellerProfile.kycRejectionReason}
                  </p>
                </div>
              )}
            </div>

            {/* KYC Admin Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button
                onClick={() => handleKycStatusChange("verified")}
                disabled={kycStatus === "verified"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.35rem",
                  padding: "0.625rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  backgroundColor: "#10b981",
                  color: "#fff",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  cursor: kycStatus === "verified" ? "not-allowed" : "pointer",
                  opacity: kycStatus === "verified" ? 0.6 : 1,
                }}
              >
                <CheckCircle2 size={15} /> Approve KYC
              </button>

              <button
                onClick={() => setRejectModalOpen(true)}
                disabled={kycStatus === "rejected"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.35rem",
                  padding: "0.625rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  cursor: kycStatus === "rejected" ? "not-allowed" : "pointer",
                  opacity: kycStatus === "rejected" ? 0.6 : 1,
                }}
              >
                <XCircle size={15} /> Reject KYC
              </button>
            </div>
          </div>

          {/* Card: Bank & Payout Details */}
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "1rem",
              border: "1px solid var(--border)",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
              <CreditCard size={16} className="text-amber-500" />
              <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)" }}>
                Settlement & Bank Details
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-muted)" }}>Account Holder:</span>
                <strong style={{ color: "var(--ink)" }}>{seller.sellerProfile?.bankDetails?.accountHolderName || "Not set"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-muted)" }}>Bank Name:</span>
                <strong style={{ color: "var(--ink)" }}>{seller.sellerProfile?.bankDetails?.bankName || "Not set"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-muted)" }}>Account Number:</span>
                <strong style={{ color: "var(--ink)", fontFamily: "monospace" }}>{seller.sellerProfile?.bankDetails?.accountNumber || "Not set"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-muted)" }}>IFSC Code:</span>
                <strong style={{ color: "var(--ink)", fontFamily: "monospace" }}>{seller.sellerProfile?.bankDetails?.ifscCode || "Not set"}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal Dialog */}
      {rejectModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
          <div style={{ width: "100%", maxWidth: "26rem", backgroundColor: "var(--surface)", borderRadius: "1rem", padding: "1.5rem", border: "1px solid var(--border)" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 700, color: "var(--ink)" }}>Reject Seller KYC</h3>
            <p style={{ margin: "0 0 1rem", fontSize: "0.8125rem", color: "var(--ink-muted)" }}>
              Provide a reason explaining why the seller KYC documents were rejected:
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Document image is blurry or name doesn't match..."
              style={{ width: "100%", padding: "0.625rem", borderRadius: "0.5rem", border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "0.8125rem", outline: "none", marginBottom: "1rem" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button onClick={() => setRejectModalOpen(false)} style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "transparent", color: "var(--ink-muted)", fontSize: "0.8125rem" }}>
                Cancel
              </button>
              <button onClick={() => handleKycStatusChange("rejected", rejectionReason)} style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", backgroundColor: "#ef4444", color: "#fff", fontWeight: 700, fontSize: "0.8125rem" }}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seller Credentials Modal */}
      <SellerCredentialsModal
        isOpen={credentialsModalOpen}
        onClose={() => setCredentialsModalOpen(false)}
        seller={seller}
      />

      {/* Account Status Confirmation Modal */}
      <ConfirmActionModal
        isOpen={confirmStatusModalOpen}
        onClose={() => setConfirmStatusModalOpen(false)}
        onConfirm={handleConfirmToggleStatus}
        title={seller?.isActive ? "Deactivate Seller Account" : "Activate Seller Account"}
        message={
          seller
            ? `Are you sure you want to ${
                seller.isActive ? "deactivate" : "activate"
              } seller "${seller.sellerProfile?.businessName || seller.name}"? ${
                seller.isActive
                  ? "Their storefront and product listings will be temporarily hidden from marketplace buyers."
                  : "Their storefront and active products will be immediately visible to marketplace buyers."
              }`
            : ""
        }
        confirmText={seller?.isActive ? "Deactivate Account" : "Activate Account"}
        confirmVariant={seller?.isActive ? "danger" : "accent"}
        loading={statusLoading}
      />

      {/* Delete Seller Confirmation Modal */}
      <ConfirmActionModal
        isOpen={confirmDeleteModalOpen}
        onClose={() => setConfirmDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteSeller}
        title="Permanently Terminate Seller Account"
        message={
          seller
            ? `Are you sure you want to permanently delete seller "${seller.sellerProfile?.businessName || seller.name}" (${seller.email})?\n\nWARNING: All of this merchant's products will be hidden from the marketplace, seller sessions revoked, and this email (${seller.email}) will be PERMANENTLY BLACKLISTED. No user or seller account can EVER be registered with this email again.`
            : ""
        }
        confirmText="Delete & Blacklist Email"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default AdminSellerDetailsPage;
