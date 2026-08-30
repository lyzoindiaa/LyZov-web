import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchWishlist } from "../../features/wishlist/wishlistSlice";
import ProductGrid from "../../components/product/ProductGrid";

const WishlistPage = () => {
  const dispatch = useDispatch();
  const { products, status } = useSelector((state) => state.wishlist);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  if (status === "succeeded" && products.length === 0) {
    return (
      <div className="empty-state py-12">
        <div
          style={{
            width: "3.5rem",
            height: "3.5rem",
            borderRadius: "9999px",
            backgroundColor: "var(--red-bg)",
            color: "var(--red)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Heart size={26} />
        </div>
        <h3 className="empty-state-title">Your wishlist is empty</h3>
        <p className="empty-state-desc">Save items you love by tapping the heart icon on any product.</p>
        <Link to="/shop" className="btn-accent mt-2">
          Discover Products <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--ink)" }}>
          My Saved Items ({products.length})
        </h2>
      </div>
      <ProductGrid products={products} isLoading={status === "loading"} emptyMessage="Your wishlist is empty" />
    </div>
  );
};

export default WishlistPage;
