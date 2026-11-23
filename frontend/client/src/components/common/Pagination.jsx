import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * Reusable, responsive pagination component matching LyZov luxury design tokens.
 *
 * @param {number} page - Current active page (1-based)
 * @param {number} totalPages - Total number of pages
 * @param {number} total - Total item count across all pages (optional)
 * @param {number} limit - Items per page (optional)
 * @param {function} onPageChange - Callback when a page is selected: (newPage) => void
 * @param {function} [onLimitChange] - Optional callback to change page size: (newLimit) => void
 * @param {number[]} [limitOptions=[10, 20, 50]] - Available page sizes
 * @param {string} [itemLabel="items"] - Plural noun for items (e.g. "products", "orders")
 * @param {boolean} [showLimitSelector=false] - Whether to show the items-per-page dropdown
 */
const Pagination = ({
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50],
  itemLabel = "items",
  showLimitSelector = false,
  className = "",
}) => {
  if (totalPages <= 1 && total <= limit && !showLimitSelector) {
    return null;
  }

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = total > 0 ? Math.min(page * limit, total) : 0;

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-2 text-xs border-t border-[var(--border)] ${className}`}
    >
      {/* Item summary info */}
      <div className="text-[var(--ink-muted)] font-medium text-center sm:text-left">
        {total > 0 ? (
          <>
            Showing <span className="font-bold text-[var(--ink)]">{startItem}</span> to{" "}
            <span className="font-bold text-[var(--ink)]">{endItem}</span> of{" "}
            <span className="font-bold text-[var(--ink)]">{total}</span> {itemLabel}
          </>
        ) : (
          <>
            Page <span className="font-bold text-[var(--ink)]">{page}</span> of{" "}
            <span className="font-bold text-[var(--ink)]">{totalPages}</span>
          </>
        )}
      </div>

      {/* Controls & Page buttons */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {/* Optional Limit Selector */}
        {showLimitSelector && onLimitChange && (
          <div className="flex items-center gap-1.5 mr-2 text-[var(--ink-muted)]">
            <span>Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* First page button */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          aria-label="First page"
          title="First page"
          className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--border)]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft size={15} />
        </button>

        {/* Previous page button */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          title="Previous page"
          className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--border)]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Numeric page buttons */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-[var(--ink-muted)] font-semibold select-none">
                …
              </span>
            ) : (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={`min-w-[2rem] h-8 px-2.5 rounded-lg text-xs font-bold transition-all ${
                  p === page
                    ? "bg-[var(--accent)] text-white shadow-xs"
                    : "border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--border)]/25"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next page button */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          title="Next page"
          className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--border)]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={15} />
        </button>

        {/* Last page button */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          aria-label="Last page"
          title="Last page"
          className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--border)]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight size={15} />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
