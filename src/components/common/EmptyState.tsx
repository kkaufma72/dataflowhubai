// Empty State Component - Professional UX
import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'minimal' | 'gradient';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
  variant = 'default'
}) => {
  const renderPrimaryAction = () => {
    if (!actionLabel) return null;

    const buttonClasses = variant === 'gradient'
      ? 'px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105'
      : 'px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg';

    if (actionHref) {
      return (
        <Link to={actionHref} className={buttonClasses}>
          {actionLabel}
        </Link>
      );
    }

    return (
      <button onClick={onAction} className={buttonClasses}>
        {actionLabel}
      </button>
    );
  };

  const renderSecondaryAction = () => {
    if (!secondaryActionLabel) return null;

    const buttonClasses = 'px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-all';

    if (secondaryActionHref) {
      return (
        <Link to={secondaryActionHref} className={buttonClasses}>
          {secondaryActionLabel}
        </Link>
      );
    }

    return (
      <button onClick={onSecondaryAction} className={buttonClasses}>
        {secondaryActionLabel}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Icon */}
      <div className={`mb-6 ${
        variant === 'gradient' 
          ? 'w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center'
          : 'w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center'
      }`}>
        <Icon className={`${
          variant === 'gradient' ? 'w-10 h-10 text-indigo-600' : 'w-8 h-8 text-gray-400'
        }`} />
      </div>

      {/* Title */}
      <h3 className={`mb-2 ${
        variant === 'gradient'
          ? 'text-2xl font-bold text-gray-900'
          : 'text-xl font-semibold text-gray-900'
      }`}>
        {title}
      </h3>

      {/* Description */}
      <p className={`mb-8 max-w-md ${
        variant === 'gradient'
          ? 'text-lg text-gray-600'
          : 'text-base text-gray-500'
      }`}>
        {description}
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {renderPrimaryAction()}
        {renderSecondaryAction()}
      </div>
    </div>
  );
};

export default EmptyState;
