import { Link } from "react-router-dom";
import { Heart, Star, ShoppingBag } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleWishlistItem } from "../../features/wishlist/wishlistSlice";
import { addToCart } from "../../features/cart/cartSlice";
import { formatCurrency } from "../../utils/formatters";
import { toast } from "react-toastify";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const wishlistProducts = useSelector((state) => state.wishlist.products);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const isWished = wishlistProducts.some((p) => p._id === product._id);
  const mainImage = product.images?.[0]?.url || "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=500&auto=format&fit=crop&q=60";
  const hoverImage = product.images?.[1]?.url || mainImage;
  const finalPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const discountPercent = product.discountPrice > 0 ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const rating = product.rating || 4.5;
  const reviewCount = product.reviewCount || 0;

  const handleWishlistClick = (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.info("Please login to save to wishlist"); return; }
    dispatch(toggleWishlistItem(product._id));
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    dispatch(addToCart({ productId: product._id, quantity: 1 }));
    toast.success(`${product.title || product.name} added to bag!`);
  };

  return (
    <Link to={`/shop/${product.slug || product._id}`} className="card-product group">

      {/* Image Area */}
      <div style={{ position: "relative", aspectRatio: "1/1", width: "100%", overflow: "hidden", backgroundColor: "var(--img-tile)" }}>
        {/* Main image */}
        <img
          src={mainImage}
          alt={product.images?.[0]?.altText || product.title || product.name}
          loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.4s" }}
          className="group-hover:opacity-0"
        />
        {/* Hover image */}
        <img
          src={hoverImage}
          alt=""
          loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0, transform: "scale(1.05)", transition: "all 0.45s" }}
          className="group-hover:opacity-100 group-hover:scale-100"
        />

        {/* Discount badge */}
        <div style={{ position: "absolute", left: "0.625rem", top: "0.625rem", display: "flex", flexDirection: "column", gap: "0.3rem", zIndex: 10 }}>
          {discountPercent > 0 && <span className="badge badge-dark">-{discountPercent}%</span>}
        </div>

        {/* Wishlist — hover reveal */}
        <button
          onClick={handleWishlistClick}
          className={`wishlist-btn-hover${isWished ? " wished" : ""}`}
          style={{
            position: "absolute", right: "0.625rem", top: "0.625rem", zIndex: 10,
            width: "2rem", height: "2rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "9999px",
            backgroundColor: "var(--surface)",
            color: isWished ? "#EF4444" : "var(--ink-muted)",
            border: "1px solid var(--border)",
            cursor: "pointer",
          }}
          aria-label="Toggle wishlist"
        >
          <Heart size={13} fill={isWished ? "#EF4444" : "none"} />
        </button>

        {/* Quick-Add CTA — slides up on hover */}
        <button onClick={handleQuickAdd} className="quick-add-btn">
          <ShoppingBag size={12} style={{ display: "inline", marginRight: "0.35rem", verticalAlign: "middle" }} />
          Quick Add
        </button>
      </div>

      {/* Product Info */}
      <div style={{ padding: "0.875rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        {/* Brand */}
        <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)" }}>
          {product.brand?.name || "LyZov Store"}
        </p>

        {/* Title */}
        <h3
          style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 0.15s" }}
          className="group-hover:text-[var(--accent)]"
        >
          {product.title || product.name}
        </h3>

        {/* Star rating */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <div style={{ display: "flex", gap: "1px" }}>
            {[1,2,3,4,5].map((i) => (
              <Star
                key={i}
                size={10}
                fill={i <= Math.round(rating) ? "#F59E0B" : "none"}
                color={i <= Math.round(rating) ? "#F59E0B" : "var(--border-dark)"}
              />
            ))}
          </div>
          <span style={{ fontSize: "10px", color: "var(--ink-subtle)" }}>
            {rating.toFixed(1)}{reviewCount > 0 ? ` (${reviewCount})` : ""}
          </span>
        </div>

        {/* Price row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.15rem" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
            {formatCurrency(finalPrice)}
          </span>
          {product.discountPrice > 0 && (
            <span style={{ fontSize: "0.75rem", color: "var(--ink-subtle)", textDecoration: "line-through", fontVariantNumeric: "tabular-nums" }}>
              {formatCurrency(product.price)}
            </span>
          )}
          {discountPercent > 0 && (
            <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: 700, color: "var(--green)" }}>
              {discountPercent}% off
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
