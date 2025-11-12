import React, { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { 
  Database, 
  Layers, 
  BarChart2, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  Upload,
  Sparkles,
  Brain,
  Zap,
  Activity,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { useMLContext } from '../context/MLContext';
import { useNotifications } from '../components/common/NotificationSystem';
import { useTour } from '../components/common/TourProvider';
import { useAIChat } from '../components/ai/GlobalAIAssistant';
import { useAuth } from '../components/auth/AuthProvider';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import RealTimeDashboard from '../components/dashboard/RealTimeDashboard';
import DashboardStatsSkeleton from '../components/common/DashboardStatsSkeleton';
import CardSkeleton from '../components/common/CardSkeleton';
import DatasetCard from '../components/datasets/DatasetCard';
import AddSampleDataButton from '../components/data/AddSampleDataButton';

// Lazy load onboarding components
const MagicMomentWelcome = lazy(() => import('../components/onboarding/MagicMomentWelcome'));

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  href: string;
  icon: React.ComponentType<any>;
}

const Dashboard: React.FC = () => {
  const { datasets, models, isLoading, currentProject } = useMLContext();
  const { addNotification } = useNotifications();
  const { startTour } = useTour();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openChat } = useAIChat();
  const [searchParams] = useSearchParams();
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<any>(null);
  const [showMagicMoment, setShowMagicMoment] = useState(false);

  // Check if user should see Magic Moment welcome
  useEffect(() => {
    const hasSeenMagicMoment = localStorage.getItem('hasSeenMagicMoment');
    const hasSkipped = localStorage.getItem('hasSkippedMagicMoment');
    
    // Show if: first time, no datasets, and hasn't seen/skipped before
    if (!hasSeenMagicMoment && !hasSkipped && datasets.length === 0 && !isLoading && user) {
      // Small delay for smooth transition
      setTimeout(() => {
        setShowMagicMoment(true);
      }, 1000);
    }
  }, [datasets.length, isLoading, user]);

  const handleMagicMomentClose = () => {
    setShowMagicMoment(false);
    localStorage.setItem('hasSeenMagicMoment', 'true');
  };

  const handleSampleLoaded = () => {
    // Mark as complete
    localStorage.setItem('hasSeenMagicMoment', 'true');
    // Could trigger confetti or celebration here
  };

  // Handle Stripe payment success redirect
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      toast.success('Payment successful! Your subscription is now active.');
      // Clean up URL
      navigate('/app', { replace: true });
    }
  }, [searchParams, navigate]);

  // Calculate workflow progress
  useEffect(() => {
    const steps: WorkflowStep[] = [
      {
        id: 'upload',
        name: 'Upload Data',
        description: 'Upload datasets',
        status: datasets.length > 0 ? 'completed' : 'current',
        href: '/app/data',
        icon: Database
      },
      {
        id: 'features',
        name: 'Feature Engineering',
        description: 'Prepare features',
        status: datasets.length > 0 ? (models.length > 0 ? 'completed' : 'current') : 'upcoming',
        href: '/app/feature-engineering',
        icon: Sparkles
      },
      {
        id: 'train',
        name: 'Train',
        description: 'Train models',
        status: models.length > 0 ? (models.some(m => m.status === 'trained' || m.status === 'deployed') ? 'completed' : 'current') : 'upcoming',
        href: '/app/train',
        icon: Brain
      },
      {
        id: 'deploy',
        name: 'Deploy',
        description: 'Deploy to production',
        status: models.some(m => m.status === 'deployed') ? 'completed' : (models.some(m => m.status === 'trained') ? 'current' : 'upcoming'),
        href: '/app/deploy',
        icon: Zap
      },
      {
        id: 'monitor',
        name: 'Monitor',
        description: 'Monitor performance',
        status: models.some(m => m.status === 'deployed') ? 'current' : 'upcoming',
        href: '/app/monitoring',
        icon: Activity
      }
    ];
    
    setWorkflowSteps(steps);
  }, [datasets, models]);
  
  // Show welcome notification on first load
  useEffect(() => {
    if (!isLoading && currentProject) {
      const hasVisitedBefore = localStorage.getItem('hasVisitedDashboard');
      if (!hasVisitedBefore) {
        // Show contextual welcome based on whether user has data
        if (datasets.length > 0) {
          addNotification({
            type: 'success',
            title: '🎉 Welcome! Sample data loaded',
            message: 'We\'ve loaded sample datasets to help you get started. Click on a dataset to explore or upload your own!',
            duration: 8000
          });
        } else {
          addNotification({
            type: 'info',
            title: 'Welcome to DataFlowHub AI',
            message: 'Get started by uploading a dataset or use the "Add Sample Data" button to explore features.',
            duration: 6000
          });
        }
        localStorage.setItem('hasVisitedDashboard', 'true');
      }
    }
  }, [isLoading, currentProject, datasets.length, addNotification]);
  
  // Determine the next recommended step
  const getNextStep = () => {
    const currentStep = workflowSteps.find(step => step.status === 'current');
    return currentStep || workflowSteps[0];
  };
  
  const nextStep = getNextStep();

  // Memoize expensive computations to avoid re-calculating on every render
  const datasetsThisWeek = useMemo(() => {
    return datasets.filter(d => {
      const uploadDate = new Date(d.dateUploaded);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return uploadDate > weekAgo;
    }).length;
  }, [datasets]);

  const trainedModelsCount = useMemo(() =>
    models.filter(m => m.status === 'trained').length,
    [models]
  );

  const deployedModelsCount = useMemo(() =>
    models.filter(m => m.status === 'deployed').length,
    [models]
  );

  const trainingModelsCount = useMemo(() =>
    models.filter(m => m.status === 'training').length,
    [models]
  );

  const statsCards = useMemo(() => [
    {
      title: 'Datasets',
      value: datasets.length,
      icon: <Database className="w-8 h-8 text-blue-500" />,
      description: 'Available datasets',
      color: 'blue',
      path: '/app/data',
      change: datasets.length > 0 ? `+${datasetsThisWeek} this week` : 'Get started'
    },
    {
      title: 'Models',
      value: models.length,
      icon: <Layers className="w-8 h-8 text-indigo-500" />,
      description: 'Trained models',
      color: 'indigo',
      path: '/app/train',
      change: models.length > 0 ? `${trainedModelsCount} ready` : 'Train your first'
    },
    {
      title: 'Deployed',
      value: deployedModelsCount,
      icon: <BarChart2 className="w-8 h-8 text-emerald-500" />,
      description: 'Models in production',
      color: 'emerald',
      path: '/app/deploy',
      change: deployedModelsCount > 0 ? 'Active now' : 'Deploy first model'
    },
    {
      title: 'In Progress',
      value: trainingModelsCount,
      icon: <Clock className="w-8 h-8 text-amber-500" />,
      description: 'Training jobs',
      color: 'amber',
      path: '/app/train',
      change: trainingModelsCount > 0 ? 'Running' : 'No active jobs'
    },
  ], [datasets.length, models.length, datasetsThisWeek, trainedModelsCount, deployedModelsCount, trainingModelsCount]);

  const handlePreview = (dataset: any) => {
    setSelectedDataset(dataset);
  };

  const handleAnalyze = (dataset: any) => {
    navigate(`/app/data?analyze=${dataset.id}`);
  };

  // Handle AI Chat opening with proper error catching
  const handleOpenAIChat = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      openChat();
    } catch (error) {
      console.error('Error opening AI chat:', error);
      addNotification({
        type: 'error',
        title: 'Unable to open AI Chat',
        message: 'Please refresh the page and try again.',
        duration: 4000
      });
    }
  };

  // Start the dashboard tour automatically for new users
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('hasVisitedDashboard');
    if (!hasVisitedBefore && !isLoading) {
      const timer = setTimeout(() => {
        startTour('dashboard');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, startTour]);

  return (
    <div className="space-y-6">
      {/* AI Assistant Spotlight Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">Ask Your AI Assistant</h2>
                <p className="text-indigo-100 text-lg">
                  Get instant insights from all your datasets using natural language
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="flex items-center space-x-2 bg-white bg-opacity-10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Query across all datasets</span>
              </div>
              <div className="flex items-center space-x-2 bg-white bg-opacity-10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Create visualizations</span>
              </div>
              <div className="flex items-center space-x-2 bg-white bg-opacity-10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Train models instantly</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-3 ml-8">
            <button
              type="button"
              onClick={handleOpenAIChat}
              className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl flex items-center space-x-3 group"
            >
              <MessageSquare className="w-6 h-6" />
              <span>Open AI Chat</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="text-center text-indigo-100 text-sm">
              <kbd className="px-2 py-1 bg-white bg-opacity-20 rounded">⌘</kbd> + <kbd className="px-2 py-1 bg-white bg-opacity-20 rounded">K</kbd> to quick access
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/data')}
            className="flex items-center space-x-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all border-2 border-transparent hover:border-indigo-300"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Upload Dataset</p>
              <p className="text-sm text-gray-600">Add new data source</p>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/app/train')}
            className="flex items-center space-x-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all border-2 border-transparent hover:border-purple-300"
          >
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Train Models</p>
              <p className="text-sm text-gray-600">Start AutoML training</p>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/app/evaluate')}
            className="flex items-center space-x-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg hover:from-amber-100 hover:to-orange-100 transition-all border-2 border-transparent hover:border-amber-300"
          >
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Evaluate</p>
              <p className="text-sm text-gray-600">Test model performance</p>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/app/deploy')}
            className="flex items-center space-x-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg hover:from-emerald-100 hover:to-teal-100 transition-all border-2 border-transparent hover:border-emerald-300"
          >
            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Deploy</p>
              <p className="text-sm text-gray-600">Publish to production</p>
            </div>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <button
            type="button"
            onClick={() => navigate('/app/monitoring')}
            className="flex items-center space-x-4 p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg hover:from-cyan-100 hover:to-blue-100 transition-all border-2 border-transparent hover:border-cyan-300"
          >
            <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Monitor</p>
              <p className="text-sm text-gray-600">Track model performance</p>
            </div>
          </button>
          
          <button
            type="button"
            onClick={handleOpenAIChat}
            className="flex items-center space-x-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg hover:from-indigo-100 hover:to-purple-100 transition-all border-2 border-transparent hover:border-indigo-300"
          >
            <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Ask AI Assistant</p>
              <p className="text-sm text-gray-600">Chat with your data</p>
            </div>
          </button>
        </div>
      </div>

      {/* Workflow Progress */}
      {workflowSteps.length > 0 && (
        <div className="workflow-steps bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">ML Workflow Progress</h3>
            <span className="text-sm text-gray-600">
              {workflowSteps.filter(s => s.status === 'completed').length} of {workflowSteps.length} completed
            </span>
          </div>
          
          <div className="relative">
            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full">
              <div 
                className="h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(workflowSteps.filter(s => s.status === 'completed').length / workflowSteps.length) * 100}%` 
                }}
              />
            </div>
            
            <div className="relative flex justify-between">
              {workflowSteps.map((step) => {
                const StepIcon = step.icon;
                return (
                  <Link
                    key={step.id}
                    to={step.href}
                    className="flex flex-col items-center group"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-md transition-all ${
                      step.status === 'completed' 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : step.status === 'current'
                        ? 'bg-white text-indigo-600 ring-4 ring-indigo-100 ring-offset-2'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step.status === 'completed' ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <p className={`text-sm font-medium ${
                        step.status === 'completed' || step.status === 'current'
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }`}>
                        {step.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {nextStep && nextStep.status === 'current' && (
            <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-indigo-900">Next Step: {nextStep.name}</p>
                    <p className="text-xs text-indigo-700">{nextStep.description}</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(nextStep.href)}
                  variant="primary"
                  size="sm"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8">
        <RealTimeDashboard />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 stats-cards">
        {isLoading ? (
          <DashboardStatsSkeleton />
        ) : (
          statsCards.map((card) => (
            <Link key={card.title} to={card.path} className="block group">
              <Card className="overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 border-2 border-transparent hover:border-indigo-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">{card.title}</p>
                    <p className="mt-2 text-4xl font-bold text-gray-900">{card.value}</p>
                    <p className="mt-2 text-sm text-gray-600">{card.description}</p>
                  </div>
                  <div className={`flex items-center justify-center w-14 h-14 rounded-xl bg-${card.color}-100 group-hover:scale-110 transition-transform`}>
                    {card.icon}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">{card.change}</p>
                  <div className={`flex items-center text-sm font-medium text-${card.color}-600 group-hover:text-${card.color}-700`}>
                    View <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>

      {isLoading ? (
        <div className="mt-8 space-y-6">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Recent Datasets</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      ) : datasets.length > 0 ? (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Datasets</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/data')}
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {datasets.slice(0, 3).map((dataset) => (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                onPreview={handlePreview}
                onAnalyze={handleAnalyze}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Datasets Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Upload your first dataset to start building machine learning models or try our sample datasets with working previews.
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => navigate('/app/data')}
              variant="primary"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Dataset
            </Button>
            <AddSampleDataButton />
            <Button
              onClick={handleOpenAIChat}
              variant="outline"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Ask AI Assistant
            </Button>
          </div>
        </div>
      )}

      {models.length > 0 && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Models</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/train')}
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {models.slice(0, 3).map((model) => (
              <Card key={model.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Brain className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{model.name}</h3>
                      <p className="text-sm text-gray-500">{model.modelType || 'ML Model'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    model.status === 'deployed' 
                      ? 'bg-green-100 text-green-800'
                      : model.status === 'trained'
                      ? 'bg-blue-100 text-blue-800'
                      : model.status === 'training'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {model.status}
                  </span>
                </div>
                
                {model.metrics && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Accuracy</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {(model.metrics.accuracy * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Precision</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {(model.metrics.precision * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Recall</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {(model.metrics.recall * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/app/evaluate?model=${model.id}`)}
                    className="w-full"
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Magic Moment Welcome Modal */}
      {showMagicMoment && user && (
        <Suspense fallback={null}>
          <MagicMomentWelcome
            userProfile={{
              full_name: user.user_metadata?.full_name,
              email: user.email,
              company: user.user_metadata?.company,
              job_title: user.user_metadata?.job_title,
              use_case: user.user_metadata?.use_case,
              linkedin_url: user.user_metadata?.linkedin_url
            }}
            onClose={handleMagicMomentClose}
            onSampleLoaded={handleSampleLoaded}
          />
        </Suspense>
      )}

    </div>
  );
};

export default Dashboard;