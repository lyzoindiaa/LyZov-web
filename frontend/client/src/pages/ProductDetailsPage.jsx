import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Star,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  ShoppingBag,
  ZoomIn,
  Check,
  ChevronRight,
  ArrowLeft,
  Pause,
  MapPin,
  AlertCircle,
  CheckCircle,
  ThumbsUp,
  Camera,
  X,
  BadgeCheck,
  MessageSquarePlus,
  Palmtree,
  Lock,
} from "lucide-react";
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
  const [reviewMeta, setReviewMeta] = useState({
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    averageRating: 0,
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [helpfulVoted, setHelpfulVoted] = useState({});
  const [searchParams] = useSearchParams();
  const [reviewEligibility, setReviewEligibility] = useState({
    canReview: false,
    hasPurchased: false,
    alreadyReviewed: false,
    isLoading: true,
  });
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

  const handleMarkHelpful = async (reviewId) => {
    if (helpfulVoted[reviewId]) {
      toast.info("You have already voted this review as helpful");
      return;
    }
    try {
      await reviewService.markHelpful(reviewId);
      setHelpfulVoted((prev) => ({ ...prev, [reviewId]: true }));
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r))
      );
      toast.success("Thank you for your feedback!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to mark as helpful");
    }
  };

  const handleReviewImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + reviewImages.length > 4) {
      toast.error("You can upload a maximum of 4 images");
      return;
    }
    setReviewImages((prev) => [...prev, ...files]);
  };

  const handleRemoveReviewImage = (index) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warn("Please sign in to write a review");
      navigate(`/login?redirect=/product/${slug}`);
      return;
    }
    if (!reviewEligibility.canReview) {
      toast.error("Review submission is restricted to verified customers who have purchased this product.");
      return;
    }
    if (!reviewComment.trim()) {
      toast.error("Please provide a review comment");
      return;
    }

    try {
      setIsSubmittingReview(true);
      const formData = new FormData();
      formData.append("productId", product._id);
      formData.append("rating", String(reviewRating));
      formData.append("title", reviewTitle.trim());
      formData.append("comment", reviewComment.trim());
      reviewImages.forEach((img) => formData.append("images", img));

      await reviewService.createReview(formData);
      toast.success("Review submitted successfully! Thank you for sharing your verified experience.");
      setShowReviewModal(false);
      setReviewTitle("");
      setReviewComment("");
      setReviewImages([]);
      setReviewRating(5);
      setReviewEligibility({
        canReview: false,
        hasPurchased: true,
        alreadyReviewed: true,
        isLoading: false,
      });

      // Refresh reviews
      const rv = await reviewService.getProductReviews(product._id).catch(() => ({ data: [], meta: {} }));
      setReviews(rv.data || []);
      if (rv.meta) setReviewMeta(rv.meta);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
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
        const rv = await reviewService.getProductReviews(prod._id).catch(() => ({ data: [], meta: {} }));
        setReviews(rv.data || []);
        if (rv.meta) setReviewMeta(rv.meta);

        // Check verified buyer review eligibility
        if (isAuthenticated) {
          reviewService
            .checkReviewEligibility(prod._id)
            .then((eligRes) => {
              if (eligRes?.data) {
                setReviewEligibility({
                  canReview: Boolean(eligRes.data.canReview),
                  hasPurchased: Boolean(eligRes.data.hasPurchased),
                  alreadyReviewed: Boolean(eligRes.data.alreadyReviewed),
                  orderId: eligRes.data.orderId,
                  isLoading: false,
                });
                if (searchParams.get("openReview") === "true") {
                  setActiveTab("reviews");
                  if (eligRes.data.canReview) {
                    setShowReviewModal(true);
                  } else if (eligRes.data.alreadyReviewed) {
                    toast.info("You have already reviewed this product.");
                  }
                }
              }
            })
            .catch(() => setReviewEligibility((p) => ({ ...p, isLoading: false })));
        } else {
          setReviewEligibility((p) => ({ ...p, isLoading: false }));
        }
      } catch {
        setProduct(null);
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug, isAuthenticated, isAdmin, searchParams]);

  // Real-Time Review Event Streaming (Server-Sent Events)
  useEffect(() => {
    if (!product?._id) return;

    let eventSource;
    try {
      const streamUrl = reviewService.getReviewStreamUrl(product._id);
      eventSource = new EventSource(streamUrl);

      eventSource.addEventListener("review:new", (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data?.review) {
            setReviews((prev) => {
              if (prev.some((r) => r._id === data.review._id)) return prev;
              return [data.review, ...prev];
            });

            if (data.distribution) {
              setReviewMeta({
                distribution: data.distribution,
                averageRating: data.averageRating || 0,
                total: data.total || 0,
              });
            }

            toast.info(
              `⭐ New verified buyer review: "${data.review.title || (data.review.comment ? data.review.comment.slice(0, 35) + '...' : 'Customer review')}"`,
              { autoClose: 4000 }
            );
          }
        } catch (err) {
          console.error("Live review SSE error", err);
        }
      });

      eventSource.addEventListener("review:helpful", (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data?.reviewId) {
            setReviews((prev) =>
              prev.map((r) =>
                r._id === data.reviewId ? { ...r, helpfulCount: data.helpfulCount } : r
              )
            );
          }
        } catch (err) {
          console.error("Live helpful SSE error", err);
        }
      });

      eventSource.addEventListener("review:deleted", (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data?.reviewId) {
            setReviews((prev) => prev.filter((r) => r._id !== data.reviewId));
            if (data.distribution) {
              setReviewMeta({
                distribution: data.distribution,
                averageRating: data.averageRating || 0,
                total: data.total || 0,
              });
            }
          }
        } catch (err) {
          console.error("Live delete SSE error", err);
        }
      });
    } catch (err) {
      console.warn("SSE connection error", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [product?._id]);

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
  const isSellerOnVacation = Boolean(product?.seller?.sellerProfile?.isVacationMode);

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
    if (isSellerOnVacation) {
      toast.warn("This merchant is currently on vacation. Orders for this item are temporarily paused.");
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
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-8 lg:gap-14 items-start">
          {/* Gallery */}
          <div className="flex flex-col gap-4 md:sticky md:top-24">
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

              {/* [SINGLE-SELLER MODE] Multi-Seller Attribution
              {product.seller && (
                <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem", color: "var(--ink-muted)" }}>
                  <ShieldCheck size={14} style={{ color: "var(--accent)" }} />
                  <span>Sold & Fulfilled by:</span>
                  <Link
                    to={product.seller.sellerProfile?.storeSlug ? `/store/${product.seller.sellerProfile.storeSlug}` : "#"}
                    style={{
                      fontWeight: 600,
                      color: "var(--accent)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
                    onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
                  >
                    {product.seller.sellerProfile?.businessName || product.seller.name || "LyZov Verified Merchant"}
                  </Link>
                </div>
              )}
              */}
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
                {isSellerOnVacation && (
                  <div
                    className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700/40 text-amber-900 dark:text-amber-200"
                    style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}
                  >
                    <Palmtree size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 700 }}>Merchant on Vacation</p>
                      <p style={{ fontSize: "0.75rem", marginTop: "0.25rem", opacity: 0.9 }}>
                        {product.seller?.sellerProfile?.vacationMessage ||
                          "This seller is currently taking a temporary holiday break. Item orders will resume shortly."}
                      </p>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ink)" }}>Quantity:</span>
                  <QuantityStepper quantity={quantity} onIncrease={handleIncreaseQuantity} onDecrease={handleDecreaseQuantity} max={stock > 0 ? stock : 10} />
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={stock <= 0 || isSellerOnVacation}
                    className="btn btn-accent btn-ripple flex-1"
                    style={{ minWidth: "11rem", flex: 1, padding: "0.9rem 1.5rem", fontSize: "0.9375rem" }}
                  >
                    <ShoppingBag size={18} />
                    {isSellerOnVacation ? "Merchant on Vacation" : stock <= 0 ? "Out of Stock" : "Add to Cart"}
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
            <div className="tab-pane flex flex-col gap-6">
              {/* Rating Summary Card & Action */}
              <div className="card-surface p-6 sm:p-8 rounded-xl border border-[var(--border)] shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Left: Overall Score */}
                  <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-[var(--border)] pb-6 md:pb-0 md:pr-6">
                    <div className="text-5xl font-black text-[var(--ink)] tracking-tight">
                      {reviewMeta.averageRating > 0 ? reviewMeta.averageRating.toFixed(1) : (product.ratingsAverage || 5.0).toFixed(1)}
                    </div>
                    <div className="flex items-center gap-1 my-2 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={18}
                          fill={s <= Math.round(reviewMeta.averageRating || product.ratingsAverage || 5) ? "currentColor" : "none"}
                          className={s <= Math.round(reviewMeta.averageRating || product.ratingsAverage || 5) ? "text-amber-500" : "text-[var(--ink-muted)]"}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-[var(--ink-muted)]">
                      Based on {reviews.length} {reviews.length === 1 ? "review" : "customer reviews"}
                    </p>

                    {/* Real-time Indicator & Action */}
                    <div className="mt-4 flex flex-col items-center md:items-start gap-2 w-full">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live Real-Time Reviews</span>
                      </div>

                      {!isAuthenticated ? (
                        <button
                          type="button"
                          onClick={() => {
                            toast.info("Please sign in to leave a review (buyers only)");
                            navigate(`/login?redirect=/product/${slug}`);
                          }}
                          className="mt-1 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-[var(--accent)] text-white hover:opacity-95 transition-all shadow-xs"
                        >
                          <MessageSquarePlus size={15} /> Sign in to Review
                        </button>
                      ) : reviewEligibility.alreadyReviewed ? (
                        <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300 dark:border-emerald-700">
                          <CheckCircle size={14} className="text-emerald-600" />
                          <span>You reviewed this item</span>
                        </div>
                      ) : reviewEligibility.canReview ? (
                        <button
                          type="button"
                          onClick={() => setShowReviewModal(true)}
                          className="mt-1 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-[var(--accent)] text-white hover:opacity-95 transition-all shadow-xs"
                        >
                          <MessageSquarePlus size={15} /> Write a Verified Review
                        </button>
                      ) : (
                        <div className="mt-1 p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-700/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                          <Lock size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>
                            <strong>Verified Buyers Only:</strong> Purchase this product to unlock customer reviews.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Star breakdown bars */}
                  <div className="md:col-span-8 flex flex-col gap-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviewMeta.distribution?.[star] || 0;
                      const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : (star === 5 ? 100 : 0);
                      return (
                        <div key={star} className="flex items-center gap-3 text-xs">
                          <span className="w-10 font-bold text-[var(--ink)] flex items-center gap-1">
                            {star} <Star size={11} className="text-amber-500" fill="currentColor" />
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-[var(--ink-muted)] font-medium">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Review Cards List */}
              {reviews.length === 0 ? (
                <div className="card-surface p-12 text-center rounded-xl border border-[var(--border)]">
                  <Star size={32} className="text-amber-400 mx-auto mb-3 opacity-60" />
                  <p className="font-bold text-[var(--ink)] text-base">No customer reviews yet</p>
                  <p className="text-xs text-[var(--ink-muted)] mt-1 mb-4">
                    Be the first verified customer to share insights about this product.
                  </p>
                  {!isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/login?redirect=/product/${slug}`)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-[var(--accent)] text-white hover:opacity-95"
                    >
                      <MessageSquarePlus size={14} /> Sign in to Write First Review
                    </button>
                  ) : reviewEligibility.canReview ? (
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-[var(--accent)] text-white hover:opacity-95"
                    >
                      <MessageSquarePlus size={14} /> Write First Review
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800">
                      <Lock size={13} className="text-amber-600" />
                      <span>Only verified buyers who ordered this product can write a review.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {reviews.map((r, i) => (
                    <div
                      key={r._id || i}
                      className="card-surface p-6 rounded-xl border border-[var(--border)] shadow-xs transition-shadow hover:shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-bold text-xs flex items-center justify-center uppercase">
                            {r.user?.name ? r.user.name.charAt(0) : "C"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-[var(--ink)]">
                                {r.user?.name || "LyZov Customer"}
                              </span>
                              {r.isVerifiedPurchase && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                  <BadgeCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                                  Verified Buyer
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[var(--ink-muted)]">
                              {formatDate(r.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              fill={s <= (r.rating || 5) ? "currentColor" : "none"}
                              className={s <= (r.rating || 5) ? "text-amber-500" : "text-[var(--ink-muted)]"}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Title if present */}
                      {r.title && (
                        <h5 className="font-bold text-sm text-[var(--ink)] mb-1.5">
                          {r.title}
                        </h5>
                      )}

                      <p className="text-sm text-[var(--ink-light)] leading-relaxed mb-4">
                        {r.comment}
                      </p>

                      {/* Review Photos */}
                      {r.images && r.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {r.images.map((img, imgIdx) => (
                            <a
                              key={imgIdx}
                              href={img.url}
                              target="_blank"
                              rel="noreferrer"
                              className="w-16 h-16 rounded-lg overflow-hidden border border-[var(--border)] group block"
                            >
                              <img
                                src={img.url}
                                alt="Review snapshot"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Helpful Button */}
                      <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs">
                        <span className="text-[var(--ink-muted)]">Was this review helpful?</span>
                        <button
                          type="button"
                          onClick={() => handleMarkHelpful(r._id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                            helpfulVoted[r._id]
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300"
                              : "border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--border)]/30"
                          }`}
                        >
                          <ThumbsUp size={12} />
                          <span>Helpful ({r.helpfulCount || 0})</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="card-surface tab-pane p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
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

        {/* Write Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div
              className="card-surface w-full max-w-lg rounded-2xl border border-[var(--border)] shadow-2xl p-6 sm:p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--ink)]">Write a Customer Review</h3>
                  <p className="text-xs text-[var(--ink-muted)] mt-0.5 truncate max-w-xs">{product.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
                {/* Star Rating Picker */}
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-2">
                    Overall Rating *
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setReviewHoverRating(star)}
                        onMouseLeave={() => setReviewHoverRating(0)}
                        onClick={() => setReviewRating(star)}
                        className="p-1 text-amber-500 hover:scale-110 transition-transform focus:outline-hidden"
                      >
                        <Star
                          size={28}
                          fill={star <= (reviewHoverRating || reviewRating) ? "currentColor" : "none"}
                          className={star <= (reviewHoverRating || reviewRating) ? "text-amber-500" : "text-gray-300 dark:text-gray-600"}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold ml-2 text-[var(--ink)]">
                      {(reviewHoverRating || reviewRating) === 5 && "Outstanding"}
                      {(reviewHoverRating || reviewRating) === 4 && "Very Good"}
                      {(reviewHoverRating || reviewRating) === 3 && "Average"}
                      {(reviewHoverRating || reviewRating) === 2 && "Poor"}
                      {(reviewHoverRating || reviewRating) === 1 && "Terrible"}
                    </span>
                  </div>
                </div>

                {/* Review Title */}
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">
                    Review Headline
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Premium fabric, fits true to size"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-hidden focus:border-[var(--accent)]"
                    maxLength={120}
                  />
                </div>

                {/* Review Comment */}
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">
                    Detailed Review *
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Write your honest feedback regarding fit, durability, material feel, packaging, and delivery..."
                    rows={4}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-hidden focus:border-[var(--accent)] resize-none"
                    maxLength={1000}
                  />
                  <span className="text-[10px] text-[var(--ink-muted)] block text-right mt-1">
                    {reviewComment.length}/1000 characters
                  </span>
                </div>

                {/* Image Uploads */}
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">
                    Attach Photos (Optional, max 4)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {reviewImages.map((file, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[var(--border)] group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveReviewImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}

                    {reviewImages.length < 4 && (
                      <label className="w-16 h-16 rounded-lg border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] cursor-pointer transition-colors">
                        <Camera size={18} />
                        <span className="text-[9px] mt-1 font-semibold">+ Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleReviewImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    disabled={isSubmittingReview}
                    className="px-4 py-2 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--border)]/30 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview || !reviewComment.trim()}
                    className="px-5 py-2 text-xs font-bold text-white bg-[var(--accent)] rounded-lg hover:opacity-95 transition-all disabled:opacity-50 shadow-xs flex items-center gap-2"
                  >
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsPage;