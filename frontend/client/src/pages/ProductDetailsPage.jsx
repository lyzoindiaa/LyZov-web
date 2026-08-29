import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Star, Heart, Truck, ShieldCheck, RotateCcw, ShoppingBag } from "lucide-react";
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
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const wishlistProducts = useSelector((state) => state.wishlist.products);

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      try {
        const res = await productService.getProductBySlug(slug);
        const prod = res.data.product || res.data;
        setProduct(prod);
        setRelated(res.data.relatedProducts || []);
        setActiveImage(0);
        setQuantity(1);

        if (prod.variants?.length > 0) {
          setSelectedVariant(prod.variants[0]);
        }

        const reviewsRes = await reviewService.getProductReviews(prod._id).catch(() => ({ data: [] }));
        setReviews(reviewsRes.data || []);
      } catch (err) {
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadProduct();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  if (isLoading) return <ProductDetailsSkeleton />;

  if (!product) {
    return (
      <div className="container-page py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <Link to="/shop" className="btn-primary mt-4 inline-flex">
          Back to Shop
        </Link>
      </div>
    );
  }

  const finalPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const discountPercent =
    product.discountPrice > 0 ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const isWished = wishlistProducts.some((p) => p._id === product._id);
  const stock = selectedVariant ? selectedVariant.stock : product.stock;

  const handleAddToCart = () => {
    if (stock <= 0) {
      toast.error("This item is currently out of stock");
      return;
    }
    dispatch(
      addToCart({
        productId: product._id,
        variantId: selectedVariant?._id,
        quantity,
      })
    );
    toast.success(`${product.title || product.name} added to bag`);
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.info("Please login to save to wishlist");
      return;
    }
    dispatch(toggleWishlistItem(product._id));
  };

  return (
    <div className="container-page py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-gray-500">
        <Link to="/" className="hover:text-gray-900">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-gray-900">Shop</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">{product.title || product.name}</span>
      </nav>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
        
        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-soft">
            <img
              src={product.images?.[activeImage]?.url || "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800"}
              alt={product.title || product.name}
              className="h-full w-full object-cover"
            />
            {discountPercent > 0 && (
              <span className="absolute left-3 top-3 badge badge-dark">
                -{discountPercent}% OFF
              </span>
            )}
            <button
              onClick={handleWishlist}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow-soft hover:text-red-500"
              aria-label="Toggle wishlist"
            >
              <Heart size={18} className={isWished ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative aspect-square w-18 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    activeImage === idx ? "border-gray-900 shadow-soft" : "border-gray-100 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details / Buy Box */}
        <div className="flex flex-col gap-5">
          <div>
            <span className="badge badge-accent mb-2">{product.brand?.name || "LyZov Store"}</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {product.title || product.name}
            </h1>
            
            <div className="mt-2.5 flex items-center gap-2 text-xs">
              <div className="flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <span className="font-semibold text-gray-700">4.9 ({reviews.length || 12} reviews)</span>
              <span className="text-gray-300">â€¢</span>
              <span className="badge badge-success text-[10px]">In Stock</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 border-y border-gray-100 py-3.5">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">
              {formatCurrency(finalPrice)}
            </span>
            {product.discountPrice > 0 && (
              <span className="text-base text-gray-400 line-through tabular-nums">
                {formatCurrency(product.price)}
              </span>
            )}
            <span className="text-xs text-gray-400 ml-auto">Inclusive of all taxes</span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {product.description || "Carefully crafted and premium quality product designed for everyday excellence."}
          </p>

          {/* Variant Selector */}
          {product.variants?.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Options
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      selectedVariant?._id === v._id
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {v.size || v.color || `Option ${idx + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500">Quantity</span>
              <QuantityStepper value={quantity} onChange={setQuantity} max={stock > 0 ? stock : 10} />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={stock <= 0}
                className="btn-primary flex-1 !py-3.5"
              >
                <ShoppingBag size={17} /> {stock <= 0 ? "Out of Stock" : "Add to Bag"}
              </button>
              <button
                onClick={handleWishlist}
                className="btn-secondary !px-3.5"
                aria-label="Wishlist"
              >
                <Heart size={18} className={isWished ? "fill-red-500 text-red-500" : ""} />
              </button>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3.5 text-center">
            <div className="flex flex-col items-center gap-1">
              <Truck size={17} className="text-amber-600" />
              <p className="text-[11px] font-bold text-gray-900">Free Shipping</p>
              <p className="text-[10px] text-gray-500">Orders &gt; â‚¹999</p>
            </div>
            <div className="flex flex-col items-center gap-1 border-x border-gray-200">
              <ShieldCheck size={17} className="text-amber-600" />
              <p className="text-[11px] font-bold text-gray-900">Quality Checked</p>
              <p className="text-[10px] text-gray-500">100% Genuine</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RotateCcw size={17} className="text-amber-600" />
              <p className="text-[11px] font-bold text-gray-900">7-Day Swap</p>
              <p className="text-[10px] text-gray-500">Damage free</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16 border-t border-gray-100 pt-8">
        <div className="flex gap-6 border-b border-gray-100 mb-6">
          {[
            { id: "description", label: "Product Description" },
            { id: "reviews", label: `Reviews (${reviews.length})` },
            { id: "shipping", label: "Shipping & Delivery" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "description" && (
          <div className="card-surface p-6 space-y-3">
            <h3 className="text-base font-bold text-gray-900">About this product</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description || "Crafted with the highest grade materials to ensure unmatched reliability and satisfaction."}
            </p>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="card-surface p-6 text-center text-xs text-gray-500">
                No reviews yet. Be the first to review this product!
              </div>
            ) : (
              reviews.map((r, i) => (
                <div key={i} className="card-surface p-5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900">{r.user?.name || "Verified Buyer"}</span>
                    <span className="text-[11px] text-gray-400">{formatDate(r.createdAt)}</span>
                  </div>
                  <div className="flex gap-0.5 text-amber-500">
                    {Array.from({ length: r.rating || 5 }).map((_, s) => (
                      <Star key={s} size={13} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">{r.comment}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "shipping" && (
          <div className="card-surface p-6 space-y-2">
            <h4 className="font-bold text-sm text-gray-900">Doorstep Delivery Across India</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Carefully boxed with shockproof packaging. Dispatched within 24 hours. Metro orders delivered in 2-4 days.
            </p>
          </div>
        )}
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-16">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            You Might Also Like
          </h3>
          <ProductGrid products={related} />
        </div>
      )}
    </div>
  );
};

export default ProductDetailsPage;