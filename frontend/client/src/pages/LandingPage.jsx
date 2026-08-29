import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
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

const LandingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);

  const filters = Object.fromEntries(searchParams.entries());
  const page = Number(filters.page) || 1;

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await productService.getProducts({ ...filters, limit: 16 });
      let list = res.data || [];
      if (inStockOnly) list = list.filter((p) => (p.stock || 0) > 0);
      setProducts(list);
      setMeta(res.meta || { page: 1, totalPages: 1, total: list.length });
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, inStockOnly]);

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

  const clearFilters = () => { setInStockOnly(false); setSearchParams({}); };
  const goToPage = (p) => updateFilters({ page: p });

  const hasActiveFilters = filters.category || filters.search || filters.minPrice || inStockOnly;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)" }}>
      <div className="container-page py-8 lg:py-10">

        {/* Page Title */}
        <div className="mb-6">
          <h1 style={{ color: "var(--ink)", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
            {filters.search ? `Results for "${filters.search}"` : "Featured Products"}
          </h1>
          <p style={{ color: "var(--ink-muted)", fontSize: "0.75rem", marginTop: "0.25rem" }}>
            {meta.total > 0 ? `${meta.total} products found` : "Browse our full collection"}
          </p>
        </div>

        {/* Controls Bar */}
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Left: Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  border: `1px solid ${isFilterOpen ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "0.75rem",
                  backgroundColor: isFilterOpen ? "var(--accent-bg)" : "var(--surface)",
                  color: isFilterOpen ? "var(--accent)" : "var(--ink)",
                  padding: "0.45rem 0.9rem",
                  fontSize: "0.75rem", fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <SlidersHorizontal size={13} />
                {isFilterOpen ? "Hide Filters" : "Filters"}
              </button>

              <button
                onClick={() => setInStockOnly(!inStockOnly)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  border: `1px solid ${inStockOnly ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "0.75rem",
                  backgroundColor: inStockOnly ? "var(--accent-bg)" : "var(--surface)",
                  color: inStockOnly ? "var(--accent)" : "var(--ink-muted)",
                  padding: "0.45rem 0.9rem",
                  fontSize: "0.75rem", fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                In Stock Only
                {inStockOnly && <X size={11} />}
              </button>

              {filters.category && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", backgroundColor: "var(--accent-bg)", color: "var(--accent)", borderRadius: "9999px", padding: "0.2rem 0.6rem", fontSize: "11px", fontWeight: 700 }}>
                  Category <X size={11} style={{ cursor: "pointer" }} onClick={() => updateFilters({ category: undefined })} />
                </span>
              )}

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: "0 0.25rem" }}
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Right: Sort */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>Sort by:</span>
              <select
                value={filters.sort || "popular"}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                style={{
                  appearance: "none",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                  backgroundColor: "var(--surface)",
                  color: "var(--ink)",
                  padding: "0.45rem 2.5rem 0.45rem 0.75rem",
                  fontSize: "0.75rem", fontWeight: 600,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ArrowUpDown size={13} style={{ position: "absolute", right: "0.6rem", pointerEvents: "none", color: "var(--ink-muted)" }} />
            </div>
          </div>
        </div>

        {/* Grid Layout */}
        <div className={`grid grid-cols-1 gap-6 ${isFilterOpen ? "lg:grid-cols-[240px_1fr]" : ""}`}>
          
          {isFilterOpen && (
            <div className="hidden lg:block">
              <FilterSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
            </div>
          )}

          {/* Mobile Drawer */}
          {isFilterOpen && (
            <div className="fixed inset-0 z-[95] lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setIsFilterOpen(false)} />
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "100%", maxWidth: "20rem", overflowY: "auto", backgroundColor: "var(--bg)", borderRight: "1px solid var(--border)", padding: "1.25rem" }}>
                <button onClick={() => setIsFilterOpen(false)} style={{ marginBottom: "1rem", marginLeft: "auto", display: "flex", padding: "0.375rem", color: "var(--ink-muted)", background: "none", border: "none", cursor: "pointer", borderRadius: "9999px" }}>
                  <X size={18} />
                </button>
                <FilterSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div>
            <ProductGrid products={products} isLoading={isLoading} emptyMessage="No products match your filters" />

            {meta.totalPages > 1 && (
              <div style={{ marginTop: "3rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <button disabled={page <= 1} onClick={() => goToPage(page - 1)} className="btn-icon" style={{ border: "1px solid var(--border)", opacity: page <= 1 ? 0.3 : 1 }}>
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: meta.totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToPage(i + 1)}
                    style={{
                      width: "2.25rem", height: "2.25rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem", fontWeight: 600,
                      backgroundColor: page === i + 1 ? "var(--ink)" : "var(--surface)",
                      color: page === i + 1 ? "var(--bg)" : "var(--ink)",
                      border: page === i + 1 ? "none" : "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
                <button disabled={page >= meta.totalPages} onClick={() => goToPage(page + 1)} className="btn-icon" style={{ border: "1px solid var(--border)", opacity: page >= meta.totalPages ? 0.3 : 1 }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;