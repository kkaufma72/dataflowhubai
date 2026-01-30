import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Select variant style */
  variant?: 'default' | 'error';
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
}

// Native Select component for simple use cases
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant = 'default', error, helperText, children, ...props }, ref) => {
    const computedVariant = error ? 'error' : variant;
    
    const variantStyles = {
      default: "border-input focus:ring-primary focus:border-primary",
      error: "border-red-300 focus:ring-red-500 focus:border-red-500",
    };

    return (
      <div className="w-full">
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "flex h-10 w-full appearance-none rounded-lg border bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer",
              variantStyles[computedVariant],
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {(error || helperText) && (
          <p className={cn(
            "mt-1.5 text-xs",
            error ? "text-red-600" : "text-gray-500"
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

// Styled Select sub-components for custom dropdown (shadcn-style)
interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

interface SelectRootProps {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const SelectRoot: React.FC<SelectRootProps> = ({ 
  children, 
  value: controlledValue, 
  defaultValue = '', 
  onValueChange 
}) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  
  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;
  
  const handleValueChange = React.useCallback((newValue: string) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(newValue);
    }
    onValueChange?.(newValue);
    setOpen(false);
  }, [controlledValue, onValueChange]);

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { placeholder?: string }
>(({ className, children, placeholder, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectTrigger must be used within Select");
  
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => context.setOpen(!context.open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children || <span className="text-gray-400">{placeholder || 'Select...'}</span>}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectValue must be used within Select");
  
  return (
    <span className={context.value ? "" : "text-gray-400"}>
      {context.value || placeholder || 'Select...'}
    </span>
  );
};

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectContent must be used within Select");
  
  if (!context.open) return null;
  
  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
SelectContent.displayName = "SelectContent";

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectItem must be used within Select");
    
    const isSelected = context.value === value;
    
    return (
      <div
        ref={ref}
        onClick={() => context.onValueChange(value)}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          isSelected && "bg-primary/10 text-primary font-medium",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

export { 
  Select, 
  SelectRoot as SelectProvider,
  SelectTrigger, 
  SelectContent, 
  SelectItem, 
  SelectValue 
};
