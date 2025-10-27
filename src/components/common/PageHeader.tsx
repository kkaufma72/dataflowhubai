/**
 * Improved Page Header Component
 * 
 * Better visual hierarchy, contrast, and readability
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  badge?: {
    text: string;
    variant: 'primary' | 'success' | 'warning' | 'premium';
  };
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  icon: Icon,
  actions,
  badge
}) => {
  const badgeStyles = {
    primary: 'bg-blue-100 text-blue-700 border-blue-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    premium: 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200'
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start space-x-4">
          {/* Icon */}
          {Icon && (
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Icon className="w-7 h-7 text-white" />
            </div>
          )}
          
          {/* Text Content */}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Title - IMPROVED: Darker, bolder, bigger */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                {title}
              </h1>
              
              {/* Badge */}
              {badge && (
                <span className={`
                  px-3 py-1 rounded-full text-xs font-semibold border
                  ${badgeStyles[badge.variant]}
                `}>
                  {badge.text}
                </span>
              )}
            </div>
            
            {/* Subtitle - IMPROVED: Better contrast */}
            {subtitle && (
              <p className="mt-2 text-lg text-gray-600 font-medium max-w-3xl leading-relaxed">
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

export default PageHeader;
