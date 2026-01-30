import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color variant */
  variant?: 'default' | 'primary' | 'white';
  /** Loading text */
  label?: string;
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', variant = 'default', label, ...props }, ref) => {
    const sizeStyles = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    };

    const variantStyles = {
      default: 'text-gray-600',
      primary: 'text-primary',
      white: 'text-white',
    };

    return (
      <div
        ref={ref}
        role="status"
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        <Loader2 
          className={cn(
            "animate-spin",
            sizeStyles[size],
            variantStyles[variant]
          )} 
        />
        {label && (
          <span className={cn(
            "text-sm",
            variant === 'white' ? 'text-white' : 'text-gray-600'
          )}>
            {label}
          </span>
        )}
        <span className="sr-only">{label || 'Loading...'}</span>
      </div>
    );
  }
);
Spinner.displayName = "Spinner";

// Full-page loading overlay
const LoadingOverlay: React.FC<{
  visible?: boolean;
  label?: string;
  className?: string;
}> = ({ visible = true, label = 'Loading...', className }) => {
  if (!visible) return null;
  
  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm",
      className
    )}>
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" variant="primary" />
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
    </div>
  );
};

// Inline loading state for buttons/containers
const LoadingInline: React.FC<{
  className?: string;
}> = ({ className }) => (
  <div className={cn("flex items-center justify-center py-8", className)}>
    <Spinner size="lg" variant="primary" label="Loading..." />
  </div>
);

export { Spinner, LoadingOverlay, LoadingInline };
