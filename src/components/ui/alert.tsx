import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        info: "border-blue-200 bg-blue-50 text-blue-900 [&>svg]:text-blue-600",
        success: "border-green-200 bg-green-50 text-green-900 [&>svg]:text-green-600",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-900 [&>svg]:text-yellow-600",
        error: "border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-600",
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

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** Show icon */
  showIcon?: boolean;
  /** Dismissible alert */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', showIcon = true, dismissible, onDismiss, children, ...props }, ref) => {
    const Icon = iconMap[variant || 'default'];
    
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start gap-3">
          {showIcon && (
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            {children}
          </div>
          {dismissible && (
            <button
              onClick={onDismiss}
              className="shrink-0 rounded-md p-1 hover:bg-black/5 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, alertVariants };
