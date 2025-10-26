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
  ChevronRight,
  MessageSquare,
  Sparkles
} from 'lucide-react';

// Define navigation structure
const navigation = [
  { 
    name: 'Dashboard', 
    href: '/app', 
    icon: HomeIcon, 
    exact: true 
  },
  {
    name: 'AI Assistant',
    href: '/app/ai-chat',
    icon: MessageSquare,
    exact: false,
    highlight: true // Makes it stand out with special styling
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

  const isItemActive = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname === href || location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">DataFlowHub</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              if (item.children) {
                const isExpanded = expandedSections.includes(item.name);
                const hasActiveChild = item.children.some(child => 
                  isItemActive(child.href, child.exact)
                );

                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleSection(item.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        hasActiveChild
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                    
                    {isExpanded && (
                      <div className="mt-1 ml-4 space-y-1">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.href}
                            to={child.href}
                            className={({ isActive }) =>
                              `flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`
                            }
                          >
                            <child.icon className="w-4 h-4" />
                            <span>{child.name}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Handle highlight for AI Assistant
              if (item.highlight) {
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 border-2 border-indigo-200'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                    {!isItemActive(item.href, item.exact) && (
                      <span className="ml-auto">
                        <Sparkles className="w-4 h-4" />
                      </span>
                    )}
                  </NavLink>
                );
              }

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Secondary Navigation */}
          <div className="px-3 py-4 border-t border-gray-200 space-y-1">
            {secondaryNavigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">DataFlowHub</span>
          </div>
          
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed top-16 left-0 right-0 bottom-0 z-30 bg-white transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="h-full px-4 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            if (item.children) {
              const isExpanded = expandedSections.includes(item.name);
              const hasActiveChild = item.children.some(child => 
                isItemActive(child.href, child.exact)
              );

              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleSection(item.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                      hasActiveChild
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-1 ml-4 space-y-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.href}
                          to={child.href}
                          onClick={toggleMobileMenu}
                          className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-2 text-sm rounded-lg transition-colors ${
                              isActive
                                ? 'bg-indigo-50 text-indigo-600 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                        >
                          <child.icon className="w-4 h-4" />
                          <span>{child.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Handle highlight for AI Assistant in mobile
            if (item.highlight) {
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={toggleMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 text-base font-medium rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 border-2 border-indigo-200'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {!isItemActive(item.href, item.exact) && (
                    <span className="ml-auto">
                      <Sparkles className="w-4 h-4" />
                    </span>
                  )}
                </NavLink>
              );
            }

            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={toggleMobileMenu}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          {/* Secondary Navigation in Mobile */}
          <div className="pt-4 mt-4 border-t border-gray-200 space-y-1">
            {secondaryNavigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={toggleMobileMenu}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
};

export default ResponsiveNavbar;