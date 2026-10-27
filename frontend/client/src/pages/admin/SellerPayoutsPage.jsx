import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
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
  Download,
  Info,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { toast } from "react-toastify";

const SellerPayoutsPage = () => {
  const { user } = useSelector((state) => state.auth);
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
  const [periodFilter, setPeriodFilter] = useState("");
  const [loading, setLoading] = useState(true);

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
      toast.error(err?.response?.data?.message || "Failed to load seller payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts(1, statusFilter);
  }, [statusFilter, periodFilter]);

  const bankDetails = user?.sellerProfile?.bankDetails || {};

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-black text-[var(--ink)] tracking-tight flex items-center gap-2.5">
            <Wallet className="text-[var(--accent)]" size={26} />
            Seller Financials & Monthly Settlements
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-muted)] mt-1">
            Real-time escrow hold balance, 7-day return cooling-off periods, and monthly bank disbursements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPayouts(meta.page, statusFilter)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--border)]/30 transition-colors shadow-xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh Ledger
          </button>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* In-Transit Escrow */}
        <div className="card-surface p-5 rounded-xl border border-[var(--border)] shadow-xs relative overflow-hidden">
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
          <p className="text-[11px] text-[var(--ink-muted)] mt-1 flex items-center gap-1">
            <Clock size={12} className="text-amber-500" /> Orders in transit or processing
          </p>
        </div>

        {/* 7-Day Cooling Off */}
        <div className="card-surface p-5 rounded-xl border border-[var(--border)] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Cooling Off (7d)
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            {formatCurrency(meta.financials?.coolingOffBalance || 0)}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1 flex items-center gap-1">
            <ShieldCheck size={12} className="text-indigo-500" /> Held during 7-day return window
          </p>
        </div>

        {/* Ready for Monthly Release */}
        <div className="card-surface p-5 rounded-xl border border-[var(--border)] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Eligible for Payout
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--ink)] mt-2">
            {formatCurrency(meta.financials?.eligibleBalance || 0)}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Cleared funds for next monthly payout
          </p>
        </div>

        {/* Total Paid Out */}
        <div className="card-surface p-5 rounded-xl border border-[var(--border)] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Disbursed to Bank
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Landmark size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(meta.financials?.paidBalance || 0)}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Transferred directly via bank NEFT / IMPS
          </p>
        </div>
      </div>

      {/* Settlement Account Card */}
      <div className="card-surface p-5 rounded-xl border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
            <Landmark size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ink)]">Verified Settlement Bank Account</h3>
            <div className="text-xs text-[var(--ink-muted)] flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
              <span>
                <strong className="text-[var(--ink)]">Bank:</strong> {bankDetails.bankName || "Not configured"}
              </span>
              <span>
                <strong className="text-[var(--ink)]">A/C:</strong>{" "}
                {bankDetails.accountNumber ? `••••${bankDetails.accountNumber.slice(-4)}` : "None"}
              </span>
              <span>
                <strong className="text-[var(--ink)]">IFSC:</strong> {bankDetails.ifscCode || "None"}
              </span>
              <span>
                <strong className="text-[var(--ink)]">Beneficiary:</strong> {bankDetails.accountHolderName || user?.name}
              </span>
            </div>
          </div>
        </div>
        <Link
          to="/seller/profile"
          className="text-xs font-bold text-[var(--accent)] hover:underline shrink-0"
        >
          Update Bank Details →
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: "All Disbursements", value: "" },
          { label: "In Escrow (Transit)", value: "pending" },
          { label: "In Cooling-Off (7d)", value: "cooling_off" },
          { label: "Eligible for Settlement", value: "eligible" },
          { label: "Disbursed (Completed)", value: "completed" },
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
                <th className="py-3 px-4">SubOrder #</th>
                <th className="py-3 px-4">Gross Sale</th>
                <th className="py-3 px-4">Platform Fee</th>
                <th className="py-3 px-4">GST (18%) & TCS (1%)</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Settlement Info</th>
                <th className="py-3 px-4 text-right">Bank UTR / Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[var(--ink-muted)]">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[var(--accent)]" />
                    Loading seller ledger...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[var(--ink-muted)]">
                    <FileText size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-[var(--ink)]">No disbursements found</p>
                    <p className="text-xs text-[var(--ink-muted)] mt-1">
                      New orders appear here automatically upon customer purchase.
                    </p>
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p._id} className="hover:bg-[var(--border)]/15 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--ink)]">
                      {p.subOrder?.subOrderNumber || "SO-PENDING"}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-[var(--ink)]">
                      {formatCurrency(p.grossAmount)}
                    </td>

                    <td className="py-3.5 px-4 text-[var(--ink-muted)]">
                      <span className="font-semibold text-purple-600">
                        {formatCurrency(p.commissionAmount)}
                      </span>{" "}
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
                          <CheckCircle2 size={11} /> Disbursed
                        </span>
                      )}
                      {p.status === "eligible" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          <CheckCircle2 size={11} /> Ready
                        </span>
                      )}
                      {p.status === "cooling_off" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" title="Held during customer 7-day return/exchange window">
                          <ShieldCheck size={11} /> Cooling Off
                        </span>
                      )}
                      {p.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <Clock size={11} /> In Transit
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-[var(--ink-muted)]">
                      <div>Period: {p.settlementPeriod || "Current"}</div>
                      {p.eligibleAt && (
                        <div className="text-[10px]">
                          Eligible: {formatDate(p.eligibleAt)}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {p.status === "completed" ? (
                        <div>
                          <div className="text-[10px] font-mono font-bold text-emerald-600">
                            {p.utrNumber || p.transactionReference || "NEFT-CONFIRMED"}
                          </div>
                          <div className="text-[10px] text-[var(--ink-muted)]">
                            {p.paidAt ? formatDate(p.paidAt) : "Paid"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-[var(--ink-muted)]">
                          Scheduled Month-End
                        </span>
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
  );
};

export default SellerPayoutsPage;
