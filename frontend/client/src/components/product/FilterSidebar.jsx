import { useState, useEffect } from "react";
import { categoryService, brandService } from "../../services/productService";
import { Filter, RotateCcw, Star } from "lucide-react";

const ratingOptions = [4, 3, 2, 1];

const FilterSidebar = ({ filters, onChange, onClear }) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || "",
    max: filters.maxPrice || "",
  });

  useEffect(() => {
    categoryService.getCategories().then((res) => setCategories(res.data || [])).catch(() => {});
    brandService.getBrands().then((res) => setBrands(res.data || [])).catch(() => {});
  }, []);

  const applyPriceRange = () => {
    onChange({ minPrice: priceRange.min || undefined, maxPrice: priceRange.max || undefined });
  };

  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
        <h3 className="text-sm font-bold tracking-tight text-gray-900 flex items-center gap-1.5">
          <Filter size={15} className="text-amber-600" /> Filters
        </h3>
        <button
          onClick={onClear}
          className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1"
        >
          <RotateCcw size={11} /> Clear All
        </button>
      </div>

      {/* Category Filter */}
      <div>
        <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-500">Categories</h4>
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700 hover:text-gray-900">
            <input
              type="radio"
              name="category"
              checked={!filters.category}
              onChange={() => onChange({ category: undefined })}
              className="accent-black"
            />
            All Categories
          </label>
          {categories.map((cat) => (
            <label key={cat._id} className="flex cursor-pointer items-center gap-2 text-xs text-gray-700 hover:text-gray-900">
              <input
                type="radio"
                name="category"
                checked={filters.category === cat._id}
                onChange={() => onChange({ category: cat._id })}
                className="accent-black"
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="border-t border-gray-100 pt-4">
        <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-500">Price Range (â‚¹)</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min â‚¹"
            value={priceRange.min}
            onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))}
            onBlur={applyPriceRange}
            className="input-field !py-2 text-xs"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="Max â‚¹"
            value={priceRange.max}
            onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))}
            onBlur={applyPriceRange}
            className="input-field !py-2 text-xs"
          />
        </div>
      </div>

      {/* Minimum Rating */}
      <div className="border-t border-gray-100 pt-4">
        <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-500">Customer Rating</h4>
        <div className="flex flex-col gap-2">
          {ratingOptions.map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 text-xs text-gray-700 hover:text-gray-900">
              <input
                type="radio"
                name="rating"
                checked={String(filters.minRating) === String(r)}
                onChange={() => onChange({ minRating: r })}
                className="accent-black"
              />
              <span className="flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: r }).map((_, i) => (
                  <Star key={i} size={12} fill="currentColor" />
                ))}
              </span>
              <span className="text-gray-500">{r}+ Stars</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;