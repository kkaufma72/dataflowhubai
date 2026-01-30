import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Animation type */
  animation?: 'pulse' | 'shimmer' | 'none';
  /** Skeleton variant */
  variant?: 'default' | 'circular' | 'text';
  /** Width */
  width?: string | number;
  /** Height */
  height?: string | number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, animation = 'pulse', variant = 'default', width, height, style, ...props }, ref) => {
    const animationStyles = {
      pulse: 'animate-pulse',
      shimmer: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
      none: '',
    };

    const variantStyles = {
      default: 'rounded-md',
      circular: 'rounded-full',
      text: 'rounded h-4 w-full',
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-gray-200",
          animationStyles[animation],
          variantStyles[variant],
          className
        )}
        style={{
          width: width,
          height: height,
          ...style,
        }}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

// Pre-built skeleton patterns
const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className 
}) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i} 
        variant="text" 
        className={i === lines - 1 ? "w-3/4" : "w-full"} 
      />
    ))}
  </div>
);

const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("rounded-xl border bg-white p-6 space-y-4", className)}>
    <div className="flex items-center gap-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="space-y-2 flex-1">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
);

const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({ 
  rows = 5, 
  columns = 4,
  className 
}) => (
  <div className={cn("space-y-3", className)}>
    {/* Header */}
    <div className="flex gap-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-6 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex gap-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-10 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable };
