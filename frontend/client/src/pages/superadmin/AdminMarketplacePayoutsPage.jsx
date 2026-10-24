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
  Download,
  Percent,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Sparkles,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { toast } from "react-toastify";

const AdminMarketplacePayoutsPage = () => {
  const [activeTab, setActiveTab] = useState("monthly"); // "monthly" | "ledger" | "rules"
  const [payouts, setPayouts] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    financials: {
      escrowBalance: 0,
      coolingOffBalance: 0,
      eligibleBalance: 0,
      paidBalance: 0,
      totalGross: 0,
      totalCommission: 0,
      totalGstOnCommission: 0,
      totalTcs: 0,
    },
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(true);

  // Monthly Batches State
  const [monthlyBatches, setMonthlyBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchReleaseModal, setBatchReleaseModal] = useState(null); // batch object or null
  const [batchUtr, setBatchUtr] = useState("");
  const [batchNotes, setBatchNotes] = useState("");
  const [isReleasingBatch, setIsReleasingBatch] = useState(false);

  // Individual Release Modal State
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [utrInput, setUtrInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [isReleasing, setIsReleasing] = useState(false);

  // Commission Rules State
  const [commissionRules, setCommissionRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: "",
    scope: "global",
    category: "",
    seller: "",
    percentage: 10,
    fixedFee: 0,
    gstOnCommissionRate: 18,
    tcsRate: 1,
    description: "",
  });

  // Fetch individual payouts
  const fetchPayouts = async (page = 1, status = statusFilter) => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (status) params.status = status;
      if (periodFilter) params.period = periodFilter;
      const res = await adminService.getPayouts(params);
      setPayouts(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load marketplace payouts");
    } finally {
      setLoading(false);
    }
  };

  // Fetch monthly batches
  const fetchMonthlyBatches = async () => {
    try {
      setLoadingBatches(true);
      const res = await adminService.getMonthlySettlementSummary({ period: periodFilter });
      setMonthlyBatches(res.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load monthly settlement batches");
    } finally {
      setLoadingBatches(false);
    }
  };

  // Fetch commission rules
  const fetchCommissionRules = async () => {
    try {
      setLoadingRules(true);
      const res = await adminService.getCommissionRules();
      setCommissionRules(res.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load commission rules");
    } finally {
      setLoadingRules(false);
    }
  };

  useEffect(() => {
    if (activeTab === "ledger") {
      fetchPayouts(1, statusFilter);
    } else if (activeTab === "monthly") {
      fetchMonthlyBatches();
      fetchPayouts(1, statusFilter);
    } else if (activeTab === "rules") {
      fetchCommissionRules();
    }
  }, [activeTab, statusFilter, periodFilter]);

  // Trigger automated maturity job
  const handleRunMaturity = async () => {
    try {
      const res = await adminService.triggerSettlementMaturityJob();
      toast.success(res.message || "Maturity scan completed");
      fetchPayouts(meta.page, statusFilter);
      fetchMonthlyBatches();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to run maturity job");
    }
  };

  // Download Bulk NEFT CSV
  const handleDownloadCsv = async () => {
    try {
      const res = await adminService.exportMonthlySettlementCsv({ period: periodFilter });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `LyZov_Settlement_${periodFilter || "Current"}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Settlement CSV exported successfully!");
    } catch (err) {
      toast.error("Failed to export settlement CSV");
    }
  };

  // Handle single payout release
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
      toast.success(`Payout of ${formatCurrency(selectedPayout.netAmount)} successfully released!`);
      setSelectedPayout(null);
      fetchPayouts(meta.page, statusFilter);
      fetchMonthlyBatches();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to release payout");
    } finally {
      setIsReleasing(false);
    }
  };

  // Handle monthly batch release
  const handleOpenBatchModal = (batch) => {
    setBatchReleaseModal(batch);
    setBatchUtr(`UTR-BATCH-${Date.now().toString().slice(-8)}`);
    setBatchNotes(`Monthly settlement release for ${batch.businessName}`);
  };

  const handleConfirmBatchRelease = async (e) => {
    e.preventDefault();
    if (!batchReleaseModal) return;
    if (!batchUtr.trim()) {
      toast.error("Please enter a valid Bank UTR number");
      return;
    }

    try {
      setIsReleasingBatch(true);
      await adminService.releaseMonthlyBatch({
        period: periodFilter,
        sellerId: batchReleaseModal.sellerId,
        utrNumber: batchUtr.trim(),
        notes: batchNotes.trim(),
      });
      toast.success(`Settlement of ${formatCurrency(batchReleaseModal.totalNet)} released successfully!`);
      setBatchReleaseModal(null);
      fetchMonthlyBatches();
      fetchPayouts(1, statusFilter);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to release settlement batch");
    } finally {
      setIsReleasingBatch(false);
    }
  };

  // Handle rule creation
  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!ruleForm.name.trim()) {
      toast.error("Rule name is required");
      return;
    }
    try {
      await adminService.createCommissionRule(ruleForm);
      toast.success("Commission rule created successfully");
      setRuleModalOpen(false);
      setRuleForm({
        name: "",
        scope: "global",
        category: "",
        seller: "",
        percentage: 10,
        fixedFee: 0,
        gstOnCommissionRate: 18,
        tcsRate: 1,
        description: "",
      });
      fetchCommissionRules();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create commission rule");
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm("Are you sure you want to delete this commission rule?")) return;
    try {
      await adminService.deleteCommissionRule(id);
      toast.success("Rule deleted");
      fetchCommissionRules();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete rule");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-black text-[var(--ink)] tracking-tight flex items-center gap-2.5">
            <Wallet className="text-[var(--accent)]" size={26} />
            Marketplace Financials & Settlements
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-muted)] mt-1">
            Centralized escrow, 7-day cooling-off holds, monthly batch disbursements, and commission governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--ink)] shadow-xs">
            <Calendar size={13} className="text-[var(--ink-muted)]" />
            <span>Period:</span>
            <input
              type="month"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-[var(--ink)] focus:outline-hidden"
            />
          </div>

          <button
            onClick={handleRunMaturity}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--border)]/30 transition-colors shadow-xs"
            title="Scan for expired 7-day return holds and promote to eligible"
          >
            <Sparkles size={13} className="text-amber-500" />
            Check Maturity
          </button>

          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[var(--accent)] text-white hover:opacity-95 transition-opacity shadow-xs"
          >
            <Download size={13} />
            Export NEFT CSV
          </button>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Escrow */}
        <div className="card-surface p-5 rounded-xl border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              In-Transit Escrow
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--ink)] mt-2">
            {formatCurrency(meta.financials?.escrowBalance || 0)}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Orders processing or currently in transit
          </p>
        </div>

        {/* 7-Day Cooling Off */}
        <div className="card-surface p-5 rounded-xl border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              In Return Window (7d)
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            {formatCurrency(meta.financials?.coolingOffBalance || 0)}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Delivered orders awaiting 7-day policy clearance
          </p>
        </div>

        {/* Ready for Monthly Release */}
        <div className="card-surface p-5 rounded-xl border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Ready for Settlement
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {formatCurrency(meta.financials?.eligibleBalance || 0)}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Cleared orders ready for monthly bank payout
          </p>
        </div>

        {/* Platform Revenue */}
        <div className="card-surface p-5 rounded-xl border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              LyZov Commission Net
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(meta.financials?.totalCommission || 0)}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Platform revenue (excl. 18% GST / 1% TCS)
          </p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab("monthly")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "monthly"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
          }`}
        >
          <Layers size={14} />
          Monthly Seller Batches
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "ledger"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
          }`}
        >
          <FileText size={14} />
          Individual Orders Ledger
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "rules"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
          }`}
        >
          <Percent size={14} />
          Commission Governance Rules
        </button>
      </div>

      {/* TAB 1: Monthly Seller Batches */}
      {activeTab === "monthly" && (
        <div className="flex flex-col gap-4">
          <div className="card-surface rounded-xl border border-[var(--border)] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Merchant Business</th>
                    <th className="py-3 px-4">Bank Details Snapshot</th>
                    <th className="py-3 px-4">Orders</th>
                    <th className="py-3 px-4">Gross Sales</th>
                    <th className="py-3 px-4">Platform Fee</th>
                    <th className="py-3 px-4">Taxes (GST + TCS)</th>
                    <th className="py-3 px-4">Net Payout</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loadingBatches ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-[var(--ink-muted)]">
                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[var(--accent)]" />
                        Calculating monthly seller settlement batches...
                      </td>
                    </tr>
                  ) : monthlyBatches.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-[var(--ink-muted)]">
                        <Landmark size={28} className="mx-auto mb-2 opacity-40" />
                        <p className="font-bold text-[var(--ink)]">No settlement records for period {periodFilter}</p>
                        <p className="text-xs text-[var(--ink-muted)] mt-1">Orders must be delivered and pass the 7-day return window to appear here.</p>
                      </td>
                    </tr>
                  ) : (
                    monthlyBatches.map((b) => (
                      <tr key={b.sellerId} className="hover:bg-[var(--border)]/15 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[var(--ink)]">
                          <div className="flex items-center gap-1.5">
                            <Store size={14} className="text-[var(--accent)]" />
                            {b.businessName}
                          </div>
                          <div className="text-[10px] text-[var(--ink-muted)]">{b.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[var(--ink)]">{b.bankDetails?.bankName || "NEFT"}</div>
                          <div className="text-[10px] text-[var(--ink-muted)]">
                            A/C: {b.bankDetails?.accountNumber ? `••••${b.bankDetails.accountNumber.slice(-4)}` : "Pending"} | IFSC: {b.bankDetails?.ifscCode || "N/A"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[var(--ink)]">{b.orderCount} orders</td>
                        <td className="py-3.5 px-4 font-semibold text-[var(--ink)]">{formatCurrency(b.totalGross)}</td>
                        <td className="py-3.5 px-4 text-purple-600 font-semibold">{formatCurrency(b.totalCommission)}</td>
                        <td className="py-3.5 px-4 text-[var(--ink-muted)]">
                          {formatCurrency((b.totalGstOnCommission || 0) + (b.totalTcs || 0))}
                        </td>
                        <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatCurrency(b.totalNet)}
                        </td>
                        <td className="py-3.5 px-4">
                          {b.hasPendingEligible ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                              <Clock size={11} /> Ready to Disburse
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 size={11} /> Settled
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {b.hasPendingEligible ? (
                            <button
                              onClick={() => handleOpenBatchModal(b)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-[var(--accent)] text-white hover:opacity-95 shadow-xs transition-opacity"
                            >
                              <Send size={11} /> Release Batch
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600">Disbursed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Individual Orders Ledger */}
      {activeTab === "ledger" && (
        <div className="flex flex-col gap-4">
          {/* Status Sub-Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { label: "All Payouts", value: "" },
              { label: "In Escrow (Transit)", value: "pending" },
              { label: "In Cooling-Off (7d)", value: "cooling_off" },
              { label: "Eligible for Release", value: "eligible" },
              { label: "Completed (Released)", value: "completed" },
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

          <div className="card-surface rounded-xl border border-[var(--border)] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Seller Store</th>
                    <th className="py-3 px-4">SubOrder #</th>
                    <th className="py-3 px-4">Gross Sale</th>
                    <th className="py-3 px-4">Commission</th>
                    <th className="py-3 px-4">GST / TCS</th>
                    <th className="py-3 px-4">Net Payout</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Settlement Info</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-[var(--ink-muted)]">
                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[var(--accent)]" />
                        Loading ledger transactions...
                      </td>
                    </tr>
                  ) : payouts.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-[var(--ink-muted)]">
                        <FileText size={28} className="mx-auto mb-2 opacity-40" />
                        <p className="font-bold text-[var(--ink)]">No payout records found matching criteria</p>
                      </td>
                    </tr>
                  ) : (
                    payouts.map((p) => {
                      const sellerName = p.seller?.sellerProfile?.businessName || p.seller?.name || "Merchant";
                      const bank = p.bankDetailsSnapshot || p.seller?.sellerProfile?.bankDetails || {};
                      return (
                        <tr key={p._id} className="hover:bg-[var(--border)]/15 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[var(--ink)]">
                            <div className="flex items-center gap-1.5">
                              <Store size={13} className="text-[var(--accent)]" />
                              {sellerName}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-[var(--ink)]">
                            {p.subOrder?.subOrderNumber || "SO-PENDING"}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[var(--ink)]">{formatCurrency(p.grossAmount)}</td>
                          <td className="py-3.5 px-4 text-[var(--ink-muted)]">
                            <span className="font-semibold text-purple-600">{formatCurrency(p.commissionAmount)}</span>{" "}
                            <span className="text-[10px]">({p.commissionRate}%)</span>
                          </td>
                          <td className="py-3.5 px-4 text-[var(--ink-muted)] text-[11px]">
                            <div>GST: {formatCurrency(p.gstOnCommission || 0)}</div>
                            <div>TCS: {formatCurrency(p.tcsAmount || 0)}</div>
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
                            {p.status === "cooling_off" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                <ShieldCheck size={11} /> Cooling Off
                              </span>
                            )}
                            {p.status === "pending" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                <Clock size={11} /> Escrow
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-[11px] font-semibold text-[var(--ink)]">{bank.bankName || "NEFT"}</div>
                            <div className="text-[10px] text-[var(--ink-muted)]">
                              A/C: {bank.accountNumber ? `••••${bank.accountNumber.slice(-4)}` : "N/A"}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {p.status === "completed" ? (
                              <div className="text-[10px] font-mono font-bold text-emerald-600">{p.utrNumber || p.transactionReference}</div>
                            ) : p.status === "eligible" ? (
                              <button
                                onClick={() => handleOpenReleaseModal(p)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--accent)] text-white hover:opacity-95 shadow-xs transition-opacity"
                              >
                                <Send size={11} /> Release
                              </button>
                            ) : (
                              <span className="text-[10px] text-[var(--ink-muted)]">Holding</span>
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
        </div>
      )}

      {/* TAB 3: Commission Rules Governance */}
      {activeTab === "rules" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--ink-muted)]">
              Dynamic commission rules govern how platform fees, 18% GST, and 1% TCS are calculated at checkout.
            </p>
            <button
              onClick={() => setRuleModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--accent)] text-white hover:opacity-95 shadow-xs"
            >
              <Plus size={14} /> Add Commission Tier
            </button>
          </div>

          <div className="card-surface rounded-xl border border-[var(--border)] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Tier Name</th>
                    <th className="py-3 px-4">Scope</th>
                    <th className="py-3 px-4">Commission %</th>
                    <th className="py-3 px-4">Fixed Fee</th>
                    <th className="py-3 px-4">GST on Fee</th>
                    <th className="py-3 px-4">TCS Rate</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loadingRules ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-[var(--ink-muted)]">
                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[var(--accent)]" />
                        Loading commission tiers...
                      </td>
                    </tr>
                  ) : commissionRules.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-[var(--ink-muted)]">
                        <Percent size={28} className="mx-auto mb-2 opacity-40" />
                        <p className="font-bold text-[var(--ink)]">No custom commission rules active</p>
                        <p className="text-xs text-[var(--ink-muted)] mt-1">Default 10% platform rate is currently applied globally.</p>
                      </td>
                    </tr>
                  ) : (
                    commissionRules.map((r) => (
                      <tr key={r._id} className="hover:bg-[var(--border)]/15 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[var(--ink)]">{r.name}</td>
                        <td className="py-3.5 px-4 font-semibold uppercase text-[10px] text-[var(--accent)]">{r.scope}</td>
                        <td className="py-3.5 px-4 font-black text-purple-600">{r.percentage}%</td>
                        <td className="py-3.5 px-4 text-[var(--ink)]">{formatCurrency(r.fixedFee || 0)}</td>
                        <td className="py-3.5 px-4 text-[var(--ink-muted)]">{r.gstOnCommissionRate || 18}%</td>
                        <td className="py-3.5 px-4 text-[var(--ink-muted)]">{r.tcsRate || 1}%</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteRule(r._id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Release Single Payout Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-bold text-[var(--ink)]">Release Payout to Seller</h3>
                <p className="text-xs text-[var(--ink-muted)]">
                  SubOrder {selectedPayout.subOrder?.subOrderNumber || selectedPayout._id}
                </p>
              </div>
              <button
                onClick={() => setSelectedPayout(null)}
                className="p-1 rounded-lg hover:bg-[var(--border)]/50 text-[var(--ink-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmRelease} className="flex flex-col gap-4 mt-4">
              <div className="p-3.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--ink-muted)]">Merchant:</span>
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
                <div className="flex justify-between border-t border-[var(--border)] pt-1.5 mt-1">
                  <span className="text-[var(--ink-muted)]">Bank Account:</span>
                  <span className="font-mono font-bold text-[var(--ink)]">
                    {selectedPayout.bankDetailsSnapshot?.accountNumber || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ink-muted)]">IFSC Code:</span>
                  <span className="font-mono font-bold text-[var(--ink)]">
                    {selectedPayout.bankDetailsSnapshot?.ifscCode || "N/A"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                  Bank UTR / Transaction Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="e.g. UTR-HDFC-9988776655"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] font-mono focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">Settlement Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Monthly settlement cleared via corporate netbanking"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--border)]/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReleasing}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-[var(--accent)] text-white hover:opacity-95 shadow-xs transition-opacity flex items-center gap-1.5"
                >
                  {isReleasing ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                  Confirm Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Release Monthly Batch Modal */}
      {batchReleaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-bold text-[var(--ink)]">Disburse Monthly Batch</h3>
                <p className="text-xs text-[var(--ink-muted)]">{batchReleaseModal.businessName} ({periodFilter})</p>
              </div>
              <button
                onClick={() => setBatchReleaseModal(null)}
                className="p-1 rounded-lg hover:bg-[var(--border)]/50 text-[var(--ink-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmBatchRelease} className="flex flex-col gap-4 mt-4">
              <div className="p-3.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--ink-muted)]">Total Orders Included:</span>
                  <span className="font-bold text-[var(--ink)]">{batchReleaseModal.orderCount} orders</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ink-muted)]">Consolidated Net Payout:</span>
                  <span className="font-black text-emerald-600 text-base">{formatCurrency(batchReleaseModal.totalNet)}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--border)] pt-1.5 mt-1">
                  <span className="text-[var(--ink-muted)]">Bank Account:</span>
                  <span className="font-mono font-bold text-[var(--ink)]">
                    {batchReleaseModal.bankDetails?.accountNumber || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ink-muted)]">IFSC Code:</span>
                  <span className="font-mono font-bold text-[var(--ink)]">
                    {batchReleaseModal.bankDetails?.ifscCode || "N/A"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                  Bank UTR / Transaction Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={batchUtr}
                  onChange={(e) => setBatchUtr(e.target.value)}
                  placeholder="e.g. UTR-HDFC-BATCH-001"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] font-mono focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setBatchReleaseModal(null)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--border)]/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReleasingBatch}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-[var(--accent)] text-white hover:opacity-95 shadow-xs transition-opacity flex items-center gap-1.5"
                >
                  {isReleasingBatch ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                  Confirm Batch Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Commission Rule Modal */}
      {ruleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-bold text-[var(--ink)]">Create Commission Tier</h3>
              <button
                onClick={() => setRuleModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--border)]/50 text-[var(--ink-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="flex flex-col gap-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--ink)] mb-1">Tier Name *</label>
                <input
                  type="text"
                  required
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  placeholder="e.g. Apparel & Accessories Tier"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--ink)] mb-1">Commission % *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    value={ruleForm.percentage}
                    onChange={(e) => setRuleForm({ ...ruleForm, percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--ink)] mb-1">Fixed Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={ruleForm.fixedFee}
                    onChange={(e) => setRuleForm({ ...ruleForm, fixedFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--ink)] mb-1">GST on Fee %</label>
                  <input
                    type="number"
                    value={ruleForm.gstOnCommissionRate}
                    onChange={(e) => setRuleForm({ ...ruleForm, gstOnCommissionRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--ink)] mb-1">TCS % (Sec 52)</label>
                  <input
                    type="number"
                    value={ruleForm.tcsRate}
                    onChange={(e) => setRuleForm({ ...ruleForm, tcsRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(false)}
                  className="px-4 py-2 font-bold rounded-lg border border-[var(--border)] text-[var(--ink)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold rounded-lg bg-[var(--accent)] text-white hover:opacity-95 shadow-xs"
                >
                  Save Tier
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
