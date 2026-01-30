import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label text */
  label?: string;
  /** Description text */
  description?: string;
  /** Indeterminate state */
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, indeterminate, checked, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    React.useImperativeHandle(ref, () => inputRef.current!, []);
    
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate ?? false;
      }
    }, [indeterminate]);

    return (
      <label className={cn("flex items-start gap-3 cursor-pointer group", className)}>
        <div className="relative flex items-center justify-center">
          <input
            ref={inputRef}
            type="checkbox"
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div className={cn(
            "h-5 w-5 shrink-0 rounded border-2 ring-offset-background transition-all",
            "border-gray-300 bg-white",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            "peer-checked:border-primary peer-checked:bg-primary",
            "group-hover:border-primary/70"
          )}>
            {checked && (
              <Check className="h-4 w-4 text-white absolute top-0.5 left-0.5" strokeWidth={3} />
            )}
            {indeterminate && !checked && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-0.5 bg-primary rounded-full" />
            )}
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-medium text-gray-900 leading-none peer-disabled:opacity-70">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-gray-500 mt-1">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
