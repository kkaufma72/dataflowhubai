import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Whether the field is required */
  required?: boolean;
  /** Whether to show the optional indicator */
  optional?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, optional, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
        {optional && <span className="text-gray-400 ml-1 font-normal">(optional)</span>}
      </label>
    );
  }
);
Label.displayName = "Label";

export { Label };
