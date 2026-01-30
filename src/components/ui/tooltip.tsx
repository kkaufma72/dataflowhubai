import * as React from "react";
import { cn } from "@/lib/utils";

// Simple Tooltip implementation
// For full functionality, consider using @radix-ui/react-tooltip

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

// Provider for tooltip delay settings
interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

const TooltipProvider: React.FC<TooltipProviderProps> = ({ children }) => {
  return <>{children}</>;
};

// Tooltip wrapper
interface TooltipProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange 
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback((value: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(value);
    }
    onOpenChange?.(value);
  }, [controlledOpen, onOpenChange]);

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </TooltipContext.Provider>
  );
};

// Tooltip trigger
const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ children, asChild, ...props }, ref) => {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error("TooltipTrigger must be used within Tooltip");

  const tooltipId = React.useId();

  const handleMouseEnter = () => context.setOpen(true);
  const handleMouseLeave = () => context.setOpen(false);
  const handleFocus = () => context.setOpen(true);
  const handleBlur = () => context.setOpen(false);
  
  // Handle keyboard - Escape to close
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && context.open) {
      context.setOpen(false);
    }
  };

  const accessibilityProps = {
    'aria-describedby': context.open ? tooltipId : undefined,
    tabIndex: 0,
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      ...accessibilityProps,
    });
  }

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      {...accessibilityProps}
      {...props}
    >
      {children}
    </div>
  );
});
TooltipTrigger.displayName = "TooltipTrigger";

// Tooltip content
interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = 'top', sideOffset = 4, children, ...props }, ref) => {
    const context = React.useContext(TooltipContext);
    if (!context) throw new Error("TooltipContent must be used within Tooltip");

    if (!context.open) return null;

    // Use inline styles for sideOffset to avoid Tailwind purging dynamic classes
    const sideConfig = {
      top: {
        className: 'bottom-full left-1/2 -translate-x-1/2',
        style: { marginBottom: `${sideOffset * 4}px` },
      },
      bottom: {
        className: 'top-full left-1/2 -translate-x-1/2',
        style: { marginTop: `${sideOffset * 4}px` },
      },
      left: {
        className: 'right-full top-1/2 -translate-y-1/2',
        style: { marginRight: `${sideOffset * 4}px` },
      },
      right: {
        className: 'left-full top-1/2 -translate-y-1/2',
        style: { marginLeft: `${sideOffset * 4}px` },
      },
    };

    const { className: sideClassName, style: sideStyle } = sideConfig[side];

    return (
      <div
        ref={ref}
        role="tooltip"
        id={React.useId()}
        className={cn(
          "absolute z-50 overflow-hidden rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95",
          sideClassName,
          className
        )}
        style={sideStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
