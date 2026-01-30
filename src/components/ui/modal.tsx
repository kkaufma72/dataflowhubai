import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal children */
  children: React.ReactNode;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether clicking overlay closes modal */
  closeOnOverlayClick?: boolean;
  /** Whether pressing Escape closes modal */
  closeOnEscape?: boolean;
  /** Additional className for modal container */
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
}) => {
  // Handle escape key
  React.useEffect(() => {
    if (!closeOnEscape || !open) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose, closeOnEscape]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Modal */}
      <div 
        className={cn(
          "relative w-full bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200",
          sizeStyles[size],
          className
        )}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
};

interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Header variant */
  variant?: 'default' | 'primary';
}

const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-gray-50 border-b border-gray-200',
      primary: 'bg-gradient-to-r from-primary to-primary-dark text-white',
    };

    return (
      <div
        ref={ref}
        className={cn(
          "px-6 py-5",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ModalHeader.displayName = "ModalHeader";

const ModalBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6 overflow-y-auto max-h-[60vh]", className)}
    {...props}
  />
));
ModalBody.displayName = "ModalBody";

const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200",
      className
    )}
    {...props}
  />
));
ModalFooter.displayName = "ModalFooter";

const ModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-xl font-semibold", className)}
    {...props}
  />
));
ModalTitle.displayName = "ModalTitle";

const ModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500 mt-1", className)}
    {...props}
  />
));
ModalDescription.displayName = "ModalDescription";

export { Modal, ModalHeader, ModalBody, ModalFooter, ModalTitle, ModalDescription };
