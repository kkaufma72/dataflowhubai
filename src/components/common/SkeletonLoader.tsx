import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface SkeletonLoaderProps {
  count?: number;
  height?: number | string;
  width?: number | string;
  circle?: boolean;
  className?: string;
  containerClassName?: string;
  inline?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  count = 1,
  height,
  width,
  circle = false,
  className = '',
  containerClassName = '',
  inline = false
}) => {
  return (
    <Skeleton
      count={count}
      height={height}
      width={width}
      circle={circle}
      className={className}
      containerClassName={containerClassName}
      inline={inline}
      baseColor="#f3f4f6" // Tailwind gray-100
      highlightColor="#e5e7eb" // Tailwind gray-200
    />
  );
};

// Predefined skeleton components for common use cases
export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
    <SkeletonLoader height={24} width="60%" className="mb-4" />
    <SkeletonLoader count={3} className="mb-2" />
    <div className="flex justify-between mt-4">
      <SkeletonLoader width={100} height={36} />
      <SkeletonLoader width={100} height={36} />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="overflow-x-auto">
    <div className="min-w-full divide-y divide-gray-200">
      <div className="bg-gray-50">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array(columns).fill(0).map((_, i) => (
            <div key={i} className="px-6 py-3">
              <SkeletonLoader height={20} />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white divide-y divide-gray-200">
        {Array(rows).fill(0).map((_, rowIdx) => (
          <div key={rowIdx} className="grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array(columns).fill(0).map((_, colIdx) => (
              <div key={colIdx} className="px-6 py-4">
                <SkeletonLoader height={20} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="flex flex-col items-center">
    <SkeletonLoader circle height={80} width={80} className="mb-4" />
    <SkeletonLoader width={150} height={24} className="mb-2" />
    <SkeletonLoader width={100} height={16} className="mb-4" />
    <SkeletonLoader count={3} width="80%" className="mb-2" />
  </div>
);

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <div style={{ height: `${height}px` }} className="w-full flex items-center justify-center bg-gray-50 rounded-lg">
    <div className="text-center">
      <SkeletonLoader height={height * 0.6} width="90%" className="mb-4" />
      <SkeletonLoader width={150} height={20} className="mx-auto" />
    </div>
  </div>
);

export const DashboardStatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {Array(4).fill(0).map((_, i) => (
      <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <SkeletonLoader width={100} height={16} className="mb-2" />
        <SkeletonLoader height={28} width={80} className="mb-1" />
        <SkeletonLoader width={120} height={16} />
      </div>
    ))}
  </div>
);

export default SkeletonLoader;