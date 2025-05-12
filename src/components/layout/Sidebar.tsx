import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  ChevronDown,
  FileSpreadsheet,
  Server
} from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';
import { useUser } from '../../context/UserContext';
import SkeletonLoader from '../common/SkeletonLoader';

// Define the navigation items with nested structure
const navigation = [
  { 
    name: 'Dashboard', 
    href: '/app', 
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
      { name: 'Data Center Report', href: '/app/data-center-report', icon: Server },
    ]
  }
];

const secondaryNavigation = [
  { name: 'Settings', href: '/app/settings', icon: Settings },
  { name: 'Help', href: '/app/documentation', icon: LifeBuoy },
];

const Sidebar = () => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['Data Preparation']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { userProfile, isLoadingProfile } = useUser();
  const location = useLocation();

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const toggleSection = (sectionName: string) => {
    if (expandedSections.includes(sectionName)) {
      setExpandedSections(expandedSections.filter(name => name !== sectionName));
    } else {
      setExpandedSections([...expandedSections, sectionName]);
    }
  };

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-1 min-h-0 bg-indigo-700 dark:bg-gray-900">
          <div className="flex items-center flex-shrink-0 h-16 px-4 bg-indigo-800 dark:bg-gray-950">
            <span className="text-xl font-bold text-white">DataFlowHub AI</span>
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
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
                        onClick={() => toggleSection(item.name)}
                        className={`flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md group hover:bg-indigo-600 dark:hover:bg-gray-800 ${
                          isActive
                            ? 'text-white'
                            : 'text-indigo-100 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center">
                          <item.icon className="w-6 h-6 mr-3 text-indigo-300 dark:text-gray-400" />
                          {item.name}
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-indigo-300 dark:text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-indigo-300 dark:text-gray-400" />
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="pl-10 space-y-1">
                          {item.children.map(child => (
                            <NavLink
                              key={child.name}
                              to={child.href}
                              end={child.exact}
                              className={({ isActive }) =>
                                `${
                                  isActive
                                    ? 'bg-indigo-800 text-white dark:bg-gray-800'
                                    : 'text-indigo-100 hover:bg-indigo-600 hover:text-white dark:hover:bg-gray-800'
                                } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150`
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  <child.icon
                                    className={`${
                                      isActive ? 'text-white' : 'text-indigo-300 group-hover:text-white dark:text-gray-400'
                                    } mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-150`}
                                    aria-hidden="true"
                                  />
                                  {child.name}
                                </>
                              )}
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
                      `${
                        isActive
                          ? 'bg-indigo-800 text-white dark:bg-gray-800'
                          : 'text-indigo-100 hover:bg-indigo-600 hover:text-white dark:hover:bg-gray-800'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={`${
                            isActive ? 'text-white' : 'text-indigo-300 group-hover:text-white dark:text-gray-400'
                          } mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-150`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
            <div className="pt-2 mt-6 space-y-1 border-t border-indigo-800 dark:border-gray-700">
              {secondaryNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `${
                      isActive
                        ? 'bg-indigo-800 text-white dark:bg-gray-800'
                        : 'text-indigo-100 hover:bg-indigo-600 hover:text-white dark:hover:bg-gray-800'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={`${
                          isActive ? 'text-white' : 'text-indigo-300 group-hover:text-white dark:text-gray-400'
                        } mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-150`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </>
                  )}
                </NavLink>
              ))}
              
              <div className="px-2 py-2 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {isLoadingProfile ? (
                      <SkeletonLoader circle width={32} height={32} />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                        {userProfile?.fullName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="ml-2">
                      {isLoadingProfile ? (
                        <SkeletonLoader width={100} height={16} />
                      ) : (
                        <p className="text-xs font-medium text-indigo-100 dark:text-gray-300">
                          {userProfile?.fullName || 'User'}
                        </p>
                      )}
                    </div>
                  </div>
                  <ThemeToggle className="bg-indigo-600 dark:bg-gray-800" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;