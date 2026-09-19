import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// Inline SVG icons for each category — no external image dependencies, always loads
const CategoryIcon = ({ id, size = 28, color = "currentColor" }) => {
  const icons = {
    "ethnic-wear": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L8 6H4l2 5-4 3 4 1 1 7h10l1-7 4-1-4-3 2-5h-4L12 2z"/>
        <path d="M9 13c0 1.657 1.343 3 3 3s3-1.343 3-3"/>
      </svg>
    ),
    "western-dresses": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h12l-2 6h2l-8 14L2 8h2L2 2"/>
        <path d="M9.5 8h5"/>
      </svg>
    ),
    "menswear": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 2h10l2 6-3 1v13H8V9L5 8z"/>
        <path d="M12 2v5M10 4l2-2 2 2"/>
      </svg>
    ),
    "footwear": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l2-8 5 3 4-3 7 2v2c0 0-2 1-3 4-1 3-2 3-5 3H5l-1 4H2"/>
        <path d="M3 11h16"/>
      </svg>
    ),
    "home-decor": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
    "beauty": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2c-2 4-6 5-6 9a6 6 0 0012 0c0-4-4-5-6-9z"/>
        <path d="M12 12v9M9 18h6"/>
      </svg>
    ),
    "accessories": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
        <path d="M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
      </svg>
    ),
    "grocery": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <path d="M3 6h18"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
  };
  return icons[id] || (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <path d="M9 9h6M9 12h6M9 15h4"/>
    </svg>
  );
};

const categories = [
  { id: "ethnic-wear",      name: "Ethnic Wear" },
  { id: "western-dresses",  name: "Western Dresses" },
  { id: "menswear",         name: "Menswear" },
  { id: "footwear",         name: "Footwear" },
  { id: "home-decor",       name: "Home Decor" },
  { id: "beauty",           name: "Beauty" },
  { id: "accessories",      name: "Accessories" },
  { id: "grocery",          name: "Grocery" },
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
                <CategoryIcon
                  id={category.id}
                  size={26}
                  color={selectedCategory === category.id ? "#ffffff" : "var(--accent)"}
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