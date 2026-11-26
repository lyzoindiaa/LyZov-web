export const ProductCardSkeleton = () => (
  <div className="card-surface p-2.5 sm:p-4 flex flex-col gap-3 rounded-2xl">
    <div className="skeleton aspect-square w-full rounded-xl" />
    <div className="skeleton h-3 w-1/4 rounded-full mt-1" />
    <div className="skeleton h-4 w-3/4 rounded-full" />
    <div className="skeleton h-3.5 w-1/2 rounded-full" />
  </div>
);

export const ProductGridSkeleton = ({ count = 8, columns, hasSidebar = false }) => {
  const gridClasses = columns
    ? columns === 3
      ? "grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-3"
      : "grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
    : hasSidebar
    ? "grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
    : "grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5";

  return (
    <div className={gridClasses}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const ProductDetailsSkeleton = () => (
  <div className="container-page grid grid-cols-1 gap-10 py-10 lg:grid-cols-2 lg:gap-16 lg:py-16">
    <div className="skeleton aspect-square w-full rounded-2xl" />
    <div className="flex flex-col gap-4">
      <div className="skeleton h-4 w-24 rounded-full" />
      <div className="skeleton h-9 w-4/5 rounded-lg" />
      <div className="skeleton h-6 w-32 rounded-full" />
      <div className="skeleton mt-4 h-24 w-full rounded-lg" />
      <div className="skeleton h-12 w-full rounded-full" />
    </div>
  </div>
);

export const OutletContentSkeleton = ({ variant = "storefront" }) => (
  <div
    className={variant === "storefront" ? "container-page py-8 lg:py-12 space-y-6" : "space-y-6"}
    aria-busy="true"
    aria-label="Loading page content"
  >
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="space-y-2">
        <div className="skeleton h-7 w-52 rounded-lg" />
        <div className="skeleton h-3.5 w-72 max-w-full rounded-full" />
      </div>
      <div className="skeleton h-9 w-36 rounded-xl" />
    </div>
    <div className="card-surface p-5 sm:p-6 space-y-4">
      <div className="skeleton h-10 w-full rounded-xl" />
      <div className="skeleton h-12 w-full rounded-xl" />
      <div className="skeleton h-12 w-full rounded-xl" />
      <div className="skeleton h-12 w-4/5 rounded-xl" />
    </div>
  </div>
);

export const AuthBootstrapFallback = ({ message = "Preparing your workspace..." }) => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg)",
      color: "var(--ink)",
    }}
    aria-busy="true"
  >
    {/* Header Shell */}
    <header
      style={{
        height: "4.25rem",
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="container-page flex items-center justify-between gap-4">
        <span
          style={{
            fontWeight: 800,
            fontSize: "1.25rem",
            letterSpacing: "-0.03em",
            color: "var(--ink)",
          }}
        >
          Ly<span style={{ color: "var(--accent)" }}>Zov</span>
        </span>
        <div className="flex items-center gap-3">
          <div className="skeleton h-3.5 w-16 rounded-full hidden sm:block" />
          <div className="skeleton h-3.5 w-16 rounded-full hidden sm:block" />
          <div className="skeleton h-8 w-8 rounded-full" />
        </div>
      </div>
    </header>

    {/* Main Content Skeleton */}
    <main className="flex-1">
      <div className="container-page py-8 lg:py-10 space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="animate-spin shrink-0"
            style={{
              width: "1.25rem",
              height: "1.25rem",
              borderRadius: "9999px",
              border: "2px solid var(--border)",
              borderTopColor: "var(--accent)",
            }}
          />
          {message && (
            <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", fontWeight: 500 }}>
              {message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 w-full rounded-xl" />
          ))}
        </div>
        <div className="card-surface p-5 sm:p-6 space-y-4">
          <div className="skeleton h-9 w-full rounded-xl" />
          <div className="skeleton h-12 w-full rounded-xl" />
          <div className="skeleton h-12 w-5/6 rounded-xl" />
        </div>
      </div>
    </main>

    {/* Footer Shell */}
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        backgroundColor: "var(--bg-subtle)",
        padding: "1.25rem 0",
        color: "var(--ink-muted)",
        fontSize: "0.75rem",
      }}
    >
      <div className="container-page flex flex-wrap items-center justify-between gap-2">
        <span>LyZov — India&apos;s Trusted Online Shopping Platform</span>
        <span>Secure &amp; Quality-Checked</span>
      </div>
    </footer>
  </div>
);
