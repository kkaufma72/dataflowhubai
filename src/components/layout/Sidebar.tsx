import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  Database,
  Layers,
  Settings,
  BarChart3,
  FileText,
  Users,
  GitBranch,
  Activity,
  Zap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FolderKanban,
  Upload,
  Brain,
  LineChart,
  ChevronDown,
  Plus,
  Check
} from 'lucide-react';
import { useMLContext } from '../../context/MLContext';
import { supabase } from '../../lib/supabase';
import { Project } from '../../types';
import toast from 'react-hot-toast';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { currentProject, datasets, models, setCurrentProject } = useMLContext();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load projects from Supabase
  useEffect(() => {
    loadProjects();
  }, []);

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
      
      if (data) {
        setProjects(data.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          createdAt: p.created_at
        })));
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

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/app',
      icon: Home,
      badge: null,
      description: 'Overview and quick actions'
    },
    {
      name: 'Data',
      href: '/app/data',
      icon: Database,
      badge: datasets.length || null,
      description: 'Manage datasets'
    },
    {
      name: 'Feature Engineering',
      href: '/app/feature-engineering',
      icon: Sparkles,
      badge: null,
      description: 'Create features'
    },
    {
      name: 'Models',
      href: '/app/train',
      icon: Brain,
      badge: models?.length || null,
      description: 'Train and deploy models'
    },
    {
      name: 'Pipelines',
      href: '/app/pipeline',
      icon: GitBranch,
      badge: null,
      description: 'Build ML pipelines'
    },
    {
      name: 'Evaluation',
      href: '/app/evaluate',
      icon: BarChart3,
      badge: null,
      description: 'Evaluate models'
    },
    {
      name: 'Monitoring',
      href: '/app/monitoring',
      icon: Activity,
      badge: null,
      description: 'Monitor performance'
    },
    {
      name: 'Deployments',
      href: '/app/deploy',
      icon: Zap,
      badge: null,
      description: 'Deploy models'
    },
    {
      name: 'Visualizations',
      href: '/app/visualizations',
      icon: LineChart,
      badge: null,
      description: 'Data insights'
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
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DF</span>
            </div>
            <span className="text-lg font-bold text-white">
              DataFlowHub
            </span>
          </Link>
        )}
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
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
                  <FolderKanban className="w-5 h-5 text-indigo-400 flex-shrink-0" />
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
            {isCollapsed && <FolderKanban className="w-5 h-5 text-indigo-400" />}
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
                        <Check className="w-4 h-4 text-indigo-400 flex-shrink-0 ml-2" />
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
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center text-indigo-400"
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
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
                title={isCollapsed ? item.name : ''}
              >
                <item.icon className={`flex-shrink-0 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'} ${
                  active ? 'text-white' : 'text-gray-400 group-hover:text-white'
                }`} />
                
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge !== null && (
                      <span className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        active 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>

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
                  <Brain className="w-3.5 h-3.5 text-purple-400" />
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
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="ml-1 text-xs font-semibold text-white">{models?.length || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;