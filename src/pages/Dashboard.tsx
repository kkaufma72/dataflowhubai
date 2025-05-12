import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import { Layers, BarChart2, Database, Clock, ArrowRight, Sparkles, Check, MessageSquare, ChevronDown, Activity, Wand2, Rocket } from 'lucide-react';
import { Plus } from 'lucide-react';
import { useMLContext } from '../context/MLContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ChatInterface from '../components/chat/ChatInterface';
import PitchDeck from '../components/marketing/PitchDeck';
import DatasetCard from '../components/data/DatasetCard';
import { Link } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import WorkflowSteps, { WorkflowStep } from '../components/workflow/WorkflowSteps';
import NextStepSuggestion from '../components/workflow/NextStepSuggestion';
import SkeletonLoader, { DashboardStatsSkeleton, CardSkeleton } from '../components/common/SkeletonLoader';
import { useTour } from '../components/common/TourProvider';
import TourButton from '../components/common/TourButton';
import { useNotifications } from '../components/common/NotificationSystem';
import NewProjectModal from '../components/common/NewProjectModal';
import RealTimeDashboard from '../components/dashboard/RealTimeDashboard';

const Dashboard = () => {
  const { datasets, models, currentProject, isLoading } = useMLContext();
  const navigate = useNavigate();
  const [showPitchDeck, setShowPitchDeck] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const { startTour } = useTour();
  const { addNotification } = useNotifications();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  
  // Determine the current workflow step based on data state
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  
  useEffect(() => {
    // Define workflow steps based on the current state
    const steps: WorkflowStep[] = [
      {
        id: 'data',
        name: 'Data',
        description: 'Prepare your data',
        status: datasets.length > 0 ? 'completed' : 'current',
        href: '/app/data'
      },
      {
        id: 'features',
        name: 'Features',
        description: 'Engineer features',
        status: datasets.length > 0 ? (models.length > 0 ? 'completed' : 'current') : 'upcoming',
        href: '/app/feature-engineering'
      },
      {
        id: 'train',
        name: 'Train',
        description: 'Train models',
        status: models.length > 0 ? (models.some(m => m.status === 'trained' || m.status === 'deployed') ? 'completed' : 'current') : 'upcoming',
        href: '/app/train'
      },
      {
        id: 'deploy',
        name: 'Deploy',
        description: 'Deploy to production',
        status: models.some(m => m.status === 'deployed') ? 'completed' : (models.some(m => m.status === 'trained') ? 'current' : 'upcoming'),
        href: '/app/deploy'
      },
      {
        id: 'monitor',
        name: 'Monitor',
        description: 'Monitor performance',
        status: models.some(m => m.status === 'deployed') ? 'current' : 'upcoming',
        href: '/app/monitoring'
      }
    ];
    
    setWorkflowSteps(steps);
  }, [datasets, models]);
  
  // Show welcome notification on first load
  useEffect(() => {
    if (!isLoading && currentProject) {
      // Check if this is the first visit
      const hasVisitedBefore = localStorage.getItem('hasVisitedDashboard');
      if (!hasVisitedBefore) {
        addNotification({
          type: 'info',
          title: 'Welcome to DataFlowHub AI',
          message: 'Get started by uploading a dataset or exploring the platform features.',
          duration: 6000
        });
        localStorage.setItem('hasVisitedDashboard', 'true');
      }
    }
  }, [isLoading, currentProject, addNotification]);
  
  // Determine the next recommended step
  const getNextStep = () => {
    const currentStep = workflowSteps.find(step => step.status === 'current');
    
    if (!currentStep) {
      return workflowSteps[0];
    }
    
    return currentStep;
  };
  
  const nextStep = getNextStep();
  
  const statsCards = [
    {
      title: 'Datasets',
      value: datasets.length,
      icon: <Database className="w-8 h-8 text-blue-500" />,
      description: 'Available datasets',
      color: 'blue',
      path: '/app/data'
    },
    {
      title: 'Models',
      value: models.length,
      icon: <Layers className="w-8 h-8 text-indigo-500" />,
      description: 'Trained models',
      color: 'indigo',
      path: '/app/train'
    },
    {
      title: 'Deployed',
      value: models.filter((model) => model.status === 'deployed').length,
      icon: <BarChart2 className="w-8 h-8 text-emerald-500" />,
      description: 'Models in production',
      color: 'emerald',
      path: '/app/deploy'
    },
    {
      title: 'In Progress',
      value: models.filter((model) => model.status === 'training').length,
      icon: <Clock className="w-8 h-8 text-amber-500" />,
      description: 'Training jobs',
      color: 'amber',
      path: '/app/train'
    },
  ];

  const handlePreview = (dataset) => {
    setSelectedDataset(dataset);
  };

  const handleAnalyze = (dataset) => {
    navigate(`/app/data?analyze=${dataset.id}`);
  };

  // Start the dashboard tour automatically for new users
  useEffect(() => {
    // Check if this is the first visit
    const hasVisitedBefore = localStorage.getItem('hasVisitedDashboard');
    if (!hasVisitedBefore && !isLoading) {
      // Set a small delay to ensure the UI is fully rendered
      const timer = setTimeout(() => {
        startTour('dashboard');
        localStorage.setItem('hasVisitedDashboard', 'true');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, startTour]);

  // Test notification
  const sendTestNotification = () => {
    addNotification({
      type: 'info',
      title: 'Notification System',
      message: 'Notifications will appear here and automatically dismiss after a few seconds.',
      duration: 4000
    });
  };

  return (
    <div>
      <PageHeader
        title="Welcome to AutoML Platform"
        description="Build, train, and deploy machine learning models with ease"
        actions={
          <div className="flex space-x-2">
            <TourButton 
              tourName="dashboard" 
              label="Take a tour"
              variant="outline"
            />
            <Button
              variant="outline"
              onClick={() => setShowPitchDeck(!showPitchDeck)}
              icon={showPitchDeck ? <ChevronDown className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            >
              {showPitchDeck ? 'Hide Presentation' : 'View Presentation'}
            </Button>
            <div>
              <Button
                onClick={() => setShowNewProjectModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                New Project
              </Button>
            </div>
          </div>
        }
      />

      {showPitchDeck && (
        <div className="mb-8">
          <PitchDeck />
        </div>
      )}

      {/* Workflow Progress */}
      <Card className="mb-6 workflow-steps">
        <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">Your ML Workflow</h2>
        {isLoading ? (
          <SkeletonLoader height={60} />
        ) : (
          <WorkflowSteps steps={workflowSteps} />
        )}
      </Card>

      {/* Next Step Suggestion */}
      {nextStep && (
        <div className="mb-6">
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <NextStepSuggestion
              title={`Next Step: ${nextStep.name}`}
              description={
                nextStep.id === 'data' 
                  ? "Upload your first dataset to get started" 
                  : nextStep.id === 'features'
                  ? "Engineer features to improve model performance"
                  : nextStep.id === 'train'
                  ? "Train your first model using your prepared data"
                  : nextStep.id === 'deploy'
                  ? "Deploy your trained model to production"
                  : "Monitor your deployed model's performance"
              }
              href={nextStep.href}
              icon={
                nextStep.id === 'data' 
                  ? Database 
                  : nextStep.id === 'features'
                  ? Wand2
                  : nextStep.id === 'train'
                  ? Layers
                  : nextStep.id === 'deploy'
                  ? Rocket
                  : Activity
              }
            />
          )}
        </div>
      )}
      
      {/* Real-time Dashboard */}
      <div className="mt-8">
        <RealTimeDashboard />
      </div>

      <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-4 stats-cards">
        {isLoading ? (
          <DashboardStatsSkeleton />
        ) : (
          statsCards.map((card) => (
            <Link key={card.title} to={card.path} className="block">
              <Card className="overflow-hidden transition-all hover:shadow-lg dark:bg-gray-800">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                    <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{card.value}</p>
                  </div>
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-lg bg-${card.color}-100 dark:bg-${card.color}-900 dark:bg-opacity-20`}
                  >
                    {card.icon}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.description}</p>
                  <div className={`flex items-center text-sm font-medium text-${card.color}-600 dark:text-${card.color}-400 hover:text-${card.color}-700 dark:hover:text-${card.color}-300`}>
                    View <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>

      {isLoading ? (
        <div className="mt-8 space-y-6">
          <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">Recent Datasets</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      ) : datasets.length > 0 ? (
        <div className="mt-8 dataset-cards">
          <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">Recent Datasets</h2>
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
          {datasets.length > 3 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => navigate('/app/data')}
              >
                View All Datasets
              </Button>
            </div>
          )}
        </div>
      ) : null}

      <div className="grid gap-6 mt-8 lg:grid-cols-3">
        <Card
          title="Quick Actions"
          className="lg:col-span-1 transition-all hover:shadow-lg dark:bg-gray-800 quick-actions"
        >
          <div className="flex flex-col space-y-3">
            <Button
              variant="outline"
              className="justify-start transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-700"
              icon={<Database className="w-4 h-4" />}
              onClick={() => navigate('/app/data')}
            >
              Upload new dataset
            </Button>
            <Button
              variant="outline"
              className="justify-start transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-700"
              icon={<Layers className="w-4 h-4" />}
              onClick={() => navigate('/app/train')}
              disabled={datasets.length === 0}
            >
              Train new model
            </Button>
            <Button
              variant="outline"
              className="justify-start transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-700"
              icon={<BarChart2 className="w-4 h-4" />}
              onClick={() => navigate('/app/evaluate')}
              disabled={models.filter(m => m.status === 'trained').length === 0}
            >
              Evaluate models
            </Button>
            <Button
              variant="outline"
              className="justify-start transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-700"
              icon={<Sparkles className="w-4 h-4" />}
              onClick={() => navigate('/app/deploy')}
              disabled={models.filter(m => m.status === 'trained').length === 0}
            >
              Deploy model
            </Button>
            <Button
              variant="outline"
              className="justify-start transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-700"
              icon={<Activity className="w-4 h-4" />}
              onClick={() => navigate('/async-workloads')}
            >
              View Async Workloads
            </Button>
          </div>
        </Card>

        <Card
          title="Recent Activity"
          className="lg:col-span-1 transition-all hover:shadow-lg dark:bg-gray-800"
        >
          {isLoading ? (
            <div className="space-y-4">
              <SkeletonLoader count={3} height={60} />
            </div>
          ) : models.length > 0 ? (
            <div className="space-y-4">
              {models.slice(0, 3).map((model) => (
                <div key={model.id} className="flex items-start">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    model.status === 'trained' ? 'bg-green-100 dark:bg-green-900 dark:bg-opacity-20' : 
                    model.status === 'training' ? 'bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-20' : 
                    model.status === 'deployed' ? 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-20' : 'bg-red-100 dark:bg-red-900 dark:bg-opacity-20'
                  }`}>
                    {model.status === 'trained' && <Check className="w-4 h-4 text-green-600 dark:text-green-400" />}
                    {model.status === 'training' && <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />}
                    {model.status === 'deployed' && <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    {model.status === 'failed' && <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {model.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {model.status === 'trained' && 'Model training completed'}
                      {model.status === 'training' && 'Model is currently training'}
                      {model.status === 'deployed' && 'Model deployed to production'}
                      {model.status === 'failed' && 'Model training failed'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(model.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2 dark:border-gray-700 dark:text-gray-300"
                onClick={() => navigate('/app/data')}
              >
                Upload dataset to get started
              </Button>
            </div>
          )}
        </Card>

        <Card
          title="AI Assistant"
          className="lg:col-span-1 transition-all hover:shadow-lg dark:bg-gray-800"
        >
          <div className="flex items-center mb-4">
            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Ask questions about your data and models</span>
          </div>
          <ChatInterface />
        </Card>
      </div>
      
      {/* New Project Modal */}
      <NewProjectModal 
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />
    </div>
  );
};

export default Dashboard;