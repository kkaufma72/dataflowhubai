/**
 * Floating AI Assistant - Proactive Help
 * 
 * Appears on page load asking how to help manage data
 */

import React, { useState, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Database, Upload, FolderOpen, Lightbulb } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../auth/AuthProvider';

interface FloatingAIAssistantProps {
  onAction?: (action: 'upload' | 'organize' | 'analyze' | 'search') => void;
}

const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({ onAction }) => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  // Show on first visit or after delay
  useEffect(() => {
    const hasSeenAssistant = sessionStorage.getItem('hasSeenDataAssistant');
    
    if (!hasSeenAssistant && !hasShown) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasShown(true);
        sessionStorage.setItem('hasSeenDataAssistant', 'true');
      }, 2000); // Show after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [hasShown]);

  const quickActions = [
    {
      id: 'upload',
      label: 'Upload New Dataset',
      icon: Upload,
      color: 'blue',
      description: 'Import CSV, Excel, or JSON files'
    },
    {
      id: 'organize',
      label: 'Organize My Data',
      icon: FolderOpen,
      color: 'green',
      description: 'Arrange datasets into buckets'
    },
    {
      id: 'analyze',
      label: 'Analyze Dataset',
      icon: Sparkles,
      color: 'purple',
      description: 'Get AI insights and statistics'
    },
    {
      id: 'search',
      label: 'Search Datasets',
      icon: Database,
      color: 'indigo',
      description: 'Find specific data quickly'
    }
  ];

  const handleAction = (actionId: string) => {
    onAction?.(actionId as any);
    setIsMinimized(true);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary to-primary-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group hover:scale-110 z-40"
      >
        <Bot className="w-6 h-6 text-white" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary to-primary-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group hover:scale-110 z-40"
      >
        <Bot className="w-6 h-6 text-white" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
      </button>
    );
  }

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border-2 border-primary/20 z-50 animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-600 p-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">AI Data Assistant</h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-white/90 text-sm">Online & ready to help</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Greeting */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-primary/5 to-primary/5 rounded-xl p-4 border border-primary/10">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-900 font-semibold text-base">
                  👋 Hi {userName}!
                </p>
                <p className="text-gray-700 mt-1">
                  How can I help you manage your data today?
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 flex items-center">
            <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
            Quick Actions:
          </p>
          
          {quickActions.map((action) => {
            // Fixed: Direct color classes (Tailwind can't process dynamic classes)
            const colorClasses = {
              blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
              green: { bg: 'bg-green-100', text: 'text-green-600' },
              purple: { bg: 'bg-primary/10', text: 'text-primary-600' },
              indigo: { bg: 'bg-primary/10', text: 'text-primary-600' }
            }[action.color] || { bg: 'bg-gray-100', text: 'text-gray-600' };

            return (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="w-full text-left p-3 rounded-xl border-2 border-gray-200 hover:border-primary-400 hover:bg-primary/5 transition-all duration-200 group"
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 ${colorClasses.bg} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <action.icon className={`w-5 h-5 ${colorClasses.text}`} />
                  </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600">
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
            );
          })}
        </div>

        {/* Tips */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>💡 Pro tip:</strong> Use the search bar to quickly find datasets, or drag them into buckets to organize your workflow!
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-4 flex items-center justify-between">
        <button
          onClick={() => setIsMinimized(true)}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium"
        >
          Minimize
        </button>
        <button
          onClick={handleClose}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium"
        >
          Don't show again
        </button>
      </div>
    </div>
  );
};

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-up {
    from {
      transform: translateY(100px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .animate-slide-up {
    animation: slide-up 0.4s ease-out;
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}

export default FloatingAIAssistant;

