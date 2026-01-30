import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Textarea variant style */
  variant?: 'default' | 'error';
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Show character count */
  showCount?: boolean;
  /** Maximum character count */
  maxLength?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'default', error, helperText, showCount, maxLength, value, ...props }, ref) => {
    const computedVariant = error ? 'error' : variant;
    const characterCount = typeof value === 'string' ? value.length : 0;
    
    const variantStyles = {
      default: "border-input focus-visible:ring-primary focus-visible:border-primary",
      error: "border-red-300 focus-visible:ring-red-500 focus-visible:border-red-500",
    };

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          value={value}
          maxLength={maxLength}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y transition-colors",
            variantStyles[computedVariant],
            className
          )}
          {...props}
        />
        <div className="mt-1.5 flex justify-between">
          {(error || helperText) && (
            <p className={cn(
              "text-xs",
              error ? "text-red-600" : "text-gray-500"
            )}>
              {error || helperText}
            </p>
          )}
          {showCount && maxLength && (
            <p className={cn(
              "text-xs ml-auto",
              characterCount >= maxLength ? "text-red-600" : "text-gray-400"
            )}>
              {characterCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
