import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Ticket,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Edit2,
  Trash2,
  TrendingUp,
  Percent,
  IndianRupee,
  Calendar,
  AlertCircle,
  Store,
  Layers,
  X,
  RefreshCw,
} from "lucide-react";
import couponService from "../../services/couponService";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { toast } from "react-toastify";

const AdminCouponsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === "admin";

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [copiedCode, setCopiedCode] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minPurchaseAmount: 0,
    maxDiscountAmount: "",
    usageLimit: "",
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    isActive: true,
  });

  // Delete Confirmation State
  const [deletingCoupon, setDeletingCoupon] = useState(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (isSuperAdmin && scopeFilter !== "all") params.scope = scopeFilter;
      if (search.trim()) params.search = search.trim();

      const res = await couponService.getCoupons(params);
      setCoupons(res.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [statusFilter, scopeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCoupons();
  };

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied "${code}" to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minPurchaseAmount: 0,
      maxDiscountAmount: "",
      usageLimit: "",
      validFrom: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue || "",
      minPurchaseAmount: coupon.minPurchaseAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || "",
      usageLimit: coupon.usageLimit || "",
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split("T")[0] : "",
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split("T")[0] : "",
      isActive: coupon.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (coupon) => {
    try {
      const nextState = !coupon.isActive;
      await couponService.updateCoupon(coupon._id, { isActive: nextState });
      toast.success(`Coupon ${coupon.code} ${nextState ? "activated" : "paused"}`);
      setCoupons((prev) =>
        prev.map((c) => (c._id === coupon._id ? { ...c, isActive: nextState } : c))
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update coupon status");
    }
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minPurchaseAmount: Number(formData.minPurchaseAmount) || 0,
        maxDiscountAmount:
          formData.discountType === "percentage" && formData.maxDiscountAmount !== ""
            ? Number(formData.maxDiscountAmount)
            : null,
        usageLimit: formData.usageLimit !== "" ? Number(formData.usageLimit) : null,
        validFrom: new Date(formData.validFrom),
        validUntil: new Date(formData.validUntil + "T23:59:59.999Z"),
        isActive: formData.isActive,
      };

      if (editingCoupon) {
        await couponService.updateCoupon(editingCoupon._id, payload);
        toast.success(`Coupon ${editingCoupon.code} updated successfully`);
      } else {
        await couponService.createCoupon(payload);
        toast.success(`Coupon ${payload.code} created successfully`);
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCoupon) return;
    try {
      await couponService.deleteCoupon(deletingCoupon._id);
      toast.success(`Coupon ${deletingCoupon.code} deleted`);
      setDeletingCoupon(null);
      setCoupons((prev) => prev.filter((c) => c._id !== deletingCoupon._id));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete coupon");
    }
  };

  // Aggregated KPI Stats
  const totalCoupons = coupons.length;
  const activeCount = coupons.filter(
    (c) => c.isActive && new Date(c.validUntil) >= new Date() && new Date(c.validFrom) <= new Date()
  ).length;
  const totalOrdersInfluenced = coupons.reduce((sum, c) => sum + (c.stats?.orders || 0), 0);
  const totalDiscountDisbursed = coupons.reduce((sum, c) => sum + (c.stats?.discountGiven || 0), 0);
  const totalRevenueGenerated = coupons.reduce((sum, c) => sum + (c.stats?.revenue || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-black text-[var(--ink)] tracking-tight flex items-center gap-2.5">
            <Ticket className="text-[var(--accent)]" size={26} />
            {isSuperAdmin ? "Marketplace Coupons & Promotions" : "Store Coupons & Vouchers"}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-muted)] mt-1">
            {isSuperAdmin
              ? "Create platform-wide promotional discounts and monitor seller-created store vouchers across the marketplace."
              : "Create exclusive discount codes for your store to increase conversions and reward loyal customers."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCoupons}
            className="btn-secondary !py-2 !px-3 text-xs font-bold inline-flex items-center gap-1.5"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="btn-accent !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 shadow-soft"
          >
            <Plus size={16} />
            {isSuperAdmin ? "New Platform Coupon" : "Create Store Coupon"}
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Active Vouchers
            </span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </span>
          </div>
          <p className="text-2xl font-black text-[var(--ink)] mt-2">
            {activeCount}{" "}
            <span className="text-xs font-normal text-[var(--ink-muted)]">/ {totalCoupons} total</span>
          </p>
          <span className="text-[11px] text-[var(--ink-muted)]">Currently redeemable by shoppers</span>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Orders Influenced
            </span>
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp size={18} />
            </span>
          </div>
          <p className="text-2xl font-black text-[var(--ink)] mt-2">{totalOrdersInfluenced}</p>
          <span className="text-[11px] text-[var(--ink-muted)]">Successful checkouts with coupon</span>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Discounts Given
            </span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Percent size={18} />
            </span>
          </div>
          <p className="text-2xl font-black text-[var(--ink)] mt-2">
            {formatCurrency(totalDiscountDisbursed)}
          </p>
          <span className="text-[11px] text-[var(--ink-muted)]">Total customer savings disbursed</span>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Influenced Sales
            </span>
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <IndianRupee size={18} />
            </span>
          </div>
          <p className="text-2xl font-black text-[var(--ink)] mt-2">
            {formatCurrency(totalRevenueGenerated)}
          </p>
          <span className="text-[11px] text-[var(--ink-muted)]">Gross checkout value from campaigns</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coupon code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter size={14} className="text-[var(--ink-muted)]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-xs font-medium focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active & Live</option>
              <option value="scheduled">Scheduled (Future)</option>
              <option value="expired">Expired</option>
              <option value="inactive">Paused (Inactive)</option>
            </select>
          </div>

          {/* Super Admin Scope Filter */}
          {isSuperAdmin && (
            <div className="flex items-center gap-1.5 text-xs">
              <Layers size={14} className="text-[var(--ink-muted)]" />
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                className="py-1.5 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-xs font-medium focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="all">All Scopes</option>
                <option value="platform">Platform-Wide (Admin)</option>
                <option value="seller">Seller Stores Only</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Coupons Table */}
      <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)] shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)] font-bold text-[var(--ink-muted)] uppercase tracking-wider">
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Funding & Scope</th>
                <th className="py-3 px-4">Thresholds</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Redemptions</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--ink-muted)]">
                    <RefreshCw size={22} className="animate-spin inline-block mb-2 text-[var(--accent)]" />
                    <p className="font-medium">Loading promotional campaigns...</p>
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--ink-muted)]">
                    <Ticket size={32} className="inline-block mb-2 opacity-30" />
                    <p className="font-bold text-sm text-[var(--ink)]">No coupons found</p>
                    <p className="text-xs mt-1">Create your first coupon code to start offering customer discounts.</p>
                    <button
                      onClick={openCreateModal}
                      className="btn-accent !py-1.5 !px-3 text-xs font-bold inline-flex items-center gap-1.5 mt-3"
                    >
                      <Plus size={14} /> Create Coupon
                    </button>
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  const now = new Date();
                  const from = new Date(coupon.validFrom);
                  const until = new Date(coupon.validUntil);
                  const isExpired = now > until;
                  const isScheduled = now < from;
                  const isLive = coupon.isActive && !isExpired && !isScheduled;

                  return (
                    <tr key={coupon._id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm px-2.5 py-1 rounded-md bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--accent)] tracking-wider">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-raised)] transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === coupon.code ? (
                              <Check size={14} className="text-emerald-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                        {coupon.description && (
                          <p className="text-[11px] text-[var(--ink-muted)] mt-1 max-w-xs truncate">
                            {coupon.description}
                          </p>
                        )}
                      </td>

                      {/* Discount Value */}
                      <td className="py-3.5 px-4 font-bold text-[var(--ink)]">
                        {coupon.discountType === "percentage" ? (
                          <div className="flex flex-col">
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                              {coupon.discountValue}% OFF
                            </span>
                            {coupon.maxDiscountAmount ? (
                              <span className="text-[10px] text-[var(--ink-muted)] font-normal">
                                Cap: {formatCurrency(coupon.maxDiscountAmount)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[var(--ink-muted)] font-normal">No cap</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                            {formatCurrency(coupon.discountValue)} FLAT
                          </span>
                        )}
                      </td>

                      {/* Scope & Funding */}
                      <td className="py-3.5 px-4">
                        {coupon.scope === "seller" ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Store size={11} /> Store Only
                            </span>
                            <p className="text-[10px] text-[var(--ink-muted)] mt-0.5 font-medium">
                              {coupon.seller?.sellerProfile?.businessName || coupon.seller?.name || "Merchant"}
                            </p>
                            <span className="text-[9px] text-[var(--ink-subtle)]">(Seller Funded)</span>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              <Layers size={11} /> Platform-Wide
                            </span>
                            <p className="text-[9px] text-[var(--ink-subtle)] mt-0.5">(Platform Funded)</p>
                          </div>
                        )}
                      </td>

                      {/* Min purchase & limits */}
                      <td className="py-3.5 px-4 text-[var(--ink-muted)]">
                        <div>
                          <span>Min: {formatCurrency(coupon.minPurchaseAmount || 0)}</span>
                        </div>
                        <div className="text-[10px] text-[var(--ink-subtle)] mt-0.5">
                          Limit: {coupon.usageLimit ? `${coupon.usageLimit} total` : "Unlimited"}
                        </div>
                      </td>

                      {/* Validity */}
                      <td className="py-3.5 px-4 text-[var(--ink-muted)]">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar size={12} className="text-[var(--ink-subtle)] shrink-0" />
                          <span>
                            {new Date(coupon.validFrom).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            –{" "}
                            {new Date(coupon.validUntil).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            <Clock size={11} /> Expired
                          </span>
                        ) : isScheduled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            <Clock size={11} /> Scheduled
                          </span>
                        ) : isLive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <CheckCircle2 size={11} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">
                            <XCircle size={11} /> Paused
                          </span>
                        )}
                      </td>

                      {/* Redemptions & Analytics */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[var(--ink)]">
                          {coupon.usedCount || 0} uses
                        </div>
                        {coupon.stats && (
                          <div className="text-[10px] text-[var(--ink-muted)]">
                            Sales: {formatCurrency(coupon.stats.revenue)}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Toggle Active Switch */}
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            className={`p-1.5 rounded-md border text-xs font-semibold transition-colors ${
                              coupon.isActive
                                ? "border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                                : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                            }`}
                            title={coupon.isActive ? "Pause coupon" : "Activate coupon"}
                          >
                            {coupon.isActive ? "Pause" : "Resume"}
                          </button>

                          {/* Edit (only if owned by caller or super admin editing platform coupon) */}
                          {(!isSuperAdmin || coupon.scope === "platform") && (
                            <button
                              onClick={() => openEditModal(coupon)}
                              className="p-1.5 rounded-md border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-raised)] transition-colors"
                              title="Edit coupon"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingCoupon(coupon)}
                            className="p-1.5 rounded-md border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Delete coupon"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE / EDIT MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-5">
              <div>
                <h3 className="text-lg font-black text-[var(--ink)] flex items-center gap-2">
                  <Ticket size={20} className="text-[var(--accent)]" />
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create New Coupon"}
                </h3>
                <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                  {isSuperAdmin
                    ? "Platform-wide coupons are funded by LyZov platform."
                    : "Store coupons apply exclusively to your products and are merchant-funded."}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1 uppercase tracking-wider">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingCoupon)}
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })
                  }
                  placeholder="e.g. FESTIVE20, SAVE150"
                  className="w-full py-2 px-3 text-sm font-mono font-bold rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-60"
                />
                <span className="text-[10px] text-[var(--ink-muted)]">3–20 characters (letters, numbers, dash, underscore)</span>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1 uppercase tracking-wider">
                  Description / Campaign Headline
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Special festive celebration discount on all products"
                  className="w-full py-2 px-3 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1 uppercase tracking-wider">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full py-2 px-3 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="flat">Flat Amount (₹ INR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1 uppercase tracking-wider">
                    Discount Value *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={formData.discountType === "percentage" ? 90 : 100000}
                      step="any"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      placeholder={formData.discountType === "percentage" ? "e.g. 20" : "e.g. 200"}
                      className="w-full py-2 pl-3 pr-8 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--ink-muted)]">
                      {formData.discountType === "percentage" ? "%" : "₹"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Max Discount (for %) & Min Purchase */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.discountType === "percentage" ? (
                  <div>
                    <label className="block text-xs font-bold text-[var(--ink)] mb-1 uppercase tracking-wider">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      placeholder="e.g. 500 (blank = no cap)"
                      className="w-full py-2 px-3 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-[var(--ink)] mb-1 uppercase tracking-wider">
                      Total Usage Limit
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      placeholder="e.g. 100 (blank = unlimited)"
                      className="w-full py-2 px-3 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1 uppercase tracking-wider">
                    Min Cart Order (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.minPurchaseAmount}
                    onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                    placeholder="e.g. 499 (0 = any order)"
                    className="w-full py-2 px-3 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Usage Limit for Percentage if not rendered above */}
              {formData.discountType === "percentage" && (
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1 uppercase tracking-wider">
                    Total Redemptions Allowed
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="e.g. 500 (blank = unlimited redemptions)"
                    className="w-full py-2 px-3 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              )}

              {/* Validity Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1 uppercase tracking-wider">
                    Valid From Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full py-2 px-3 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1 uppercase tracking-wider">
                    Valid Until Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full py-2 px-3 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="coupon-active-toggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[var(--accent)] focus:ring-0 border-[var(--border)]"
                />
                <label htmlFor="coupon-active-toggle" className="text-xs font-bold text-[var(--ink)]">
                  Make coupon active immediately
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary !py-2 !px-4 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-accent !py-2 !px-5 text-xs font-bold shadow-soft"
                >
                  {isSubmitting ? "Saving..." : editingCoupon ? "Update Coupon" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ── */}
      {deletingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-black text-[var(--ink)] mb-1">
              Delete Coupon "{deletingCoupon.code}"?
            </h3>
            <p className="text-xs text-[var(--ink-muted)] mb-5">
              This action cannot be undone. Shoppers will no longer be able to redeem this code at checkout.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingCoupon(null)}
                className="btn-secondary !py-2 !px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-soft"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCouponsPage;
