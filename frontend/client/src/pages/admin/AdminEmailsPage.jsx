import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Server,
  Eye,
  X,
} from "lucide-react";
import emailAdminService from "../../services/emailAdminService";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const templateLabels = {
  welcome_verification: { label: "Welcome & Verify", color: "#3B82F6", bg: "rgba(59, 130, 246, 0.12)" },
  verification_success: { label: "Verified", color: "#10B981", bg: "rgba(16, 185, 129, 0.12)" },
  password_reset: { label: "Password Reset", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)" },
  password_reset_success: { label: "Password Changed", color: "#10B981", bg: "rgba(16, 185, 129, 0.12)" },
  order_confirmation: { label: "Order Receipt", color: "#C5A059", bg: "rgba(197, 160, 89, 0.15)" },
  seller_new_order: { label: "Seller Order Alert", color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.12)" },
  order_status_update: { label: "Shipment Update", color: "#06B6D4", bg: "rgba(6, 182, 212, 0.12)" },
  order_cancelled: { label: "Order Cancelled", color: "#EF4444", bg: "rgba(239, 68, 68, 0.12)" },
  customer_support_inquiry: { label: "Support Inquiry", color: "#EC4899", bg: "rgba(236, 72, 153, 0.12)" },
  seller_test_email: { label: "SMTP Test", color: "#64748B", bg: "rgba(100, 116, 139, 0.12)" },
};

