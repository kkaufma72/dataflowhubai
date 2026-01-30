import * as React from "react";
import { cn } from "@/lib/utils";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum height for the scroll area */
  maxHeight?: string | number;
  /** Whether to show scrollbar always or only on hover */
  scrollbarVisibility?: 'auto' | 'always' | 'hover';
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, maxHeight, scrollbarVisibility = 'auto', style, ...props }, ref) => {
    const scrollbarStyles = {
      auto: '',
      always: 'scrollbar-always',
      hover: 'scrollbar-hover',
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-auto",
          scrollbarStyles[scrollbarVisibility],
          className
        )}
        style={{
          maxHeight: maxHeight,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
