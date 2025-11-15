import React, { useState } from 'react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import { 
  Activity, 
  BarChart2, 
  Database, 
  Server, 
  Zap, 
  RefreshCw,
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { useMLContext } from '../../context/MLContext';

const RealTimeDashboard: React.FC = () => {
  const { datasets, models } = useMLContext();
  const [isLoading, setIsLoading] = useState(false);
  
  // Sample metrics data
  const metrics = {
    activeModels: models.filter(m => m.status === 'deployed').length,
    modelAccuracy: models.length > 0 ? 
      models.reduce((acc, model) => acc + (model.metrics?.accuracy || 0), 0) / models.length : 0,
    dataProcessed: datasets.reduce((acc, dataset) => acc + (dataset.rows || 0), 0),
    apiCalls: 12458,
    responseTime: 124,
    uptime: 99.98
  };

  const refreshData = () => {
    setIsLoading(true);
    // Simulate data refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Real-Time Dashboard</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
            icon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            size="sm"
            onClick={() => window.dispatchEvent(new CustomEvent('openNewProjectModal'))}
            icon={<Plus className="w-4 h-4" />}
          >
            New Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
              <BarChart2 className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Models</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.activeModels}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Avg. Accuracy</p>
              <p className="text-sm font-medium text-gray-900">{(metrics.modelAccuracy * 100).toFixed(1)}%</p>
            </div>
            <div className="w-full h-2 mt-1 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-primary-600 rounded-full" 
                style={{ width: `${metrics.modelAccuracy * 100}%` }}
              ></div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <Database className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Data Processed</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.dataProcessed.toLocaleString()} rows</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Datasets</p>
              <p className="text-sm font-medium text-gray-900">{datasets.length}</p>
            </div>
            <div className="w-full h-2 mt-1 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-green-600 rounded-full" 
                style={{ width: `${Math.min(100, datasets.length * 10)}%` }}
              ></div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
              <Zap className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">API Calls (24h)</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.apiCalls.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Avg. Response Time</p>
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-900">{metrics.responseTime} ms</p>
                <ArrowDownRight className="w-3 h-3 ml-1 text-green-500" />
                <span className="text-xs text-green-500">5%</span>
              </div>
            </div>
            <div className="w-full h-2 mt-1 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-primary-600 rounded-full" 
                style={{ width: `${Math.min(100, (metrics.responseTime / 200) * 100)}%` }}
              ></div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="ml-2 text-sm text-gray-700">API Services</span>
              </div>
              <span className="text-sm text-gray-500">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="ml-2 text-sm text-gray-700">Model Training</span>
              </div>
              <span className="text-sm text-gray-500">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="ml-2 text-sm text-gray-700">Data Processing</span>
              </div>
              <span className="text-sm text-gray-500">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="ml-2 text-sm text-gray-700">Model Deployment</span>
              </div>
              <span className="text-sm text-gray-500">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="ml-2 text-sm text-gray-700">Batch Processing</span>
              </div>
              <span className="text-sm text-gray-500">Degraded Performance</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Server className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-700">System Uptime</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{metrics.uptime}%</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { time: '10 minutes ago', event: 'Model "Customer Churn Predictor" deployed', icon: Zap, color: 'text-primary' },
              { time: '25 minutes ago', event: 'New dataset "Sales Q2 2025" uploaded', icon: Database, color: 'text-green-500' },
              { time: '1 hour ago', event: 'Model training completed with 92% accuracy', icon: BarChart2, color: 'text-primary' },
              { time: '2 hours ago', event: 'API rate limit increased to 10,000 req/min', icon: Activity, color: 'text-blue-500' },
              { time: '3 hours ago', event: 'System maintenance completed', icon: Server, color: 'text-amber-500' },
            ].map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                      <Icon className={`w-5 h-5 ${activity.color}`} />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-900">{activity.event}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

    </div>
  );
};

export default RealTimeDashboard;