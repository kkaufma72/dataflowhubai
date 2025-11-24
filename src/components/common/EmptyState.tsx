import React from 'react';
import { LucideIcon } from 'lucide-react';
import Button from './Button';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  tip?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actions = [],
  tip,
  className = ''
}) => {
  return (
    <div className={`text-center py-16 px-6 ${className}`}>
      {/* Icon */}
      <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon className="w-10 h-10 text-indigo-600" />
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex gap-3 justify-center flex-wrap">
          {actions.map((action, idx) => (
            <Button
              key={idx}
              onClick={action.onClick}
              variant={action.variant || (idx === 0 ? 'primary' : 'secondary')}
              size="lg"
            >
              {action.icon && <action.icon className="w-4 h-4 mr-2" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Tip */}
      {tip && (
        <div className="mt-6 inline-flex items-start gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-left">
          <span className="text-amber-600 text-sm">💡</span>
          <p className="text-sm text-amber-800 font-medium">
            <strong>Tip:</strong> {tip}
          </p>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
