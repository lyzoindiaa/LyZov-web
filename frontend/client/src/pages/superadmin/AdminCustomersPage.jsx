import { useState, useEffect } from "react";
import {
  Users,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  User,
  Phone,
  Mail,
  Calendar,
  Trash2,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import ConfirmActionModal from "./ConfirmActionModal";
import Pagination from "../../components/common/Pagination";
import { toast } from "react-toastify";

const AdminCustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "active", "inactive"
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [statusModal, setStatusModal] = useState({ isOpen: false, customer: null, nextStatus: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, customer: null });

  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: pagination.limit };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await adminService.getCustomers(params);
      if (res.success) {
        setCustomers(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers(1);
  };

  const handlePromptToggleStatus = (customer) => {
    setStatusModal({
      isOpen: true,
      customer,
      nextStatus: !customer.isActive,
    });
  };

  const handleConfirmToggleStatus = async () => {
    const { customer, nextStatus } = statusModal;
    if (!customer) return;
    const actionWord = nextStatus ? "activate" : "deactivate";

    try {
      setActionLoadingId(customer._id);
      const res = await adminService.updateCustomerStatus(customer._id, nextStatus);
      if (res.success) {
        toast.success(`Customer ${actionWord}d successfully`);
        setCustomers((prev) =>
          prev.map((c) => (c._id === customer._id ? { ...c, isActive: nextStatus } : c))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${actionWord} customer`);
    } finally {
      setActionLoadingId(null);
      setStatusModal({ isOpen: false, customer: null, nextStatus: null });
    }
  };

  const handlePromptDeleteCustomer = (customer) => {
    setDeleteModal({
      isOpen: true,
      customer,
    });
  };

  const handleConfirmDeleteCustomer = async () => {
    const { customer } = deleteModal;
    if (!customer) return;

    try {
      setActionLoadingId(customer._id);
      const res = await adminService.deleteCustomer(customer._id);
      if (res.success) {
        toast.success(`Customer account deleted and ${customer.email} blacklisted`);
        setCustomers((prev) => prev.filter((c) => c._id !== customer._id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete customer");
    } finally {
      setActionLoadingId(null);
      setDeleteModal({ isOpen: false, customer: null });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)" }}>
            Customer Accounts
          </h1>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
            Directory of registered shoppers, profile statuses, and access control
          </p>
        </div>

        <button
          onClick={() => fetchCustomers(pagination.page)}
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
      </div>

      {/* Filter & Search */}
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
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: "1 1 280px", maxWidth: "420px" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--ink-muted)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, email, phone..."
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
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Search
          </button>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.25rem", backgroundColor: "var(--bg)", padding: "0.25rem", borderRadius: "0.5rem", border: "1px solid var(--border)" }}>
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
      </div>

      {/* Customers Table */}
      <div
        style={{
          backgroundColor: "var(--surface)",
          borderRadius: "1rem",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: "820px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-raised)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                <th style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.06em" }}>
                  Customer
                </th>
                <th style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.06em" }}>
                  Contact
                </th>
                <th style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.06em" }}>
                  Profile Completed
                </th>
                <th style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.06em" }}>
                  Status
                </th>
                <th style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.06em" }}>
                  Joined Date
                </th>
                <th style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.06em", textAlign: "right" }}>
                  Action
                </th>
              </tr>
            </thead>
            {!loading && customers.length > 0 && (
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c._id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-raised)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Customer */}
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <div
                          style={{
                            width: "2rem",
                            height: "2rem",
                            borderRadius: "50%",
                            backgroundColor: "var(--bg-raised)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--ink)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            flexShrink: 0,
                          }}
                        >
                          {c.name?.[0]?.toUpperCase() || "C"}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: "var(--ink)" }}>{c.name}</p>
                          <p style={{ margin: 0, fontSize: "11px", color: "var(--ink-muted)" }}>
                            Auth: {c.authProvider || "local"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td style={{ padding: "1rem" }}>
                      <p style={{ margin: 0, fontWeight: 600, color: "var(--ink)" }}>{c.email}</p>
                      <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                        {c.phone || "No phone added"}
                      </p>
                    </td>

                    {/* Profile Completed */}
                    <td style={{ padding: "1rem", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: "0.25rem 0.625rem",
                          borderRadius: "9999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          backgroundColor: c.profileComplete ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: c.profileComplete ? "#10b981" : "#f59e0b",
                        }}
                      >
                        {c.profileComplete ? "Complete" : "Incomplete"}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "1rem", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.25rem 0.625rem",
                          borderRadius: "9999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          backgroundColor: c.isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: c.isActive ? "#10b981" : "#ef4444",
                        }}
                      >
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, backgroundColor: c.isActive ? "#10b981" : "#ef4444" }} />
                        {c.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td style={{ padding: "1rem", color: "var(--ink-muted)", whiteSpace: "nowrap" }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>

                    {/* Action */}
                    <td style={{ padding: "1rem", textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                        <button
                          onClick={() => handlePromptToggleStatus(c)}
                          disabled={actionLoadingId === c._id}
                          style={{
                            padding: "0.35rem 0.65rem",
                            borderRadius: "0.375rem",
                            border: "1px solid var(--border)",
                            backgroundColor: c.isActive ? "var(--surface)" : "rgba(16, 185, 129, 0.15)",
                            color: c.isActive ? "var(--red)" : "#10b981",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          onClick={() => handlePromptDeleteCustomer(c)}
                          disabled={actionLoadingId === c._id}
                          title="Permanently Delete Account & Blacklist Email"
                          aria-label="Delete customer"
                          style={{
                            padding: "0.45rem 0.55rem",
                            borderRadius: "0.375rem",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            backgroundColor: "rgba(239, 68, 68, 0.08)",
                            color: "#ef4444",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          <Trash2 size={15} className="shrink-0" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {loading ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--ink-muted)" }}>
            <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--ink-muted)" }}>
            No customer accounts found.
          </div>
        ) : null}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[var(--border)]">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            itemLabel="customers"
            showLimitSelector={true}
            limitOptions={[15, 30, 60]}
            onPageChange={(newPage) => fetchCustomers(newPage)}
            onLimitChange={(newLimit) => {
              setPagination((prev) => ({ ...prev, limit: newLimit }));
              fetchCustomers(1);
            }}
          />
        </div>
      </div>

      {/* Status Toggle Modal */}
      <ConfirmActionModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ isOpen: false, customer: null, nextStatus: null })}
        onConfirm={handleConfirmToggleStatus}
        title={statusModal.nextStatus ? "Activate Customer Account" : "Deactivate Customer Account"}
        message={
          statusModal.customer
            ? `Are you sure you want to ${
                statusModal.nextStatus ? "activate" : "deactivate"
              } customer account "${statusModal.customer.name}" (${statusModal.customer.email})?`
            : ""
        }
        confirmText={statusModal.nextStatus ? "Activate Account" : "Deactivate Account"}
        confirmVariant={statusModal.nextStatus ? "accent" : "danger"}
        loading={actionLoadingId === statusModal.customer?._id}
      />

      {/* Delete Customer Confirmation Modal */}
      <ConfirmActionModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, customer: null })}
        onConfirm={handleConfirmDeleteCustomer}
        title="Permanently Terminate Customer Account"
        message={
          deleteModal.customer
            ? `Are you sure you want to permanently delete customer "${deleteModal.customer.name}" (${deleteModal.customer.email})? All active sessions will be terminated immediately, and this email will be permanently blacklisted from creating any new accounts on LyZov.`
            : ""
        }
        confirmText="Delete & Blacklist Email"
        confirmVariant="danger"
        loading={actionLoadingId === deleteModal.customer?._id}
      />
    </div>
  );
};

export default AdminCustomersPage;
