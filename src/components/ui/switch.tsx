import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Label text */
  label?: string;
  /** Description text */
  description?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, size = 'md', checked, ...props }, ref) => {
    const sizeStyles = {
      sm: {
        track: 'h-5 w-9',
        thumb: 'h-4 w-4',
        translate: 'translate-x-4',
      },
      md: {
        track: 'h-6 w-11',
        thumb: 'h-5 w-5',
        translate: 'translate-x-5',
      },
      lg: {
        track: 'h-7 w-14',
        thumb: 'h-6 w-6',
        translate: 'translate-x-7',
      },
    };

    const styles = sizeStyles[size];

    return (
      <label className={cn("flex items-start gap-3 cursor-pointer group", className)}>
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            role="switch"
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div className={cn(
            "shrink-0 rounded-full transition-colors duration-200",
            styles.track,
            "bg-gray-200 peer-checked:bg-primary",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            "group-hover:bg-gray-300 peer-checked:group-hover:bg-primary-dark"
          )}>
            <div className={cn(
              "rounded-full bg-white shadow-sm transition-transform duration-200",
              styles.thumb,
              "translate-x-0.5 peer-checked:translate-x-0",
              checked ? styles.translate : ''
            )} 
            style={{ 
              marginTop: '0.125rem',
              transform: checked ? `translateX(calc(${styles.track.split(' ')[1]} - ${styles.thumb.split(' ')[1]} - 0.25rem))` : 'translateX(0.125rem)'
            }}
            />
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-medium text-gray-900 leading-none">
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
Switch.displayName = "Switch";

export { Switch };
