/**
 * Section Header Component
 * 
 * Improved visual hierarchy for section titles
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  subtitle, 
  icon: Icon,
  actions,
  className = ''
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Icon */}
          {Icon && (
            <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/10 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary-600" />
            </div>
          )}
          
          <div>
            {/* Title - IMPROVED: Better contrast and size */}
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {title}
            </h2>
            
            {/* Subtitle - IMPROVED: More readable */}
            {subtitle && (
              <p className="mt-1 text-sm font-medium text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionHeader;

