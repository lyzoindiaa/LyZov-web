import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Store,
  Layers,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  X,
  Eye,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { toast } from "react-toastify";

const AdminProductModerationPage = () => {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("pending_approval");
  const [loading, setLoading] = useState(true);

  // Reject Modal State
  const [rejectingProduct, setRejectingProduct] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchModerationQueue = async (page = 1, status = statusFilter) => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (status) params.status = status;
      const res = await adminService.getProductsForModeration(params);
      setProducts(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load moderation queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerationQueue(1, statusFilter);
  }, [statusFilter]);

  const handleApprove = async (productId) => {
    try {
      await adminService.moderateProduct(productId, { status: "approved" });
      toast.success("Product approved and activated in live marketplace!");
      fetchModerationQueue(meta.page, statusFilter);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to approve product");
    }
  };

  const handleOpenRejectModal = (product) => {
    setRejectingProduct(product);
    setFeedback("");
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingProduct) return;
    if (!feedback.trim()) {
      toast.error("Please provide feedback explaining why the product was rejected.");
      return;
    }

    try {
      setIsSubmitting(true);
      await adminService.moderateProduct(rejectingProduct._id, {
        status: "rejected",
        feedback: feedback.trim(),
      });
      toast.warn("Product rejected with feedback sent to merchant.");
      setRejectingProduct(null);
      fetchModerationQueue(meta.page, statusFilter);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reject product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-black text-[var(--ink)] tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="text-[var(--accent)]" size={26} />
            Product Moderation Queue
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-muted)] mt-1">
            Review merchant-submitted product listings for brand compliance, quality standards, and pricing accuracy.
          </p>
        </div>
        <button
          onClick={() => fetchModerationQueue(meta.page, statusFilter)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--border)]/30 transition-colors shadow-xs"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Queue
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: "Pending Approval", value: "pending_approval" },
          { label: "Approved Products", value: "approved" },
          { label: "Rejected Products", value: "rejected" },
          { label: "All Items", value: "" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap ${
              statusFilter === tab.value
                ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs"
                : "bg-[var(--surface)] text-[var(--ink-muted)] border-[var(--border)] hover:text-[var(--ink)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="card-surface p-12 text-center rounded-xl border border-[var(--border)] text-[var(--ink-muted)]">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[var(--accent)]" />
          Loading products awaiting review...
        </div>
      ) : products.length === 0 ? (
        <div className="card-surface p-12 text-center rounded-xl border border-[var(--border)] text-[var(--ink-muted)]">
          <CheckCircle size={32} className="mx-auto mb-2 text-emerald-500 opacity-80" />
          <p className="font-bold text-[var(--ink)] text-base">Moderation queue is clean!</p>
          <p className="text-xs mt-1">No products currently match the selected moderation status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => {
            const primaryImg = p.images?.[0]?.url || "";
            const sellerBusiness = p.seller?.sellerProfile?.businessName || p.seller?.name || "Independent Merchant";
            const storeSlug = p.seller?.sellerProfile?.storeSlug;

            return (
              <div
                key={p._id}
                className="card-surface rounded-xl border border-[var(--border)] overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Thumbnail & Badges */}
                  <div className="relative h-48 bg-[var(--surface-muted)] overflow-hidden border-b border-[var(--border)]">
                    {primaryImg ? (
                      <img
                        src={primaryImg}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--ink-muted)]">
                        <Layers size={32} />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      {p.moderationStatus === "approved" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                          <CheckCircle size={10} /> Approved
                        </span>
                      )}
                      {p.moderationStatus === "pending_approval" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                          <Clock size={10} /> Needs Review
                        </span>
                      )}
                      {p.moderationStatus === "rejected" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                          <XCircle size={10} /> Rejected
                        </span>
                      )}
                    </div>

                    {/* Price Tag */}
                    <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-xs text-white text-xs font-black">
                      {formatCurrency(p.price)}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 flex flex-col gap-2">
                    <h3 className="font-bold text-sm text-[var(--ink)] line-clamp-1">{p.name}</h3>

                    {/* Merchant Attribution */}
                    <div className="flex items-center justify-between text-xs text-[var(--ink-muted)] border-b border-[var(--border)] pb-2">
                      <span className="flex items-center gap-1">
                        <Store size={12} className="text-[var(--accent)]" />
                        <strong className="text-[var(--ink)]">{sellerBusiness}</strong>
                      </span>
                      {storeSlug && (
                        <Link
                          to={`/store/${storeSlug}`}
                          target="_blank"
                          className="text-[var(--accent)] hover:underline inline-flex items-center gap-0.5 text-[11px]"
                        >
                          Storefront <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--ink-muted)] pt-1">
                      <div>
                        Category: <span className="font-semibold text-[var(--ink)]">{p.category?.name || "General"}</span>
                      </div>
                      <div>
                        Stock: <span className="font-semibold text-[var(--ink)]">{p.stock || 0} units</span>
                      </div>
                    </div>

                    {/* Moderation Feedback if rejected */}
                    {p.moderationFeedback && (
                      <div className="mt-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-700 dark:text-rose-300">
                        <strong>Feedback Note:</strong> {p.moderationFeedback}
                      </div>
                    )}
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-muted)]/30 flex items-center justify-between gap-2">
                  <Link
                    to={`/product/${p.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  >
                    <Eye size={13} /> Preview
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenRejectModal(p)}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(p._id)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject with Feedback Modal */}
      {rejectingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="card-surface w-full max-w-md rounded-2xl border border-[var(--border)] shadow-2xl p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--ink)]">Reject Product Listing</h3>
                <p className="text-xs text-[var(--ink-muted)] mt-0.5 truncate max-w-xs">
                  {rejectingProduct.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRejectingProduct(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">
                  Rejection Reason / Seller Feedback *
                </label>
                <textarea
                  required
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Specify clear quality guidelines (e.g. Please upload higher-resolution white-background images, correct the MRP pricing, or add full material specifications)."
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-hidden focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setRejectingProduct(null)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !feedback.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductModerationPage;
