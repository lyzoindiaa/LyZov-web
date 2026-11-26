import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, Image as ImageIcon, BookMarked, ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { productService } from "../../services/productService";
import { adminProductService } from "../../services/adminProductService";
import { formatCurrency } from "../../utils/formatters";
import Button from "../../components/ui/Button";
import ProductImageGalleryModal from "../../components/admin/ProductImageGalleryModal";
import Pagination from "../../components/common/Pagination";
import { getDraftIndex, loadDraft, clearDraft } from "../../hooks/useDraft";

const AdminProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Draft state
  const [drafts, setDrafts] = useState([]);
  const [showDraftBanner, setShowDraftBanner] = useState(true);

  const refreshDrafts = () => {
    const index = getDraftIndex();
    const loaded = index
      .map((lyId) => loadDraft(lyId))
      .filter(Boolean)
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    setDrafts(loaded);
  };

  const loadProducts = async (page = pagination.page, limit = pagination.limit) => {
    setIsLoading(true);
    try {
      const res = await adminProductService.getMyProducts({ page, limit });
      setProducts(res.data || []);
      const meta = res.meta || res.pagination;
      if (meta) {
        setPagination({
          page: meta.page || page,
          limit: meta.limit || limit,
          total: meta.total || 0,
          totalPages: meta.totalPages || 1,
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load seller products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(1, pagination.limit);
    refreshDrafts();
  }, []);

  const handleEdit = (product) => {
    navigate(`/seller/products/${product._id}/edit`);
  };

  const handleAdd = () => {
    navigate("/seller/products/add");
  };

  const handleViewImages = (product) => {
    setViewingProduct(product);
    setIsGalleryOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product? This action cannot be undone.")) return;
    try {
      await adminProductService.deleteProduct(id);
      toast.success("Product deleted");
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete product");
    }
  };

  const handleContinueDraft = (draft) => {
    navigate(`/seller/products/add?draft=${draft.lyId}`);
  };

  const handleDiscardDraft = (lyId) => {
    if (!confirm("Discard this draft? This cannot be undone.")) return;
    clearDraft(lyId);
    refreshDrafts();
    toast.info("Draft discarded.");
  };

  const formatDraftTime = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow">Catalog</span>
          <h1 className="mt-1 font-display text-3xl tracking-tightest">Products</h1>
        </div>
        <div className="flex items-center gap-3">
          {drafts.length > 0 && (
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-300/60 dark:border-amber-500/40 cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
              onClick={() => setShowDraftBanner((v) => !v)}
              title={showDraftBanner ? "Hide drafts" : "Show drafts"}
            >
              <BookMarked size={13} />
              {drafts.length} saved {drafts.length === 1 ? "draft" : "drafts"}
            </span>
          )}
          <Button icon={Plus} onClick={handleAdd}>
            Add Product
          </Button>
        </div>
      </div>

      {/* Drafts Banner */}
      {drafts.length > 0 && showDraftBanner && (
        <div
          id="drafts-banner"
          className="relative rounded-2xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-500/30 p-4 overflow-hidden"
        >
          {/* Decorative accent strip */}
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-l-2xl" />

          <div className="pl-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookMarked size={16} className="text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                  Unsaved Drafts
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 dark:bg-amber-800/40 dark:text-amber-300">
                  {drafts.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDraftBanner(false)}
                className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {drafts.map((draft) => (
                <div
                  key={draft.lyId}
                  className="flex items-center justify-between gap-3 flex-wrap bg-white/70 dark:bg-charcoal/40 rounded-xl px-4 py-3 border border-amber-200/60 dark:border-amber-700/30"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {draft.formValues?.title || (
                        <span className="italic text-stone">Untitled product</span>
                      )}
                    </p>
                    <p className="text-[11px] text-stone mt-0.5">
                      <span className="font-mono text-xs text-amber-700 dark:text-amber-400 mr-2">
                        {draft.lyId}
                      </span>
                      · Saved {formatDraftTime(draft.savedAt)}
                      {draft.currentStep && (
                        <span className="ml-2 capitalize">
                          · Last on: <strong>{draft.currentStep}</strong> step
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDiscardDraft(draft.lyId)}
                      className="text-xs text-stone hover:text-red-500 font-medium transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      id={`continue-draft-${draft.lyId}`}
                      onClick={() => handleContinueDraft(draft)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                    >
                      Continue <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead>
              <tr className="border-b border-hairline text-xs uppercase tracking-wide text-stone dark:border-hairline-dark">
                <th className="px-4 sm:px-5 py-4 whitespace-nowrap">Product</th>
                <th className="px-4 sm:px-5 py-4 whitespace-nowrap">Category</th>
                <th className="px-4 sm:px-5 py-4 whitespace-nowrap">Price</th>
                <th className="px-4 sm:px-5 py-4 whitespace-nowrap">Stock</th>
                <th className="px-4 sm:px-5 py-4 whitespace-nowrap">Images</th>
                <th className="px-4 sm:px-5 py-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            {!isLoading && products.length > 0 && (
              <tbody>
                {products.map((product) => (
                <tr key={product._id} className="border-b border-hairline last:border-0 dark:border-hairline-dark">
                  <td className="px-4 sm:px-5 py-4 min-w-[220px] max-w-[280px]">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0]?.url}
                        alt={product.title}
                        className="h-12 w-10 rounded-md object-cover shrink-0"
                      />
                      <span className="font-medium line-clamp-2">{product.title}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-5 py-4 text-stone whitespace-nowrap">{product.category?.name}</td>
                  <td className="px-4 sm:px-5 py-4 tabular-nums font-semibold whitespace-nowrap">{formatCurrency(product.price)}</td>
                  <td className="px-4 sm:px-5 py-4 tabular-nums whitespace-nowrap">{product.stock}</td>
                  <td className="px-4 sm:px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {product.images && product.images.length > 0 ? (
                        <>
                          <span className="text-xs text-stone whitespace-nowrap">
                            {product.images.length} {product.images.length === 1 ? 'image' : 'images'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleViewImages(product)}
                            className="p-1.5 rounded-lg text-stone hover:text-blue-500 hover:bg-blue-500/10 transition-colors shrink-0 inline-flex items-center justify-center"
                            title="View images"
                            aria-label="View product images"
                          >
                            <Eye size={16} className="shrink-0" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-stone flex items-center gap-1 whitespace-nowrap">
                          <ImageIcon size={14} className="shrink-0" /> No images
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-5 py-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        className="p-2 rounded-lg text-stone hover:text-ink hover:bg-[var(--bg-raised)] dark:hover:text-cream transition-colors shrink-0 inline-flex items-center justify-center"
                        title="Edit product"
                        aria-label="Edit product"
                      >
                        <Pencil size={16} className="shrink-0" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product._id)}
                        className="p-2 rounded-lg text-stone hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0 inline-flex items-center justify-center"
                        title="Delete product"
                        aria-label="Delete product"
                      >
                        <Trash2 size={16} className="shrink-0" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {isLoading ? (
          <div className="px-5 py-8 text-center text-stone">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="px-5 py-12 text-center text-stone">
            <div className="flex flex-col items-center justify-center gap-2">
              <p className="text-base font-semibold text-gray-700 dark:text-gray-300">No products found</p>
              <p className="text-xs text-stone">You haven't added any products to your catalog yet.</p>
              <Button icon={Plus} size="sm" onClick={handleAdd} className="mt-2 whitespace-nowrap">
                Add Your First Product
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        itemLabel="products"
        showLimitSelector={true}
        limitOptions={[12, 24, 48]}
        onPageChange={(newPage) => loadProducts(newPage, pagination.limit)}
        onLimitChange={(newLimit) => loadProducts(1, newLimit)}
      />

      <ProductImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        product={viewingProduct}
      />
    </div>
  );
};

export default AdminProductsPage;
