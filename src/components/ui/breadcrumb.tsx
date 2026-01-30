import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

// Breadcrumb components
interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  separator?: React.ReactNode;
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, separator, children, ...props }, ref) => {
    const items = React.Children.toArray(children);
    const separatorElement = separator || <ChevronRight className="h-4 w-4 text-gray-400" />;

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn("flex items-center", className)}
        {...props}
      >
        <ol className="flex items-center gap-1.5">
          {items.map((child, index) => (
            <React.Fragment key={index}>
              <li className="flex items-center gap-1.5">
                {child}
              </li>
              {index < items.length - 1 && (
                <li className="flex items-center" aria-hidden="true">
                  {separatorElement}
                </li>
              )}
            </React.Fragment>
          ))}
        </ol>
      </nav>
    );
  }
);
Breadcrumb.displayName = "Breadcrumb";

interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLSpanElement> {
  isCurrentPage?: boolean;
}

const BreadcrumbItem = React.forwardRef<HTMLSpanElement, BreadcrumbItemProps>(
  ({ className, isCurrentPage, children, ...props }, ref) => (
    <span
      ref={ref}
      aria-current={isCurrentPage ? "page" : undefined}
      className={cn(
        "text-sm",
        isCurrentPage 
          ? "font-medium text-gray-900" 
          : "text-gray-500",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
);
BreadcrumbItem.displayName = "BreadcrumbItem";

interface BreadcrumbLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {}

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        "text-sm text-gray-500 hover:text-gray-900 transition-colors",
        className
      )}
      {...props}
    />
  )
);
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("text-sm font-medium text-gray-900", className)}
    {...props}
  />
));
BreadcrumbPage.displayName = "BreadcrumbPage";

export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage };
