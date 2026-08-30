import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import ProductGrid from "../components/product/ProductGrid";
import FilterSidebar from "../components/product/FilterSidebar";
import { productService } from "../services/productService";

const sortOptions = [
  { label: "Recommended", value: "popular" },
  { label: "Newest Arrivals", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Top Rated", value: "rating-desc" },
];

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filters = Object.fromEntries(searchParams.entries());
  const page = Number(filters.page) || 1;

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await productService.getProducts({ ...filters, limit: 12 });
      setProducts(res.data || []);
      setMeta(res.meta || { page: 1, totalPages: 1, total: res.data?.length || 0 });
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchProducts]);

  const updateFilters = (updates) => {
    const next = { ...filters, ...updates, page: 1 };
    Object.keys(next).forEach((key) => {
      if (next[key] === undefined || next[key] === "") delete next[key];
    });
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});

  const goToPage = (p) => {
    updateFilters({ page: p });
  };

  return (
    <div className="container-page py-8 lg:py-12">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Store Collection</span>
          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.025em", marginTop: "0.25rem" }}>
            {filters.search ? `Results for "${filters.search}"` : "All Products"}
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", marginTop: "0.25rem" }}>
            Showing {products.length} of {meta.total} curated items
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <button
          onClick={() => setIsFilterOpen(true)}
          className="btn-secondary !py-2 !px-4 text-xs lg:hidden"
        >
          <SlidersHorizontal size={14} /> Filter Products
        </button>

        {/* Active Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {filters.category && (
            <span className="badge badge-accent flex items-center gap-1.5 py-1 px-2.5">
              Category
              <X size={12} className="cursor-pointer" onClick={() => updateFilters({ category: undefined })} />
            </span>
          )}
          {filters.search && (
            <span className="badge badge-accent flex items-center gap-1.5 py-1 px-2.5">
              "{filters.search}"
              <X size={12} className="cursor-pointer" onClick={() => updateFilters({ search: undefined })} />
            </span>
          )}
          {(filters.category || filters.search || filters.minPrice) && (
            <button
              onClick={clearFilters}
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--accent)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }} className="hidden sm:inline">Sort By:</span>
          <select
            value={filters.sort || "popular"}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            style={{
              borderRadius: "0.75rem",
              border: "1.5px solid var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--ink)",
              padding: "0.45rem 0.85rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              outline: "none",
              cursor: "pointer",
              boxShadow: "var(--shadow-xs)",
              transition: "border-color 0.15s",
            }}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <div className="hidden lg:block">
          <div style={{ position: "sticky", top: "5.5rem" }}>
            <FilterSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-[95] lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsFilterOpen(false)}
            />
            <div
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow-2xl)",
              }}
              className="absolute left-0 top-0 h-full w-full max-w-xs overflow-y-auto p-5 border-r"
            >
              <div className="flex items-center justify-between mb-4">
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)" }}>Filter Store</span>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="btn-icon"
                  aria-label="Close filters"
                >
                  <X size={18} />
                </button>
              </div>
              <FilterSidebar
                filters={filters}
                onChange={(f) => {
                  updateFilters(f);
                  setIsFilterOpen(false);
                }}
                onClear={() => {
                  clearFilters();
                  setIsFilterOpen(false);
                }}
              />
            </div>
          </div>
        )}

        <div>
          <ProductGrid products={products} isLoading={isLoading} emptyMessage="No products match your criteria" />

          {meta.totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="btn-icon disabled:opacity-30"
                style={{ border: "1px solid var(--border)", width: "2.25rem", height: "2.25rem" }}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: meta.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i + 1)}
                  style={{
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.18s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: page === i + 1 ? "var(--brand)" : "var(--surface)",
                    color: page === i + 1 ? "var(--bg)" : "var(--ink)",
                    border: page === i + 1 ? "none" : "1px solid var(--border)",
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page >= meta.totalPages}
                onClick={() => goToPage(page + 1)}
                className="btn-icon disabled:opacity-30"
                style={{ border: "1px solid var(--border)", width: "2.25rem", height: "2.25rem" }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopPage;