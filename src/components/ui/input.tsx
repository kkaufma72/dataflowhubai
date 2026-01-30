import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input variant style */
  variant?: 'default' | 'error' | 'success';
  /** Left icon element */
  leftIcon?: React.ReactNode;
  /** Right icon element */
  rightIcon?: React.ReactNode;
  /** Helper text below input */
  helperText?: string;
  /** Error message */
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', leftIcon, rightIcon, helperText, error, ...props }, ref) => {
    const baseStyles = "flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors";
    
    const variantStyles = {
      default: "border-input focus-visible:ring-primary focus-visible:border-primary",
      error: "border-red-300 focus-visible:ring-red-500 focus-visible:border-red-500 text-red-900 placeholder:text-red-400",
      success: "border-green-300 focus-visible:ring-green-500 focus-visible:border-green-500",
    };

    const computedVariant = error ? 'error' : variant;

    return (
      <div className="w-full">
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              baseStyles,
              variantStyles[computedVariant],
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p className={cn(
            "mt-1.5 text-xs",
            error ? "text-red-600" : "text-gray-500"
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