const AdminEmailsPage = () => {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0, smtpStatus: {} });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [templateFilter, setTemplateFilter] = useState("");
  const [page, setPage] = useState(1);

  // Test Email Modal
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await emailAdminService.fetchEmailLogs({
        page,
        limit: 15,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        template: templateFilter || undefined,
      });

      setLogs(res.data || []);
      setMeta(res.meta || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load email logs.");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, templateFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testEmail) {
      toast.error("Please enter a test recipient email.");
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await emailAdminService.sendTestEmail(testEmail);
      toast.success(res.message || "Test email dispatched successfully!");
      setIsTestModalOpen(false);
      setTestEmail("");
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send test email.");
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
            Email Communications
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", marginTop: "2px" }}>
            Audit outgoing messages, inspect delivery statuses, and verify SMTP transport.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchLogs}
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={() => setIsTestModalOpen(true)}
            className="btn-ripple flex items-center gap-2"
          >
            <Send size={14} />
            <span>Send Test Email</span>
          </Button>
        </div>
      </div>

      {/* ── SMTP Status Banner ── */}
      <div
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
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
              width: "2.75rem",
              height: "2.75rem",
              borderRadius: "0.75rem",
              backgroundColor: meta.configured ? "var(--green-bg)" : "var(--accent-bg)",
              color: meta.configured ? "var(--green)" : "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Server size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)" }}>
                Gmail SMTP Transport
              </h4>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "9999px",
                  backgroundColor: meta.configured ? "var(--green-bg)" : "rgba(245, 158, 11, 0.15)",
                  color: meta.configured ? "var(--green)" : "#D97706",
                }}
              >
                {meta.configured ? "Configured & Active" : "Simulated Dev Mode"}
              </span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "2px" }}>
              {meta.smtpStatus?.message || "Emails are safely recorded into MongoDB and previewed in console."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs" style={{ color: "var(--ink-muted)" }}>
          <div>
            Total Logs: <strong style={{ color: "var(--ink)" }}>{meta.total || 0}</strong>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "1rem",
          padding: "1rem 1.25rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div className="flex-1 min-w-[16rem]">
          <Input
            placeholder="Search by recipient or subject..."
            leftIcon={Search}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
            <Filter size={14} />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input-field"
            style={{
              height: "2.5rem",
              borderRadius: "0.625rem",
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              padding: "0 0.75rem",
              fontSize: "0.8125rem",
              color: "var(--ink)",
            }}
          >
            <option value="">All Statuses</option>
            <option value="sent">Sent (Live)</option>
            <option value="simulated">Simulated (Dev)</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={templateFilter}
            onChange={(e) => {
              setTemplateFilter(e.target.value);
              setPage(1);
            }}
            className="input-field"
            style={{
              height: "2.5rem",
              borderRadius: "0.625rem",
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              padding: "0 0.75rem",
              fontSize: "0.8125rem",
              color: "var(--ink)",
            }}
          >
            <option value="">All Templates</option>
            <option value="order_confirmation">Order Confirmation</option>
            <option value="seller_new_order">Seller Order Alert</option>
            <option value="order_status_update">Order Status Update</option>
            <option value="order_cancelled">Order Cancelled</option>
            <option value="welcome_verification">Welcome & Verification</option>
            <option value="verification_success">Verification Success</option>
            <option value="password_reset">Password Reset</option>
            <option value="customer_support_inquiry">Customer Inquiry</option>
            <option value="seller_test_email">SMTP Test</option>
          </select>
        </div>
      </div>

      {/* ── Email Logs Table ── */}
      <div
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "1rem",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "0.875rem 1.25rem", fontWeight: 700, color: "var(--ink-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Recipient
                </th>
                <th style={{ padding: "0.875rem 1.25rem", fontWeight: 700, color: "var(--ink-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Subject
                </th>
                <th style={{ padding: "0.875rem 1.25rem", fontWeight: 700, color: "var(--ink-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Template
                </th>
                <th style={{ padding: "0.875rem 1.25rem", fontWeight: 700, color: "var(--ink-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Status
                </th>
                <th style={{ padding: "0.875rem 1.25rem", fontWeight: 700, color: "var(--ink-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Sent At
                </th>
                <th style={{ padding: "0.875rem 1.25rem", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--ink-muted)" }}>
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Loading communication audit records...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "3.5rem 1rem", textAlign: "center", color: "var(--ink-muted)" }}>
                    <Mail size={32} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
                    <p style={{ fontWeight: 600, color: "var(--ink)" }}>No email logs found</p>
                    <p style={{ fontSize: "0.75rem", marginTop: "4px" }}>
                      Outgoing transactional emails will automatically record here.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const t = templateLabels[log.template] || {
                    label: log.template,
                    color: "var(--ink-muted)",
                    bg: "var(--bg)",
                  };

                  return (
                    <tr
                      key={log._id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      className="hover:bg-slate-50/5 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td style={{ padding: "0.875rem 1.25rem" }}>
                        <div style={{ fontWeight: 600, color: "var(--ink)" }}>
                          {log.recipientName || "—"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                          {log.recipient}
                        </div>
                      </td>

                      <td style={{ padding: "0.875rem 1.25rem", maxWidth: "18rem" }}>
                        <span style={{ fontWeight: 500, color: "var(--ink)" }} className="line-clamp-1">
                          {log.subject}
                        </span>
                      </td>

                      <td style={{ padding: "0.875rem 1.25rem" }}>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.55rem",
                            borderRadius: "9999px",
                            backgroundColor: t.bg,
                            color: t.color,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t.label}
                        </span>
                      </td>

                      <td style={{ padding: "0.875rem 1.25rem" }}>
                        {log.status === "sent" && (
                          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#10B981" }}>
                            <CheckCircle2 size={13} />
                            <span>Sent</span>
                          </span>
                        )}
                        {log.status === "simulated" && (
                          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#3B82F6" }}>
                            <Clock size={13} />
                            <span>Simulated</span>
                          </span>
                        )}
                        {log.status === "failed" && (
                          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#EF4444" }}>
                            <AlertCircle size={13} />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.75rem", color: "var(--ink-muted)", whiteSpace: "nowrap" }}>
                        {new Date(log.sentAt || log.createdAt).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td style={{ padding: "0.875rem 1.25rem", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="btn-secondary"
                          style={{ padding: "0.35rem 0.65rem", borderRadius: "0.5rem", fontSize: "0.75rem" }}
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {meta.totalPages > 1 && (
          <div
            style={{
              padding: "0.875rem 1.25rem",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.8125rem",
            }}
          >
            <span style={{ color: "var(--ink-muted)" }}>
              Page {meta.page} of {meta.totalPages} ({meta.total} total)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Send Test Email Modal ── */}
      {isTestModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
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
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "1.25rem",
              maxWidth: "26rem",
              width: "100%",
              padding: "1.75rem",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--ink)" }}>
                Send SMTP Test Email
              </h3>
              <button
                onClick={() => setIsTestModalOpen(false)}
                style={{ color: "var(--ink-muted)", padding: "0.25rem" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", marginBottom: "1.25rem", lineHeight: 1.5 }}>
              This will trigger a test email via the configured Gmail SMTP transport and record a test log entry.
            </p>

            <form onSubmit={handleSendTest} className="flex flex-col gap-4">
              <Input
                label="Target Recipient Email"
                type="email"
                placeholder="your-email@gmail.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                leftIcon={Mail}
                required
              />

              <div className="flex items-center justify-end gap-2.5 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTestModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSendingTest}
                  className="btn-ripple flex items-center gap-2"
                >
                  <Send size={14} />
                  <span>Send Test</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Log Detail Modal ── */}
      {selectedLog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
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
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "1.25rem",
              maxWidth: "32rem",
              width: "100%",
              padding: "1.75rem",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--ink)" }}>
                Email Audit Record
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ color: "var(--ink-muted)", padding: "0.25rem" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-sm" style={{ color: "var(--ink)" }}>
              <div>
                <span style={{ color: "var(--ink-muted)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>
                  Recipient:
                </span>
                <p style={{ fontWeight: 600 }}>{selectedLog.recipientName ? `${selectedLog.recipientName} <${selectedLog.recipient}>` : selectedLog.recipient}</p>
              </div>

              <div>
                <span style={{ color: "var(--ink-muted)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>
                  Subject:
                </span>
                <p style={{ fontWeight: 600 }}>{selectedLog.subject}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span style={{ color: "var(--ink-muted)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>
                    Template:
                  </span>
                  <p>{selectedLog.template}</p>
                </div>
                <div>
                  <span style={{ color: "var(--ink-muted)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>
                    Status:
                  </span>
                  <p style={{ textTransform: "capitalize", fontWeight: 700 }}>{selectedLog.status}</p>
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "0.5rem", padding: "0.75rem" }}>
                  <span style={{ color: "#991B1B", fontWeight: 700, fontSize: "0.75rem" }}>Error Details:</span>
                  <p style={{ color: "#B91C1C", fontSize: "0.8125rem", marginTop: "2px" }}>{selectedLog.errorMessage}</p>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <span style={{ color: "var(--ink-muted)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>
                    Metadata:
                  </span>
                  <pre
                    style={{
                      backgroundColor: "var(--bg)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem",
                      padding: "0.75rem",
                      fontSize: "0.75rem",
                      overflowX: "auto",
                      marginTop: "4px",
                    }}
                  >
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-5">
              <Button onClick={() => setSelectedLog(null)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmailsPage;
