import { Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleWishlistItem } from "../../features/wishlist/wishlistSlice";
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
  const discountPercent =
    product.discountPrice > 0 ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  const handleWishlistClick = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Please login to save to wishlist");
      return;
    }
    dispatch(toggleWishlistItem(product._id));
  };

  return (
    <Link to={`/shop/${product.slug || product._id}`} className="group block card-product">
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
        <img
          src={mainImage}
          alt={product.images?.[0]?.altText || product.title || product.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-premium group-hover:opacity-0"
        />
        <img
          src={hoverImage}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition-all duration-500 ease-premium group-hover:scale-100 group-hover:opacity-100"
        />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-10">
          <span className="badge badge-accent">Bestseller</span>
          {discountPercent > 0 && <span className="badge badge-dark">-{discountPercent}%</span>}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className="absolute right-3 top-3 flex h-8.5 w-8.5 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-soft backdrop-blur-sm transition-all duration-200 hover:text-red-500 z-10"
          aria-label="Toggle wishlist"
        >
          <Heart size={16} className={isWished ? "fill-red-500 text-red-500" : ""} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
          {product.brand?.name || "LyZov Store"}
        </p>

        <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
          {product.title || product.name}
        </h3>

        <div className="flex items-center gap-2 pt-1">
          <span className="text-sm font-bold text-gray-900 tabular-nums">
            {formatCurrency(finalPrice)}
          </span>
          {product.discountPrice > 0 && (
            <span className="text-xs text-gray-400 line-through tabular-nums">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;