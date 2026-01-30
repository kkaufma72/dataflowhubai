import * as React from "react";
import { cn } from "@/lib/utils";

// Simple Popover implementation with accessibility
interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerId: string;
  contentId: string;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Popover: React.FC<PopoverProps> = ({ 
  children, 
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange 
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const triggerId = React.useId();
  const contentId = React.useId();

  const setOpen = React.useCallback((value: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(value);
    }
    onOpenChange?.(value);
  }, [controlledOpen, onOpenChange]);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    
    const handleClick = () => setOpen(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [open, setOpen]);
  
  // Close on Escape key
  React.useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerId, contentId }}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, asChild, onClick, ...props }, ref) => {
  const context = React.useContext(PopoverContext);
  if (!context) throw new Error("PopoverTrigger must be used within Popover");

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    context.setOpen(!context.open);
    onClick?.(e);
  };
  
  const accessibilityProps = {
    'aria-expanded': context.open,
    'aria-haspopup': 'dialog' as const,
    'aria-controls': context.open ? context.contentId : undefined,
    id: context.triggerId,
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        context.setOpen(!context.open);
      },
      ...accessibilityProps,
    });
  }

  return (
    <button ref={ref} onClick={handleClick} {...accessibilityProps} {...props}>
      {children}
    </button>
  );
});
PopoverTrigger.displayName = "PopoverTrigger";

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = 'center', side = 'bottom', sideOffset = 4, children, onClick, ...props }, ref) => {
    const context = React.useContext(PopoverContext);
    const contentRef = React.useRef<HTMLDivElement>(null);
    if (!context) throw new Error("PopoverContent must be used within Popover");

    // Auto-focus content when opened
    React.useEffect(() => {
      if (context.open && contentRef.current) {
        // Focus first focusable element or the content itself
        const focusable = contentRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) {
          focusable.focus();
        } else {
          contentRef.current.focus();
        }
      }
    }, [context.open]);

    if (!context.open) return null;

    const alignStyles = {
      start: 'left-0',
      center: 'left-1/2 -translate-x-1/2',
      end: 'right-0',
    };

    // Use inline styles for sideOffset to avoid Tailwind purging dynamic classes
    const sideConfig = {
      top: {
        className: 'bottom-full',
        style: { marginBottom: `${sideOffset * 4}px` },
      },
      bottom: {
        className: 'top-full',
        style: { marginTop: `${sideOffset * 4}px` },
      },
      left: {
        className: 'right-full top-0',
        style: { marginRight: `${sideOffset * 4}px` },
      },
      right: {
        className: 'left-full top-0',
        style: { marginLeft: `${sideOffset * 4}px` },
      },
    };

    const { className: sideClassName, style: sideStyle } = sideConfig[side];

    return (
      <div
        ref={(node) => {
          // Handle both refs
          (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={context.triggerId}
        id={context.contentId}
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
        className={cn(
          "absolute z-50 min-w-[8rem] overflow-hidden rounded-lg border bg-white p-4 shadow-lg animate-in fade-in-0 zoom-in-95 focus:outline-none",
          sideClassName,
          (side === 'top' || side === 'bottom') && alignStyles[align],
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
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
