import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

// Production-ready Dropdown Menu implementation
// Features: keyboard navigation, focus management, accessibility
interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ 
  children, 
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange 
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback((value: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(value);
    }
    onOpenChange?.(value);
    if (!value) {
      setActiveIndex(-1);
    }
  }, [controlledOpen, onOpenChange]);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    
    const handleClick = (e: MouseEvent) => {
      // Only close if click is outside the dropdown
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    
    // Close on escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, setOpen]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, activeIndex, setActiveIndex, triggerRef }}>
      <div className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, asChild, onClick, ...props }, ref) => {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuTrigger must be used within DropdownMenu");

  // Merge refs
  const mergedRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
      (context.triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    },
    [ref, context.triggerRef]
  );

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    context.setOpen(!context.open);
    onClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      context.setOpen(true);
      context.setActiveIndex(0);
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: mergedRef,
      'aria-haspopup': 'menu',
      'aria-expanded': context.open,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        context.setOpen(!context.open);
      },
      onKeyDown: handleKeyDown,
    });
  }

  return (
    <button 
      ref={mergedRef} 
      onClick={handleClick} 
      onKeyDown={handleKeyDown}
      aria-haspopup="menu"
      aria-expanded={context.open}
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = 'start', sideOffset = 4, children, onClick, ...props }, ref) => {
    const context = React.useContext(DropdownMenuContext);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const itemsRef = React.useRef<HTMLDivElement[]>([]);
    
    if (!context) throw new Error("DropdownMenuContent must be used within DropdownMenu");

    // Register items for keyboard navigation
    React.useEffect(() => {
      if (!context.open || !contentRef.current) return;
      itemsRef.current = Array.from(
        contentRef.current.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])')
      ) as HTMLDivElement[];
    }, [context.open, children]);

    // Focus active item
    React.useEffect(() => {
      if (context.activeIndex >= 0 && itemsRef.current[context.activeIndex]) {
        itemsRef.current[context.activeIndex].focus();
      }
    }, [context.activeIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      const itemCount = itemsRef.current.length;
      if (itemCount === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          context.setActiveIndex((context.activeIndex + 1) % itemCount);
          break;
        case 'ArrowUp':
          e.preventDefault();
          context.setActiveIndex((context.activeIndex - 1 + itemCount) % itemCount);
          break;
        case 'Home':
          e.preventDefault();
          context.setActiveIndex(0);
          break;
        case 'End':
          e.preventDefault();
          context.setActiveIndex(itemCount - 1);
          break;
        case 'Tab':
          context.setOpen(false);
          break;
      }
    };

    if (!context.open) return null;

    const alignStyles = {
      start: 'left-0',
      center: 'left-1/2 -translate-x-1/2',
      end: 'right-0',
    };

    return (
      <div
        ref={(node) => {
          contentRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "absolute z-50 min-w-[8rem] overflow-hidden rounded-lg border bg-white p-1 shadow-lg top-full animate-in fade-in-0 zoom-in-95",
          alignStyles[align],
          className
        )}
        style={{ marginTop: sideOffset }}
        role="menu"
        aria-orientation="vertical"
        tabIndex={-1}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuContent.displayName = "DropdownMenuContent";

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
  onSelect?: () => void;
}

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, disabled, onSelect, onClick, children, ...props }, ref) => {
    const context = React.useContext(DropdownMenuContext);
    
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      onSelect?.();
      onClick?.(e);
      context?.setOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect?.();
        context?.setOpen(false);
      }
    };

    return (
      <div
        ref={ref}
        role="menuitem"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors",
          disabled 
            ? "pointer-events-none opacity-50 cursor-not-allowed" 
            : "hover:bg-gray-100 focus:bg-primary/10 focus:text-primary",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gray-200", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold text-gray-900", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

interface DropdownMenuCheckboxItemProps extends DropdownMenuItemProps {
  checked?: boolean;
}

const DropdownMenuCheckboxItem = React.forwardRef<HTMLDivElement, DropdownMenuCheckboxItemProps>(
  ({ className, children, checked, ...props }, ref) => (
    <DropdownMenuItem
      ref={ref}
      className={cn("pl-8 pr-2", className)}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <Check className="h-4 w-4" />}
      </span>
      {children}
    </DropdownMenuItem>
  )
);
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
};
