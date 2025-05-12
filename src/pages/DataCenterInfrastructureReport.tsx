import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { 
  Activity, 
  Server, 
  Thermometer, 
  BarChart2, 
  AlertCircle, 
  Clock, 
  Download,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import Button from '../components/common/Button';

const DataCenterInfrastructureReport: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  // Sample data for the report
  const metrics = {
    powerUsage: 84.3,
    powerTrend: -2.1,
    temperature: 22.6,
    temperatureTrend: 0.4,
    humidity: 45.2,
    humidityTrend: -0.5,
    coolingEfficiency: 92.1,
    coolingEfficiencyTrend: 1.3,
    serverUtilization: 78.6,
    serverUtilizationTrend: 3.2,
    networkLatency: 4.3,
    networkLatencyTrend: -0.7,
    storageCapacity: 72.5,
    storageCapacityTrend: 5.1,
    incidentCount: 3,
    incidentCountTrend: -1
  };

  // Sample alerts data
  const alerts = [
    { id: 1, type: 'warning', message: 'High temperature detected in Server Rack B3', timestamp: '2025-05-10T08:42:15Z' },
    { id: 2, type: 'critical', message: 'Power supply failure in UPS #2', timestamp: '2025-05-09T14:23:47Z' },
    { id: 3, type: 'info', message: 'Scheduled maintenance completed for cooling system', timestamp: '2025-05-08T19:15:32Z' },
  ];

  // Sample resource usage data
  const resourceUsageData = {
    cpu: [62, 58, 69, 53, 78, 82, 74, 65, 58, 64, 72, 77],
    memory: [54, 53, 61, 58, 63, 68, 72, 73, 69, 68, 74, 76],
    network: [42, 43, 45, 46, 51, 55, 59, 64, 65, 61, 58, 53],
    storage: [65, 66, 68, 71, 74, 78, 82, 83, 85, 87, 88, 90]
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
              <Server className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Data Center Infrastructure Report</h3>
              <p className="text-sm text-gray-500">
                Comprehensive analysis of data center performance and efficiency
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-4 h-4" />}
            >
              Export Report
            </Button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="p-4 mb-6 bg-indigo-50 rounded-lg">
          <h4 className="mb-3 text-base font-medium text-indigo-900">Executive Summary</h4>
          <p className="text-sm text-indigo-800">
            Data center operations have maintained 99.98% uptime over the past {timeRange}, with power efficiency improving by 2.1%. 
            Three incidents were recorded, a 25% reduction from the previous period. Storage capacity utilization continues to trend 
            upward at 5.1%, suggesting a need for expansion planning in Q3 2025. Cooling efficiency has improved by 1.3%, 
            contributing to operational cost reductions of approximately $42,000.
          </p>
        </div>

        {/* Metrics Overview */}
        <h4 className="mb-4 text-base font-medium text-gray-900">Key Metrics</h4>
        <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Power Usage Effectiveness</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics.powerUsage}%</p>
              </div>
              <div className={`${metrics.powerTrend < 0 ? 'bg-green-100' : 'bg-red-100'} rounded-full p-2`}>
                {metrics.powerTrend < 0 ? (
                  <ArrowDownRight className={`w-5 h-5 text-green-600`} />
                ) : (
                  <ArrowUpRight className={`w-5 h-5 text-red-600`} />
                )}
              </div>
            </div>
            <div className="mt-1">
              <span className={`text-sm ${metrics.powerTrend < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.powerTrend < 0 ? '↓' : '↑'} {Math.abs(metrics.powerTrend)}%
              </span>
              <span className="text-sm text-gray-500"> from last period</span>
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Temperature</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics.temperature}°C</p>
              </div>
              <div className={`${metrics.temperatureTrend > 0.5 ? 'bg-amber-100' : 'bg-green-100'} rounded-full p-2`}>
                <Thermometer className={`w-5 h-5 ${metrics.temperatureTrend > 0.5 ? 'text-amber-600' : 'text-green-600'}`} />
              </div>
            </div>
            <div className="mt-1">
              <span className={`text-sm ${metrics.temperatureTrend < 0 ? 'text-green-600' : 'text-amber-600'}`}>
                {metrics.temperatureTrend < 0 ? '↓' : '↑'} {Math.abs(metrics.temperatureTrend)}°C
              </span>
              <span className="text-sm text-gray-500"> from last period</span>
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Cooling Efficiency</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics.coolingEfficiency}%</p>
              </div>
              <div className="bg-blue-100 rounded-full p-2">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-1">
              <span className="text-sm text-green-600">
                ↑ {metrics.coolingEfficiencyTrend}%
              </span>
              <span className="text-sm text-gray-500"> from last period</span>
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Server Utilization</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics.serverUtilization}%</p>
              </div>
              <div className="bg-purple-100 rounded-full p-2">
                <Server className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-1">
              <span className="text-sm text-purple-600">
                ↑ {metrics.serverUtilizationTrend}%
              </span>
              <span className="text-sm text-gray-500"> from last period</span>
            </div>
          </div>
        </div>

        {/* Resource Usage Chart */}
        <div className="mb-6">
          <h4 className="mb-4 text-base font-medium text-gray-900">Resource Usage Trend</h4>
          <div className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
            <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
              {/* The actual chart would be implemented here using a chart library */}
              <div className="flex flex-col items-center">
                <BarChart2 className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-gray-500">Resource usage chart visualization</p>
                <p className="text-sm text-gray-400 mt-1">Data available in the actual implementation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <h4 className="mb-4 text-base font-medium text-gray-900">Recent Alerts</h4>
        <div className="space-y-4 mb-6">
          {alerts.map(alert => (
            <div key={alert.id} className={`p-4 rounded-lg ${
              alert.type === 'critical' 
                ? 'bg-red-50 border border-red-100' 
                : alert.type === 'warning'
                ? 'bg-amber-50 border border-amber-100'
                : 'bg-blue-50 border border-blue-100'
            }`}>
              <div className="flex">
                <div className={`flex-shrink-0 w-5 h-5 ${
                  alert.type === 'critical'
                    ? 'text-red-400'
                    : alert.type === 'warning'
                    ? 'text-amber-400'
                    : 'text-blue-400'
                }`}>
                  {alert.type === 'critical' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : alert.type === 'warning' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    alert.type === 'critical'
                      ? 'text-red-800'
                      : alert.type === 'warning'
                      ? 'text-amber-800'
                      : 'text-blue-800'
                  }`}>
                    {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                  </h3>
                  <div className={`mt-2 text-sm ${
                    alert.type === 'critical'
                      ? 'text-red-700'
                      : alert.type === 'warning'
                      ? 'text-amber-700'
                      : 'text-blue-700'
                  }`}>
                    <p>{alert.message}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Model Training Logs */}
        <h4 className="mb-4 text-base font-medium text-gray-900">AI Model Training Logs</h4>
        <div className="mt-3 bg-gray-800 text-gray-200 p-4 rounded-lg overflow-x-auto font-mono text-sm">
          <pre>
            {`[2025-05-07 14:32:18] INFO: Starting model training process
[2025-05-07 14:32:19] INFO: Loading dataset from data_center_metrics table
[2025-05-07 14:32:20] INFO: Dataset loaded: 1,245,782 rows, 42 features
[2025-05-07 14:32:22] INFO: Preprocessing data...
[2025-05-07 14:32:25] INFO: Handling missing values: 0.3% of data points
[2025-05-07 14:32:28] INFO: Normalizing numerical features
[2025-05-07 14:32:30] INFO: Encoding categorical features
[2025-05-07 14:32:32] INFO: Feature engineering complete
[2025-05-07 14:32:35] INFO: Splitting dataset: 80% train, 20% test
[2025-05-07 14:32:36] INFO: Starting hyperparameter optimization
[2025-05-07 14:33:42] INFO: Hyperparameter optimization complete after 50 iterations
[2025-05-07 14:33:43] INFO: Best parameters: {"max_depth": 8, "learning_rate": 0.05, "n_estimators": 250, "subsample": 0.8, "colsample_bytree": 0.85, "min_child_weight": 3}
[2025-05-07 14:33:45] INFO: Training final model with optimized parameters
[2025-05-07 14:34:52] INFO: Model training complete
[2025-05-07 14:34:53] INFO: Evaluating model on test set
[2025-05-07 14:34:55] INFO: Test accuracy: 0.942
[2025-05-07 14:34:55] INFO: Test precision: 0.928
[2025-05-07 14:34:55] INFO: Test recall: 0.915
[2025-05-07 14:34:55] INFO: Test F1 score: 0.921
[2025-05-07 14:34:56] INFO: Saving model to disk
[2025-05-07 14:34:58] INFO: Model saved successfully
[2025-05-07T14:34:59] INFO: Total training time: 2.7 minutes`}
          </pre>
        </div>

        {/* Action Items */}
        <div className="mt-6">
          <h4 className="mb-4 text-base font-medium text-gray-900">Recommended Actions</h4>
          <div className="space-y-3">
            <div className="flex p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex-shrink-0">
                <Server className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Optimize Server Rack Configuration</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Based on thermal analysis, reconfiguring server racks B4-B8 could improve cooling efficiency by an estimated 4-6%.</p>
                </div>
                <div className="mt-3">
                  <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-100">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Schedule Preventative Maintenance</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>UPS #2 requires maintenance before the end of Q2 2025 to prevent potential failures.</p>
                </div>
                <div className="mt-3">
                  <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100">
                    Schedule Now
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex-shrink-0">
                <BarChart2 className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Storage Capacity Planning</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Current growth trends indicate storage capacity will reach 90% by Q3 2025. Begin expansion planning now to avoid performance impacts.</p>
                </div>
                <div className="mt-3">
                  <Button size="sm" variant="outline" className="text-blue-700 border-blue-300 hover:bg-blue-100">
                    View Projection
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DataCenterInfrastructureReport;