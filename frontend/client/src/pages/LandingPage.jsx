import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import ProductGrid from "../components/product/ProductGrid";
import FilterSidebar from "../components/product/FilterSidebar";
import { productService } from "../services/productService";

const sortOptions = [
  { label: "Sort By : Recommended", value: "popular" },
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
      const res = await productService.getProducts({ ...filters, limit: 12 });
      let list = res.data || [];
      if (inStockOnly) {
        list = list.filter((p) => (p.stock || 0) > 0);
      }
      setProducts(list);
      setMeta(res.meta || { page: 1, totalPages: 1, total: list.length });
    } catch (err) {
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

  const clearFilters = () => {
    setInStockOnly(false);
    setSearchParams({});
  };

  const goToPage = (p) => {
    updateFilters({ page: p });
  };

  return (
    <div className="container-page py-8 lg:py-12">
      
      {/* Page Title */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
          {filters.search ? `Search results for "${filters.search}"` : "Featured Products"}
        </h1>
      </div>

      {/* Filter and Control Bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-5">
        
        {/* Left Filter Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-800 hover:border-gray-900 transition-colors shadow-soft"
          >
            <SlidersHorizontal size={14} />
            <span>Filter</span>
          </button>

          {/* In Stock toggle button */}
          <button
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
              inStockOnly
                ? "border-amber-600 bg-amber-50 text-amber-800"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            <span>In Stock</span>
            {inStockOnly && <X size={12} className="cursor-pointer" />}
          </button>

          {/* Category Chip if active */}
          {filters.category && (
            <span className="badge badge-accent flex items-center gap-1 py-1.5 px-3 text-xs font-medium">
              Category Active
              <X size={12} className="cursor-pointer" onClick={() => updateFilters({ category: undefined })} />
            </span>
          )}

          {/* Clear Filters Link */}
          {(filters.category || filters.search || filters.minPrice || inStockOnly) && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-amber-700 hover:underline ml-1"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Right Sort By Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={filters.sort || "popular"}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="appearance-none rounded-xl border border-gray-300 bg-white pl-4 pr-9 py-2 text-xs font-semibold text-gray-800 outline-none hover:border-gray-900 cursor-pointer shadow-soft"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ArrowUpDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className={`grid grid-cols-1 gap-8 ${isFilterOpen ? "lg:grid-cols-[240px_1fr]" : ""}`}>
        
        {/* Collapsible Filter Sidebar on Desktop */}
        {isFilterOpen && (
          <div className="hidden lg:block">
            <FilterSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
          </div>
        )}

        {/* Mobile Filter Drawer */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-[95] lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsFilterOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-full max-w-xs overflow-y-auto bg-white p-5 border-r border-gray-200">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="mb-4 ml-auto flex rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
              <FilterSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
            </div>
          </div>
        )}

        {/* Product Grid Listing */}
        <div>
          <ProductGrid products={products} isLoading={isLoading} emptyMessage="No products match your filters" />

          {meta.totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="btn-icon disabled:opacity-30 border border-gray-200"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: meta.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i + 1)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    page === i + 1
                      ? "bg-black text-white"
                      : "border border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page >= meta.totalPages}
                onClick={() => goToPage(page + 1)}
                className="btn-icon disabled:opacity-30 border border-gray-200"
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

export default LandingPage;