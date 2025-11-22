import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-disabled'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const baseClasses = [
    'relative inline-flex items-center justify-center gap-2 font-semibold rounded-lg',
    'transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-60',
    'active:translate-y-[0.5px] select-none',
    fullWidth ? 'w-full' : 'w-auto'
  ].join(' ');

  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:-translate-y-[1px]',
    secondary: 'bg-slate-900 text-white shadow-md shadow-slate-900/10 hover:bg-slate-800',
    outline: 'bg-white text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50',
    danger: 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/25 hover:shadow-xl hover:-translate-y-[1px]',
    success: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent',
  } as const;

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-5 text-base',
  } as const;

  const composedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled || isLoading ? 'pointer-events-none' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const renderIcon = () => {
    if (!icon) return null;

    return (
      <span className={`flex items-center ${iconPosition === 'left' ? 'mr-1.5' : 'ml-1.5 order-last'}`}>
        {icon}
      </span>
    );
  };

  return (
    <button
      type={type}
      className={composedClasses}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span className="opacity-90">{children}</span>
        </span>
      ) : (
        <>
          {iconPosition === 'left' && renderIcon()}
          <span>{children}</span>
          {iconPosition === 'right' && renderIcon()}
        </>
      )}
    </button>
  );
};

export default React.memo(Button);
