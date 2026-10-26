import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { categoryService } from "../../services/categoryService";

// Inline SVG icons for categories — no external image dependencies, always loads
const CategoryIcon = ({ id, size = 28, color = "currentColor" }) => {
  const normId = String(id || "").toLowerCase();

  if (normId.includes("god") || normId.includes("idol") || normId.includes("temple")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L9 8h6l-3-6z" />
        <path d="M4 21V11l8-4 8 4v10" />
        <path d="M9 21v-6h6v6" />
        <circle cx="12" cy="11" r="1.5" />
      </svg>
    );
  }

  if (normId.includes("fitness") || normId.includes("gripper") || normId.includes("gym")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 5v14M18 5v14M3 9v6M21 9v6M6 12h12" />
      </svg>
    );
  }

  if (normId.includes("battery") || normId.includes("light") || normId.includes("diya") || normId.includes("sensor")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    );
  }

  if (normId.includes("car")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17h14M5 17a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2M7 17v2M17 17v2M5 11h14" />
      </svg>
    );
  }

  if (normId.includes("showpiece") || normId.includes("figurine") || normId.includes("decor")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h12l4 6-10 13L2 9l4-6z" />
        <path d="M11 3L8 9l4 13 4-13-3-6" />
        <path d="M2 9h20" />
      </svg>
    );
  }

  if (normId.includes("electronic")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
      </svg>
    );
  }

  if (normId.includes("men")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 2h10l2 6-3 1v13H8V9L5 8z" />
        <path d="M12 2v5M10 4l2-2 2 2" />
      </svg>
    );
  }

  if (normId.includes("footwear")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l2-8 5 3 4-3 7 2v2c0 0-2 1-3 4-1 3-2 3-5 3H5l-1 4H2" />
        <path d="M3 11h16" />
      </svg>
    );
  }

  // Default accessories icon
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <path d="M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
    </svg>
  );
};

const defaultCategories = [
  { id: "accessories", name: "Accessories" },
  { id: "accessories-showpiece-and-figurine-god-idol", name: "God Idol" },
  { id: "accessories-fitness-accessories", name: "Fitness Accessories" },
  { id: "electronics-battery-oprated", name: "Battery Operated" },
  { id: "accessories-showpiece-and-figurine", name: "Showpiece & Figurine" },
  { id: "accessories-car-accessories", name: "Car Accessories" },
  { id: "electronics", name: "Electronics" },
  { id: "men", name: "Men" },
];

const CategoryFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState(defaultCategories);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");

  useEffect(() => {
    categoryService
      .getCategories()
      .then((res) => {
        const raw = res?.data || [];
        if (raw.length > 0) {
          // Curate categories to show: show distinct categories that either have depth or are top-level
          const displayCats = raw.map((c) => ({
            id: c.slug || c._id,
            name: c.name,
            level: c.level || 1,
          }));
          // Sort to put subcategories like God Idol and Fitness Accessories up front
          displayCats.sort((a, b) => (b.level || 1) - (a.level || 1));
          setCategories(displayCats.slice(0, 8));
        }
      })
      .catch(() => {
        // Fall back to default store categories
      });
  }, []);

  const handleCategoryClick = (categoryId) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory("");
      const next = new URLSearchParams(searchParams);
      next.delete("category");
      setSearchParams(next);
    } else {
      setSelectedCategory(categoryId);
      const next = new URLSearchParams(searchParams);
      next.set("category", categoryId);
      setSearchParams(next);
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
        <div className="category-scroll">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryClick(category.id)}
              className="category-filter-card"
              style={{
                backgroundColor: selectedCategory === category.id ? "var(--accent-bg)" : "var(--surface)",
                border: selectedCategory === category.id ? "2px solid var(--accent)" : "1px solid var(--border)",
                cursor: "pointer",
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
                  backgroundColor: selectedCategory === category.id ? "var(--accent)" : "var(--bg-subtle)",
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
                  lineHeight: 1.25,
                  width: "100%",
                }}
                className="line-clamp-2"
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