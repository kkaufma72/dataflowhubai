import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMLContext } from '../context/MLContext';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { MLModel } from '../types';
import { 
  Activity, 
  BarChart2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Database,
  Bell,
  Zap,
  AlertTriangle
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import RealTimeMonitoring from '../components/monitoring/RealTimeMonitoring';
import PremiumFeatureGate from '../components/common/PremiumFeatureGate';
const ModelPerformanceDashboard = React.lazy(() => import('../components/monitoring/ModelPerformanceDashboard'));
import toast from 'react-hot-toast';

const ModelMonitoringContent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { models, datasets, updateModelStatus } = useMLContext();
  const { startCheckout, loading: checkoutLoading } = useStripeCheckout();
  const modelId = searchParams.get('model');
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [activeTab, setActiveTab] = useState<'realtime' | 'performance'>('realtime');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [notifications, setNotifications] = useState<{
    id: string;
    type: 'drift' | 'performance' | 'system';
    message: string;
    timestamp: string;
    read: boolean;
  }[]>([
    {
      id: '1',
      type: 'drift',
      message: 'Data drift detected in feature "income"',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false
    },
    {
      id: '2',
      type: 'performance',
      message: 'Model accuracy dropped by 5% in the last hour',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      read: false
    }
  ]);

  useEffect(() => {
    const model = models.find(m => m.id === modelId);
    if (model) {
      setSelectedModel(model);
    } else if (models.length > 0) {
      // If no model ID is provided or the ID is invalid, select the first deployed model
      const deployedModel = models.find(m => m.status === 'deployed');
      if (deployedModel) {
        setSelectedModel(deployedModel);
        navigate(`/app/monitoring?model=${deployedModel.id}`);
      } else {
        // If no deployed model exists, select the first trained model
        const trainedModel = models.find(m => m.status === 'trained');
        if (trainedModel) {
          setSelectedModel(trainedModel);
          navigate(`/app/monitoring?model=${trainedModel.id}`);
        }
      }
    }
  }, [modelId, models, navigate]);

  const deployedModels = models.filter(m => m.status === 'deployed');
  const currentIndex = deployedModels.findIndex(m => m.id === selectedModel?.id);

  const handleModelChange = (direction: 'prev' | 'next') => {
    if (!selectedModel || deployedModels.length <= 1) return;

    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? deployedModels.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === deployedModels.length - 1 ? 0 : currentIndex + 1;
    }

    const newModel = deployedModels[newIndex];
    navigate(`/app/monitoring?model=${newModel.id}`);
  };

  const handleRetrainRequest = () => {
    if (!selectedModel) return;
    
    // Update model status to simulate retraining
    setTimeout(() => {
      if (selectedModel) {
        const updatedMetrics = {
          ...selectedModel.metrics,
          accuracy: Math.min(0.98, (selectedModel.metrics?.accuracy || 0.8) + 0.05),
          precision: Math.min(0.98, (selectedModel.metrics?.precision || 0.8) + 0.04),
          recall: Math.min(0.98, (selectedModel.metrics?.recall || 0.8) + 0.03),
          f1Score: Math.min(0.98, (selectedModel.metrics?.f1Score || 0.8) + 0.04)
        };
        
        updateModelStatus(selectedModel.id, 'deployed', updatedMetrics);
        toast.success('Model has been retrained and redeployed with improved performance');
        
        // Add notification
        const newNotification = {
          id: Date.now().toString(),
          type: 'system' as const,
          message: 'Model has been successfully retrained and redeployed',
          timestamp: new Date().toISOString(),
          read: false
        };
        
        setNotifications([newNotification, ...notifications]);
      }
    }, 3000);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  if (!selectedModel) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
          <Activity className="w-6 h-6 text-primary-600" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No models available for monitoring</h3>
        <p className="mt-1 text-sm text-gray-500">
          Deploy a model first to monitor its performance (Pro feature)
        </p>
        <Button 
          className="mt-4" 
          onClick={() => startCheckout({ tier: 'professional', billing: 'monthly' })}
          disabled={checkoutLoading}
        >
          Upgrade to Pro
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header - Improved visibility */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Model Monitoring
            </h1>
            <p className="mt-2 text-lg text-gray-600 font-medium">
              Monitor model performance and detect drift in real-time
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between mb-6 md:flex-row md:items-center">
        <div className="hidden"></div>
        <div className="flex items-center mt-4 space-x-4 md:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              icon={<Bell className="w-4 h-4" />}
            >
              Notifications
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </Button>
            {notifications.length > 0 && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="p-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary-600 hover:text-primary"
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    <div>
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-gray-200 ${
                            !notification.read ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-start">
                            {notification.type === 'drift' ? (
                              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                            ) : notification.type === 'performance' ? (
                              <Activity className="w-5 h-5 text-red-500 mt-0.5" />
                            ) : (
                              <Zap className="w-5 h-5 text-primary mt-0.5" />
                            )}
                            <div className="ml-3 flex-1">
                              <p className="text-sm text-gray-900">{notification.message}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg mr-4">
            <Database className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{selectedModel.name}</h2>
            <p className="text-sm text-gray-500">
              {selectedModel.description}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleModelChange('prev')}
            disabled={deployedModels.length <= 1}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleModelChange('next')}
            disabled={deployedModels.length <= 1}
            icon={<ChevronRight className="w-4 h-4 ml-1" />}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveTab('realtime')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'realtime'
                  ? 'border-primary text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Real-Time Monitoring
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'performance'
                  ? 'border-primary text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Performance Dashboard
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'realtime' && (
        <RealTimeMonitoring
          model={selectedModel}
          onRetrainRequest={handleRetrainRequest}
        />
      )}

      {activeTab === 'performance' && (
        <React.Suspense fallback={<div className="h-64 flex items-center justify-center">Loading performance...</div>}>
          <ModelPerformanceDashboard
            model={selectedModel}
            timeRange={timeRange}
          />
        </React.Suspense>
      )}
    </div>
  );
};

const ModelMonitoring: React.FC = () => {
  return (
    <PremiumFeatureGate feature="monitoring">
      <ModelMonitoringContent />
    </PremiumFeatureGate>
  );
};

export default ModelMonitoring;