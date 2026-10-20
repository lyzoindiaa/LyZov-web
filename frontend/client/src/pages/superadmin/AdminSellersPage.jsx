import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Store,
  Search,
  Filter,
  UserPlus,
  RefreshCw,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Eye,
  KeyRound,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { adminService } from "../../services/adminService";
import InviteSellerModal from "./InviteSellerModal";
import { toast } from "react-toastify";

const AdminSellersPage = () => {
  const [sellers, setSellers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "active", "inactive"
  const [kycFilter, setKycFilter] = useState("all"); // "all", "pending", "submitted", "verified", "rejected"
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchSellers = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: pagination.limit };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      if (kycFilter !== "all") params.kycStatus = kycFilter;

      const res = await adminService.getSellers(params);
      if (res.success) {
        setSellers(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load sellers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers(1);
  }, [statusFilter, kycFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSellers(1);
  };

  const handleToggleStatus = async (seller) => {
    const nextStatus = !seller.isActive;
    const actionWord = nextStatus ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${actionWord} seller "${seller.sellerProfile?.businessName || seller.name}"?`)) {
      return;
    }

    try {
      setActionLoadingId(seller._id);
      const res = await adminService.updateSellerStatus(seller._id, nextStatus);
      if (res.success) {
        toast.success(`Seller ${actionWord}d successfully`);
        setSellers((prev) =>
          prev.map((s) => (s._id === seller._id ? { ...s, isActive: nextStatus } : s))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${actionWord} seller`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResendCredentials = async (seller) => {
    if (!window.confirm(`Regenerate a new temporary password and resend credentials to ${seller.email}?`)) {
      return;
    }

    try {
      setActionLoadingId(seller._id);
      const res = await adminService.resendSellerInvite(seller._id);
      if (res.success) {
        toast.success("New credentials generated!");
        if (res.data?.whatsappUrl) {
          window.open(res.data.whatsappUrl, "_blank");
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to regenerate credentials");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getKycBadge = (status) => {
    switch (status) {
      case "verified":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.5rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
            <CheckCircle size={11} /> Verified
          </span>
        );
      case "submitted":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.5rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
            <Clock size={11} /> Review Needed
          </span>
        );
      case "rejected":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.5rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
            <XCircle size={11} /> Rejected
          </span>
        );
      default:
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.5rem", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
            <AlertTriangle size={11} /> Pending
          </span>
        );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)" }}>
            Sellers Directory
          </h1>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
            Manage merchant accounts, KYC verification, and status
          </p>
        </div>

        <button
          onClick={() => setInviteModalOpen(true)}
          className="btn-accent"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            borderRadius: "0.625rem",
            fontSize: "0.875rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <UserPlus size={16} />
          <span>Add / Invite Seller</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          backgroundColor: "var(--surface)",
          borderRadius: "1rem",
          border: "1px solid var(--border)",
          padding: "1rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: "1 1 280px", maxWidth: "420px" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--ink-muted)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by business, name, email, phone..."
              style={{
                width: "100%",
                padding: "0.5rem 0.875rem 0.5rem 2.25rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--ink)",
                fontSize: "0.8125rem",
                outline: "none",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "0.5rem 0.875rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-raised)",
              color: "var(--ink)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>

        {/* Filter Tabs */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", backgroundColor: "var(--bg)", padding: "0.25rem", borderRadius: "0.5rem", border: "1px solid var(--border)" }}>
            {["all", "active", "inactive"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "0.3rem 0.65rem",
                  borderRadius: "0.375rem",
                  border: "none",
                  backgroundColor: statusFilter === s ? "var(--surface)" : "transparent",
                  color: statusFilter === s ? "var(--ink)" : "var(--ink-muted)",
                  fontSize: "0.75rem",
                  fontWeight: statusFilter === s ? 700 : 500,
                  boxShadow: statusFilter === s ? "var(--shadow-sm)" : "none",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* KYC Filter */}
          <select
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
            style={{
              padding: "0.45rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg)",
              color: "var(--ink)",
              fontSize: "0.75rem",
              fontWeight: 600,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All KYC Statuses</option>
            <option value="pending">KYC Pending</option>
            <option value="submitted">KYC Submitted</option>
            <option value="verified">KYC Verified</option>
            <option value="rejected">KYC Rejected</option>
          </select>
        </div>
      </div>

      {/* Sellers Table */}
      <div
        style={{
          backgroundColor: "var(--surface)",
          borderRadius: "1rem",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-raised)", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.06em" }}>
                  Merchant / Store
                </th>
                <th style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.06em" }}>
                  Contact Info
                </th>
                <th style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.06em" }}>
                  KYC Status
                </th>
                <th style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.06em" }}>
                  Account Status
                </th>
                <th style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.06em" }}>
                  Joined Date
                </th>
                <th style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.06em", textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: "3rem", textAlign: "center", color: "var(--ink-muted)" }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
                    Loading merchants...
                  </td>
                </tr>
              ) : sellers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "3rem", textAlign: "center", color: "var(--ink-muted)" }}>
                    No sellers found matching the criteria.
                  </td>
                </tr>
              ) : (
                sellers.map((seller) => (
                  <tr
                    key={seller._id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-raised)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Merchant / Store */}
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "2.25rem",
                            height: "2.25rem",
                            borderRadius: "0.5rem",
                            backgroundColor: "var(--bg-raised)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--accent)",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          <Store size={15} />
                        </div>
                        <div>
                          <Link
                            to={`/admin/sellers/${seller._id}`}
                            style={{
                              fontWeight: 700,
                              color: "var(--ink)",
                              textDecoration: "none",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink)")}
                          >
                            {seller.sellerProfile?.businessName || "Unnamed Store"}
                          </Link>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                            Owner: {seller.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td style={{ padding: "1rem" }}>
                      <p style={{ margin: 0, fontWeight: 600, color: "var(--ink)" }}>{seller.email}</p>
                      <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                        {seller.phone || "No phone added"}
                      </p>
                    </td>

                    {/* KYC Status */}
                    <td style={{ padding: "1rem" }}>
                      {getKycBadge(seller.sellerProfile?.kycStatus)}
                    </td>

                    {/* Account Status Toggle */}
                    <td style={{ padding: "1rem" }}>
                      <button
                        onClick={() => handleToggleStatus(seller)}
                        disabled={actionLoadingId === seller._id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.25rem 0.625rem",
                          borderRadius: "9999px",
                          border: "none",
                          fontSize: "11px",
                          fontWeight: 700,
                          backgroundColor: seller.isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: seller.isActive ? "#10b981" : "#ef4444",
                          cursor: "pointer",
                          transition: "opacity 0.15s",
                        }}
                        title={seller.isActive ? "Click to deactivate" : "Click to activate"}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: seller.isActive ? "#10b981" : "#ef4444",
                          }}
                        />
                        {seller.isActive ? "Active" : "Deactivated"}
                      </button>
                    </td>

                    {/* Joined Date */}
                    <td style={{ padding: "1rem", color: "var(--ink-muted)" }}>
                      {new Date(seller.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                        {seller.phone && (
                          <a
                            href={`https://wa.me/${String(seller.phone).replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat on WhatsApp"
                            style={{
                              padding: "0.4rem",
                              borderRadius: "0.375rem",
                              backgroundColor: "rgba(37, 211, 102, 0.1)",
                              color: "#25D366",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              textDecoration: "none",
                            }}
                          >
                            <FaWhatsapp size={14} />
                          </a>
                        )}

                        <button
                          onClick={() => handleResendCredentials(seller)}
                          disabled={actionLoadingId === seller._id}
                          title="Regenerate & Resend Temporary Password"
                          style={{
                            padding: "0.4rem",
                            borderRadius: "0.375rem",
                            backgroundColor: "var(--bg)",
                            border: "1px solid var(--border)",
                            color: "var(--ink)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <KeyRound size={13} />
                        </button>

                        <Link
                          to={`/admin/sellers/${seller._id}`}
                          title="View Full Details"
                          style={{
                            padding: "0.35rem 0.65rem",
                            borderRadius: "0.375rem",
                            border: "1px solid var(--border)",
                            backgroundColor: "var(--surface)",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--ink)",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.8125rem",
              color: "var(--ink-muted)",
            }}
          >
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} sellers)
            </span>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchSellers(pagination.page - 1)}
                style={{
                  padding: "0.35rem 0.65rem",
                  borderRadius: "0.375rem",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--surface)",
                  color: "var(--ink)",
                  cursor: pagination.page <= 1 ? "not-allowed" : "pointer",
                  opacity: pagination.page <= 1 ? 0.5 : 1,
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchSellers(pagination.page + 1)}
                style={{
                  padding: "0.35rem 0.65rem",
                  borderRadius: "0.375rem",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--surface)",
                  color: "var(--ink)",
                  cursor: pagination.page >= pagination.totalPages ? "not-allowed" : "pointer",
                  opacity: pagination.page >= pagination.totalPages ? 0.5 : 1,
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <InviteSellerModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onSellerCreated={() => fetchSellers(1)}
      />
    </div>
  );
};

export default AdminSellersPage;
