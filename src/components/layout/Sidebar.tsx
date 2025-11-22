import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  Database,
  Settings,
  BarChart3,
  Activity,
  Zap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FolderKanban,
  Brain,
  LineChart,
  ChevronDown,
  Plus,
  Check,
  TrendingUp
} from 'lucide-react';
import { useMLContext } from '../../context/MLContext';
import { supabase } from '../../lib/supabase';
import { Project } from '../../types';
import { useSubscription } from '../../hooks/useSubscription';
import toast from 'react-hot-toast';

const SIDEBAR_STORAGE_KEY = 'sidebar_state';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { datasets, models } = useMLContext();
  const subscription = useSubscription();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load collapse state from localStorage
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        return state.isCollapsed ?? false;
      }
    } catch (error) {
      console.error('Failed to load sidebar state:', error);
    }
    return false;
  });
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(() => {
    // Load dropdown state from localStorage
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        return state.isProjectDropdownOpen ?? false;
      }
    } catch (error) {
      console.error('Failed to load sidebar state:', error);
    }
    return false;
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load projects from Supabase
  useEffect(() => {
    loadProjects();
  }, []);

  // Persist sidebar state to localStorage
  useEffect(() => {
    try {
      const state = {
        isCollapsed,
        isProjectDropdownOpen,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save sidebar state:', error);
    }
  }, [isCollapsed, isProjectDropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const projectList = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          createdAt: p.created_at
        }));
        setProjects(projectList);
        
        // Set first project as current if none selected
        if (!currentProject) {
          setCurrentProject(projectList[0]);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleProjectSwitch = (project: Project) => {
    setCurrentProject(project);
    setIsProjectDropdownOpen(false);
    toast.success(`Switched to ${project.name}`);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed((prev: boolean) => !prev);
  };

  const handlePremiumClick = (e: React.MouseEvent, _feature: string, itemName: string) => {
    e.preventDefault();
    setUpgradeFeature(itemName);
    setShowUpgradePrompt(true);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Simplified 3-section workflow navigation
  const navigation = [
    {
      name: 'Dashboard',
      href: '/app',
      icon: Home,
      badge: null,
      description: 'Overview and quick actions',
      single: true
    },
    {
      name: 'Data',
      icon: Database,
      badge: datasets.length || null,
      description: 'Work with your datasets',
      section: true,
      items: [
        {
          name: 'Data Management',
          href: '/app/data',
          icon: Database,
          description: 'Browse, upload & manage datasets',
          dataTour: 'sidebar-data'
        },
        {
          name: 'Insights & Charts',
          href: '/app/insights',
          icon: BarChart3,
          description: 'Visualize and analyze',
          dataTour: 'insights'
        },
        {
          name: 'Feature Engineering',
          href: '/app/feature-engineering',
          icon: Sparkles,
          description: 'Transform and enhance data'
        }
      ]
    },
    {
      name: 'Build Models',
      icon: Brain,
      badge: models?.length || null,
      description: 'Train and evaluate ML models',
      section: true,
      premium: true,
      items: [
        {
          name: 'Train Models',
          href: '/app/train',
          icon: Brain,
          description: 'Create new models',
          dataTour: 'train-models'
        },
        {
          name: 'Evaluate',
          href: '/app/evaluate',
          icon: BarChart3,
          description: 'Test model performance'
          // Free tier - essential for validating trained models
        }
      ]
    },
    {
      name: 'Deploy & Monitor',
      icon: Zap,
      badge: null,
      description: 'Production deployment',
      section: true,
      premium: true,
      items: [
        {
          name: 'Deploy',
          href: '/app/deploy',
          icon: Zap,
          description: 'Publish models',
          premium: true
        },
        {
          name: 'Monitoring',
          href: '/app/monitoring',
          icon: Activity,
          description: 'Track performance',
          premium: true
        },
        {
          name: 'Metrics',
          href: '/app/metrics',
          icon: LineChart,
          description: 'Real-time metrics',
          premium: true
        },
        {
          name: 'Async ML',
          href: '/app/async-ml',
          icon: Zap,
          description: 'Background tasks',
          premium: true
        }
      ]
    }
  ];

  // UPDATED: Removed Documentation from secondaryNavigation
  const secondaryNavigation = [
    {
      name: 'Settings',
      href: '/app/settings',
      icon: Settings
    }
  ];

  return (
    <div 
      className={`flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header with Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
        {!isCollapsed && (
          <Link to="/app" className="flex items-center space-x-2">
            <svg viewBox="0 0 800 800" className="w-8 h-8">
              <defs>
                <linearGradient id="sidebar-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#5B21B6', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <path d="M 100 200 L 100 650 L 350 650 C 500 650 600 550 600 425 C 600 300 500 200 350 200 Z M 200 300 L 350 300 C 430 300 480 350 480 425 C 480 500 430 550 350 550 L 200 550 Z" 
                    fill="url(#sidebar-logo-gradient)"/>
              <line x1="500" y1="250" x2="650" y2="250" stroke="url(#sidebar-logo-gradient)" strokeWidth="8"/>
              <line x1="500" y1="300" x2="650" y2="300" stroke="url(#sidebar-logo-gradient)" strokeWidth="8"/>
              <line x1="500" y1="350" x2="650" y2="350" stroke="url(#sidebar-logo-gradient)" strokeWidth="8"/>
              <line x1="500" y1="400" x2="650" y2="400" stroke="url(#sidebar-logo-gradient)" strokeWidth="8"/>
              <line x1="500" y1="450" x2="650" y2="450" stroke="url(#sidebar-logo-gradient)" strokeWidth="8"/>
              <line x1="500" y1="500" x2="650" y2="500" stroke="url(#sidebar-logo-gradient)" strokeWidth="8"/>
              <line x1="500" y1="550" x2="650" y2="550" stroke="url(#sidebar-logo-gradient)" strokeWidth="8"/>
              <line x1="500" y1="600" x2="650" y2="600" stroke="url(#sidebar-logo-gradient)" strokeWidth="8"/>
              <circle cx="650" cy="250" r="15" fill="url(#sidebar-logo-gradient)"/>
              <circle cx="650" cy="300" r="15" fill="url(#sidebar-logo-gradient)"/>
              <circle cx="650" cy="350" r="15" fill="url(#sidebar-logo-gradient)"/>
              <circle cx="650" cy="400" r="15" fill="url(#sidebar-logo-gradient)"/>
              <circle cx="650" cy="450" r="15" fill="url(#sidebar-logo-gradient)"/>
              <circle cx="650" cy="500" r="15" fill="url(#sidebar-logo-gradient)"/>
              <circle cx="650" cy="550" r="15" fill="url(#sidebar-logo-gradient)"/>
              <circle cx="650" cy="600" r="15" fill="url(#sidebar-logo-gradient)"/>
            </svg>
            <span className="text-lg font-bold text-white">
              DataFlowHub.AI
            </span>
          </Link>
        )}
        
        <button
          onClick={handleToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Project Selector */}
      {currentProject && (
        <div className="px-3 py-3 border-b border-gray-700" ref={dropdownRef}>
          <button
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/50 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            {!isCollapsed && (
              <>
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <FolderKanban className="w-5 h-5 text-primary-400 flex-shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {currentProject.name}
                    </p>
                    <p className="text-xs text-gray-400">Current Project</p>
                  </div>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isProjectDropdownOpen ? 'transform rotate-180' : ''
                  }`} 
                />
              </>
            )}
            {isCollapsed && <FolderKanban className="w-5 h-5 text-primary-400" />}
          </button>

          {/* Project Dropdown */}
          {isProjectDropdownOpen && !isCollapsed && (
            <div className="mt-2 py-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 max-h-64 overflow-y-auto">
              {isLoadingProjects ? (
                <div className="px-4 py-2 text-sm text-gray-400">Loading...</div>
              ) : (
                <>
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectSwitch(project)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center justify-between ${
                        currentProject.id === project.id ? 'bg-gray-700' : ''
                      }`}
                    >
                      <span className="text-white truncate">{project.name}</span>
                      {currentProject.id === project.id && (
                        <Check className="w-4 h-4 text-primary-400 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-gray-700 mt-2 pt-2">
                    <button
                      onClick={() => {
                        // Open new project modal - this will be handled by the parent component
                        setIsProjectDropdownOpen(false);
                        // Dispatch a custom event to open the modal
                        window.dispatchEvent(new CustomEvent('openNewProjectModal'));
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center text-primary-400"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      <span>New Project</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {navigation.map((item: any) => {
          // Single item (like Dashboard)
          if (item.single && item.href) {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  active
                    ? 'bg-gradient-to-r from-primary-600 to-primary-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
                title={isCollapsed ? item.description : ''}
              >
                <item.icon
                  className={`flex-shrink-0 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'} ${
                    active ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  }`}
                />
                {!isCollapsed && <span className="flex-1 truncate">{item.name}</span>}
              </Link>
            );
          }

          // Section with sub-items
          if (item.section && item.items) {
            return (
              <div key={item.name} className="space-y-1">
                {/* Section Header */}
                {!isCollapsed && (
                  <div className="px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <item.icon className="w-4 h-4 text-gray-200" />
                      <span className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        {item.name}
                      </span>
                    </div>
                    {item.badge !== null && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-200">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Section Items */}
                <div className={isCollapsed ? 'space-y-1' : 'space-y-0.5'}>
                  {item.items.map((subItem: any) => {
                    const active = isActive(subItem.href);
                    const isPremium = subItem.premium && subscription.tier === 'free';
                    
                    // If premium and user is free tier, intercept click
                    if (isPremium) {
                      return (
                        <button
                          key={subItem.name}
                          onClick={(e) => handlePremiumClick(e, subItem.href, subItem.name)}
                          data-tour={(subItem as any).dataTour}
                          className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all text-gray-300 hover:bg-gray-700/50 hover:text-white ${!isCollapsed && 'ml-2'} cursor-pointer`}
                          title={isCollapsed ? `${subItem.description} (Premium)` : ''}
                        >
                          <subItem.icon
                            className={`flex-shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4 mr-3'} text-gray-400 group-hover:text-white`}
                          />
                          {!isCollapsed && (
                            <span className="flex-1 truncate flex items-center gap-2">
                              {subItem.name}
                              <span className="text-xs bg-yellow-500 text-gray-900 px-2 py-0.5 rounded-full font-semibold">
                                PRO
                              </span>
                            </span>
                          )}
                        </button>
                      );
                    }
                    
                    return (
                      <Link
                        key={subItem.name}
                        to={subItem.href}
                        data-tour={(subItem as any).dataTour}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                          active
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                        } ${!isCollapsed && 'ml-2'}`}
                        title={isCollapsed ? subItem.description : ''}
                      >
                        <subItem.icon
                          className={`flex-shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4 mr-3'} ${
                            active ? 'text-white' : 'text-gray-400 group-hover:text-white'
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="flex-1 truncate">
                            {subItem.name}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          return null;
        })}

        {/* Divider */}
        <div className="py-2">
          <div className="border-t border-gray-700"></div>
        </div>

        {/* Secondary Navigation */}
        <div className="space-y-1">
          {secondaryNavigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  active
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                }`}
                title={isCollapsed ? item.name : ''}
              >
                <item.icon className={`flex-shrink-0 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>
        
        {/* Command Palette Hint */}
        {!isCollapsed && (
          <div className="px-3 py-3 border-t border-gray-700/50">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                  Quick Tip
                </span>
              </div>
              <p className="text-xs text-gray-300 mb-2">
                Press{' '}
                <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs font-mono text-blue-400">
                  ⌘K
                </kbd>{' '}
                to quickly search datasets, models, and navigate anywhere
              </p>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Section - Quick Stats */}
      {!isCollapsed && currentProject && (
        <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/50">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Quick Stats
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-700/50 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-400">Datasets</p>
                    <p className="text-sm font-semibold text-white">{datasets.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-700/50 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <Brain className="w-3.5 h-3.5 text-primary-400" />
                  <div>
                    <p className="text-xs text-gray-400">Models</p>
                    <p className="text-sm font-semibold text-white">{models?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed state - Mini stats */}
      {isCollapsed && currentProject && (
        <div className="px-3 py-3 border-t border-gray-700 space-y-2">
          <div className="flex items-center justify-center p-2 bg-gray-700/50 rounded-lg" title="Datasets">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="ml-1 text-xs font-semibold text-white">{datasets.length}</span>
          </div>
          <div className="flex items-center justify-center p-2 bg-gray-700/50 rounded-lg" title="Models">
            <Brain className="w-4 h-4 text-primary-400" />
            <span className="ml-1 text-xs font-semibold text-white">{models?.length || 0}</span>
          </div>
        </div>
      )}

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{upgradeFeature}</h2>
                    <p className="text-sm text-gray-500">Premium Feature</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpgradePrompt(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</span>
                </button>
              </div>

              {/* Feature Description */}
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  <strong>{upgradeFeature}</strong> is available on our Professional and Team plans.
                  Upgrade now to unlock this powerful feature and accelerate your ML workflow.
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Advanced ML Tools</h3>
                    <p className="text-xs text-gray-600 mt-1">AutoML, hyperparameter tuning, and more</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Production Deployment</h3>
                    <p className="text-xs text-gray-600 mt-1">Deploy models with one click</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Real-time Monitoring</h3>
                    <p className="text-xs text-gray-600 mt-1">Track performance and drift</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Unlimited Models</h3>
                    <p className="text-xs text-gray-600 mt-1">Train as many models as you need</p>
                  </div>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Professional Plan</p>
                    <p className="text-2xl font-bold text-gray-900">$50<span className="text-sm font-normal text-gray-500">/month</span></p>
                    <p className="text-xs text-gray-500 mt-1">or $500/year (save $100)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-600 font-semibold mb-1">✓ 14-day free trial</p>
                    <p className="text-xs text-gray-500">Cancel anytime</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUpgradePrompt(false);
                    window.location.href = '/pricing';
                  }}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  View All Plans
                </button>
                <button
                  onClick={() => setShowUpgradePrompt(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Maybe Later
                </button>
              </div>

              {/* Trust Signal */}
              <p className="text-center text-xs text-gray-500 mt-4">
                🔒 Secure payment • 💳 Cancel anytime • 🚀 Instant access
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;