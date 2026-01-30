import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Progress value (0-100) */
  value?: number;
  /** Maximum value */
  max?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  /** Show percentage label */
  showLabel?: boolean;
  /** Label position */
  labelPosition?: 'inside' | 'outside' | 'top';
  /** Indeterminate loading state */
  indeterminate?: boolean;
  /** Striped animation */
  striped?: boolean;
  /** Animated stripes */
  animated?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    value = 0, 
    max = 100, 
    size = 'md', 
    variant = 'default',
    showLabel = false,
    labelPosition = 'outside',
    indeterminate = false,
    striped = false,
    animated = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeStyles = {
      sm: 'h-1.5',
      md: 'h-2.5',
      lg: 'h-4',
    };

    const variantStyles = {
      default: 'bg-primary',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
    };

    const stripedClass = striped ? 'bg-stripes' : '';
    const animatedClass = (animated && striped) ? 'animate-stripes' : '';

    return (
      <div className={cn("w-full", className)} ref={ref} {...props}>
        {showLabel && labelPosition === 'top' && (
          <div className="flex justify-between mb-1.5">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">{Math.round(percentage)}%</span>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <div 
            className={cn(
              "w-full bg-gray-200 rounded-full overflow-hidden",
              sizeStyles[size]
            )}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300 ease-out",
                variantStyles[variant],
                stripedClass,
                animatedClass,
                indeterminate && "animate-indeterminate w-1/3"
              )}
              style={!indeterminate ? { width: `${percentage}%` } : undefined}
            >
              {showLabel && labelPosition === 'inside' && size === 'lg' && (
                <span className="flex items-center justify-center h-full text-xs font-medium text-white">
                  {Math.round(percentage)}%
                </span>
              )}
            </div>
          </div>
          
          {showLabel && labelPosition === 'outside' && (
            <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-right">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    );
  }
);
Progress.displayName = "Progress";

// Circular progress variant
interface CircularProgressProps {
  value?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  showLabel?: boolean;
  className?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value = 0,
  max = 100,
  size = 48,
  strokeWidth = 4,
  variant = 'default',
  showLabel = false,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    default: '#4F46E5', // primary
    success: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444',
    info: '#3B82F6',
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={variantColors[variant]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-medium text-gray-700">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

export { Progress, CircularProgress };
