import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  customPaths?: { name: string; href: string }[];
  showHome?: boolean;
}

const pathNameMap: Record<string, string> = {
  'app': 'Dashboard',
  'data': 'Data Management',
  'feature-engineering': 'Feature Engineering',
  'train': 'Model Training',
  'evaluate': 'Model Evaluation',
  'deploy': 'Deployment',
  'monitoring': 'Model Monitoring',
  'documentation': 'Documentation',
  'visualizations': 'Visualizations',
  'pipeline': 'Pipeline Builder',
  'settings': 'Settings'
};

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ 
  customPaths,
  showHome = true
}) => {
  const location = useLocation();
  
  // If custom paths are provided, use those
  if (customPaths) {
    return (
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          {showHome && (
            <li>
              <Link to="/app" className="text-gray-500 hover:text-gray-700">
                <Home className="w-4 h-4" />
                <span className="sr-only">Home</span>
              </Link>
            </li>
          )}
          
          {customPaths.map((path, index) => {
            const isLast = index === customPaths.length - 1;
            
            return (
              <React.Fragment key={path.href}>
                {index > 0 || showHome ? (
                  <li className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </li>
                ) : null}
                
                <li>
                  {isLast ? (
                    <span className="text-sm font-medium text-gray-900" aria-current="page">
                      {path.name}
                    </span>
                  ) : (
                    <Link
                      to={path.href}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      {path.name}
                    </Link>
                  )}
                </li>
              </React.Fragment>
            );
          })}
        </ol>
      </nav>
    );
  }
  
  // Otherwise, generate breadcrumbs from the current path
  const pathnames = location.pathname.split('/').filter(x => x);
  
  // Remove 'app' from the beginning if it exists
  if (pathnames[0] === 'app') {
    pathnames.shift();
  }
  
  const breadcrumbs = [
    { name: 'Dashboard', href: '/app' },
    ...pathnames.map((name, index) => {
      const displayName = pathNameMap[name] || name.charAt(0).toUpperCase() + name.slice(1);
      const href = `/${pathnames.slice(0, index + 1).join('/')}`;
      return { name: displayName, href };
    })
  ];
  
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <React.Fragment key={breadcrumb.href}>
              {index > 0 ? (
                <li className="flex items-center">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </li>
              ) : null}
              
              <li>
                {isLast ? (
                  <span className="text-sm font-medium text-gray-900" aria-current="page">
                    {breadcrumb.name}
                  </span>
                ) : (
                  <Link
                    to={breadcrumb.href}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    {index === 0 ? (
                      <Home className="w-4 h-4" />
                    ) : (
                      breadcrumb.name
                    )}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;