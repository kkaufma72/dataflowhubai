// IBM Watson-Inspired Sidebar Navigation
// Clean white background with subtle borders and IBM Blue accents

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  Database,
  Brain,
  BarChart3,
  Zap,
  Activity,
  Settings,
  Sparkles,
  FileText,
  TrendingUp,
  FolderKanban
} from 'lucide-react';
import { useMLContext } from '../../context/MLContext';

const SidebarIBM: React.FC = () => {
  const location = useLocation();
  const { datasets, models } = useMLContext();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const menuItems = [
    { 
      path: '/app', 
      label: 'Dashboard', 
      icon: Home,
      exact: true
    },
    { 
      path: '/app/catalog', 
      label: 'Data Catalog', 
      icon: Database,
      badge: datasets.length 
    },
    { 
      path: '/app/data', 
      label: 'Data Management', 
      icon: FolderKanban 
    },
    { 
      path: '/app/insights', 
      label: 'Insights', 
      icon: Sparkles 
    },
    { 
      path: '/app/train?step=2', 
      label: 'Features', 
      icon: Zap 
    },
    { 
      path: '/app/train', 
      label: 'Model Training', 
      icon: Brain,
      badge: models.length 
    },
    { 
      path: '/app/evaluation', 
      label: 'Evaluation', 
      icon: TrendingUp 
    },
    { 
      path: '/app/deploy', 
      label: 'Deployment', 
      icon: Activity 
    },
    { 
      path: '/app/train?step=3', 
      label: 'Monitoring', 
      icon: BarChart3 
    },
    { 
      path: '/app/docs', 
      label: 'Documentation', 
      icon: FileText 
    }
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-800">
        <Link to="/app" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-50">DataFlow AI</h1>
            <p className="text-xs text-gray-400">Enterprise ML Platform</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact 
              ? location.pathname === item.path 
              : isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${active 
                    ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`
                    px-2 py-0.5 text-xs font-semibold rounded-full
                    ${active 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'bg-gray-100 text-gray-700'
                    }
                  `}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer - Settings */}
      <div className="px-3 py-4 border-t border-gray-200">
        <Link
          to="/app/settings"
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
            ${isActive('/app/settings')
              ? 'bg-primary-50 text-primary-700 border border-primary-200'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
            }
          `}
        >
          <Settings className={`w-5 h-5 ${isActive('/app/settings') ? 'text-primary-600' : 'text-gray-500'}`} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
};

export default SidebarIBM;
