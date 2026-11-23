import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Store,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  UserPlus,
  RefreshCw,
  ExternalLink,
  Crown,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { adminService } from "../../services/adminService";
// [SINGLE-SELLER MODE] import InviteSellerModal from "./InviteSellerModal";
import { toast } from "react-toastify";

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  // [SINGLE-SELLER MODE] const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await adminService.getOverview();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load dashboard overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const stats = data?.stats || {
    totalCustomers: 0,
    activeCustomers: 0,
    totalSellers: 0,
    activeSellers: 0,
    inactiveSellers: 0,
    pendingKycSellers: 0,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Top Banner / Welcome */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Crown size={22} className="text-amber-500" />
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              Super Admin Dashboard
            </h1>
          </div>
          {/* [SINGLE-SELLER MODE] <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--ink-muted)" }}>Platform governance, merchant onboarding, and customer directory</p> */}
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
            Store overview and customer directory
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={fetchOverview}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.5rem 0.875rem",
              borderRadius: "0.625rem",
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--ink)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          {/* [SINGLE-SELLER MODE] Invite seller button disabled
          <button
            onClick={() => setInviteModalOpen(true)}
            className="btn-accent"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.625rem",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <UserPlus size={16} />
            <span>Invite New Seller</span>
          </button>
          */}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Total Customers */}
        <div
          style={{
            backgroundColor: "var(--surface)",
            borderRadius: "1rem",
            padding: "1.25rem",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Customers
            </span>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", backgroundColor: "rgba(59, 130, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--ink)" }}>
            {loading ? "..." : stats.totalCustomers}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--ink-muted)" }}>
            <span style={{ color: "#10b981", fontWeight: 600 }}>{stats.activeCustomers} active</span>
            <span>•</span>
            <span>{stats.inactiveCustomers || 0} deactivated</span>
          </div>
        </div>

        {/* [SINGLE-SELLER MODE] Multi-vendor KPI cards (Total Merchants, KYC Pending, Add Seller) hidden
        <div
          style={{
            backgroundColor: "var(--surface)",
            borderRadius: "1rem",
            padding: "1.25rem",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Merchants
            </span>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", backgroundColor: "rgba(197, 160, 89, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
              <Store size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--ink)" }}>
            {loading ? "..." : stats.totalSellers}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--ink-muted)" }}>
            <span style={{ color: "#10b981", fontWeight: 600 }}>{stats.activeSellers} active</span>
            <span>•</span>
            <span style={{ color: "var(--red)", fontWeight: 600 }}>{stats.inactiveSellers} inactive</span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "var(--surface)",
            borderRadius: "1rem",
            padding: "1.25rem",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              KYC Reviews Pending
            </span>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", backgroundColor: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.875rem", fontWeight: 800, color: stats.pendingKycSellers > 0 ? "#f59e0b" : "var(--ink)" }}>
            {loading ? "..." : stats.pendingKycSellers}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
            {stats.pendingKycSellers > 0 ? "Merchants waiting for verification" : "All seller KYCs are up to date"}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "var(--surface)",
            borderRadius: "1rem",
            padding: "1.25rem",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, var(--surface) 0%, var(--bg-raised) 100%)",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Merchant Onboarding
            </p>
            <h4 style={{ margin: "0.25rem 0 0", fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)" }}>
              Add Seller with WhatsApp Invite
            </h4>
          </div>
          <button
            onClick={() => setInviteModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              width: "100%",
              padding: "0.5rem",
              borderRadius: "0.5rem",
              backgroundColor: "var(--accent)",
              color: "#fff",
              border: "none",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              marginTop: "0.75rem",
            }}
          >
            <UserPlus size={14} /> Open Invite Modal
          </button>
        </div>
        */}
      </div>

      {/* Grid: Recent Customers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "1.5rem" }}>
        {/* [SINGLE-SELLER MODE] Recent Sellers card hidden
        <div
          style={{
            backgroundColor: "var(--surface)",
            borderRadius: "1rem",
            border: "1px solid var(--border)",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--ink)" }}>
                Recent Sellers
              </h3>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                Latest merchants registered on LyZov
              </p>
            </div>
            <Link
              to="/admin/sellers"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--accent)",
                textDecoration: "none",
              }}
            >
              View All <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {loading ? (
              <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", textAlign: "center", padding: "1.5rem" }}>
                Loading sellers...
              </p>
            ) : data?.recentSellers?.length === 0 ? (
              <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", textAlign: "center", padding: "1.5rem" }}>
                No sellers found. Add your first seller using the button above.
              </p>
            ) : (
              data?.recentSellers?.map((seller) => (
                <div
                  key={seller._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.625rem 0.75rem",
                    borderRadius: "0.625rem",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--bg)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {seller.sellerProfile?.businessName || seller.name}
                      </p>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          padding: "0.15rem 0.4rem",
                          borderRadius: "9999px",
                          backgroundColor: seller.isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: seller.isActive ? "#10b981" : "#ef4444",
                          textTransform: "uppercase",
                        }}
                      >
                        {seller.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "var(--ink-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {seller.email} {seller.phone ? `• ${seller.phone}` : ""}
                    </p>
                  </div>

                  <Link
                    to={`/admin/sellers/${seller._id}`}
                    style={{
                      padding: "0.35rem 0.6rem",
                      borderRadius: "0.375rem",
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--surface)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--ink)",
                      textDecoration: "none",
                      flexShrink: 0,
                    }}
                  >
                    Details
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
        */}

        {/* Recent Customers */}
        <div
          style={{
            backgroundColor: "var(--surface)",
            borderRadius: "1rem",
            border: "1px solid var(--border)",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--ink)" }}>
                Recent Customers
              </h3>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                Latest user accounts on the storefront
              </p>
            </div>
            <Link
              to="/admin/customers"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--accent)",
                textDecoration: "none",
              }}
            >
              View All <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {loading ? (
              <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", textAlign: "center", padding: "1.5rem" }}>
                Loading customers...
              </p>
            ) : data?.recentCustomers?.length === 0 ? (
              <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", textAlign: "center", padding: "1.5rem" }}>
                No customer accounts yet.
              </p>
            ) : (
              data?.recentCustomers?.map((cust) => (
                <div
                  key={cust._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.625rem 0.75rem",
                    borderRadius: "0.625rem",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--bg)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cust.name}
                      </p>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          padding: "0.15rem 0.4rem",
                          borderRadius: "9999px",
                          backgroundColor: cust.isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: cust.isActive ? "#10b981" : "#ef4444",
                          textTransform: "uppercase",
                        }}
                      >
                        {cust.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "var(--ink-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cust.email}
                    </p>
                  </div>

                  <span style={{ fontSize: "0.75rem", color: "var(--ink-subtle)" }}>
                    {new Date(cust.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* [SINGLE-SELLER MODE] Invite Seller Modal disabled
      <InviteSellerModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onSellerCreated={() => fetchOverview()}
      />
      */}
    </div>
  );
};

export default AdminDashboardPage;
