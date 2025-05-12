import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  footer?: ReactNode;
  className?: string;
  role?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  footer,
  className = '',
  role = 'region',
}) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden ${className}`}
      role={role}
    >
      {(title || description) && (
        <div className="px-4 py-5 border-b border-gray-100 sm:px-6" role="heading" aria-level={3}>
          {title && <h3 className="text-lg font-medium leading-6 text-gray-900" id={`card-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>{title}</h3>}
          {description && <p className="mt-1 text-sm text-gray-500" id={`card-desc-${title?.toLowerCase().replace(/\s+/g, '-') || 'card'}`}>{description}</p>}
        </div>
      )}
      <div className="px-4 py-5 sm:p-6">{children}</div>
      {footer && <div className="px-4 py-4 border-t border-gray-100 sm:px-6">{footer}</div>}
    </div>
  );
};

export default Card;

export { Card }