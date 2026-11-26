import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Store, ShieldCheck, Star, Package, ChevronRight, ArrowLeft, Search, Palmtree, Clock } from "lucide-react";
import { productService } from "../services/productService";
import ProductGrid from "../components/product/ProductGrid";
import ExpandableText from "../components/ui/ExpandableText";
import SEO from "../components/common/SEO";

const SellerStorefrontPage = () => {
  const { storeSlug } = useParams();
  const [storeData, setStoreData] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await productService.getSellerStorefront(storeSlug);
        if (res.success && res.data) {
          setStoreData(res.data.seller);
          setProducts(res.data.products || []);
        } else {
          setError("Store not found");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load seller storefront");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStore();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [storeSlug]);

  const filteredProducts = products.filter((p) =>
    (p.title || p.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="container-page py-20 text-center">
        <Store size={48} className="mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold mb-2">Store Not Found</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link to="/shop" className="btn-accent px-6 py-2 rounded-full inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Return to Shop
        </Link>
      </div>
    );
  }

  const storeName = storeData?.businessName || storeData?.name || "Merchant Store";
  const isOnVacation = Boolean(storeData?.isVacationMode);

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }} className="pb-16">
      <SEO
        title={`${storeName}${isOnVacation ? " (On Vacation)" : ""} - Verified Seller | LyZov Marketplace`}
        description={storeData?.storeBio || `Shop authentic collections directly from ${storeName} on LyZov.`}
      />

      {/* Hero Banner Header */}
      <div
        style={{
          background: isOnVacation
            ? "linear-gradient(135deg, rgba(30, 24, 15, 0.96), rgba(45, 30, 15, 0.96))"
            : "linear-gradient(135deg, rgba(20, 20, 25, 0.95), rgba(40, 30, 20, 0.95))",
          color: "#fff",
          borderBottom: "1px solid var(--border)",
          paddingTop: "2.5rem",
          paddingBottom: "3rem",
        }}
      >
        <div className="container-page">
          {/* Breadcrumbs */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.6)",
              marginBottom: "1.5rem",
            }}
          >
            <Link to="/" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>
              Home
            </Link>
            <ChevronRight size={12} />
            <Link to="/shop" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>
              Shop
            </Link>
            <ChevronRight size={12} />
            <span style={{ color: "#fff", fontWeight: 600 }}>{storeName}</span>
          </nav>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                style={{
                  width: "4.5rem",
                  height: "4.5rem",
                  borderRadius: "1rem",
                  backgroundColor: isOnVacation ? "var(--amber-600, #d97706)" : "var(--accent)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1.75rem",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                }}
              >
                {storeName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{storeName}</h1>
                  {isOnVacation ? (
                    <span
                      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(245, 158, 11, 0.2)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.4)" }}
                    >
                      <Palmtree size={13} /> On Vacation
                    </span>
                  ) : (
                    storeData?.kycVerified && (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.4)" }}
                      >
                        <ShieldCheck size={13} /> Verified Merchant
                      </span>
                    )
                  )}
                </div>
                {storeData?.storeBio && (
                  <ExpandableText
                    text={storeData.storeBio}
                    lines={3}
                    className="mt-1 text-sm text-gray-300 max-w-xl"
                    buttonClassName="text-amber-400"
                  />
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-4 text-sm bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
              <div className="text-center px-3 border-r border-white/10">
                <span className="block text-xs uppercase tracking-wider text-gray-400">Status</span>
                <strong className={`text-sm font-bold ${isOnVacation ? "text-amber-400" : "text-emerald-400"}`}>
                  {isOnVacation ? "Away" : "Active"}
                </strong>
              </div>
              <div className="text-center px-3">
                <span className="block text-xs uppercase tracking-wider text-gray-400">Rating</span>
                <span className="text-lg font-bold inline-flex items-center gap-1 text-amber-400">
                  <Star size={14} fill="currentColor" /> {storeData?.rating || "4.8"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container-page py-8">
        {isOnVacation ? (
          /* Vacation Announcement Notice */
          <div className="card-surface p-8 sm:p-12 text-center max-w-2xl mx-auto rounded-2xl border border-amber-300/40 dark:border-amber-600/30 shadow-lg">
            <div
              style={{
                width: "4rem",
                height: "4rem",
                borderRadius: "50%",
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                color: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <Palmtree size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--ink)" }}>
              {storeName} is Taking a Break
            </h2>
            <p className="text-base font-medium mb-4 text-amber-700 dark:text-amber-300 max-w-md mx-auto">
              "{storeData?.vacationMessage || "This store is currently on vacation. We are temporarily pausing product listings and orders."}"
            </p>
            <p className="text-sm text-gray-500 max-w-lg mx-auto mb-8">
              All active listings from this merchant are paused while they are away. Existing placed orders will continue to be processed according to schedule.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/shop"
                className="btn-accent px-6 py-2.5 rounded-full inline-flex items-center gap-2 text-sm font-semibold"
              >
                <ArrowLeft size={16} /> Browse Marketplace
              </Link>
            </div>
          </div>
        ) : (
          /* Active Store Catalog View */
          <>
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
                  Catalog ({filteredProducts.length})
                </h2>
                <p className="text-xs text-gray-500">All items curated & fulfilled by {storeName}</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search in this store..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Product Grid */}
            <ProductGrid
              products={filteredProducts}
              isLoading={isLoading}
              emptyMessage={
                searchQuery ? `No products found matching "${searchQuery}"` : "This seller has no active listings yet"
              }
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SellerStorefrontPage;
