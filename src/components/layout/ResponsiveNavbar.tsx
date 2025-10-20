import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  Database, 
  Layers, 
  BarChart3, 
  Rocket,
  Settings,
  LifeBuoy,
  Activity,
  Wand2,
  PieChart,
  GitBranch,
  Menu,
  X,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

// Define navigation structure
const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: HomeIcon, 
    exact: true 
  },
  {
    name: 'Data Preparation',
    icon: Database,
    children: [
      { name: 'Data Management', href: '/app/data', icon: FileSpreadsheet },
      { name: 'Feature Engineering', href: '/app/feature-engineering', icon: Wand2 },
    ]
  },
  {
    name: 'Model Development',
    icon: Layers,
    children: [
      { name: 'Model Training', href: '/app/train', icon: Layers },
      { name: 'Model Evaluation', href: '/app/evaluate', icon: BarChart3 },
    ]
  },
  {
    name: 'Production',
    icon: Rocket,
    children: [
      { name: 'Deployment', href: '/app/deploy', icon: Rocket },
      { name: 'Monitoring', href: '/app/monitoring', icon: Activity },
    ]
  },
  {
    name: 'Advanced',
    icon: GitBranch,
    children: [
      { name: 'Visualizations', href: '/app/visualizations', icon: PieChart },
      { name: 'Pipeline Builder', href: '/app/pipeline', icon: GitBranch },
    ]
  }
];

// Define secondary navigation
const secondaryNavigation = [
  { name: 'Settings', href: '/app/settings', icon: Settings },
  { name: 'Help', href: '/app/documentation', icon: LifeBuoy },
];

const ResponsiveNavbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSection = (sectionName: string) => {
    if (expandedSections.includes(sectionName)) {
      setExpandedSections(expandedSections.filter(name => name !== sectionName));
    } else {
      setExpandedSections([...expandedSections, sectionName]);
    }
  };

  // Get top-level navigation items for desktop view
  const topLevelNavItems = navigation.map(item => {
    if (item.children) {
      // Check if any child is active
      const isActive = item.children.some(child => 
        location.pathname === child.href || 
        (!child.exact && location.pathname.startsWith(child.href))
      );
      
      return {
        ...item,
        isActive
      };
    }
    
    return {
      ...item,
      isActive: item.exact 
        ? location.pathname === item.href 
        : location.pathname.startsWith(item.href)
    };
  });

  return (
    <div className="bg-white shadow-sm">
      {/* Desktop Navigation */}
      <div className="hidden md:flex md:justify-center border-b border-gray-200">
        <nav className="flex space-x-6 px-4 max-w-7xl mx-auto">
          {topLevelNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.children ? item.children[0].href : item.href}
              className={`flex items-center px-1 pt-1 pb-2 border-b-2 text-sm font-medium transition-colors duration-150 ${
                item.isActive
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <item.icon
                className={`mr-1 h-4 w-4 ${
                  item.isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center">
            <span className="text-lg font-bold text-indigo-600">AutoML</span>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={toggleMobileMenu}
            aria-expanded={isMobileMenuOpen}
          >
            <span className="sr-only">Open main menu</span>
            {isMobileMenuOpen ? (
              <X className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="block h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile menu panel */}
        {isMobileMenuOpen && (
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
            {navigation.map((item) => {
              if (item.children) {
                const isExpanded = expandedSections.includes(item.name);
                const isActive = item.children.some(child => 
                  location.pathname === child.href || 
                  (!child.exact && location.pathname.startsWith(child.href))
                );
                
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => toggleSection(item.name)}
                    >
                      <div className="flex items-center">
                        <item.icon
                          className={`mr-3 flex-shrink-0 h-5 w-5 ${
                            isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                          }`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="pl-10 space-y-1">
                        {item.children.map(child => (
                          <NavLink
                            key={child.name}
                            to={child.href}
                            className={({ isActive }) =>
                              `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                                isActive
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`
                            }
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <child.icon
                              className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                            {child.name}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon
                    className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              );
            })}

            {/* Settings and Help */}
            <div className="pt-2 mt-2 border-t border-gray-200">
              {secondaryNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon
                    className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveNavbar;