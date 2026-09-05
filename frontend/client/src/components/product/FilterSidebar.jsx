import { useState, useEffect, useMemo } from "react";
import { Star, RotateCcw, SlidersHorizontal, ChevronDown, ChevronRight, Folder } from "lucide-react";
import { categoryService } from "../../services/categoryService";
import { brandService } from "../../services/productService";

const FilterSidebar = ({ filters, onChange, onClear }) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [expandedCats, setExpandedCats] = useState(new Set());
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || "",
    max: filters.maxPrice || "",
  });

  useEffect(() => {
    categoryService
      ?.getCategories?.()
      .then((res) => {
        const data = res.data || [];
        setCategories(data);

        // Auto-expand the parent of the currently active category if any
        if (filters.category) {
          const activeCat = data.find(
            (c) => c._id === filters.category || c.slug === filters.category
          );
          if (activeCat) {
            const toExpand = new Set();
            if (activeCat.parent) {
              const pId = activeCat.parent?._id || activeCat.parent;
              toExpand.add(pId.toString());
            }
            (activeCat.ancestors || []).forEach((a) => toExpand.add(a._id.toString()));
            setExpandedCats((prev) => new Set([...prev, ...toExpand]));
          }
        }
      })
      .catch(() => {});

    brandService
      ?.getBrands?.()
      .then((res) => setBrands(res.data || []))
      .catch(() => {});
  }, [filters.category]);

  const toggleExpand = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const applyPrice = () =>
    onChange({ minPrice: priceRange.min || undefined, maxPrice: priceRange.max || undefined });

  const sectionLabel = (text) => (
    <p
      style={{
        fontSize: "10px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--ink-subtle)",
        marginBottom: "0.625rem",
      }}
    >
      {text}
    </p>
  );

  // Group categories by parent
  const treeData = useMemo(() => {
    const l1 = categories.filter((c) => (c.level || 1) === 1);
    const getChildren = (parentId) =>
      categories.filter((c) => {
        const p = c.parent?._id ? c.parent._id.toString() : c.parent ? c.parent.toString() : "";
        return p === parentId.toString();
      });

    return l1.map((root) => {
      const subcats = getChildren(root._id);
      return {
        ...root,
        children: subcats.map((sub) => ({
          ...sub,
          children: getChildren(sub._id),
        })),
      };
    });
  }, [categories]);

  const isSelected = (cat) => filters.category === cat._id || filters.category === cat.slug;

  return (
    <aside
      style={{
        border: "1px solid var(--border)",
        borderRadius: "1rem",
        backgroundColor: "var(--surface)",
        padding: "1.25rem",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "0.875rem",
          borderBottom: "1px solid var(--border)",
          marginBottom: "1rem",
        }}
      >
        <h3
          style={{
            fontSize: "0.875rem",
            fontWeight: 700,
            color: "var(--ink)",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          <SlidersHorizontal size={15} style={{ color: "var(--accent)" }} /> Filters
        </h3>
        <button
          onClick={onClear}
          style={{
            fontSize: "0.6875rem",
            fontWeight: 600,
            color: "var(--ink-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.2rem",
          }}
        >
          <RotateCcw size={11} /> Clear All
        </button>
      </div>

      {/* Category Hierarchy Accordion */}
      <div style={{ marginBottom: "1.25rem" }}>
        {sectionLabel("Category Hierarchy")}

        {/* All Categories Option */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
            padding: "0.3rem 0",
            fontSize: "0.8125rem",
            color: !filters.category ? "var(--ink)" : "var(--ink-muted)",
            fontWeight: !filters.category ? 700 : 400,
          }}
        >
          <input
            type="radio"
            name="cat-filter"
            checked={!filters.category}
            onChange={() => onChange({ category: undefined })}
            style={{ accentColor: "var(--accent)" }}
          />
          All Categories
        </label>

        {/* Root Categories (L1) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.25rem" }}>
          {treeData.map((root) => {
            const hasSubcats = root.children && root.children.length > 0;
            const isExpanded = expandedCats.has(root._id);
            const checked = isSelected(root);

            return (
              <div key={root._id} className="flex flex-col">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.25rem 0",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      fontSize: "0.8125rem",
                      color: checked ? "var(--accent)" : "var(--ink)",
                      fontWeight: checked ? 700 : 500,
                      flex: 1,
                    }}
                  >
                    <input
                      type="radio"
                      name="cat-filter"
                      checked={checked}
                      onChange={() => onChange({ category: root.slug || root._id })}
                      style={{ accentColor: "var(--accent)" }}
                    />
                    <span>{root.name}</span>
                  </label>

                  {hasSubcats && (
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(e, root._id)}
                      className="p-1 text-stone hover:text-ink rounded"
                      style={{ background: "none", border: "none", cursor: "pointer" }}
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                </div>

                {/* Subcategories (L2) */}
                {hasSubcats && isExpanded && (
                  <div
                    style={{
                      paddingLeft: "1.25rem",
                      borderLeft: "1.5px solid var(--border)",
                      marginLeft: "0.5rem",
                      marginTop: "0.2rem",
                      marginBottom: "0.35rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.2rem",
                    }}
                  >
                    {root.children.map((sub) => {
                      const hasItems = sub.children && sub.children.length > 0;
                      const isSubExpanded = expandedCats.has(sub._id);
                      const subChecked = isSelected(sub);

                      return (
                        <div key={sub._id} className="flex flex-col">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "0.2rem 0",
                            }}
                          >
                            <label
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                color: subChecked ? "var(--accent)" : "var(--ink-muted)",
                                fontWeight: subChecked ? 700 : 400,
                                flex: 1,
                              }}
                            >
                              <input
                                type="radio"
                                name="cat-filter"
                                checked={subChecked}
                                onChange={() => onChange({ category: sub.slug || sub._id })}
                                style={{ accentColor: "var(--accent)" }}
                              />
                              <span>{sub.name}</span>
                            </label>

                            {hasItems && (
                              <button
                                type="button"
                                onClick={(e) => toggleExpand(e, sub._id)}
                                className="p-0.5 text-stone hover:text-ink rounded"
                                style={{ background: "none", border: "none", cursor: "pointer" }}
                              >
                                {isSubExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                              </button>
                            )}
                          </div>

                          {/* Items (L3) */}
                          {hasItems && isSubExpanded && (
                            <div
                              style={{
                                paddingLeft: "1rem",
                                borderLeft: "1px dashed var(--border)",
                                marginLeft: "0.4rem",
                                marginTop: "0.15rem",
                                marginBottom: "0.25rem",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.15rem",
                              }}
                            >
                              {sub.children.map((item) => {
                                const itemChecked = isSelected(item);
                                return (
                                  <label
                                    key={item._id}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.35rem",
                                      cursor: "pointer",
                                      fontSize: "0.6875rem",
                                      color: itemChecked ? "var(--accent)" : "var(--ink-muted)",
                                      fontWeight: itemChecked ? 600 : 400,
                                      padding: "0.15rem 0",
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      name="cat-filter"
                                      checked={itemChecked}
                                      onChange={() => onChange({ category: item.slug || item._id })}
                                      style={{ accentColor: "var(--accent)" }}
                                    />
                                    <span>{item.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1.25rem" }}>
        {sectionLabel("Price Range (₹)")}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))}
            onBlur={applyPrice}
            className="input-field"
            style={{ padding: "0.4rem 0.6rem", fontSize: "0.75rem" }}
          />
          <span style={{ color: "var(--ink-subtle)" }}>–</span>
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))}
            onBlur={applyPrice}
            className="input-field"
            style={{ padding: "0.4rem 0.6rem", fontSize: "0.75rem" }}
          />
        </div>
      </div>

      {/* Rating */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
        {sectionLabel("Customer Rating")}
        {[4, 3, 2].map((r) => (
          <label
            key={r}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              padding: "0.3rem 0",
              fontSize: "0.8125rem",
              color: String(filters.minRating) === String(r) ? "var(--ink)" : "var(--ink-muted)",
              fontWeight: String(filters.minRating) === String(r) ? 600 : 400,
            }}
          >
            <input
              type="radio"
              name="rating-filter"
              checked={String(filters.minRating) === String(r)}
              onChange={() => onChange({ minRating: r })}
              style={{ accentColor: "var(--accent)" }}
            />
            <span style={{ display: "flex", gap: "1px", color: "var(--accent)" }}>
              {Array.from({ length: r }).map((_, i) => (
                <Star key={i} size={12} fill="currentColor" />
              ))}
            </span>
            <span>{r}+ Stars</span>
          </label>
        ))}
      </div>
    </aside>
  );
};

export default FilterSidebar;