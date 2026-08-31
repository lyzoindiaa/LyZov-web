import ProductCard from "./ProductCard";
import { ProductGridSkeleton } from "../skeletons/Skeletons";
import { PackageSearch } from "lucide-react";

const ProductGrid = ({ products, isLoading, emptyMessage = "No products found" }) => {
  if (isLoading) return <ProductGridSkeleton />;

  if (!products || products.length === 0) {
    return (
      <div className="empty-state card-surface py-16 my-4 w-full">
        <div
          style={{
            width: "3.5rem",
            height: "3.5rem",
            borderRadius: "9999px",
            backgroundColor: "var(--bg-raised)",
            color: "var(--ink-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "0.5rem",
          }}
        >
          <PackageSearch size={26} />
        </div>
        <h3 className="empty-state-title" style={{ fontSize: "1.125rem" }}>
          {emptyMessage}
        </h3>
        <p className="empty-state-desc">Try adjusting your filters or explore other categories.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
