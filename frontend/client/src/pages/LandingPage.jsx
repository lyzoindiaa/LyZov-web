import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SlidersHorizontal, X, ArrowUpDown, Sparkles } from "lucide-react";
import { useSelector } from "react-redux";
import Hero from "../components/layout/Hero";
import ProductGrid from "../components/product/ProductGrid";
import FilterSidebar from "../components/product/FilterSidebar";
import CategoryFilter from "../components/product/CategoryFilter";
import { productService } from "../services/productService";

const sortOptions = [
  { label: "Recommended", value: "popular" },
  { label: "Newest Arrivals", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Top Rated", value: "rating-desc" },
];

const LandingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const loadMoreRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const searchDraft = useSelector((state) => state.ui.searchDraft);

  const filters = Object.fromEntries(searchParams.entries());
  // Stable string key — avoids creating a new object ref on every render
  const filtersKey = searchParams.toString();
  const isFiltered = useMemo(
    () => Boolean(filters.search || filters.category || filters.minPrice || filters.sort || inStockOnly),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtersKey, inStockOnly]
  );

  // Redirect legacy /?search=... links to /shop so the Hero is never hidden on the home page
  useEffect(() => {
    if (filters.search) {
      const shopParams = new URLSearchParams(searchParams);
      navigate(`/shop?${shopParams.toString()}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    loadingMoreRef.current = false;
    try {
      const queryFilters = { ...filters };
      delete queryFilters.page;
      const res = await productService.getProducts({ ...queryFilters, page: 1, limit: 8 });
      let list = res.data || [];
      if (inStockOnly) list = list.filter((p) => (p.stock || 0) > 0);
      setProducts(list);
      setMeta(res.meta || { page: 1, totalPages: 1, total: list.length });
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
    // Use stable filtersKey string, NOT the searchParams object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, inStockOnly]);

  useEffect(() => {
    fetchProducts();
    if (isFiltered) {
      const el = document.getElementById("store-products");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
    // fetchProducts is already stable per filtersKey; isFiltered is memoized
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
      let nextProducts = res.data || [];
      if (inStockOnly) nextProducts = nextProducts.filter((p) => (p.stock || 0) > 0);
      setProducts((currentProducts) => [...currentProducts, ...nextProducts]);
      setMeta(res.meta || { ...meta, page: meta.page + 1 });
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [filtersKey, inStockOnly, meta]);

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

  const clearFilters = () => {
    setInStockOnly(false);
    setSearchParams({});
  };

  const hasActiveFilters = filters.category || filters.search || filters.minPrice || inStockOnly;
  // Hide hero whenever there's an active search, category, or searchDraft in progress
  const showHero = !filters.search && !filters.category && !searchDraft;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)" }}>
      {/* ── Top Hero Banner (Shown on default home view) ── */}
      {showHero && <Hero />}
      {/* Category Filter */}
      {showHero && <CategoryFilter />}
      {/* {!filters.search && !isFiltered && <WhyLyZov />} */}

      {/* ── Products Section ── */}
      <section id="store-products" className="container-page py-10 lg:py-14">
        {/* Section Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="eyebrow flex items-center gap-1.5">
              <Sparkles size={12} /> Shop LyZov
            </span>
            <h2
              style={{
                color: "var(--ink)",
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                marginTop: "0.25rem",
              }}
            >
              {filters.search ? `Results for "${filters.search}"` : "Trending Picks You'll Love"}
            </h2>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.9375rem", marginTop: "0.35rem", lineHeight: 1.6 }}>
              {meta.total > 0
                ? `${meta.total} handpicked products — ${products.length} shown on this page`
                : "Fresh arrivals and customer favorites, updated regularly"}
            </p>
          </div>
        </div>

        {/* Controls Bar */}
        <div
          style={{
            borderBottom: "1px solid var(--border)",
            paddingBottom: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Filter triggers */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  border: `1.5px solid ${isFilterOpen ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "0.75rem",
                  backgroundColor: isFilterOpen ? "var(--accent-bg)" : "var(--surface)",
                  color: isFilterOpen ? "var(--accent)" : "var(--ink)",
                  padding: "0.45rem 0.9rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.18s",
                }}
              >
                <SlidersHorizontal size={13} />
                {isFilterOpen ? "Hide Filters" : "Filter Catalog"}
              </button>

              <button
                type="button"
                onClick={() => setInStockOnly(!inStockOnly)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  border: `1.5px solid ${inStockOnly ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "0.75rem",
                  backgroundColor: inStockOnly ? "var(--accent-bg)" : "var(--surface)",
                  color: inStockOnly ? "var(--accent)" : "var(--ink-muted)",
                  padding: "0.45rem 0.9rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.18s",
                }}
              >
                In Stock Only
                {inStockOnly && <X size={11} />}
              </button>

              {filters.category && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    backgroundColor: "var(--accent-bg)",
                    color: "var(--accent)",
                    borderRadius: "9999px",
                    padding: "0.25rem 0.65rem",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  Category <X size={11} className="cursor-pointer" onClick={() => updateFilters({ category: undefined })} />
                </span>
              )}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--accent)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: "0 0.25rem",
                  }}
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Right: Sort Select */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>Sort by:</span>
              <select
                value={filters.sort || "popular"}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                style={{
                  appearance: "none",
                  border: "1.5px solid var(--border)",
                  borderRadius: "0.75rem",
                  backgroundColor: "var(--surface)",
                  color: "var(--ink)",
                  padding: "0.45rem 2.5rem 0.45rem 0.85rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  outline: "none",
                  boxShadow: "var(--shadow-xs)",
                }}
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ArrowUpDown
                size={13}
                style={{ position: "absolute", right: "0.75rem", pointerEvents: "none", color: "var(--ink-muted)" }}
              />
            </div>
          </div>
        </div>

        {/* Grid Layout */}
        <div className={`grid grid-cols-1 gap-8 ${isFilterOpen ? "lg:grid-cols-[240px_1fr]" : ""}`}>
          {isFilterOpen && (
            <div className="hidden lg:block">
              <div style={{ position: "sticky", top: "5.5rem" }}>
                <FilterSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
              </div>
            </div>
          )}

          {/* Mobile Drawer */}
          {isFilterOpen && (
            <div className="fixed inset-0 z-[95] lg:hidden">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: "100%",
                  maxWidth: "20rem",
                  overflowY: "auto",
                  backgroundColor: "var(--bg)",
                  borderRight: "1px solid var(--border)",
                  padding: "1.25rem",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)" }}>Filter Catalog</span>
                  <button
                    type="button"
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

          {/* Product Grid */}
          <div>
            <ProductGrid products={products} isLoading={isLoading} emptyMessage="No products match your filters" />
            <div ref={loadMoreRef} style={{ minHeight: "1px", marginTop: "2rem" }} aria-hidden="true" />
            {isLoadingMore && (
              <p style={{ textAlign: "center", color: "var(--ink-muted)", fontSize: "0.8rem" }}>Loading more products...</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;