import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Star, Heart, Truck, ShieldCheck, RotateCcw, ShoppingBag, ZoomIn } from "lucide-react";
import { productService, reviewService } from "../services/productService";
import { addToCart } from "../features/cart/cartSlice";
import { toggleWishlistItem } from "../features/wishlist/wishlistSlice";
import { formatCurrency, formatDate } from "../utils/formatters";
import { ProductDetailsSkeleton } from "../components/skeletons/Skeletons";
import ProductGrid from "../components/product/ProductGrid";
import QuantityStepper from "../components/ui/QuantityStepper";
import { toast } from "react-toastify";

const ProductDetailsPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const wishlistProducts = useSelector((s) => s.wishlist.products);

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await productService.getProductBySlug(slug);
        const prod = res.data.product || res.data;
        setProduct(prod);
        setRelated(res.data.relatedProducts || []);
        setActiveImage(0);
        setQuantity(1);
        if (prod.variants?.length > 0) setSelectedVariant(prod.variants[0]);
        const rv = await reviewService.getProductReviews(prod._id).catch(() => ({ data: [] }));
        setReviews(rv.data || []);
      } catch { setProduct(null); } finally { setIsLoading(false); }
    };
    load();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  if (isLoading) return <ProductDetailsSkeleton />;
  if (!product) return (
    <div style={{ textAlign: "center", padding: "5rem 1rem", backgroundColor: "var(--bg)" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--ink)" }}>Product not found</h2>
      <Link to="/" className="btn-primary" style={{ marginTop: "1rem", display: "inline-flex" }}>Back to Store</Link>
    </div>
  );

  const finalPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const discountPercent = product.discountPrice > 0 ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const isWished = wishlistProducts.some((p) => p._id === product._id);
  const stock = selectedVariant ? selectedVariant.stock : product.stock;

  const handleAddToCart = (e) => {
    if (stock <= 0) { toast.error("Out of stock"); return; }
    dispatch(addToCart({ productId: product._id, variantId: selectedVariant?._id, quantity }));
    toast.success(`${product.title || product.name} added to bag!`);
    // Ripple effect
    const btn = e.currentTarget;
    const ripple = document.createElement("span");
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.className = "ripple";
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  };

  const handleWishlist = () => {
    if (!isAuthenticated) { toast.info("Please login first"); return; }
    dispatch(toggleWishlistItem({ productId: product._id, product }));
  };

  const tabs = [
    { id: "description", label: "Description" },
    { id: "reviews", label: `Reviews (${reviews.length})` },
    { id: "shipping", label: "Shipping" },
  ];

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>
      <div className="container-page" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>

        {/* Breadcrumb */}
        <nav style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.75rem", color: "var(--ink-muted)", marginBottom: "1.5rem" }}>
          <Link to="/" style={{ color: "var(--ink-muted)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link to="/shop" style={{ color: "var(--ink-muted)", textDecoration: "none" }}>Shop</Link>
          <span>/</span>
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>{product.title || product.name}</span>
        </nav>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">

          {/* Gallery */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div className="gallery-main" style={{ position: "relative", aspectRatio: "1/1", borderRadius: "1.25rem", overflow: "hidden", border: "1px solid var(--border)", backgroundColor: "var(--img-tile)" }}>
              <img
                src={product.images?.[activeImage]?.url || "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800"}
                alt={product.title || product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
              />
              {discountPercent > 0 && (
                <span className="badge badge-dark" style={{ position: "absolute", left: "0.75rem", top: "0.75rem" }}>
                  -{discountPercent}% OFF
                </span>
              )}
              <button
                onClick={handleWishlist}
                style={{
                  position: "absolute", right: "0.75rem", top: "0.75rem",
                  width: "2.5rem", height: "2.5rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "9999px",
                  backgroundColor: "var(--surface)", border: "1px solid var(--border)",
                  color: isWished ? "#EF4444" : "var(--ink-muted)", cursor: "pointer",
                }}
              >
                <Heart size={18} fill={isWished ? "#EF4444" : "none"} />
              </button>
              {/* Zoom icon on hover */}
              <div className="gallery-zoom-icon">
                <ZoomIn size={16} />
              </div>
            </div>

            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div style={{ display: "flex", gap: "0.625rem", overflowX: "auto" }} className="no-scrollbar">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    style={{
                      width: "4.5rem", height: "4.5rem", flexShrink: 0, borderRadius: "0.75rem", overflow: "hidden",
                      border: `2px solid ${activeImage === idx ? "var(--ink)" : "var(--border)"}`,
                      opacity: activeImage === idx ? 1 : 0.6, cursor: "pointer", padding: 0, backgroundColor: "transparent",
                    }}
                  >
                    <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buy Box */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <span className="badge badge-accent" style={{ marginBottom: "0.5rem" }}>{product.brand?.name || "LyZov Store"}</span>
              <h1 style={{ fontSize: "clamp(1.25rem,2.5vw,1.75rem)", fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>
                {product.title || product.name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.625rem" }}>
                <div style={{ display: "flex", gap: "2px", color: "#F59E0B" }}>
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>({reviews.length || 12} reviews)</span>
                <span style={{ color: "var(--border-dark)" }}>Â·</span>
                <span className="badge badge-success" style={{ fontSize: "10px" }}>In Stock</span>
              </div>
            </div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "0.875rem 0" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(finalPrice)}
              </span>
              {product.discountPrice > 0 && (
                <span style={{ fontSize: "1rem", color: "var(--ink-subtle)", textDecoration: "line-through" }}>
                  {formatCurrency(product.price)}
                </span>
              )}
              <span style={{ fontSize: "0.75rem", color: "var(--ink-subtle)", marginLeft: "auto" }}>Incl. all taxes</span>
            </div>

            {/* Description */}
            <p style={{ fontSize: "0.875rem", color: "var(--ink-light)", lineHeight: 1.7 }}>
              {product.description || "Premium quality product designed for everyday excellence."}
            </p>

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Options</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {product.variants.map((v, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        padding: "0.375rem 0.875rem", borderRadius: "0.75rem", fontSize: "0.8125rem", fontWeight: 600,
                        border: `1px solid ${selectedVariant?._id === v._id ? "var(--ink)" : "var(--border)"}`,
                        backgroundColor: selectedVariant?._id === v._id ? "var(--ink)" : "var(--surface)",
                        color: selectedVariant?._id === v._id ? "var(--bg)" : "var(--ink)",
                        cursor: "pointer",
                      }}
                    >
                      {v.size || v.color || `Option ${idx + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty + Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-muted)" }}>Quantity</span>
                <QuantityStepper value={quantity} onChange={setQuantity} max={stock > 0 ? stock : 10} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={handleAddToCart} disabled={stock <= 0} className="btn-primary btn-ripple" style={{ flex: 1, padding: "0.875rem" }}>
                  <ShoppingBag size={17} />
                  {stock <= 0 ? "Out of Stock" : "Add to Bag"}
                </button>
                <button onClick={handleWishlist} className="btn-secondary" style={{ padding: "0.875rem 1rem" }} aria-label="Wishlist">
                  <Heart size={18} fill={isWished ? "#EF4444" : "none"} color={isWished ? "#EF4444" : "var(--ink)"} />
                </button>
              </div>
            </div>

            {/* Trust Banner */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", borderRadius: "1rem", border: "1px solid var(--border)", backgroundColor: "var(--bg-raised)", padding: "0.875rem", textAlign: "center" }}>
              {[[Truck, "Free Shipping", "Orders > â‚¹999"], [ShieldCheck, "Quality Checked", "100% Genuine"], [RotateCcw, "7-Day Swap", "Damage free"]].map(([Icon, t, s], i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem", ...(i === 1 ? { borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" } : {}) }}>
                  <Icon size={17} style={{ color: "var(--accent)" }} />
                  <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--ink)" }}>{t}</p>
                  <p style={{ fontSize: "9px", color: "var(--ink-muted)" }}>{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginTop: "3rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", gap: "1.5rem", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem" }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  paddingBottom: "0.75rem",
                  paddingTop: "0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: activeTab === tab.id ? "var(--ink)" : "var(--ink-subtle)",
                  borderBottom: `2px solid ${activeTab === tab.id ? "var(--ink)" : "transparent"}`,
                  marginBottom: "-1px",
                  background: "none", border: "none",
                  borderBottomStyle: "solid",
                  borderBottomWidth: "2px",
                  borderBottomColor: activeTab === tab.id ? "var(--ink)" : "transparent",
                  cursor: "pointer",
                  transition: "color 0.15s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "description" && (
            <div className="card-surface tab-pane" style={{ padding: "1.5rem" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--ink-light)", lineHeight: 1.7 }}>
                {product.description || "Crafted with the highest grade materials for unmatched reliability."}
              </p>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="tab-pane" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {reviews.length === 0 ? (
                <div className="card-surface" style={{ padding: "2rem", textAlign: "center", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
                  No reviews yet â€” be the first to review this product!
                </div>
              ) : (
                reviews.map((r, i) => (
                  <div key={i} className="card-surface" style={{ padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ink)" }}>{r.user?.name || "Verified Buyer"}</span>
                      <span style={{ fontSize: "11px", color: "var(--ink-subtle)" }}>{formatDate(r.createdAt)}</span>
                    </div>
                    <div style={{ display: "flex", gap: "2px", color: "#F59E0B", marginBottom: "0.375rem" }}>
                      {Array.from({ length: r.rating || 5 }).map((_, s) => <Star key={s} size={13} fill="currentColor" />)}
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "var(--ink-light)" }}>{r.comment}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="card-surface tab-pane" style={{ padding: "1.5rem" }}>
              <h4 style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--ink)", marginBottom: "0.5rem" }}>Doorstep Delivery Across India</h4>
              <p style={{ fontSize: "0.8125rem", color: "var(--ink-light)", lineHeight: 1.7 }}>
                All products are carefully packaged with shockproof material. Dispatched within 24 hours. Metro deliveries in 2-4 days, other regions in 4-6 days with tracking.
              </p>
            </div>
          )}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div style={{ marginTop: "3rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)", marginBottom: "1.5rem" }}>You Might Also Like</h3>
            <ProductGrid products={related} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsPage;