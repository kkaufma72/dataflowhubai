import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Database, 
  Zap, 
  Upload, 
  BarChart3, 
  Settings, 
  User, 
  Home,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  Command
} from 'lucide-react';
import { useMLContext } from '../../context/MLContext';
import toast from 'react-hot-toast';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'navigation' | 'dataset' | 'model' | 'action' | 'recent';
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { datasets, models, currentProject } = useMLContext();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Navigation items
  const navigationItems: SearchItem[] = [
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      subtitle: 'View overview and metrics',
      category: 'navigation',
      icon: <Home className="w-5 h-5 text-blue-500" />,
      action: () => {
        navigate('/app');
        onClose();
      },
      keywords: ['home', 'overview', 'main']
    },
    {
      id: 'nav-data',
      title: 'Data Management',
      subtitle: 'Manage your datasets',
      category: 'navigation',
      icon: <Database className="w-5 h-5 text-green-500" />,
      action: () => {
        navigate('/app/data');
        onClose();
      },
      keywords: ['datasets', 'upload', 'files']
    },
    {
      id: 'nav-models',
      title: 'Models',
      subtitle: 'Train and manage models',
      category: 'navigation',
      icon: <Zap className="w-5 h-5 text-primary" />,
      action: () => {
        navigate('/app/models');
        onClose();
      },
      keywords: ['ml', 'training', 'ai']
    },
    {
      id: 'nav-analytics',
      title: 'Analytics',
      subtitle: 'View insights and reports',
      category: 'navigation',
      icon: <BarChart3 className="w-5 h-5 text-orange-500" />,
      action: () => {
        navigate('/app/analytics');
        onClose();
      },
      keywords: ['charts', 'graphs', 'insights']
    },
    {
      id: 'nav-settings',
      title: 'Settings',
      subtitle: 'Configure your account',
      category: 'navigation',
      icon: <Settings className="w-5 h-5 text-gray-500" />,
      action: () => {
        navigate('/app/settings');
        onClose();
      },
      keywords: ['preferences', 'config']
    },
    {
      id: 'nav-profile',
      title: 'Profile',
      subtitle: 'View your profile',
      category: 'navigation',
      icon: <User className="w-5 h-5 text-primary" />,
      action: () => {
        navigate('/app/profile');
        onClose();
      },
      keywords: ['account', 'user']
    }
  ];

  // Quick actions
  const quickActions: SearchItem[] = [
    {
      id: 'action-upload',
      title: 'Upload Dataset',
      subtitle: 'Add a new dataset',
      category: 'action',
      icon: <Upload className="w-5 h-5 text-blue-500" />,
      action: () => {
        navigate('/app/data');
        onClose();
        toast.success('Opening dataset uploader...');
      },
      keywords: ['add', 'new', 'import']
    },
    {
      id: 'action-generate',
      title: 'Generate Sample Data',
      subtitle: 'Create synthetic dataset',
      category: 'action',
      icon: <Sparkles className="w-5 h-5 text-primary" />,
      action: () => {
        navigate('/app/data');
        onClose();
        toast.success('Opening sample data generator...');
      },
      keywords: ['synthetic', 'demo', 'test']
    },
    {
      id: 'action-train',
      title: 'Train New Model',
      subtitle: 'Start model training',
      category: 'action',
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
      action: () => {
        navigate('/app/models');
        onClose();
        toast.success('Opening model trainer...');
      },
      keywords: ['ml', 'train', 'build']
    }
  ];

  // Dataset items
  const datasetItems: SearchItem[] = datasets.map(dataset => ({
    id: `dataset-${dataset.id}`,
    title: dataset.name,
    subtitle: `${dataset.row_count?.toLocaleString()} rows • ${dataset.column_count} columns`,
    category: 'dataset',
    icon: <Database className="w-5 h-5 text-green-500" />,
    action: () => {
      navigate('/app/data');
      onClose();
      toast.success(`Opening ${dataset.name}`);
    },
    keywords: [dataset.file_type || '', dataset.description || '']
  }));

  // Model items
  const modelItems: SearchItem[] = (models || []).map(model => ({
    id: `model-${model.id}`,
    title: model.name,
    subtitle: model.status || 'Ready',
    category: 'model',
    icon: <Zap className="w-5 h-5 text-primary" />,
    action: () => {
      navigate('/app/models');
      onClose();
      toast.success(`Opening ${model.name}`);
    },
    keywords: [model.algorithm || '', model.status || '']
  }));

  // Combine all items
  const allItems = useMemo(() => [
    ...navigationItems,
    ...quickActions,
    ...datasetItems,
    ...modelItems
  ], [datasets, models]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      // Show recent searches and quick actions when no query
      return [...quickActions, ...navigationItems.slice(0, 4)];
    }

    const lowerQuery = query.toLowerCase();
    return allItems.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(lowerQuery);
      const subtitleMatch = item.subtitle?.toLowerCase().includes(lowerQuery);
      const keywordMatch = item.keywords?.some(k => k.toLowerCase().includes(lowerQuery));
      
      return titleMatch || subtitleMatch || keywordMatch;
    });
  }, [query, allItems, quickActions, navigationItems]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    
    return groups;
  }, [filteredItems]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (itemsRef.current[selectedIndex]) {
      itemsRef.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          executeAction(filteredItems[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const executeAction = (item: SearchItem) => {
    // Save to recent searches
    if (query.trim()) {
      const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    }
    
    item.action();
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      navigation: 'Navigation',
      dataset: 'Datasets',
      model: 'Models',
      action: 'Quick Actions',
      recent: 'Recent'
    };
    return labels[category] || category;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="absolute top-[15%] left-1/2 transform -translate-x-1/2 w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-gray-200 bg-gray-50">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search datasets, models, or navigate..."
              className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 outline-none text-base"
            />
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm">ESC</kbd>
              <span>to close</span>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No results found</p>
                <p className="text-gray-400 text-xs mt-1">Try a different search term</p>
              </div>
            ) : (
              Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                    {getCategoryLabel(category)}
                  </div>
                  {items.map((item, idx) => {
                    const globalIndex = filteredItems.indexOf(item);
                    const isSelected = globalIndex === selectedIndex;
                    
                    return (
                      <div
                        key={item.id}
                        ref={el => itemsRef.current[globalIndex] = el}
                        className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-primary/5 border-l-2 border-primary' 
                            : 'hover:bg-gray-50 border-l-2 border-transparent'
                        }`}
                        onClick={() => executeAction(item)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              isSelected ? 'text-primary-900' : 'text-gray-900'
                            }`}>
                              {item.title}
                            </p>
                            {item.subtitle && (
                              <p className="text-xs text-gray-500 truncate">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                        <ArrowRight className={`w-4 h-4 flex-shrink-0 ml-2 ${
                          isSelected ? 'text-primary' : 'text-gray-400'
                        }`} />
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm">↵</kbd>
                <span>Select</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Command className="w-3 h-3" />
              <span>+</span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm">K</kbd>
              <span>to open</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;