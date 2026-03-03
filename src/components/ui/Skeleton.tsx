interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div
      className={`skeleton-pulse bg-ring-bg ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonRings() {
  return (
    <div className="flex items-center gap-8">
      <Skeleton variant="circular" width={180} height={180} />
      <div className="flex-1 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" variant="rectangular" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonSessionRow() {
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-5 items-center">
      <div className="col-span-4 flex items-center gap-3">
        <Skeleton variant="rectangular" width={36} height={36} />
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" />
          <Skeleton width="40%" className="h-3" />
        </div>
      </div>
      <div className="col-span-4">
        <Skeleton width="60%" className="h-7" variant="rectangular" />
      </div>
      <div className="col-span-2">
        <Skeleton width="80%" />
      </div>
      <div className="col-span-2 flex justify-end gap-2">
        <Skeleton width={60} className="h-7" variant="rectangular" />
        <Skeleton width={70} className="h-7" variant="rectangular" />
      </div>
    </div>
  );
}
