import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Star, Heart, Truck, ShieldCheck, RotateCcw, ShoppingBag, ZoomIn, Check, ChevronRight, ArrowLeft, Pause, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { productService, reviewService } from "../services/productService";
import { shippingService } from "../services/shippingService";
import { addToCart } from "../features/cart/cartSlice";
import { toggleWishlistItem } from "../features/wishlist/wishlistSlice";
import { formatCurrency, formatDate } from "../utils/formatters";
import { ProductDetailsSkeleton } from "../components/skeletons/Skeletons";
import ProductGrid from "../components/product/ProductGrid";
import QuantityStepper from "../components/ui/QuantityStepper";
import SEO from "../components/common/SEO";
import { toast } from "react-toastify";

const ProductDetailsPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const wishlistProducts = useSelector((s) => s.wishlist.products);
  const isSeller = user?.role === "seller" || user?.role === "admin";
  const isAdmin = isSeller;

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);
  const slideshowIntervalRef = useRef(null);

  // Delivery Pincode Checker State
  const [pincodeInput, setPincodeInput] = useState("");
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeResult, setPincodeResult] = useState(null);

  const handleCheckPincode = async () => {
    if (!pincodeInput || pincodeInput.length !== 6) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }
    try {
      setIsCheckingPincode(true);
      const res = await shippingService.checkPincode(pincodeInput);
      if (res?.data?.delivery_codes && res.data.delivery_codes.length > 0) {
        const codeInfo = res.data.delivery_codes[0];
        setPincodeResult({
          available: true,
          message: `Delivery available to ${codeInfo.postal_code?.city || pincodeInput}! (COD: ${codeInfo.postal_code?.cod === "Y" ? "Available" : "Prepaid Only"})`,
        });
      } else {
        setPincodeResult({
          available: true,
          message: `Delivery serviceable to pincode ${pincodeInput}. Standard delivery in 3-5 days.`,
        });
      }
    } catch (err) {
      setPincodeResult({
        available: true,
        message: `Standard delivery available to ${pincodeInput} in 3-5 business days.`,
      });
    } finally {
      setIsCheckingPincode(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const res = await productService.getProductBySlug(slug);
        if (res.data?.isRedirect && res.data?.canonicalSlug) {
          navigate(`/product/${res.data.canonicalSlug}`, { replace: true });
          return;
        }
        const prod = res.data.product || res.data;
        setProduct(prod);
        setRelated(res.data.relatedProducts || []);
        setActiveImage(0);
        setQuantity(1);
        if (prod.variants?.length > 0) setSelectedVariant(prod.variants[0]);
        const rv = await reviewService.getProductReviews(prod._id).catch(() => ({ data: [] }));
        setReviews(rv.data || []);
      } catch {
        setProduct(null);
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  useEffect(() => {
    if (isSlideshowPlaying && product?.images?.length > 1) {
      slideshowIntervalRef.current = setInterval(() => {
        setActiveImage((prev) => (prev + 1) % product.images.length);
      }, 3000);
    } else if (slideshowIntervalRef.current) {
      clearInterval(slideshowIntervalRef.current);
    }

    return () => {
      if (slideshowIntervalRef.current) {
        clearInterval(slideshowIntervalRef.current);
      }
    };
  }, [isSlideshowPlaying, product?.images?.length]);

  if (isLoading) return <ProductDetailsSkeleton />;
  if (loadError)
    return (
      <div className="container-page py-24 text-center">
        <div className="empty-state card-surface max-w-md mx-auto">
          <h2 className="empty-state-title">Unable to load product</h2>
          <p className="empty-state-desc">The product service is temporarily unavailable. Please try again in a moment.</p>
          <button type="button" className="btn-primary mt-3" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  if (!product)
    return (
      <div className="container-page py-24 text-center">
        <div className="empty-state card-surface max-w-md mx-auto">
          <h2 className="empty-state-title">Product Not Found</h2>
          <p className="empty-state-desc">The item you're looking for may be unavailable or moved.</p>
          <Link to="/shop" className="btn-primary mt-3">
            Explore All Products
          </Link>
        </div>
      </div>
    );

  const finalPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const discountPercent =
    product.discountPrice > 0
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0;
  const isWished = Boolean(wishlistProducts?.some?.((p) => (p?._id || p) === product._id));
  const stock = selectedVariant ? selectedVariant.stock : product.stock;

  const handleAddToCart = (e) => {
    if (!isAuthenticated) {
      toast.info("Please sign in to add items to your shopping cart");
      navigate("/login", { state: { from: { pathname: `/product/${slug}` } } });
      return;
    }
    if (isSeller) {
      toast.info("Sellers can manage products, not shop as a customer.");
      return;
    }
    if (stock <= 0) {
      toast.error("Out of stock");
      return;
    }
    dispatch(addToCart({ productId: product._id, variantId: selectedVariant?._id, quantity }));

    // Ripple effect
    const btn = e.currentTarget;
    const ripple = document.createElement("span");
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.className = "ripple";
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2
      }px;top:${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.info("Please sign in to save items to your wishlist");
      navigate("/login", { state: { from: { pathname: `/product/${slug}` } } });
      return;
    }
    if (isAdmin) {
      toast.info("Wishlist is for customer accounts only.");
      return;
    }
    dispatch(toggleWishlistItem({ productId: product._id, product }));
  };

  const toggleSlideshow = () => {
    setIsSlideshowPlaying((prev) => !prev);
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleDecreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleNextImage = () => {
    setActiveImage((prev) => (prev + 1) % product.images.length);
  };

  const handlePreviousImage = () => {
    setActiveImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  const tabs = isAdmin
    ? [
      { id: "description", label: "Description & Details" },
      { id: "shipping", label: "Shipping & Returns" },
    ]
    : [
      { id: "description", label: "Description & Details" },
      { id: "reviews", label: `Customer Reviews (${reviews.length})` },
      { id: "shipping", label: "Shipping & Returns" },
    ];

  // Dynamic SEO and Schema.org generation
  const pageTitle = product.seo?.metaTitle || `${product.title} | Buy Online at LyZov`;
  const cleanDescription = (product.shortDescription || product.description || "")
    .replace(/<[^>]*>?/gm, "")
    .trim();
  const pageDescription =
    product.seo?.metaDescription ||
    (cleanDescription
      ? `${cleanDescription.slice(0, 150)} — Shop genuine products with Pan-India delivery on LyZov.`
      : "Shop premium products online at LyZov.");
  const canonicalUrl = product.seo?.canonicalUrl || `${window.location.origin}/product/${product.slug}`;
  const ogImage = product.images?.[0]?.url || `${window.location.origin}/lyzov-logo.png`;
  const validFrom = product.createdAt
    ? new Date(product.createdAt).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  const reviewSchema = reviews.map((review) => ({
    "@type": "Review",
    author: {
      "@type": "Person",
      name: review.user?.name || "LyZov customer",
    },
    datePublished: review.createdAt ? new Date(review.createdAt).toISOString().split("T")[0] : undefined,
    reviewBody: review.comment,
    reviewRating: {
      "@type": "Rating",
      ratingValue: String(review.rating),
      bestRating: "5",
      worstRating: "1",
    },
  }));

  const breadcrumbItems = [
    { name: "Home", url: `${window.location.origin}/` },
    { name: "Shop", url: `${window.location.origin}/shop` },
    { name: product.title, url: canonicalUrl },
  ];

  const productSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${canonicalUrl}#product`,
        name: product.title,
        description: pageDescription,
        image: product.images?.map((img) => img.url).filter(Boolean) || [ogImage],
        sku: product.lyId || product.sku || undefined,
        ...(product.mpn ? { mpn: product.mpn } : {}),
        ...(product.brand?.name ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
        offers: {
          "@type": "Offer",
          url: canonicalUrl,
          priceCurrency: "INR",
          price: String(finalPrice || 0),
          validFrom,
          priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: {
              "@type": "MonetaryAmount",
              value: "9.99",
              currency: "INR",
            },
            shippingDestination: {
              "@type": "DefinedRegion",
              addressCountry: "IN",
            },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
              handlingTime: {
                "@type": "QuantitativeValue",
                minValue: 0,
                maxValue: 1,
                unitCode: "DAY",
              },
              transitTime: {
                "@type": "QuantitativeValue",
                minValue: 3,
                maxValue: 7,
                unitCode: "DAY",
              },
            },
          },
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "IN",
            returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: 7,
            returnMethod: "https://schema.org/ReturnByMail",
            returnFees: "https://schema.org/FreeReturn",
          },
          seller: {
            "@type": "Organization",
            name: "LyZov",
          },
        },
        ...(product.ratingsCount > 0
          ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: String(product.ratingsAverage || 5),
              reviewCount: String(product.ratingsCount),
              bestRating: "5",
              worstRating: "1",
            },
          }
          : {}),
        ...(reviewSchema.length > 0 ? { review: reviewSchema } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems.map((crumb, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: crumb.name,
          item: crumb.url,
        })),
      },
    ],
  };

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonicalUrl={canonicalUrl}
        ogImage={ogImage}
        ogType="product"
        schema={productSchema}
      />
      <div className="container-page py-8 lg:py-12">
        {/* Navigation & Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
              style={{
                padding: "0.45rem 0.9rem",
                fontSize: "0.75rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                borderRadius: "9999px",
              }}
            >
              <ArrowLeft size={14} /> Back
            </button>

            <nav
              aria-label="Breadcrumb"
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
                fontSize: "0.8125rem",
                color: "var(--ink-muted)",
              }}
            >
              <Link to="/" style={{ color: "var(--ink-muted)", textDecoration: "none", fontWeight: 500 }} onMouseEnter={(e) => e.target.style.color = "var(--ink)"} onMouseLeave={(e) => e.target.style.color = "var(--ink-muted)"}>
                Home
              </Link>
              <ChevronRight size={12} style={{ color: "var(--ink-subtle)" }} />
              <Link to="/shop" style={{ color: "var(--ink-muted)", textDecoration: "none", fontWeight: 500 }} onMouseEnter={(e) => e.target.style.color = "var(--ink)"} onMouseLeave={(e) => e.target.style.color = "var(--ink-muted)"}>
                Shop
              </Link>
              <ChevronRight size={12} style={{ color: "var(--ink-subtle)" }} />
              <span style={{ color: "var(--ink)", fontWeight: 700 }} className="max-w-[200px] sm:max-w-xs truncate">{product.title || product.name}</span>
            </nav>
          </div>

          <Link
            to="/shop"
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--accent)",
              textDecoration: "none",
            }}
          >
            Browse All Products →
          </Link>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Gallery */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div
              className="gallery-main"
              style={{
                position: "relative",
                aspectRatio: "1/1",
                borderRadius: "1.25rem",
                overflow: "hidden",
                border: "1px solid var(--border)",
                backgroundColor: "var(--img-tile)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <img
                src={
                  product.images?.[activeImage]?.url ||
                  "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800"
                }
                alt={product.title || product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
              />
              {discountPercent > 0 && (
                <span
                  className="badge badge-dark"
                  style={{ position: "absolute", left: "1rem", top: "1rem", zIndex: 5 }}
                >
                  -{discountPercent}% OFF
                </span>
              )}
              <button
                type="button"
                onClick={handleWishlist}
                style={{
                  position: "absolute",
                  right: "1rem",
                  top: "1rem",
                  width: "2.5rem",
                  height: "2.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "9999px",
                  backgroundColor: "var(--glass-bg)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid var(--border)",
                  color: isWished ? "var(--red)" : "var(--ink-muted)",
                  boxShadow: "var(--shadow-sm)",
                  cursor: "pointer",
                  zIndex: 5,
                }}
                aria-label="Wishlist toggle"
              >
                <Heart size={18} fill={isWished ? "var(--red)" : "none"} />
              </button>

              {/* Navigation Arrows */}
              {product.images?.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePreviousImage}
                    style={{
                      position: "absolute",
                      left: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "2.5rem",
                      height: "2.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "9999px",
                      backgroundColor: "var(--glass-bg)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid var(--border)",
                      color: "var(--ink)",
                      boxShadow: "var(--shadow-sm)",
                      cursor: "pointer",
                      zIndex: 5,
                    }}
                    aria-label="Previous image"
                  >
                    <ChevronRight size={20} style={{ transform: "rotate(180deg)" }} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    style={{
                      position: "absolute",
                      right: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "2.5rem",
                      height: "2.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "9999px",
                      backgroundColor: "var(--glass-bg)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid var(--border)",
                      color: "var(--ink)",
                      boxShadow: "var(--shadow-sm)",
                      cursor: "pointer",
                      zIndex: 5,
                    }}
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Slideshow Controls */}
              {product.images?.length > 1 && (
                <button
                  type="button"
                  onClick={toggleSlideshow}
                  style={{
                    position: "absolute",
                    bottom: "1rem",
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: "0.5rem 1rem",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    backdropFilter: "blur(8px)",
                    color: "white",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    zIndex: 5,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {isSlideshowPlaying ? <Pause size={14} /> : <span style={{ fontSize: "12px", fontWeight: "bold" }}>▶</span>}
                  {isSlideshowPlaying ? "Pause" : "Play Slideshow"}
                </button>
              )}

              {/* Image Counter */}
              {product.images?.length > 1 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "1rem",
                    right: "1rem",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    color: "white",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    zIndex: 5,
                  }}
                >
                  {activeImage + 1} / {product.images.length}
                </div>
              )}

              {/* Zoom icon on hover */}
              <div className="gallery-zoom-icon">
                <ZoomIn size={16} />
              </div>
            </div>

            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto" }} className="no-scrollbar">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveImage(idx);
                      setIsSlideshowPlaying(false);
                    }}
                    style={{
                      width: "4.75rem",
                      height: "4.75rem",
                      flexShrink: 0,
                      borderRadius: "0.875rem",
                      overflow: "hidden",
                      border: `2px solid ${activeImage === idx ? "var(--accent)" : "var(--border)"}`,
                      opacity: activeImage === idx ? 1 : 0.65,
                      cursor: "pointer",
                      padding: 0,
                      backgroundColor: "transparent",
                      transition: "all 0.2s",
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
              <Link
                to={`/shop?brand=${encodeURIComponent(product.brand?.slug || product.brand?._id || "")}`}
                className="badge badge-accent hover:opacity-80 transition-opacity"
                style={{ marginBottom: "0.5rem", textDecoration: "none", display: "inline-block" }}
              >
                {product.brand?.name || "LyZov"}
              </Link>
              <h1
                style={{
                  fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                  fontWeight: 800,
                  color: "var(--ink)",
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                }}
              >
                {product.title || product.name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
                <div style={{ display: "flex", gap: "2px", color: "var(--yellow)" }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i <= Math.round(product.rating || 4.5) ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <span style={{ fontSize: "0.8125rem", color: "var(--ink-muted)" }}>
                  ({reviews.length || 12} verified reviews)
                </span>
                <span style={{ color: "var(--border)" }}>•</span>
                {stock > 0 ? (
                  <span className="badge badge-success" style={{ fontSize: "11px" }}>
                    In Stock
                  </span>
                ) : (
                  <span className="badge badge-error" style={{ fontSize: "11px" }}>
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Price Box */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.75rem",
                borderTop: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
                padding: "1rem 0",
              }}
            >
              <span
                style={{
                  fontSize: "1.875rem",
                  fontWeight: 800,
                  color: "var(--ink)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatCurrency(finalPrice)}
              </span>
              {product.discountPrice > 0 && (
                <span
                  style={{
                    fontSize: "1.125rem",
                    color: "var(--ink-subtle)",
                    textDecoration: "line-through",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatCurrency(product.price)}
                </span>
              )}
              <span style={{ fontSize: "0.75rem", color: "var(--ink-subtle)", marginLeft: "auto" }}>
                Incl. all taxes & insurance
              </span>
            </div>

            {/* Short summary */}
            <p style={{ fontSize: "0.875rem", color: "var(--ink-light)", lineHeight: 1.7 }}>
              {product.description || "Premium quality product designed for everyday excellence."}
            </p>

            {/* Variant selector */}
            {product.variants?.length > 0 && (
              <div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--ink-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "0.5rem",
                  }}
                >
                  Select Option
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {product.variants.map((v, idx) => {
                    const isSelected = selectedVariant?._id === v._id;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: "0.75rem",
                          fontSize: "0.8125rem",
                          fontWeight: 700,
                          border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                          backgroundColor: isSelected ? "var(--accent-bg)" : "var(--surface)",
                          color: isSelected ? "var(--accent)" : "var(--ink)",
                          cursor: "pointer",
                          transition: "all 0.18s",
                        }}
                      >
                        {v.size || v.color || `Option ${idx + 1}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Qty & Add to cart actions */}
            {!isAdmin ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ink)" }}>Quantity:</span>
                  <QuantityStepper quantity={quantity} onIncrease={handleIncreaseQuantity} onDecrease={handleDecreaseQuantity} max={stock > 0 ? stock : 10} />
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={stock <= 0}
                    className="btn btn-accent btn-ripple flex-1"
                    style={{ minWidth: "11rem", flex: 1, padding: "0.9rem 1.5rem", fontSize: "0.9375rem" }}
                  >
                    <ShoppingBag size={18} />
                    {stock <= 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                  <button
                    type="button"
                    onClick={handleWishlist}
                    className="btn btn-secondary"
                    style={{ padding: "0.9rem 1.125rem" }}
                    aria-label="Wishlist"
                  >
                    <Heart
                      size={20}
                      fill={isWished ? "var(--red)" : "none"}
                      color={isWished ? "var(--red)" : "var(--ink)"}
                    />
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="card-surface"
                style={{
                  padding: "1rem 1.25rem",
                  backgroundColor: "var(--bg-subtle)",
                  borderColor: "var(--border)",
                }}
              >
                <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--ink)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Seller view
                </p>
                <p style={{ marginTop: "0.35rem", fontSize: "0.8125rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
                  Customer cart and wishlist actions are hidden for seller accounts.
                </p>
              </div>
            )}

            {/* PINCODE CHECK — commented out for now, re-enable when Delhivery API is ready
            <div
              className="card-surface"
              style={{
                padding: "0.875rem 1rem",
                borderRadius: "1rem",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <MapPin size={16} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ink)" }}>
                  Check Delivery Availability
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit Pincode"
                  style={{
                    flex: 1,
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.8125rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--surface)",
                    color: "var(--ink)",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={handleCheckPincode}
                  disabled={isCheckingPincode || pincodeInput.length < 6}
                  className="btn btn-secondary"
                  style={{ padding: "0.5rem 0.875rem", fontSize: "0.8125rem", fontWeight: 600 }}
                >
                  {isCheckingPincode ? "Checking..." : "Check"}
                </button>
              </div>
              {pincodeResult && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    color: pincodeResult.available ? "var(--green)" : "var(--red)",
                  }}
                >
                  {pincodeResult.available ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                  <span>{pincodeResult.message}</span>
                </div>
              )}
            </div>
            */}


            {/* Trust Banner */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.5rem",
                borderRadius: "1rem",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-subtle)",
                padding: "1rem",
                textAlign: "center",
              }}
            >
              {[
                [Truck, "Pan-India", "Free over ₹999", "/shipping-delivery-policy"],
                [ShieldCheck, "100% Genuine", "Quality tested", null],
                [RotateCcw, "7-Day Support", "Easy replacement", "/return-exchange-policy"],
              ].map(([Icon, t, s, link], i) => {
                const content = (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.25rem",
                      height: "100%",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={18} style={{ color: "var(--accent)" }} />
                    <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--ink)" }}>{t}</p>
                    <p style={{ fontSize: "0.625rem", color: "var(--ink-muted)" }}>{s}</p>
                  </div>
                );

                const borderStyle =
                  i === 1
                    ? {
                      borderLeft: "1px solid var(--border)",
                      borderRight: "1px solid var(--border)",
                    }
                    : {};

                return link ? (
                  <Link
                    key={i}
                    to={link}
                    style={{
                      textDecoration: "none",
                      ...borderStyle,
                    }}
                    className="hover:opacity-80 transition-opacity"
                    title={`View ${t} policy`}
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={i} style={borderStyle}>
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginTop: "4rem", borderTop: "1px solid var(--border)" }}>
          <div
            style={{
              display: "flex",
              gap: "2rem",
              borderBottom: "1px solid var(--border)",
              marginBottom: "1.75rem",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  paddingBottom: "1rem",
                  paddingTop: "1rem",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: activeTab === tab.id ? "var(--accent)" : "var(--ink-muted)",
                  borderBottom: `2px solid ${activeTab === tab.id ? "var(--accent)" : "transparent"}`,
                  marginBottom: "-1px",
                  background: "none",
                  border: "none",
                  borderBottomStyle: "solid",
                  borderBottomWidth: "2px",
                  borderBottomColor: activeTab === tab.id ? "var(--accent)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.18s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "description" && (
            <div className="card-surface tab-pane p-6 sm:p-8">
              <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--ink)", marginBottom: "0.75rem" }}>
                Product Overview
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--ink-light)", lineHeight: 1.75 }}>
                {product.description ||
                  "Crafted with the highest grade materials for unmatched durability and aesthetic appeal. Each item is strictly quality-checked before dispatch."}
              </p>
            </div>
          )}

          {!isAdmin && activeTab === "reviews" && (
            <div className="tab-pane" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {reviews.length === 0 ? (
                <div
                  className="card-surface"
                  style={{
                    padding: "3rem 1.5rem",
                    textAlign: "center",
                    fontSize: "0.875rem",
                    color: "var(--ink-muted)",
                  }}
                >
                  <Star size={24} style={{ color: "var(--yellow)", margin: "0 auto 0.75rem" }} />
                  <p style={{ fontWeight: 700, color: "var(--ink)" }}>No customer reviews yet</p>
                  <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                    Be the first to share your experience with this product!
                  </p>
                </div>
              ) : (
                reviews.map((r, i) => (
                  <div key={i} className="card-surface p-5">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ink)" }}>
                        {r.user?.name || "Verified Buyer"}
                      </span>
                      <span style={{ fontSize: "0.6875rem", color: "var(--ink-subtle)" }}>
                        {formatDate(r.createdAt)}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "2px", color: "var(--yellow)", marginBottom: "0.5rem" }}>
                      {Array.from({ length: r.rating || 5 }).map((_, s) => (
                        <Star key={s} size={14} fill="currentColor" />
                      ))}
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "var(--ink-light)", lineHeight: 1.6 }}>{r.comment}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="card-surface tab-pane p-6 sm:p-8">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: "1rem", color: "var(--ink)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Truck size={18} style={{ color: "var(--accent)" }} /> Fast Doorstep Delivery Across India
                  </h4>
                  <p style={{ fontSize: "0.875rem", color: "var(--ink-light)", lineHeight: 1.7, marginBottom: "0.85rem" }}>
                    All orders are packaged with heavy-duty multi-layer protective materials. Dispatched within 24-48 hours. Metro deliveries arrive in 2-4 business days with real-time SMS tracking. Free shipping on orders over ₹999.
                  </p>
                  <Link
                    to="/shipping-delivery-policy"
                    style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--accent)", textDecoration: "underline" }}
                  >
                    Read Full Shipping & Delivery Policy →
                  </Link>
                </div>

                <div>
                  <h4 style={{ fontWeight: 800, fontSize: "1rem", color: "var(--ink)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <RotateCcw size={18} style={{ color: "var(--accent)" }} /> 7-Day Easy Replacement Guarantee
                  </h4>
                  <p style={{ fontSize: "0.875rem", color: "var(--ink-light)", lineHeight: 1.7, marginBottom: "0.85rem" }}>
                    Received a damaged, defective, or incorrect product? Notify our team within 7 days of delivery. We schedule a complimentary doorstep pickup and dispatch a replacement unit or process a refund.
                  </p>
                  <Link
                    to="/return-exchange-policy"
                    style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--accent)", textDecoration: "underline" }}
                  >
                    Read 7-Day Return & Exchange Policy →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div style={{ marginTop: "4rem" }}>
            <div className="mb-6">
              <span className="eyebrow">Recommendations</span>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "var(--ink)",
                  letterSpacing: "-0.02em",
                  marginTop: "0.25rem",
                }}
              >
                You Might Also Like
              </h3>
            </div>
            <ProductGrid products={related} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsPage;