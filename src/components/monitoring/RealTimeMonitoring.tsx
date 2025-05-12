import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { 
  Activity, 
  AlertTriangle, 
  BarChart2, 
  Bell, 
  Clock, 
  RefreshCw, 
  Settings, 
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Check,
  X
} from 'lucide-react';
import Button from '../common/Button';
import { MLModel } from '../../types';
import { Line, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler,
  ArcElement,
  DoughnutController
} from 'chart.js';
import toast from 'react-hot-toast';
import DriftDetection from './DriftDetection';
import PerformanceMetrics from './PerformanceMetrics';
import ABTestingPanel from './ABTestingPanel';
import AlertsConfiguration from './AlertsConfiguration';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  DoughnutController
);

interface RealTimeMonitoringProps {
  model: MLModel;
  onRetrainRequest?: () => void;
}

interface MetricPoint {
  timestamp: string;
  value: number;
}

interface DriftData {
  featureName: string;
  driftScore: number;
  status: 'normal' | 'warning' | 'critical';
}

interface Alert {
  id: string;
  type: 'drift' | 'performance' | 'system';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

const RealTimeMonitoring: React.FC<RealTimeMonitoringProps> = ({ 
  model,
  onRetrainRequest 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'drift' | 'performance' | 'abtesting' | 'alerts'>('overview');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [accuracyData, setAccuracyData] = useState<MetricPoint[]>([]);
  const [latencyData, setLatencyData] = useState<MetricPoint[]>([]);
  const [requestVolumeData, setRequestVolumeData] = useState<MetricPoint[]>([]);
  const [driftData, setDriftData] = useState<DriftData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlertsConfig, setShowAlertsConfig] = useState(false);
  const [driftDetected, setDriftDetected] = useState(false);
  const [performanceDrop, setPerformanceDrop] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainingProgress, setRetrainingProgress] = useState(0);

  // Generate sample data on component mount and when time range changes
  useEffect(() => {
    generateSampleData();
    
    if (isAutoRefresh) {
      const interval = setInterval(() => {
        generateSampleData();
        setLastUpdated(new Date());
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [timeRange, isAutoRefresh]);

  const generateSampleData = () => {
    // Generate timestamps based on selected time range
    const now = new Date();
    const points = timeRange === '1h' ? 60 : timeRange === '24h' ? 24 : timeRange === '7d' ? 7 * 24 : 30 * 24;
    const interval = timeRange === '1h' ? 60 * 1000 : 60 * 60 * 1000; // 1 minute or 1 hour
    
    // Generate accuracy data with slight downward trend to simulate drift
    const newAccuracyData: MetricPoint[] = [];
    let baseAccuracy = model.metrics?.accuracy || 0.85;
    
    for (let i = points - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * interval).toISOString();
      // Add slight downward trend and some noise
      baseAccuracy = Math.max(0.5, Math.min(1, baseAccuracy - 0.0005 + (Math.random() - 0.6) * 0.01));
      newAccuracyData.push({
        timestamp,
        value: baseAccuracy
      });
    }
    setAccuracyData(newAccuracyData);
    
    // Generate latency data
    const newLatencyData: MetricPoint[] = [];
    let baseLatency = 50; // ms
    
    for (let i = points - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * interval).toISOString();
      // Add some random variation
      baseLatency = Math.max(10, Math.min(200, baseLatency + (Math.random() - 0.5) * 10));
      newLatencyData.push({
        timestamp,
        value: baseLatency
      });
    }
    setLatencyData(newLatencyData);
    
    // Generate request volume data
    const newRequestVolumeData: MetricPoint[] = [];
    let baseVolume = 100; // requests per interval
    
    for (let i = points - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * interval).toISOString();
      // Add some random variation and time-of-day pattern
      const hourOfDay = new Date(timestamp).getHours();
      const timeOfDayFactor = 1 + Math.sin((hourOfDay - 6) * Math.PI / 12) * 0.5; // Peak at 12-18h
      baseVolume = Math.max(10, Math.min(500, baseVolume * 0.95 + Math.random() * 50 * timeOfDayFactor));
      newRequestVolumeData.push({
        timestamp,
        value: Math.round(baseVolume)
      });
    }
    setRequestVolumeData(newRequestVolumeData);
    
    // Generate drift data
    const features = ['feature1', 'feature2', 'feature3', 'feature4', 'feature5'];
    const newDriftData: DriftData[] = features.map(feature => {
      const driftScore = Math.random();
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      
      if (driftScore > 0.7) status = 'critical';
      else if (driftScore > 0.4) status = 'warning';
      
      return {
        featureName: feature,
        driftScore,
        status
      };
    });
    setDriftData(newDriftData);
    
    // Check if drift is detected
    const hasCriticalDrift = newDriftData.some(d => d.status === 'critical');
    const hasWarningDrift = newDriftData.some(d => d.status === 'warning');
    
    if (hasCriticalDrift && !driftDetected) {
      setDriftDetected(true);
      addAlert({
        type: 'drift',
        severity: 'critical',
        message: 'Critical data drift detected in one or more features',
      });
    } else if (hasWarningDrift && !driftDetected) {
      setDriftDetected(true);
      addAlert({
        type: 'drift',
        severity: 'warning',
        message: 'Potential data drift detected in one or more features',
      });
    }
    
    // Check for performance drop
    const recentAccuracy = newAccuracyData[newAccuracyData.length - 1].value;
    const pastAccuracy = newAccuracyData[0].value;
    
    if (pastAccuracy - recentAccuracy > 0.05 && !performanceDrop) {
      setPerformanceDrop(true);
      addAlert({
        type: 'performance',
        severity: 'warning',
        message: 'Model accuracy has dropped by more than 5% in the last period',
      });
    }
  };

  const addAlert = (alertData: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>) => {
    const newAlert: Alert = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      acknowledged: false,
      ...alertData
    };
    
    setAlerts(prev => [newAlert, ...prev]);
    
    // Show toast notification
    toast(
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {alertData.severity === 'critical' ? (
            <AlertTriangle className="h-5 w-5 text-red-400" />
          ) : alertData.severity === 'warning' ? (
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          ) : (
            <Info className="h-5 w-5 text-blue-400" />
          )}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">
            {alertData.severity === 'critical' ? 'Critical Alert' : 
             alertData.severity === 'warning' ? 'Warning' : 'Information'}
          </p>
          <p className="mt-1 text-sm text-gray-500">{alertData.message}</p>
        </div>
      </div>,
      {
        duration: alertData.severity === 'critical' ? 10000 : 5000,
        icon: null,
      }
    );
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const handleRefresh = () => {
    generateSampleData();
    setLastUpdated(new Date());
    toast.success('Monitoring data refreshed');
  };

  const handleRetrain = () => {
    setIsRetraining(true);
    setRetrainingProgress(0);
    
    // Simulate retraining process
    const interval = setInterval(() => {
      setRetrainingProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsRetraining(false);
            setDriftDetected(false);
            setPerformanceDrop(false);
            toast.success('Model retraining completed successfully');
            if (onRetrainRequest) onRetrainRequest();
          }, 1000);
          return 100;
        }
        return newProgress;
      });
    }, 500);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (timeRange === '1h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getAccuracyChartData = () => {
    return {
      labels: accuracyData.map(d => formatTimestamp(d.timestamp)),
      datasets: [
        {
          label: 'Accuracy',
          data: accuracyData.map(d => d.value * 100),
          borderColor: 'rgb(79, 70, 229)',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.4,
        }
      ]
    };
  };

  const getLatencyChartData = () => {
    return {
      labels: latencyData.map(d => formatTimestamp(d.timestamp)),
      datasets: [
        {
          label: 'Response Time (ms)',
          data: latencyData.map(d => d.value),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        }
      ]
    };
  };

  const getRequestVolumeChartData = () => {
    return {
      labels: requestVolumeData.map(d => formatTimestamp(d.timestamp)),
      datasets: [
        {
          label: 'Requests',
          data: requestVolumeData.map(d => d.value),
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: false,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
              <Activity className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Current Accuracy</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold text-gray-900">
                  {(accuracyData[accuracyData.length - 1]?.value * 100).toFixed(1)}%
                </p>
                {accuracyData.length > 1 && (
                  <span className={`ml-2 flex items-center text-sm ${
                    accuracyData[accuracyData.length - 1].value >= accuracyData[accuracyData.length - 2].value
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {accuracyData[accuracyData.length - 1].value >= accuracyData[accuracyData.length - 2].value ? (
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(
                      (accuracyData[accuracyData.length - 1].value - accuracyData[accuracyData.length - 2].value) * 100
                    ).toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Response Time</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold text-gray-900">
                  {latencyData[latencyData.length - 1]?.value.toFixed(1)} ms
                </p>
                {latencyData.length > 1 && (
                  <span className={`ml-2 flex items-center text-sm ${
                    latencyData[latencyData.length - 1].value <= latencyData[latencyData.length - 2].value
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {latencyData[latencyData.length - 1].value <= latencyData[latencyData.length - 2].value ? (
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(
                      latencyData[latencyData.length - 1].value - latencyData[latencyData.length - 2].value
                    ).toFixed(1)} ms
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
              <BarChart2 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Request Volume</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold text-gray-900">
                  {requestVolumeData.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
                </p>
                <span className="ml-2 text-sm text-gray-500">
                  total
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Drift Status</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold text-gray-900">
                  {driftDetected ? 'Detected' : 'Normal'}
                </p>
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  driftDetected ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                }`}>
                  {driftDetected ? 'Action Needed' : 'Stable'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Accuracy Trend</h3>
          </div>
          <div className="h-64">
            <Line data={getAccuracyChartData()} options={chartOptions} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Response Time</h3>
          </div>
          <div className="h-64">
            <Line data={getLatencyChartData()} options={chartOptions} />
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Request Volume</h3>
        </div>
        <div className="h-64">
          <Line data={getRequestVolumeChartData()} options={chartOptions} />
        </div>
      </Card>

      {(driftDetected || performanceDrop) && (
        <div className={`p-4 rounded-lg ${
          driftDetected && performanceDrop ? 'bg-red-50' : 'bg-amber-50'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className={`h-5 w-5 ${
                driftDetected && performanceDrop ? 'text-red-400' : 'text-amber-400'
              }`} />
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                driftDetected && performanceDrop ? 'text-red-800' : 'text-amber-800'
              }`}>
                {driftDetected && performanceDrop 
                  ? 'Critical: Data Drift and Performance Drop Detected' 
                  : driftDetected 
                  ? 'Warning: Data Drift Detected' 
                  : 'Warning: Performance Drop Detected'}
              </h3>
              <div className={`mt-2 text-sm ${
                driftDetected && performanceDrop ? 'text-red-700' : 'text-amber-700'
              }`}>
                <p>
                  {driftDetected && 'Significant drift detected in the input data distribution. '}
                  {performanceDrop && 'Model performance has decreased significantly. '}
                  Consider retraining the model with recent data to maintain performance.
                </p>
              </div>
              <div className="mt-4">
                {isRetraining ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Retraining progress</span>
                      <span className="text-sm font-medium text-gray-700">{Math.round(retrainingProgress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${retrainingProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={handleRetrain}
                    icon={<RefreshCw className="w-4 h-4" />}
                  >
                    Retrain Model
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <input
              id="auto-refresh"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              checked={isAutoRefresh}
              onChange={() => setIsAutoRefresh(!isAutoRefresh)}
            />
            <label htmlFor="auto-refresh" className="ml-2 block text-sm text-gray-900">
              Auto-refresh
            </label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Real-Time Model Monitoring</h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor model performance, detect drift, and receive alerts
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              onClick={() => setActiveTab('alerts')}
            >
              Alerts
              {alerts.filter(a => !a.acknowledged).length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {alerts.filter(a => !a.acknowledged).length}
                </span>
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<Settings className="w-4 h-4" />}
            onClick={() => setShowAlertsConfig(!showAlertsConfig)}
          >
            Configure
          </Button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('drift')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'drift'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Drift Detection
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'performance'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setActiveTab('abtesting')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'abtesting'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            A/B Testing
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && renderOverviewTab()}
      
      {activeTab === 'drift' && (
        <DriftDetection 
          driftData={driftData} 
          onRetrainRequest={handleRetrain}
          isRetraining={isRetraining}
          retrainingProgress={retrainingProgress}
        />
      )}
      
      {activeTab === 'performance' && (
        <PerformanceMetrics
          accuracyData={accuracyData}
          latencyData={latencyData}
          requestVolumeData={requestVolumeData}
          timeRange={timeRange}
          formatTimestamp={formatTimestamp}
        />
      )}
      
      {activeTab === 'abtesting' && (
        <ABTestingPanel model={model} />
      )}
      
      {activeTab === 'alerts' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Alert History</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAlerts(alerts.map(a => ({ ...a, acknowledged: true })))}
              disabled={alerts.filter(a => !a.acknowledged).length === 0}
            >
              Acknowledge All
            </Button>
          </div>
          
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
              <p className="mt-1 text-sm text-gray-500">
                No alerts have been generated for this model yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg ${
                    alert.acknowledged 
                      ? 'bg-gray-50' 
                      : alert.severity === 'critical'
                      ? 'bg-red-50'
                      : alert.severity === 'warning'
                      ? 'bg-amber-50'
                      : 'bg-blue-50'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {alert.severity === 'critical' ? (
                        <AlertTriangle className={`h-5 w-5 ${alert.acknowledged ? 'text-gray-400' : 'text-red-400'}`} />
                      ) : alert.severity === 'warning' ? (
                        <AlertTriangle className={`h-5 w-5 ${alert.acknowledged ? 'text-gray-400' : 'text-amber-400'}`} />
                      ) : (
                        <Info className={`h-5 w-5 ${alert.acknowledged ? 'text-gray-400' : 'text-blue-400'}`} />
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium ${
                          alert.acknowledged 
                            ? 'text-gray-700' 
                            : alert.severity === 'critical'
                            ? 'text-red-800'
                            : alert.severity === 'warning'
                            ? 'text-amber-800'
                            : 'text-blue-800'
                        }`}>
                          {alert.type === 'drift' 
                            ? 'Data Drift Alert' 
                            : alert.type === 'performance'
                            ? 'Performance Alert'
                            : 'System Alert'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <p className={`mt-1 text-sm ${
                        alert.acknowledged 
                          ? 'text-gray-600' 
                          : alert.severity === 'critical'
                          ? 'text-red-700'
                          : alert.severity === 'warning'
                          ? 'text-amber-700'
                          : 'text-blue-700'
                      }`}>
                        {alert.message}
                      </p>
                      {!alert.acknowledged && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {showAlertsConfig && (
        <AlertsConfiguration 
          onClose={() => setShowAlertsConfig(false)}
          onSave={(config) => {
            setShowAlertsConfig(false);
            toast.success('Alert configuration saved');
          }}
        />
      )}
    </div>
  );
};

export default RealTimeMonitoring;