/**
 * DataFlowHub UI Component Library
 * 
 * Centralized exports for all UI components.
 * Import from '@/components/ui' for consistent usage.
 * 
 * @example
 * ```tsx
 * import { Button, Card, CardHeader, CardContent, Input, Alert } from '@/components/ui';
 * ```
 */

// ============================================================================
// Core Components
// ============================================================================
export { Button, buttonVariants, type ButtonProps } from './button';
export { Badge, badgeVariants, type BadgeProps } from './badge';
export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from './card';
export { PageHeader } from './PageHeader';

// ============================================================================
// Form Components
// ============================================================================
export { Input, type InputProps } from './input';
export { Label, type LabelProps } from './label';
export { 
  Select, 
  SelectProvider,
  SelectTrigger, 
  SelectContent, 
  SelectItem, 
  SelectValue,
  type SelectProps 
} from './select';
export { Textarea, type TextareaProps } from './textarea';
export { Checkbox, type CheckboxProps } from './checkbox';
export { Switch, type SwitchProps } from './switch';

// ============================================================================
// Feedback Components
// ============================================================================
export { Alert, AlertTitle, AlertDescription, alertVariants, type AlertProps } from './alert';
export { Toast, toastVariants, type ToastProps } from './toast';
export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, type SkeletonProps } from './skeleton';
export { Spinner, LoadingOverlay, LoadingInline, type SpinnerProps } from './spinner';

// ============================================================================
// Overlay Components
// ============================================================================
export { 
  Modal, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  ModalTitle,
  ModalDescription,
  type ModalProps 
} from './modal';
export { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogClose
} from './dialog';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';
export { Popover, PopoverTrigger, PopoverContent } from './popover';
export { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem
} from './dropdown-menu';

// ============================================================================
// Navigation Components
// ============================================================================
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage } from './breadcrumb';

// ============================================================================
// Data Display Components
// ============================================================================
export { Avatar, AvatarImage, AvatarFallback, AvatarGroup } from './avatar';
export { Progress, CircularProgress, type ProgressProps } from './progress';
export { 
  Table, 
  TableHeader, 
  TableBody, 
  TableFooter,
  TableRow, 
  TableHead, 
  TableCell,
  TableCaption
} from './table';

// ============================================================================
// Layout Components
// ============================================================================
export { Separator } from './separator';
export { ScrollArea } from './scroll-area';

// ============================================================================
// Animation Components
// ============================================================================
export { ContainerScroll, Header as ContainerHeader } from './container-scroll-animation';
export { Spotlight } from './spotlight';
