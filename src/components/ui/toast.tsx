import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

const toastVariants = cva(
  "pointer-events-auto relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-lg border p-4 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "bg-background border-border text-foreground",
        success: "bg-green-50 border-green-200 text-green-900",
        error: "bg-red-50 border-red-200 text-red-900",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
        info: "bg-blue-50 border-blue-200 text-blue-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconMap = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  /** Toast title */
  title?: string;
  /** Toast description */
  description?: string;
  /** Show icon */
  showIcon?: boolean;
  /** Callback when closed */
  onClose?: () => void;
  /** Action element */
  action?: React.ReactNode;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = 'default', title, description, showIcon = true, onClose, action, ...props }, ref) => {
    const Icon = iconMap[variant || 'default'];
    
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(toastVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start gap-3 flex-1">
          {showIcon && (
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <p className="font-semibold text-sm">{title}</p>
            )}
            {description && (
              <p className="text-sm opacity-90 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1 hover:bg-black/5 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
Toast.displayName = "Toast";

export { Toast, toastVariants };
