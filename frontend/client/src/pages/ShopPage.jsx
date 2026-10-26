import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import ProductGrid from "../components/product/ProductGrid";
import FilterSidebar from "../components/product/FilterSidebar";
import { productService } from "../services/productService";
import SEO from "../components/common/SEO";

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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const loadMoreRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const filters = Object.fromEntries(searchParams.entries());
  const filtersKey = searchParams.toString();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    loadingMoreRef.current = false;
    try {
      const queryFilters = { ...filters };
      delete queryFilters.page;
      const res = await productService.getProducts({ ...queryFilters, page: 1, limit: 8 });
      setProducts(res.data || []);
      setMeta(res.meta || { page: 1, totalPages: 1, total: res.data?.length || 0 });
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [filtersKey]);

  useEffect(() => {
    fetchProducts();
    const scrollTarget = filters.category ? document.getElementById("shop-products-grid") : null;
    if (scrollTarget) {
      window.setTimeout(() => scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [fetchProducts]);

  const loadMoreProducts = useCallback(async () => {
    if (loadingMoreRef.current || meta.page >= meta.totalPages) return;

    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const queryFilters = { ...filters };
      delete queryFilters.page;
      const res = await productService.getProducts({
        ...queryFilters,
        page: meta.page + 1,
        limit: 8,
      });
      setProducts((currentProducts) => [...currentProducts, ...(res.data || [])]);
      setMeta(res.meta || { ...meta, page: meta.page + 1 });
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [filtersKey, meta]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || isLoading || meta.page >= meta.totalPages) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMoreProducts();
      },
      { rootMargin: "320px 0px" }
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [isLoading, loadMoreProducts, meta.page, meta.totalPages]);

  const updateFilters = (updates) => {
    const next = { ...filters, ...updates, page: 1 };
    Object.keys(next).forEach((key) => {
      if (next[key] === undefined || next[key] === "") delete next[key];
    });
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});

  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");
  const searchParam = searchParams.get("search");

  let pageTitle = "Shop All Products";
  if (categoryParam) {
    pageTitle = `${categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)} - Shop`;
  } else if (brandParam) {
    pageTitle = `${brandParam.charAt(0).toUpperCase() + brandParam.slice(1)} Collection - Shop`;
  } else if (searchParam) {
    pageTitle = `Results for "${searchParam}" - Shop`;
  }

  const pageDescription = `Explore ${pageTitle} on LyZov. Discover curated, quality-checked products with direct pricing and safe Pan-India delivery.`;

  return (
    <div className="container-page py-8 lg:py-12">
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonicalUrl={`${window.location.origin}/shop`}
      />
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div id="shop-products-grid">
          <span className="eyebrow">Curated Collection</span>
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
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)" }}>Filter Products</span>
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
          <ProductGrid products={products} isLoading={isLoading} emptyMessage="No products match your criteria" hasSidebar={true} />
          <div ref={loadMoreRef} style={{ minHeight: "1px", marginTop: "2rem" }} aria-hidden="true" />
          {isLoadingMore && (
            <p style={{ textAlign: "center", color: "var(--ink-muted)", fontSize: "0.8rem" }}>Loading more products...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopPage;