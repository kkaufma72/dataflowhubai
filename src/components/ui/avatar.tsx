import * as React from "react";
import { cn } from "@/lib/utils";

// Avatar components
interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizeStyles = {
      xs: 'h-6 w-6',
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16',
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full",
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Avatar.displayName = "Avatar";

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, alt, ...props }, ref) => (
    <img
      ref={ref}
      alt={alt}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  )
);
AvatarImage.displayName = "AvatarImage";

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
AvatarFallback.displayName = "AvatarFallback";

// Avatar Group for displaying multiple avatars
interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, children, max = 4, size = 'md', ...props }, ref) => {
    const items = React.Children.toArray(children);
    const visible = items.slice(0, max);
    const remaining = items.length - max;

    const sizeStyles = {
      xs: 'h-6 w-6 text-[10px]',
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg',
    };

    return (
      <div
        ref={ref}
        className={cn("flex -space-x-2", className)}
        {...props}
      >
        {visible.map((child, index) => (
          <div 
            key={index} 
            className="ring-2 ring-white rounded-full"
            style={{ zIndex: visible.length - index }}
          >
            {child}
          </div>
        ))}
        {remaining > 0 && (
          <div 
            className={cn(
              "flex items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium ring-2 ring-white",
              sizeStyles[size]
            )}
            style={{ zIndex: 0 }}
          >
            +{remaining}
          </div>
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = "AvatarGroup";

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup };
