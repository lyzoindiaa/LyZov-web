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
