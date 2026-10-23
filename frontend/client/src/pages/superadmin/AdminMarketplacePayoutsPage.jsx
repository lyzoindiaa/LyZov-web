import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Landmark,
  FileText,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  Send,
  X,
  Store,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { toast } from "react-toastify";

const AdminMarketplacePayoutsPage = () => {
  const [payouts, setPayouts] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    financials: {
      escrowBalance: 0,
      eligibleBalance: 0,
      paidBalance: 0,
      totalGross: 0,
      totalCommission: 0,
    },
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Release Modal State
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [utrInput, setUtrInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [isReleasing, setIsReleasing] = useState(false);

  const fetchPayouts = async (page = 1, status = statusFilter) => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (status) params.status = status;
      const res = await adminService.getPayouts(params);
      setPayouts(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load marketplace payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts(1, statusFilter);
  }, [statusFilter]);

  const handleOpenReleaseModal = (payout) => {
    setSelectedPayout(payout);
    setUtrInput(`UTR-${Date.now().toString().slice(-8)}`);
    setNotesInput("");
  };

  const handleConfirmRelease = async (e) => {
    e.preventDefault();
    if (!selectedPayout) return;
    if (!utrInput.trim()) {
      toast.error("Please enter a valid Bank UTR / Transaction Reference");
      return;
    }

    try {
      setIsReleasing(true);
      await adminService.releasePayout(selectedPayout._id, {
        transactionReference: utrInput.trim(),
        notes: notesInput.trim(),
      });
      toast.success(`Payout of ${formatCurrency(selectedPayout.netAmount)} successfully marked as released!`);
      setSelectedPayout(null);
      fetchPayouts(meta.page, statusFilter);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to release payout");
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-black text-[var(--ink)] tracking-tight flex items-center gap-2.5">
            <Wallet className="text-[var(--accent)]" size={26} />
            Marketplace Financials & Disbursements
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-muted)] mt-1">
            SuperAdmin central ledger: Escrow hold balances, commission revenues, and merchant payout releases.
          </p>
        </div>
        <button
          onClick={() => fetchPayouts(meta.page, statusFilter)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--border)]/30 transition-colors shadow-xs"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Payouts
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-surface p-5 rounded-xl border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Pending in Escrow
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--ink)] mt-2">
            {formatCurrency(meta.financials?.escrowBalance || 0)}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Protected under 7-day return policy
          </p>
        </div>

        <div className="card-surface p-5 rounded-xl border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Ready for Payout
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--ink)] mt-2">
            {formatCurrency(meta.financials?.eligibleBalance || 0)}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Eligible for immediate disbursement
          </p>
        </div>

        <div className="card-surface p-5 rounded-xl border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Disbursed to Sellers
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Landmark size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(meta.financials?.paidBalance || 0)}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Completed bank disbursements
          </p>
        </div>

        <div className="card-surface p-5 rounded-xl border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Platform Revenue Earned
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {formatCurrency(meta.financials?.totalCommission || 0)}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Net marketplace commission earned
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: "All Payouts", value: "" },
          { label: "Pending (Escrow)", value: "pending" },
          { label: "Eligible for Release", value: "eligible" },
          { label: "Completed (Disbursed)", value: "completed" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap ${
              statusFilter === tab.value
                ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs"
                : "bg-[var(--surface)] text-[var(--ink-muted)] border-[var(--border)] hover:text-[var(--ink)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payouts Table */}
      <div className="card-surface rounded-xl border border-[var(--border)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Seller Store</th>
                <th className="py-3 px-4">SubOrder #</th>
                <th className="py-3 px-4">Gross Sale</th>
                <th className="py-3 px-4">Commission</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Bank Settlement Details</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[var(--ink-muted)]">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[var(--accent)]" />
                    Loading marketplace disbursements...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[var(--ink-muted)]">
                    <FileText size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-[var(--ink)]">No payouts found matching criteria</p>
                  </td>
                </tr>
              ) : (
                payouts.map((p) => {
                  const sellerName = p.seller?.sellerProfile?.businessName || p.seller?.name || "Merchant";
                  const bank = p.bankDetailsSnapshot || p.seller?.sellerProfile?.bankDetails || {};
                  return (
                    <tr key={p._id} className="hover:bg-[var(--border)]/15 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                          <Store size={13} className="text-[var(--accent)]" />
                          {sellerName}
                        </div>
                        <div className="text-[10px] text-[var(--ink-muted)]">
                          {p.seller?.email}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-[var(--ink)]">
                        {p.subOrder?.subOrderNumber || "SO-PENDING"}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[var(--ink)]">
                        {formatCurrency(p.grossAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-[var(--ink-muted)]">
                        <span className="font-semibold text-purple-600">
                          {formatCurrency(p.commissionAmount)}
                        </span>{" "}
                        <span className="text-[10px]">({p.commissionRate}%)</span>
                      </td>

                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(p.netAmount)}
                      </td>

                      <td className="py-3.5 px-4">
                        {p.status === "completed" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 size={11} /> Released
                          </span>
                        )}
                        {p.status === "eligible" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            <Clock size={11} /> Ready
                          </span>
                        )}
                        {p.status === "pending" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <ShieldCheck size={11} /> Escrow
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-[11px] font-semibold text-[var(--ink)]">
                          {bank.bankName || "Bank Name Pending"}
                        </div>
                        <div className="text-[10px] text-[var(--ink-muted)]">
                          A/C: {bank.accountNumber || "N/A"} | IFSC: {bank.ifscCode || "N/A"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {p.status === "completed" ? (
                          <div className="text-[10px] text-right font-mono font-bold text-emerald-600">
                            {p.transactionReference}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenReleaseModal(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--accent)] text-white hover:opacity-95 shadow-xs transition-opacity"
                          >
                            <Send size={11} /> Release
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Release Payout Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="card-surface w-full max-w-md rounded-2xl border border-[var(--border)] shadow-2xl p-6 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--ink)]">Disburse Seller Payout</h3>
                <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                  SubOrder {selectedPayout.subOrder?.subOrderNumber || selectedPayout._id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--ink-muted)]">Merchant Store:</span>
                <span className="font-bold text-[var(--ink)]">
                  {selectedPayout.seller?.sellerProfile?.businessName || selectedPayout.seller?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-muted)]">Net Payout Amount:</span>
                <span className="font-black text-emerald-600 text-sm">
                  {formatCurrency(selectedPayout.netAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-muted)]">Bank Account:</span>
                <span className="font-mono text-[var(--ink)]">
                  {selectedPayout.bankDetailsSnapshot?.accountNumber || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-muted)]">IFSC Code:</span>
                <span className="font-mono text-[var(--ink)]">
                  {selectedPayout.bankDetailsSnapshot?.ifscCode || "N/A"}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmRelease} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                  Bank UTR / Transaction Reference *
                </label>
                <input
                  type="text"
                  required
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="e.g. UTR-HDFC-9988776655"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-hidden focus:border-[var(--accent)] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                  Settlement Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Processed via HDFC Corporate Netbanking batch"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-hidden focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  disabled={isReleasing}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReleasing || !utrInput.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-[var(--accent)] rounded-lg hover:opacity-95 transition-all disabled:opacity-50 shadow-xs flex items-center gap-1.5"
                >
                  {isReleasing ? "Releasing..." : "Confirm Disbursement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMarketplacePayoutsPage;
