import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useParams, useNavigate, Link } from "react-router-dom";
import { SlidersHorizontal, X, ChevronRight } from "lucide-react";
import ProductGrid from "../components/product/ProductGrid";
import FilterSidebar from "../components/product/FilterSidebar";
import { productService } from "../services/productService";
import { categoryService } from "../services/categoryService";
import SEO from "../components/common/SEO";

const sortOptions = [
  { label: "Recommended", value: "popular" },
  { label: "Newest Arrivals", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Top Rated", value: "rating-desc" },
];

const formatSlugLabel = (raw) =>
  String(raw || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const ShopPage = () => {
  const { slug: routeCategorySlug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const loadMoreRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const searchFilters = Object.fromEntries(searchParams.entries());
  const activeCategorySlug = routeCategorySlug || searchFilters.category || "";
  const filters = useMemo(
    () => ({
      ...searchFilters,
      ...(activeCategorySlug ? { category: activeCategorySlug } : {}),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString(), activeCategorySlug]
  );
  const filtersKey = useMemo(
    () => `${activeCategorySlug}::${searchParams.toString()}`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCategorySlug, searchParams.toString()]
  );

  useEffect(() => {
    categoryService
      .getCategories()
      .then((res) => setCategories(res?.data || []))
      .catch(() => {});
  }, []);

  const activeCategory = useMemo(() => {
    if (!activeCategorySlug) return null;
    const norm = activeCategorySlug.toLowerCase();
    return (
      categories.find(
        (c) => String(c.slug || "").toLowerCase() === norm || String(c._id) === activeCategorySlug
      ) || null
    );
  }, [categories, activeCategorySlug]);

  const subcategories = useMemo(() => {
    if (!activeCategory) return [];
    return categories.filter((c) => {
      const parentId = c.parent?._id ? String(c.parent._id) : c.parent ? String(c.parent) : "";
      return parentId === String(activeCategory._id);
    });
  }, [categories, activeCategory]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    loadingMoreRef.current = false;
    try {
      const queryFilters = { ...filters };
      delete queryFilters.page;
      const res = await productService.getProducts({ ...queryFilters, page: 1, limit: 12 });
      setProducts(res.data || []);
      setMeta(res.meta || { page: 1, totalPages: 1, total: res.data?.length || 0 });
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    fetchProducts();
    const scrollTarget = activeCategorySlug ? document.getElementById("shop-products-grid") : null;
    if (scrollTarget) {
      window.setTimeout(() => scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [fetchProducts, activeCategorySlug]);

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
        limit: 12,
      });
      setProducts((currentProducts) => [...currentProducts, ...(res.data || [])]);
      setMeta(res.meta || { ...meta, page: meta.page + 1 });
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const next = { ...searchFilters, ...updates };
    delete next.page;
    const nextCategory = Object.prototype.hasOwnProperty.call(updates, "category")
      ? updates.category
      : activeCategorySlug;
    delete next.category;

    const params = new URLSearchParams();
    Object.keys(next).forEach((key) => {
      if (next[key] !== undefined && next[key] !== "") {
        params.set(key, next[key]);
      }
    });
    const qs = params.toString();

    if (nextCategory) {
      navigate(`/category/${encodeURIComponent(nextCategory)}${qs ? `?${qs}` : ""}`);
    } else if (routeCategorySlug) {
      navigate(`/shop${qs ? `?${qs}` : ""}`);
    } else {
      setSearchParams(params);
    }
  };

  const clearFilters = () => {
    if (routeCategorySlug) {
      navigate("/shop");
    } else {
      setSearchParams({});
    }
  };

  const brandParam = searchParams.get("brand");
  const searchParam = searchParams.get("search");
  const categoryName = activeCategory?.name || (activeCategorySlug ? formatSlugLabel(activeCategorySlug) : "");
  const canonicalCategorySlug = activeCategory?.slug || activeCategorySlug;

  let pageTitle = "Shop All Products — Quality-Checked Goods | LyZov";
  let headingTitle = "All Products";
  if (categoryName) {
    pageTitle = `${categoryName} — Buy Online in India | LyZov`;
    headingTitle = categoryName;
  } else if (brandParam) {
    const brandName = formatSlugLabel(brandParam);
    pageTitle = `${brandName} Collection — Shop | LyZov`;
    headingTitle = `${brandName} Collection`;
  } else if (searchParam) {
    pageTitle = `Results for "${searchParam}" — Shop | LyZov`;
    headingTitle = `Results for "${searchParam}"`;
  }

  const pageDescription = activeCategory?.description
    ? activeCategory.description
    : categoryName
      ? `Shop curated, quality-checked ${categoryName} products online on LyZov. Enjoy transparent pricing, secure UPI checkout, and safe Pan-India delivery.`
      : `Explore ${headingTitle} on LyZov. Discover curated, quality-checked products with direct pricing and safe Pan-India delivery.`;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://lyzov.com";
  const canonicalUrl = canonicalCategorySlug
    ? `${origin}/category/${encodeURIComponent(canonicalCategorySlug)}`
    : `${origin}/shop`;

  const hasNonCanonicalParams = Boolean(
    filters.search || filters.minPrice || filters.maxPrice || filters.minRating || filters.sort || filters.brand
  );

  const collectionSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${canonicalUrl}#collection`,
          name: headingTitle,
          description: pageDescription,
          url: canonicalUrl,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: meta.total || products.length,
            itemListElement: products.slice(0, 12).map((prod, idx) => ({
              "@type": "ListItem",
              position: idx + 1,
              url: `${origin}/product/${encodeURIComponent(prod.slug || prod._id)}`,
              name: prod.title || prod.name,
            })),
          },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Shop", item: `${origin}/shop` },
            ...(categoryName
              ? [{ "@type": "ListItem", position: 3, name: categoryName, item: canonicalUrl }]
              : []),
          ],
        },
      ],
    }),
    [canonicalUrl, headingTitle, pageDescription, meta.total, products, origin, categoryName]
  );

  return (
    <div className="container-page py-8 lg:py-12">
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonicalUrl={canonicalUrl}
        noIndex={hasNonCanonicalParams}
        schema={collectionSchema}
      />

      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-[var(--ink-muted)]"
      >
        <Link to="/" className="hover:text-[var(--ink)] transition-colors" style={{ textDecoration: "none", color: "inherit" }}>
          Home
        </Link>
        <ChevronRight size={12} />
        {categoryName ? (
          <>
            <Link to="/shop" className="hover:text-[var(--ink)] transition-colors" style={{ textDecoration: "none", color: "inherit" }}>
              Shop
            </Link>
            {Array.isArray(activeCategory?.ancestors) &&
              activeCategory.ancestors.map((anc) => (
                <span key={anc._id} className="inline-flex items-center gap-1.5">
                  <ChevronRight size={12} />
                  <Link
                    to={`/category/${encodeURIComponent(anc.slug)}`}
                    className="hover:text-[var(--ink)] transition-colors"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {anc.name}
                  </Link>
                </span>
              ))}
            <ChevronRight size={12} />
            <span className="font-semibold text-[var(--ink)]">{categoryName}</span>
          </>
        ) : (
          <span className="font-semibold text-[var(--ink)]">Shop</span>
        )}
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div id="shop-products-grid">
          <span className="eyebrow">{categoryName ? "Curated Category" : "Curated Collection"}</span>
          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.025em", marginTop: "0.25rem" }}>
            {headingTitle}
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", marginTop: "0.25rem" }}>
            {activeCategory?.description || `Showing ${products.length} of ${meta.total} curated items`}
          </p>
        </div>
      </div>

      {/* Crawlable Subcategory Links */}
      {subcategories.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {subcategories.map((sub) => (
            <Link
              key={sub._id}
              to={`/category/${encodeURIComponent(sub.slug || sub._id)}`}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              style={{ textDecoration: "none" }}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

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
          {activeCategorySlug && (
            <span className="badge badge-accent flex items-center gap-1.5 py-1 px-2.5">
              {categoryName || "Category"}
              <X size={12} className="cursor-pointer" onClick={() => updateFilters({ category: undefined })} />
            </span>
          )}
          {filters.search && (
            <span className="badge badge-accent flex items-center gap-1.5 py-1 px-2.5">
              "{filters.search}"
              <X size={12} className="cursor-pointer" onClick={() => updateFilters({ search: undefined })} />
            </span>
          )}
          {(activeCategorySlug || filters.search || filters.minPrice) && (
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
            <div className="flex items-center justify-center gap-2 py-6 text-[var(--ink-muted)] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
              Loading more products...
            </div>
          )}
          {!isLoading && !isLoadingMore && meta.page >= meta.totalPages && products.length > 0 && (
            <div className="text-center py-8 text-xs text-[var(--ink-muted)] border-t border-[var(--border)] mt-8">
              Showing all <strong className="text-[var(--ink)]">{meta.total}</strong> products in this collection
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
