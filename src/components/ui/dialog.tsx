import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

// Simple Dialog implementation with full accessibility
// For additional functionality, consider using @radix-ui/react-dialog

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Dialog: React.FC<DialogProps> = ({ 
  children, 
  open: controlledOpen, 
  defaultOpen = false,
  onOpenChange 
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const titleId = React.useId();
  const descriptionId = React.useId();
  
  const handleOpenChange = React.useCallback((value: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(value);
    }
    onOpenChange?.(value);
  }, [controlledOpen, onOpenChange]);

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange, titleId, descriptionId }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, asChild, onClick, ...props }, ref) => {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("DialogTrigger must be used within Dialog");

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context.onOpenChange(true);
    onClick?.(e);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
    });
  }

  return (
    <button ref={ref} onClick={handleClick} {...props}>
      {children}
    </button>
  );
});
DialogTrigger.displayName = "DialogTrigger";

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(DialogContext);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);
  
  if (!context) throw new Error("DialogContent must be used within Dialog");

  // Handle Escape key
  React.useEffect(() => {
    if (!context.open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        context.onOpenChange(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [context.open, context.onOpenChange]);

  // Focus trap and body scroll lock
  React.useEffect(() => {
    if (!context.open) return;
    
    // Store current active element
    previousActiveElement.current = document.activeElement as HTMLElement;
    
    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // Focus first focusable element
    requestAnimationFrame(() => {
      if (contentRef.current) {
        const focusable = contentRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) {
          focusable.focus();
        } else {
          contentRef.current.focus();
        }
      }
    });
    
    return () => {
      document.body.style.overflow = originalOverflow;
      // Restore focus
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [context.open]);

  // Focus trap: keep focus inside dialog
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !contentRef.current) return;
    
    const focusableElements = contentRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  if (!context.open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={() => context.onOpenChange(false)}
        aria-hidden="true"
      />
      {/* Content */}
      <div
        ref={(node) => {
          (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={context.titleId}
        aria-describedby={context.descriptionId}
        tabIndex={-1}
        className={cn(
          "relative z-50 w-full max-w-lg bg-white rounded-xl shadow-xl p-6",
          "animate-in fade-in-0 zoom-in-95 focus:outline-none",
          className
        )}
        {...props}
      >
        {children}
        {/* Close button */}
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </div>
    </div>
  );
});
DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}
    {...props}
  />
));
DialogHeader.displayName = "DialogHeader";

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)}
    {...props}
  />
));
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const context = React.useContext(DialogContext);
  
  return (
    <h2
      ref={ref}
      id={context?.titleId}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
});
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const context = React.useContext(DialogContext);
  
  return (
    <p
      ref={ref}
      id={context?.descriptionId}
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  );
});
DialogDescription.displayName = "DialogDescription";

const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("DialogClose must be used within Dialog");

  return (
    <button
      ref={ref}
      onClick={(e) => {
        context.onOpenChange(false);
        onClick?.(e);
      }}
      {...props}
    />
  );
});
DialogClose.displayName = "DialogClose";

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
