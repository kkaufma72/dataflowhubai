import React, { ReactNode } from 'react';
import Breadcrumbs from './Breadcrumbs';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: { name: string; href: string }[];
  icon?: React.ElementType;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  breadcrumbs,
  icon: Icon
}) => {
  return (
    <div className="mb-6">
      {breadcrumbs && (
        <div className="mb-2">
          <Breadcrumbs customPaths={breadcrumbs} />
        </div>
      )}
      
      <div className="flex flex-col justify-between md:flex-row md:items-center">
        <div className="flex items-center">
          {Icon && (
            <div className="flex items-center justify-center w-10 h-10 mr-4 bg-indigo-100 rounded-lg">
              <Icon className="w-6 h-6 text-indigo-600" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="mt-4 md:mt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;