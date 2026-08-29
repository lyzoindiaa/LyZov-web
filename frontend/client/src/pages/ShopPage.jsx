import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
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
    } catch (err) {
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
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          {filters.search ? `Results for "${filters.search}"` : "Featured Products"}
        </h1>
        <p className="text-xs text-gray-500">{meta.total} products available</p>
      </div>

      {/* Control Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <button
          onClick={() => setIsFilterOpen(true)}
          className="btn-secondary !py-2 !px-4 text-xs lg:hidden"
        >
          <SlidersHorizontal size={14} /> Filter
        </button>

        {/* Active Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {filters.category && (
            <span className="badge badge-accent flex items-center gap-1 py-1 px-2.5">
              Category
              <X size={11} className="cursor-pointer" onClick={() => updateFilters({ category: undefined })} />
            </span>
          )}
          {filters.search && (
            <span className="badge badge-accent flex items-center gap-1 py-1 px-2.5">
              "{filters.search}"
              <X size={11} className="cursor-pointer" onClick={() => updateFilters({ search: undefined })} />
            </span>
          )}
          {(filters.category || filters.search || filters.minPrice) && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-amber-700 hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-gray-500 sm:inline">Sort By :</span>
          <select
            value={filters.sort || "popular"}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-gray-900 cursor-pointer shadow-soft"
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
          <FilterSidebar filters={filters} onChange={updateFilters} onClear={clearFilters} />
        </div>

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

        <div>
          <ProductGrid products={products} isLoading={isLoading} emptyMessage="No products match your criteria" />

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

export default ShopPage;