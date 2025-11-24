import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, CheckCircle, Upload, Sparkles, Zap, Rocket, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

interface Task {
  id: string;
  label: string;
  description: string;
  route: string;
  icon: React.ElementType;
  complete: boolean;
}

export const OnboardingChecklist: React.FC = () => {
  const { user } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check localStorage for completed tasks
  const getCompletedTasks = () => {
    const stored = localStorage.getItem(`onboarding_${user?.id}`);
    return stored ? JSON.parse(stored) : {};
  };

  const [completedTasks, setCompletedTasks] = useState(getCompletedTasks());

  const tasks: Task[] = [
    {
      id: 'upload_dataset',
      label: 'Upload your first dataset',
      description: 'Import data to start analyzing',
      route: '/app/data',
      icon: Upload,
      complete: completedTasks.upload_dataset || false
    },
    {
      id: 'ask_ai',
      label: 'Ask AI a question',
      description: 'Try natural language queries',
      route: '/app/insights',
      icon: Sparkles,
      complete: completedTasks.ask_ai || false
    },
    {
      id: 'train_model',
      label: 'Train your first model',
      description: 'One-click AutoML training',
      route: '/app/train',
      icon: Zap,
      complete: completedTasks.train_model || false
    },
    {
      id: 'deploy_model',
      label: 'Deploy to production',
      description: 'Get your API endpoint',
      route: '/app/deploy',
      icon: Rocket,
      complete: completedTasks.deploy_model || false
    },
    {
      id: 'invite_team',
      label: 'Invite a team member',
      description: 'Collaborate with your team',
      route: '/app/settings',
      icon: Users,
      complete: completedTasks.invite_team || false
    }
  ];

  const progress = tasks.filter(t => t.complete).length;
  const total = tasks.length;
  const percentage = Math.round((progress / total) * 100);
  const isComplete = progress === total;

  // Auto-dismiss when complete (after 5 seconds)
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        setIsDismissed(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  // Save to localStorage when tasks complete
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(completedTasks));
    }
  }, [completedTasks, user?.id]);

  // Check if dismissed permanently
  useEffect(() => {
    const dismissed = localStorage.getItem(`onboarding_dismissed_${user?.id}`);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, [user?.id]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (user?.id) {
      localStorage.setItem(`onboarding_dismissed_${user.id}`, 'true');
    }
  };

  const handleTaskClick = (taskId: string) => {
    // Mark task as complete when clicked
    setCompletedTasks((prev: any) => ({
      ...prev,
      [taskId]: true
    }));
  };

  if (isDismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-xl shadow-2xl border-2 border-indigo-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {progress}/{total}
              </span>
            </div>
            <div>
              <p className="font-bold text-white">Getting Started</p>
              <p className="text-xs text-indigo-100">{percentage}% complete</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white/80 hover:text-white transition-colors p-1"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors p-1"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {!isMinimized && (
          <div className="mt-3">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      {!isMinimized && (
        <div className="p-4">
          {isComplete ? (
            // Celebration View
            <div className="text-center py-6">
              <div className="text-6xl mb-3">🎉</div>
              <p className="text-xl font-bold text-gray-900 mb-2">
                Awesome! You're all set!
              </p>
              <p className="text-sm text-gray-600 mb-4">
                You've completed the getting started guide. You're ready to build amazing models!
              </p>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Start Building
              </button>
            </div>
          ) : (
            // Task List View
            <div className="space-y-2">
              {tasks.map(task => (
                <Link
                  key={task.id}
                  to={task.route}
                  onClick={() => handleTaskClick(task.id)}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg transition-all group
                    ${task.complete
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200'
                    }
                  `}
                >
                  {/* Icon/Checkbox */}
                  <div className="flex-shrink-0 mt-0.5">
                    {task.complete ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full group-hover:border-indigo-400 transition-colors" />
                    )}
                  </div>

                  {/* Task Icon */}
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${task.complete ? 'bg-green-100' : 'bg-indigo-100 group-hover:bg-indigo-200'}
                    transition-colors
                  `}>
                    <task.icon className={`w-4 h-4 ${task.complete ? 'text-green-600' : 'text-indigo-600'}`} />
                  </div>

                  {/* Task Details */}
                  <div className="flex-1 min-w-0">
                    <p className={`
                      text-sm font-medium
                      ${task.complete ? 'text-gray-500 line-through' : 'text-gray-900'}
                    `}>
                      {task.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {task.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Footer Tip */}
          {!isComplete && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                💡 Click any task to get started
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OnboardingChecklist;
