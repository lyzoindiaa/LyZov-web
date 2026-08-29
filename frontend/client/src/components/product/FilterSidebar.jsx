import { useState, useEffect } from "react";
import { Star, RotateCcw, SlidersHorizontal } from "lucide-react";
import { categoryService, brandService } from "../../services/productService";

const FilterSidebar = ({ filters, onChange, onClear }) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: filters.minPrice || "", max: filters.maxPrice || "" });

  useEffect(() => {
    categoryService?.getCategories?.().then((res) => setCategories(res.data || [])).catch(() => {});
    brandService?.getBrands?.().then((res) => setBrands(res.data || [])).catch(() => {});
  }, []);

  const applyPrice = () => onChange({ minPrice: priceRange.min || undefined, maxPrice: priceRange.max || undefined });

  const sectionLabel = (text) => (
    <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-subtle)", marginBottom: "0.625rem" }}>{text}</p>
  );

  const radioRow = (label, checked, onClick) => (
    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.3rem 0", fontSize: "0.8125rem", color: checked ? "var(--ink)" : "var(--ink-muted)", fontWeight: checked ? 600 : 400 }}>
      <input type="radio" name="cat-filter" checked={checked} onChange={onClick} style={{ accentColor: "var(--accent)" }} />
      {label}
    </label>
  );

  return (
    <aside style={{ border: "1px solid var(--border)", borderRadius: "1rem", backgroundColor: "var(--surface)", padding: "1.25rem", boxShadow: "var(--shadow-sm)" }}>
      
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "0.875rem", borderBottom: "1px solid var(--border)", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <SlidersHorizontal size={15} style={{ color: "var(--accent)" }} /> Filters
        </h3>
        <button onClick={onClear} style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--ink-muted)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem" }}>
          <RotateCcw size={11} /> Clear All
        </button>
      </div>

      {/* Category */}
      <div style={{ marginBottom: "1.25rem" }}>
        {sectionLabel("Category")}
        {radioRow("All Categories", !filters.category, () => onChange({ category: undefined }))}
        {categories.map((cat) => radioRow(cat.name, filters.category === cat._id, () => onChange({ category: cat._id })))}
        {categories.length === 0 && (
          <>
            {radioRow("Gym & Fitness", filters.category === "equipment", () => onChange({ category: "equipment" }))}
            {radioRow("God Idols & Decor", filters.category === "spiritual", () => onChange({ category: "spiritual" }))}
            {radioRow("Accessories", filters.category === "accessories", () => onChange({ category: "accessories" }))}
          </>
        )}
      </div>

      {/* Price Range */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1.25rem" }}>
        {sectionLabel("Price Range (â‚¹)")}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input type="number" placeholder="Min" value={priceRange.min} onChange={(e) => setPriceRange(p => ({ ...p, min: e.target.value }))} onBlur={applyPrice} className="input-field" style={{ padding: "0.4rem 0.6rem", fontSize: "0.75rem" }} />
          <span style={{ color: "var(--ink-subtle)" }}>â€“</span>
          <input type="number" placeholder="Max" value={priceRange.max} onChange={(e) => setPriceRange(p => ({ ...p, max: e.target.value }))} onBlur={applyPrice} className="input-field" style={{ padding: "0.4rem 0.6rem", fontSize: "0.75rem" }} />
        </div>
      </div>

      {/* Rating */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
        {sectionLabel("Customer Rating")}
        {[4, 3, 2].map((r) => (
          <label key={r} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.3rem 0", fontSize: "0.8125rem", color: String(filters.minRating) === String(r) ? "var(--ink)" : "var(--ink-muted)", fontWeight: String(filters.minRating) === String(r) ? 600 : 400 }}>
            <input type="radio" name="rating-filter" checked={String(filters.minRating) === String(r)} onChange={() => onChange({ minRating: r })} style={{ accentColor: "var(--accent)" }} />
            <span style={{ display: "flex", gap: "1px", color: "var(--accent)" }}>
              {Array.from({ length: r }).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
            </span>
            <span>{r}+ Stars</span>
          </label>
        ))}
      </div>
    </aside>
  );
};

export default FilterSidebar;