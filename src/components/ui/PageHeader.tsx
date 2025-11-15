import React from 'react';
import { spacing } from '../../styles/designSystem';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  icon, 
  actions,
  className = '' 
}) => {
  return (
    <div className={`${spacing.pageMargin} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          {icon && (
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-white tracking-tight">{title}</h1>
            {description && (
              <p className="mt-2 text-lg font-body text-white leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
