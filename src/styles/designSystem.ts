// Design System Tokens
// Centralized design tokens for consistent styling across the application

// Typography Scale
export const typography = {
  // Page Headers
  pageTitle: 'text-3xl md:text-4xl font-heading font-bold text-gray-900 tracking-tight',
  sectionTitle: 'text-2xl font-heading font-bold text-gray-900',
  cardTitle: 'text-lg font-heading font-semibold text-gray-900',
  subTitle: 'text-xl font-heading font-semibold text-gray-900',
  
  // Body Text
  bodyLarge: 'text-lg font-body text-gray-600 leading-relaxed',
  bodyBase: 'text-base font-body text-gray-700',
  bodySmall: 'text-sm font-body text-gray-600',
  
  // Labels & Helpers
  label: 'text-sm font-medium text-gray-700',
  helperText: 'text-xs text-gray-500',
  caption: 'text-xs font-body text-gray-500',
  
  // Special
  mono: 'text-sm font-mono text-gray-600',
};

// Color System
export const colors = {
  // Primary actions & branding (Indigo)
  primary: {
    bg: 'bg-primary',
    text: 'text-primary',
    border: 'border-primary',
    hover: 'hover:bg-primary-dark hover:text-primary-dark',
    focus: 'focus:ring-primary focus:border-primary',
  },
  
  // Secondary actions (Green)
  secondary: {
    bg: 'bg-secondary',
    text: 'text-secondary',
    border: 'border-secondary',
    hover: 'hover:bg-secondary-dark hover:text-secondary-dark',
  },
  
  // Text hierarchy
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-600',
    tertiary: 'text-gray-500',
    disabled: 'text-gray-400',
    inverse: 'text-white',
  },
  
  // Backgrounds
  surface: {
    primary: 'bg-white',
    secondary: 'bg-gray-50',
    elevated: 'bg-white shadow-lg',
    dark: 'bg-gray-900',
  },
  
  // States
  states: {
    success: 'text-green-600 bg-green-50',
    warning: 'text-yellow-600 bg-yellow-50',
    error: 'text-red-600 bg-red-50',
    info: 'text-blue-600 bg-blue-50',
  },
};

// Component Patterns
export const components = {
  // Cards
  card: {
    base: 'bg-white rounded-xl border border-gray-200 shadow-sm',
    elevated: 'bg-white rounded-xl border border-gray-200 shadow-lg',
    interactive: 'bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer',
    flat: 'bg-white rounded-lg border border-gray-200',
  },
  
  // Buttons
  button: {
    primary: 'px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50',
    ghost: 'px-4 py-2 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-all',
    danger: 'px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all shadow-sm',
    success: 'px-4 py-2 bg-secondary text-white text-sm font-medium rounded-lg hover:bg-secondary-dark transition-all shadow-sm',
  },
  
  // Input fields
  input: {
    base: 'w-full px-3 py-2 text-base font-body border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors',
    error: 'w-full px-3 py-2 text-base font-body border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors',
    small: 'w-full px-3 py-2 text-sm font-body border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors',
  },
  
  // Badges & Tags
  badge: {
    default: 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700',
    primary: 'px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary-700',
    success: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700',
    warning: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700',
    error: 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700',
    info: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700',
  },
  
  // Tabs
  tab: {
    base: 'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
    active: 'border-primary text-primary',
    inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
  },
  
  // Alerts
  alert: {
    info: 'p-4 rounded-lg bg-blue-50 border border-blue-200',
    success: 'p-4 rounded-lg bg-green-50 border border-green-200',
    warning: 'p-4 rounded-lg bg-yellow-50 border border-yellow-200',
    error: 'p-4 rounded-lg bg-red-50 border border-red-200',
  },
};

// Spacing System
export const spacing = {
  sectionPadding: 'p-4 md:p-10',
  cardPadding: 'p-6',
  containerMax: 'max-w-7xl mx-auto',
  pageMargin: 'mb-8',
  sectionMargin: 'mb-6',
  elementMargin: 'mb-4',
};

// Layout Patterns
export const layout = {
  page: 'p-4 md:p-10 mx-auto max-w-7xl',
  section: 'mb-8',
  grid: {
    two: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    three: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    four: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
  },
};

// Transitions
export const transitions = {
  base: 'transition-all duration-200 ease-in-out',
  fast: 'transition-all duration-150 ease-in-out',
  slow: 'transition-all duration-300 ease-in-out',
};

// Shadows
export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  none: 'shadow-none',
};
