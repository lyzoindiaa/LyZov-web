import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Star, ShoppingBag } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleWishlistItem } from "../../features/wishlist/wishlistSlice";
import { addToCart } from "../../features/cart/cartSlice";
import { formatCurrency } from "../../utils/formatters";
import { toast } from "react-toastify";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const wishlistProducts = useSelector((state) => state.wishlist.products);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const isWished = wishlistProducts.some((p) => p._id === product._id);
  const mainImage = product.images?.[0]?.url || "";
  const hoverImage = product.images?.[1]?.url || mainImage;
  const finalPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const discountPercent = product.discountPrice > 0 ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const rating = product.rating || 4.5;
  const reviewCount = product.reviewCount || 0;
  const isOutOfStock = product.stock === 0;

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info("Please sign in to save items to your wishlist");
      navigate("/login", { state: { from: { pathname: `/product/${product.slug || product._id}` } } });
      return;
    }
    dispatch(toggleWishlistItem({ productId: product._id, product }));
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info("Please sign in to add items to your shopping bag");
      navigate("/login", { state: { from: { pathname: `/product/${product.slug || product._id}` } } });
      return;
    }
    if (isOutOfStock) return;
    dispatch(addToCart({ productId: product._id, quantity: 1 }));
    toast.success(`${product.title || product.name} added to bag!`);
  };

  return (
    <Link
      to={`/product/${product.slug || product._id}`}
      className="card-product group hover-lift w-full flex flex-col justify-between"
    >

      {/* Image Container (1:1 Aspect Ratio) */}
      <div style={{ position: "relative", aspectRatio: "1/1", width: "100%", overflow: "hidden", backgroundColor: "var(--img-tile)" }}>
        {!imageError && mainImage ? (
          <>
            {/* Main image */}
            <img
              src={mainImage}
              alt={product.images?.[0]?.altText || product.title || product.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "opacity 0.4s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              className="group-hover:opacity-0 group-hover:scale-105"
            />
            {/* Hover image */}
            {hoverImage && hoverImage !== mainImage && (
              <img
                src={hoverImage}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0,
                  transform: "scale(1.05)",
                  transition: "opacity 0.4s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                className="group-hover:opacity-100 group-hover:scale-100"
              />
            )}
          </>
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(15,23,42,0.6) 100%)",
              color: "var(--ink-muted)",
              padding: "1rem",
              textAlign: "center",
            }}
          >
            <ShoppingBag size={32} color="var(--accent)" opacity={0.6} />
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {product.brand?.name || "LyZov Exclusive"}
            </span>
          </div>
        )}

        {/* Badges Top-Left */}
        <div style={{ position: "absolute", left: "0.75rem", top: "0.75rem", display: "flex", flexDirection: "column", gap: "0.35rem", zIndex: 10 }}>
          {isOutOfStock ? (
            <span className="badge badge-error">Out of Stock</span>
          ) : (
            discountPercent > 0 && <span className="badge badge-dark">-{discountPercent}%</span>
          )}
          {product.isFeatured && <span className="badge badge-accent">Featured</span>}
        </div>

        {/* Wishlist Button Top-Right — 40px touch friendly */}
        <button
          type="button"
          onClick={handleWishlistClick}
          className={`wishlist-btn-hover${isWished ? " wished" : ""}`}
          style={{
            position: "absolute",
            right: "0.75rem",
            top: "0.75rem",
            zIndex: 10,
            width: "2.375rem",
            height: "2.375rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "9999px",
            backgroundColor: "var(--glass-bg)",
            backdropFilter: "blur(8px)",
            color: isWished ? "var(--red)" : "var(--ink-muted)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
            cursor: "pointer",
            transition: "transform 0.2s cubic-bezier(0.22,1,0.36,1), background-color 0.2s",
          }}
          aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={15} fill={isWished ? "var(--red)" : "none"} strokeWidth={2.2} />
        </button>

        {/* Quick-Add CTA — slides up on hover */}
        {!isOutOfStock && (
          <button type="button" onClick={handleQuickAdd} className="quick-add-btn">
            <ShoppingBag size={13} style={{ display: "inline", marginRight: "0.35rem", verticalAlign: "middle" }} />
            Add to Bag
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="p-2.5 sm:p-4 flex flex-col gap-1 sm:gap-1.5 flex-1 justify-between">
        <div className="flex flex-col gap-1">
          {/* Brand */}
          <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)" }} className="sm:text-[10px]">
            {product.brand?.name || "LyZov Store"}
          </p>

          {/* Title */}
          <h3
            style={{
              fontWeight: 600,
              color: "var(--ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              transition: "color 0.15s",
            }}
            className="text-xs sm:text-sm group-hover:text-[var(--accent)]"
          >
            {product.title || product.name}
          </h3>

          {/* Star rating */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <div style={{ display: "flex", gap: "1.5px" }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={10}
                  className="sm:w-[11px] sm:h-[11px]"
                  fill={i <= Math.round(rating) ? "var(--yellow)" : "none"}
                  color={i <= Math.round(rating) ? "var(--yellow)" : "var(--border-dark)"}
                />
              ))}
            </div>
            <span style={{ fontSize: "10px", color: "var(--ink-subtle)", fontWeight: 500 }} className="sm:text-[11px]">
              {rating.toFixed(1)}{reviewCount > 0 ? ` (${reviewCount})` : ""}
            </span>
          </div>
        </div>

        {/* Price row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }} className="text-xs sm:text-sm md:text-base">
            {formatCurrency(finalPrice)}
          </span>
          {product.discountPrice > 0 && (
            <span style={{ color: "var(--ink-subtle)", textDecoration: "line-through", fontVariantNumeric: "tabular-nums" }} className="text-[10px] sm:text-xs">
              {formatCurrency(product.price)}
            </span>
          )}
          {discountPercent > 0 && (
            <span style={{ marginLeft: "auto", fontWeight: 700, color: "var(--green)" }} className="text-[10px] sm:text-xs">
              {discountPercent}% off
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
