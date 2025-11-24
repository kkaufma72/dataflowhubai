import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'card' | 'table' | 'list' | 'chart' | 'text';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'card',
  count = 3,
  className = ''
}) => {
  if (variant === 'card') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
              
              {/* Content */}
              <div className="flex-1 space-y-3">
                {/* Title */}
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                
                {/* Description */}
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                
                {/* Stats */}
                <div className="flex gap-4 mt-4">
                  <div className="h-8 bg-gray-200 rounded w-20" />
                  <div className="h-8 bg-gray-200 rounded w-20" />
                  <div className="h-8 bg-gray-200 rounded w-20" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
        {/* Table Header */}
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <div className="flex gap-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
        
        {/* Table Rows */}
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="border-b border-gray-200 p-4 animate-pulse"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="flex gap-4">
              <div className="h-3 bg-gray-200 rounded w-1/4" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 animate-pulse"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            {/* Avatar */}
            <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
            
            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-2 bg-gray-200 rounded w-1/2" />
            </div>
            
            {/* Action */}
            <div className="w-16 h-8 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          {/* Chart Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-5 bg-gray-200 rounded w-1/4" />
            <div className="h-8 bg-gray-200 rounded w-24" />
          </div>
          
          {/* Chart Bars */}
          <div className="flex items-end gap-4 h-48">
            {Array.from({ length: 7 }).map((_, idx) => (
              <div
                key={idx}
                className="flex-1 bg-gray-200 rounded-t"
                style={{
                  height: `${Math.random() * 80 + 20}%`,
                  animationDelay: `${idx * 0.1}s`
                }}
              />
            ))}
          </div>
          
          {/* Chart Labels */}
          <div className="flex gap-4 mt-4">
            {Array.from({ length: 7 }).map((_, idx) => (
              <div key={idx} className="flex-1 h-3 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default LoadingSkeleton;
