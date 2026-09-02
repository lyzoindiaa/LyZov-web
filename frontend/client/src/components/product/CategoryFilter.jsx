import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const categories = [
  { id: "ethnic-wear", name: "Ethnic Wear", image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200&h=200&fit=crop" },
  { id: "western-dresses", name: "Western Dresses", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&h=200&fit=crop" },
  { id: "menswear", name: "Menswear", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=200&h=200&fit=crop" },
  { id: "footwear", name: "Footwear", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop" },
  { id: "home-decor", name: "Home Decor", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop" },
  { id: "beauty", name: "Beauty", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop" },
  { id: "accessories", name: "Accessories", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&h=200&fit=crop" },
  { id: "grocery", name: "Grocery", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop" },
];

const CategoryFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");

  const handleCategoryClick = (categoryId) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory("");
      setSearchParams({});
    } else {
      setSelectedCategory(categoryId);
      setSearchParams({ category: categoryId });
    }
  };

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "");
  }, [searchParams]);

  return (
    <section
      style={{
        backgroundColor: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        padding: "2rem 0",
        width: "100%",
      }}
    >
      <div className="container-page" style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            overflowX: "auto",
            padding: "0.5rem 0",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            width: "100%",
            justifyContent: "center",
          }}
          className="category-scroll"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryClick(category.id)}
              className="category-filter-card"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                minWidth: "5rem",
                padding: "0.75rem",
                borderRadius: "1.5rem",
                backgroundColor: selectedCategory === category.id ? "var(--accent-bg)" : "var(--surface)",
                border: selectedCategory === category.id ? "2px solid var(--accent)" : "1px solid var(--border)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textDecoration: "none",
                flexShrink: 0,
                boxShadow: "var(--shadow-sm)",
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== category.id) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== category.id) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }
              }}
            >
              <div
                className="category-filter-image"
                style={{
                  width: "3.5rem",
                  height: "3.5rem",
                  borderRadius: "1rem",
                  backgroundColor: selectedCategory === category.id ? "var(--accent)" : "var(--bg-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                }}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: selectedCategory === category.id ? "var(--accent)" : "var(--ink)",
                  textAlign: "center",
                  maxWidth: "5rem",
                }}
              >
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryFilter;