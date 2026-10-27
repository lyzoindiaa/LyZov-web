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
  Mail,
  Bell,
  ChevronDown,
  ChevronUp,
  Eye,
  Check,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { toast } from "react-toastify";

const AdminMarketplacePayoutsPage = () => {
  const [activeTab, setActiveTab] = useState("monthly"); // "monthly" | "upcoming" | "ledger" | "rules"
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

  // Consolidated Settlement Batches State (Weekly / Monthly / All Cleared)
  const [settlementCycle, setSettlementCycle] = useState("weekly"); // "weekly" | "all_cleared" | "monthly"
  const [monthlyBatches, setMonthlyBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchReleaseModal, setBatchReleaseModal] = useState(null); // batch object or null
  const [batchUtr, setBatchUtr] = useState("");
  const [batchNotes, setBatchNotes] = useState("");
  const [isReleasingBatch, setIsReleasingBatch] = useState(false);

  // Manifest inspection inside batch modal
  const [batchOrdersManifest, setBatchOrdersManifest] = useState([]);
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [showManifest, setShowManifest] = useState(false);

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
    effectiveFrom: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    effectiveTo: "",
    notifySellers: true,
  });

  // Calculate 7-day cooling-off countdown
  const getWindowCountdown = (eligibleAt, coolingOffUntil) => {
    const target = new Date(eligibleAt || coolingOffUntil || Date.now());
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs <= 0) {
      return {
        cleared: true,
        text: "Matures Today",
        subtext: "7-day policy period cleared",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800",
      };
    }

    if (diffHours <= 24) {
      return {
        cleared: false,
        text: `Matures in ${diffHours} hr${diffHours > 1 ? "s" : ""}`,
        subtext: "Final hours of cooling hold",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800",
      };
    }

    return {
      cleared: false,
      text: `Clears in ${diffDays} day${diffDays > 1 ? "s" : ""}`,
      subtext: `${Math.max(1, 7 - diffDays)} of 7 days completed`,
      badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800",
    };
  };

  // Commission Rule Status Indicator
  const getRuleStatus = (rule) => {
    const now = new Date();
    const from = rule.effectiveFrom ? new Date(rule.effectiveFrom) : null;
    const to = rule.effectiveTo ? new Date(rule.effectiveTo) : null;

    if (from && from > now) {
      return {
        label: "Scheduled",
        badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
        description: `Starts ${formatDate(rule.effectiveFrom)}`,
      };
    }
    if (to && to < now) {
      return {
        label: "Expired",
        badgeClass: "bg-neutral-500/15 text-neutral-500 border border-neutral-500/30",
        description: `Ended ${formatDate(rule.effectiveTo)}`,
      };
    }
    return {
      label: "Active Now",
      badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
      description: from ? `Active since ${formatDate(rule.effectiveFrom)}` : "Ongoing active tier",
    };
  };

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

  // Fetch consolidated settlement batches
  const fetchMonthlyBatches = async (cycle = settlementCycle, period = periodFilter) => {
    try {
      setLoadingBatches(true);
      const params = { cycle };
      if (cycle === "monthly" && period) {
        params.period = period;
      }
      const res = await adminService.getMonthlySettlementSummary(params);
      setMonthlyBatches(res.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load settlement batches");
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
    } else if (activeTab === "upcoming") {
      fetchPayouts(1, "cooling_off");
    } else if (activeTab === "monthly") {
      fetchMonthlyBatches(settlementCycle, periodFilter);
      fetchPayouts(1, statusFilter);
    } else if (activeTab === "rules") {
      fetchCommissionRules();
    }
  }, [activeTab, statusFilter, periodFilter, settlementCycle]);

  // Trigger automated maturity job
  const handleRunMaturity = async () => {
    try {
      const res = await adminService.triggerSettlementMaturityJob();
      toast.success(res.message || "Maturity scan completed");
      fetchPayouts(meta.page, statusFilter);
      fetchMonthlyBatches(settlementCycle, periodFilter);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to run maturity job");
    }
  };

  // Download Bulk NEFT CSV
  const handleDownloadCsv = async () => {
    try {
      const res = await adminService.exportMonthlySettlementCsv({
        period: settlementCycle === "monthly" ? periodFilter : "",
        cycle: settlementCycle,
      });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `LyZov_Settlement_${settlementCycle}_${periodFilter || "Current"}.csv`);
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
      fetchMonthlyBatches(settlementCycle, periodFilter);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to release payout");
    } finally {
      setIsReleasing(false);
    }
  };

  // Handle consolidated batch release (supports 1,000+ orders in 1 single transfer)
  const handleOpenBatchModal = (batch) => {
    setBatchReleaseModal(batch);
    setBatchUtr(`UTR-SETTLE-${Date.now().toString().slice(-8)}`);
    setBatchNotes(
      `${settlementCycle === "weekly" ? "Weekly" : settlementCycle === "monthly" ? "Monthly" : "Consolidated"} payout for ${batch.orderCount} cleared orders (${batch.businessName})`
    );
    setShowManifest(false);
    setBatchOrdersManifest([]);
  };

  // Toggle order manifest inspection
  const handleToggleManifest = async () => {
    if (!showManifest && batchReleaseModal?.sellerId) {
      try {
        setLoadingManifest(true);
        const res = await adminService.getBatchOrders({
          sellerId: batchReleaseModal.sellerId,
          status: "eligible",
        });
        setBatchOrdersManifest(res.data || []);
      } catch (err) {
        toast.error("Failed to load batch orders manifest");
      } finally {
        setLoadingManifest(false);
      }
    }
    setShowManifest(!showManifest);
  };

  const handleConfirmBatchRelease = async (e) => {
    e.preventDefault();
    if (!batchReleaseModal) return;
    if (!batchUtr.trim()) {
      toast.error("Please enter a valid Bank UTR reference number");
      return;
    }

    try {
      setIsReleasingBatch(true);
      await adminService.releaseSellerBatch({
        sellerId: batchReleaseModal.sellerId,
        payoutIds: batchReleaseModal.payoutIds,
        utrNumber: batchUtr.trim(),
        notes: batchNotes.trim(),
        cycle: settlementCycle === "weekly" ? "Weekly" : settlementCycle === "monthly" ? "Monthly" : "Consolidated",
      });
      toast.success(
        `Single payout of ${formatCurrency(batchReleaseModal.totalNet)} for ${batchReleaseModal.orderCount} orders confirmed!`
      );
      setBatchReleaseModal(null);
      fetchMonthlyBatches(settlementCycle, periodFilter);
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
        effectiveFrom: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        effectiveTo: "",
        notifySellers: true,
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-black text-[var(--ink)] tracking-tight flex items-center gap-2.5">
            <Wallet className="text-[var(--accent)]" size={26} />
            Seller Payouts & Marketplace Earnings
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-muted)] mt-1">
            Automated weekly seller payouts, 7-day return safety holds, 1-click bulk transfers, and platform fee governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {settlementCycle === "monthly" && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--ink)] shadow-xs">
              <Calendar size={13} className="text-[var(--ink-muted)]" />
              <span>Month:</span>
              <input
                type="month"
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-[var(--ink)] focus:outline-hidden"
              />
            </div>
          )}

          <button
            onClick={handleRunMaturity}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--border)]/30 transition-colors shadow-xs"
            title="Scan for orders whose 7-day return period has ended and unlock them for payout"
          >
            <Sparkles size={13} className="text-amber-500" />
            Check Cleared Orders
          </button>

          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[var(--accent)] text-white hover:opacity-95 transition-opacity shadow-xs"
          >
            <Download size={13} />
            Export Bank NEFT CSV
          </button>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* In-Transit Escrow -> In Delivery */}
        <div className="card-surface p-5 rounded-xl border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              In Delivery (Transit)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--ink)] mt-2">
            {formatCurrency(meta.financials?.escrowBalance || 0)}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Orders packed or actively out for customer delivery
          </p>
        </div>

        {/* 7-Day Cooling Off -> 7-Day Return Window */}
        <div
          onClick={() => setActiveTab("upcoming")}
          className="card-surface p-5 rounded-xl border border-[var(--border)] shadow-xs hover:border-indigo-500/50 cursor-pointer transition-all hover:shadow-md group"
          title="Click to view all delivered orders currently undergoing the 7-day return safety window"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] group-hover:text-indigo-600 transition-colors">
              7-Day Return Window
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            {formatCurrency(meta.financials?.coolingOffBalance || 0)}
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] text-[var(--ink-muted)]">
              Delivered orders under 7-day return protection hold
            </p>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
              View Window →
            </span>
          </div>
        </div>

        {/* Ready for Monthly Release -> Ready for Payout */}
        <div className="card-surface p-5 rounded-xl border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Ready for Next Payout
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {formatCurrency(meta.financials?.eligibleBalance || 0)}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Orders that cleared the 7-day window, ready for bank payout
          </p>
        </div>

        {/* Platform Revenue */}
        <div className="card-surface p-5 rounded-xl border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              LyZov Platform Fees
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(meta.financials?.totalCommission || 0)}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Platform fee revenue (excl. 18% GST / 1% TCS)
          </p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("monthly")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "monthly"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
          }`}
        >
          <Layers size={14} />
          Seller Payout Batches
        </button>
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "upcoming"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
          }`}
        >
          <ShieldCheck size={14} />
          Orders in Return Window (7-Day Hold)
          {(meta.financials?.coolingOffBalance || 0) > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500 text-white font-black">
              {formatCurrency(meta.financials.coolingOffBalance)}
            </span>
          )}
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
          All Orders & Payouts
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
          Platform Fee & Commission Rates
        </button>
      </div>

      {/* TAB 1: Seller Payout Batches (Weekly / Monthly / All Cleared) */}
      {activeTab === "monthly" && (
        <div className="flex flex-col gap-4">
          {/* Cycle Selector & Information Banner */}
          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--ink)] whitespace-nowrap">Payout Cycle:</span>
              <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5 bg-[var(--surface-muted)]">
                <button
                  onClick={() => {
                    setSettlementCycle("weekly");
                    fetchMonthlyBatches("weekly");
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    settlementCycle === "weekly"
                      ? "bg-[var(--accent)] text-white shadow-xs"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  ⚡ Weekly Payouts
                </button>
                <button
                  onClick={() => {
                    setSettlementCycle("all_cleared");
                    fetchMonthlyBatches("all_cleared");
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    settlementCycle === "all_cleared"
                      ? "bg-[var(--accent)] text-white shadow-xs"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  🎯 All Cleared Balances
                </button>
                <button
                  onClick={() => {
                    setSettlementCycle("monthly");
                    fetchMonthlyBatches("monthly", periodFilter);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    settlementCycle === "monthly"
                      ? "bg-[var(--accent)] text-white shadow-xs"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  📅 Monthly Batches
                </button>
              </div>
            </div>

            <div className="text-xs text-[var(--ink-muted)]">
              {settlementCycle === "weekly" && (
                <span>Grouping all orders cleared this week for 1-click single-payment bank settlement.</span>
              )}
              {settlementCycle === "all_cleared" && (
                <span>Grouping all un-settled cleared orders across all dates without splitting.</span>
              )}
              {settlementCycle === "monthly" && (
                <span>Calendar month accounting cycle ({periodFilter}).</span>
              )}
            </div>
          </div>

          <div className="card-surface rounded-xl border border-[var(--border)] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Merchant Business</th>
                    <th className="py-3 px-4">Bank Details Snapshot</th>
                    <th className="py-3 px-4">Cleared Orders</th>
                    <th className="py-3 px-4">Gross Sales</th>
                    <th className="py-3 px-4">Platform Fee</th>
                    <th className="py-3 px-4">Taxes (GST + TCS)</th>
                    <th className="py-3 px-4">Net Transfer Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loadingBatches ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-[var(--ink-muted)]">
                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[var(--accent)]" />
                        Calculating seller payout totals automatically...
                      </td>
                    </tr>
                  ) : monthlyBatches.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-[var(--ink-muted)]">
                        <Landmark size={28} className="mx-auto mb-2 opacity-40 text-[var(--accent)]" />
                        <p className="font-bold text-[var(--ink)]">No pending payouts found for this cycle</p>
                        <p className="text-xs text-[var(--ink-muted)] mt-1">
                          Orders automatically clear and appear here once their 7-day return safety window ends.
                        </p>
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
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[var(--ink)]">{b.orderCount} orders</span>
                          <span className="text-[10px] text-[var(--ink-muted)] block">1 single transfer</span>
                        </td>
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
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                              <Clock size={11} /> Ready to Pay
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 size={11} /> Paid
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {b.hasPendingEligible ? (
                            <button
                              onClick={() => handleOpenBatchModal(b)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--accent)] text-white hover:opacity-95 shadow-xs transition-opacity whitespace-nowrap"
                              title="Pay all cleared orders for this merchant in a single bank transfer"
                            >
                              <Send size={11} /> Settle All ({b.orderCount})
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

      {/* TAB: Upcoming Settlements (7-Day Cooling Off Window) */}
      {activeTab === "upcoming" && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--ink)]">
                  7-Day Buyer Cooling-Off & Return Safeguard Window
                </h3>
                <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                  SubOrders here are delivered to customers and held for 7 days to protect against returns and exchanges. Once this cooling-off window matures, funds automatically advance to <strong>Eligible for Monthly Settlement</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleRunMaturity}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
                title="Scan database for any completed 7-day holds and promote them to eligible for payout"
              >
                <Sparkles size={13} />
                Run Maturity Scan
              </button>
            </div>
          </div>

          <div className="card-surface rounded-xl border border-[var(--border)] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Merchant Store</th>
                    <th className="py-3 px-4">SubOrder #</th>
                    <th className="py-3 px-4">Delivery Date</th>
                    <th className="py-3 px-4">Settlement Maturity</th>
                    <th className="py-3 px-4">Cooling Window Status</th>
                    <th className="py-3 px-4">Gross Sale</th>
                    <th className="py-3 px-4">Platform Fee</th>
                    <th className="py-3 px-4">Net Seller Payout</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-[var(--ink-muted)]">
                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[var(--accent)]" />
                        Fetching cooling-off settlements...
                      </td>
                    </tr>
                  ) : payouts.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-[var(--ink-muted)]">
                        <ShieldCheck size={28} className="mx-auto mb-2 text-indigo-500 opacity-60" />
                        <p className="font-bold text-[var(--ink)]">No orders currently in 7-day cooling-off window</p>
                        <p className="text-xs text-[var(--ink-muted)] mt-1">
                          When customer orders are marked delivered, they will appear here with an active countdown.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    payouts.map((p) => {
                      const sellerName = p.seller?.sellerProfile?.businessName || p.seller?.name || "Merchant";
                      const countdown = getWindowCountdown(p.eligibleAt, p.subOrder?.coolingOffUntil);
                      const deliveredDate = p.subOrder?.deliveredAt || p.coolingOffStartedAt;
                      const maturityDate = p.eligibleAt || p.subOrder?.coolingOffUntil;

                      return (
                        <tr key={p._id} className="hover:bg-[var(--border)]/15 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[var(--ink)]">
                            <div className="flex items-center gap-1.5">
                              <Store size={13} className="text-[var(--accent)] shrink-0" />
                              <div>
                                <div>{sellerName}</div>
                                <div className="text-[10px] font-normal text-[var(--ink-muted)]">
                                  {p.seller?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-[var(--ink)]">
                              {p.subOrder?.subOrderNumber || "SO-PENDING"}
                            </div>
                            <div className="text-[10px] text-[var(--ink-muted)]">
                              {p.subOrder?.items?.length || 1} item(s)
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[var(--ink)]">
                            {deliveredDate ? formatDate(deliveredDate) : "Recently Delivered"}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[var(--ink)]">
                            {maturityDate ? formatDate(maturityDate) : "7 days after delivery"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${countdown.badgeClass}`}
                            >
                              <Clock size={11} />
                              {countdown.text}
                            </span>
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
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedPayout(p);
                                setUtrInput(`UTR-EARLY-${Date.now().toString().slice(-8)}`);
                                setNotesInput(`Early release override by Super Admin for SubOrder ${p.subOrder?.subOrderNumber || p._id}`);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--border)] text-[var(--ink)] border border-[var(--border)] transition-colors shadow-2xs"
                              title="Override cooling-off hold and release early with bank UTR"
                            >
                              <ArrowUpRight size={12} className="text-indigo-600" />
                              Early Release
                            </button>
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
                    <th className="py-3 px-4">Commission Margin</th>
                    <th className="py-3 px-4">Effective Period</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Merchant Notice</th>
                    <th className="py-3 px-4">Taxes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loadingRules ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-[var(--ink-muted)]">
                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[var(--accent)]" />
                        Loading commission tiers...
                      </td>
                    </tr>
                  ) : commissionRules.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-[var(--ink-muted)]">
                        <Percent size={28} className="mx-auto mb-2 opacity-40" />
                        <p className="font-bold text-[var(--ink)]">No custom commission rules active</p>
                        <p className="text-xs text-[var(--ink-muted)] mt-1">Default 10% platform rate is currently applied globally.</p>
                      </td>
                    </tr>
                  ) : (
                    commissionRules.map((r) => {
                      const status = getRuleStatus(r);
                      const effectiveStart = r.effectiveFrom ? formatDate(r.effectiveFrom) : "Immediate / Creation";
                      const effectiveEnd = r.effectiveTo ? formatDate(r.effectiveTo) : "Ongoing";

                      return (
                        <tr key={r._id} className="hover:bg-[var(--border)]/15 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[var(--ink)]">
                            <div>{r.name}</div>
                            {r.description && (
                              <div className="text-[10px] font-normal text-[var(--ink-muted)]">{r.description}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold uppercase text-[10px] text-[var(--accent)]">{r.scope}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-black text-purple-600 text-sm">{r.percentage}%</span>
                            {r.fixedFee > 0 && (
                              <span className="text-[10px] text-[var(--ink-muted)] block">+ {formatCurrency(r.fixedFee)} fee</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-[var(--ink)]">
                            <div className="font-medium">From: {effectiveStart}</div>
                            <div className="text-[10px] text-[var(--ink-muted)]">Until: {effectiveEnd}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.badgeClass}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[11px]">
                            {r.notificationRecipientCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold" title={`Email sent on ${r.notificationSentAt ? formatDate(r.notificationSentAt) : "creation"}`}>
                                <Mail size={12} /> {r.notificationRecipientCount} merchants
                              </span>
                            ) : (
                              <span className="text-[var(--ink-muted)] text-[10px]">No broadcast</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-[var(--ink-muted)]">
                            <div>GST: {r.gstOnCommissionRate || 18}%</div>
                            <div>TCS: {r.tcsRate || 1}%</div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteRule(r._id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Delete tier rule"
                            >
                              <Trash2 size={14} />
                            </button>
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

      {/* Release Consolidated Batch Modal (1 Single Transfer for 1,000+ orders) */}
      {batchReleaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-xl w-full shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Landmark size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--ink)]">
                    {settlementCycle === "weekly"
                      ? "Consolidated Weekly Payout"
                      : settlementCycle === "all_cleared"
                      ? "Consolidated Cleared Payout"
                      : "Consolidated Monthly Payout"}
                  </h3>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {batchReleaseModal.businessName} • 1 Single Bank Transfer for all cleared orders
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBatchReleaseModal(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--border)]/50 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmBatchRelease} className="flex flex-col gap-4 mt-4 overflow-y-auto pr-1">
              {/* Zero-Math Automated Calculations Summary Card */}
              <div className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <span className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    Orders Ready for Settlement:
                  </span>
                  <span className="font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-md">
                    {batchReleaseModal.orderCount} orders
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1 text-[var(--ink-muted)]">
                  <div className="flex justify-between">
                    <span>Total Gross Sales:</span>
                    <span className="font-semibold text-[var(--ink)] font-mono">
                      {formatCurrency(batchReleaseModal.totalGross || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>LyZov Platform Fee:</span>
                    <span className="font-semibold text-rose-500 font-mono">
                      -{formatCurrency(batchReleaseModal.totalCommission || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST on Fee (18%):</span>
                    <span className="font-semibold text-rose-500 font-mono">
                      -{formatCurrency(batchReleaseModal.totalGstOnCommission || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>TCS on Net Sales (1%):</span>
                    <span className="font-semibold text-rose-500 font-mono">
                      -{formatCurrency(batchReleaseModal.totalTcs || 0)}
                    </span>
                  </div>
                </div>

                {/* Net Transfer Amount Highlight */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mt-1">
                  <div>
                    <span className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      Single Net Bank Transfer
                    </span>
                    <span className="text-[10px] text-emerald-600">
                      Calculated automatically • Settles all {batchReleaseModal.orderCount} orders
                    </span>
                  </div>
                  <span className="font-black text-emerald-600 text-xl font-mono">
                    {formatCurrency(batchReleaseModal.totalNet)}
                  </span>
                </div>

                {/* Bank Account Details */}
                <div className="pt-2 border-t border-[var(--border)] grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[var(--ink-muted)] block">Beneficiary Account:</span>
                    <span className="font-mono font-bold text-[var(--ink)]">
                      {batchReleaseModal.bankDetails?.accountNumber || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--ink-muted)] block">IFSC Code & Holder:</span>
                    <span className="font-mono font-bold text-[var(--ink)]">
                      {batchReleaseModal.bankDetails?.ifscCode || "N/A"}{" "}
                      {batchReleaseModal.bankDetails?.accountHolderName ? `(${batchReleaseModal.bankDetails.accountHolderName})` : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Manifest Inspector (Collapsible Accordion) */}
              <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={handleToggleManifest}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between bg-[var(--surface-muted)] hover:bg-[var(--border)]/30 text-xs font-semibold text-[var(--ink)] transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText size={13} className="text-[var(--accent)]" />
                    Review Included Orders Manifest ({batchReleaseModal.orderCount})
                  </span>
                  <span className="text-[var(--ink-muted)] flex items-center gap-1 text-[11px]">
                    {showManifest ? (
                      <>Hide <ChevronUp size={13} /></>
                    ) : (
                      <>Preview list <ChevronDown size={13} /></>
                    )}
                  </span>
                </button>

                {showManifest && (
                  <div className="p-3 bg-[var(--surface)] max-h-48 overflow-y-auto text-xs border-t border-[var(--border)]">
                    {loadingManifest ? (
                      <div className="py-6 flex items-center justify-center gap-2 text-[var(--ink-muted)]">
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Loading orders manifest...</span>
                      </div>
                    ) : batchOrdersManifest.length === 0 ? (
                      <p className="text-center py-4 text-[var(--ink-muted)]">No individual orders found in manifest.</p>
                    ) : (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] uppercase font-bold text-[var(--ink-muted)] border-b border-[var(--border)]">
                            <th className="pb-1.5">SubOrder #</th>
                            <th className="pb-1.5">Delivered On</th>
                            <th className="pb-1.5 text-right">Gross</th>
                            <th className="pb-1.5 text-right">Net Payable</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]/40 font-mono text-[11px]">
                          {batchOrdersManifest.map((item) => (
                            <tr key={item._id} className="hover:bg-[var(--surface-muted)]/50">
                              <td className="py-1 font-bold text-[var(--ink)]">
                                {item.subOrderId?.subOrderNumber || item.subOrderId?._id?.slice(-8) || "N/A"}
                              </td>
                              <td className="py-1 text-[var(--ink-muted)]">
                                {item.deliveredAt ? formatDate(item.deliveredAt) : "Delivered"}
                              </td>
                              <td className="py-1 text-right text-[var(--ink)]">
                                {formatCurrency(item.grossAmount)}
                              </td>
                              <td className="py-1 text-right font-bold text-emerald-600">
                                {formatCurrency(item.netAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>

              {/* Bank UTR & Reference */}
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                  Bank UTR / Transaction Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={batchUtr}
                  onChange={(e) => setBatchUtr(e.target.value)}
                  placeholder="e.g. UTR-HDFC-SETTLE-001298"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] font-mono focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
                />
                <p className="text-[10px] text-[var(--ink-muted)] mt-1">
                  This 1 single UTR will be stamped on all {batchReleaseModal.orderCount} orders and emailed to the merchant.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                  Payout Note (Sent in Merchant Receipt)
                </label>
                <input
                  type="text"
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  placeholder="e.g. Weekly settlement for delivered orders"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)] shrink-0">
                <button
                  type="button"
                  onClick={() => setBatchReleaseModal(null)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--border)]/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReleasingBatch}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-[var(--accent)] text-white hover:opacity-95 shadow-xs transition-opacity flex items-center gap-1.5"
                >
                  {isReleasingBatch ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                  Confirm 1-Click Payout ({formatCurrency(batchReleaseModal.totalNet)})
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
                  placeholder="e.g. Q4 Festive Apparel Tier"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--ink)] mb-1">Scope</label>
                <select
                  value={ruleForm.scope}
                  onChange={(e) => setRuleForm({ ...ruleForm, scope: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="global">Global (All Sellers & Categories)</option>
                  <option value="category">Category-Specific</option>
                  <option value="seller">Seller-Specific Merchant Tier</option>
                </select>
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
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--ink)] mb-1">Fixed Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={ruleForm.fixedFee}
                    onChange={(e) => setRuleForm({ ...ruleForm, fixedFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Scheduled Future-Dating */}
              <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5 font-bold text-[var(--ink)] text-[11px]">
                  <Calendar size={13} className="text-[var(--accent)]" />
                  Scheduled Timeline & Effective Window
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--ink-muted)] mb-1">
                      Effective From *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={ruleForm.effectiveFrom}
                      onChange={(e) => setRuleForm({ ...ruleForm, effectiveFrom: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] text-[11px] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--ink-muted)] mb-1">
                      Effective Until (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={ruleForm.effectiveTo}
                      onChange={(e) => setRuleForm({ ...ruleForm, effectiveTo: e.target.value })}
                      placeholder="Indefinite"
                      className="w-full px-2 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] text-[11px] focus:outline-hidden"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[var(--ink-muted)]">
                  Orders placed on or after the &ldquo;Effective From&rdquo; date will automatically apply this margin rate at checkout.
                </p>
              </div>

              {/* Email Notification Checkbox */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] cursor-pointer hover:bg-[var(--surface-muted)] transition-colors">
                <input
                  type="checkbox"
                  checked={ruleForm.notifySellers}
                  onChange={(e) => setRuleForm({ ...ruleForm, notifySellers: e.target.checked })}
                  className="mt-0.5 rounded text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-[var(--ink)] flex items-center gap-1 text-[11px]">
                    <Mail size={12} className="text-[var(--accent)]" />
                    Notify active merchants via email
                  </span>
                  <span className="text-[10px] text-[var(--ink-muted)]">
                    Automatically dispatches an official branded notice to registered sellers with effective dates and margin details.
                  </span>
                </div>
              </label>

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

              <div>
                <label className="block font-bold text-[var(--ink)] mb-1">Notes / Description (Optional)</label>
                <textarea
                  rows={2}
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  placeholder="e.g. Standard holiday campaign rate update"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(false)}
                  className="px-4 py-2 font-bold rounded-lg border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--border)]/30"
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
