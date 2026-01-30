import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  AlertCircle,
  Download,
  RefreshCw,
  Filter
} from 'lucide-react';
import Button from '../common/Button';
import { MLModel } from '../../types';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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
import * as d3 from 'd3';

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

interface ModelPerformanceDashboardProps {
  model: MLModel;
  timeRange?: '1h' | '24h' | '7d' | '30d';
}

interface PerformanceData {
  timestamp: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  latency: number;
  requests: number;
  errors: number;
}

const ModelPerformanceDashboard: React.FC<ModelPerformanceDashboardProps> = ({
  model,
  timeRange = '24h'
}) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'precision' | 'recall' | 'f1Score'>('accuracy');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minAccuracy: 0,
    showErrors: true,
    userSegment: 'all'
  });

  useEffect(() => {
    // Simulate loading performance data
    setIsLoading(true);
    setTimeout(() => {
      setPerformanceData(generatePerformanceData());
      setIsLoading(false);
    }, 1000);
  }, [timeRange]);

  const generatePerformanceData = (): PerformanceData[] => {
    const data: PerformanceData[] = [];
    const now = new Date();
    const points = timeRange === '1h' ? 60 : timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const interval = timeRange === '1h' ? 60 * 1000 : 60 * 60 * 1000;
    
    let baseAccuracy = model.metrics?.accuracy || 0.85;
    let basePrecision = model.metrics?.precision || 0.83;
    let baseRecall = model.metrics?.recall || 0.82;
    let baseF1Score = model.metrics?.f1Score || 0.82;
    
    for (let i = points - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * interval).toISOString();
      
      // Add some random variation and slight trend
      baseAccuracy = Math.max(0.7, Math.min(0.98, baseAccuracy + (Math.random() - 0.52) * 0.01));
      basePrecision = Math.max(0.7, Math.min(0.98, basePrecision + (Math.random() - 0.52) * 0.01));
      baseRecall = Math.max(0.7, Math.min(0.98, baseRecall + (Math.random() - 0.52) * 0.01));
      baseF1Score = Math.max(0.7, Math.min(0.98, baseF1Score + (Math.random() - 0.52) * 0.01));
      
      // Generate latency with time-of-day pattern
      const hour = new Date(timestamp).getHours();
      const timeOfDayFactor = 1 + Math.sin((hour - 12) * Math.PI / 12) * 0.3;
      const latency = 50 + Math.random() * 30 * timeOfDayFactor;
      
      // Generate request volume with time-of-day pattern
      const requests = Math.floor((100 + Math.random() * 150) * timeOfDayFactor);
      
      // Generate errors (about 1-3% of requests)
      const errors = Math.floor(requests * (0.01 + Math.random() * 0.02));
      
      data.push({
        timestamp,
        accuracy: baseAccuracy,
        precision: basePrecision,
        recall: baseRecall,
        f1Score: baseF1Score,
        latency,
        requests,
        errors
      });
    }
    
    return data;
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

  const getPerformanceChartData = () => {
    return {
      labels: performanceData.map(d => formatTimestamp(d.timestamp)),
      datasets: [
        {
          label: 'Accuracy',
          data: performanceData.map(d => d.accuracy * 100),
          borderColor: 'rgb(79, 70, 229)',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.4,
          hidden: selectedMetric !== 'accuracy'
        },
        {
          label: 'Precision',
          data: performanceData.map(d => d.precision * 100),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          hidden: selectedMetric !== 'precision'
        },
        {
          label: 'Recall',
          data: performanceData.map(d => d.recall * 100),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: true,
          tension: 0.4,
          hidden: selectedMetric !== 'recall'
        },
        {
          label: 'F1 Score',
          data: performanceData.map(d => d.f1Score * 100),
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4,
          hidden: selectedMetric !== 'f1Score'
        }
      ]
    };
  };

  const getLatencyChartData = () => {
    return {
      labels: performanceData.map(d => formatTimestamp(d.timestamp)),
      datasets: [
        {
          label: 'Response Time (ms)',
          data: performanceData.map(d => d.latency),
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
      labels: performanceData.map(d => formatTimestamp(d.timestamp)),
      datasets: [
        {
          label: 'Requests',
          data: performanceData.map(d => d.requests),
          borderColor: 'rgb(79, 70, 229)',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Errors',
          data: performanceData.map(d => d.errors),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  };

  const getErrorRateChartData = () => {
    // Calculate error rates
    const errorRates = performanceData.map(d => (d.errors / d.requests) * 100);
    
    return {
      labels: ['0-1%', '1-2%', '2-3%', '3-4%', '4-5%', '>5%'],
      datasets: [
        {
          label: 'Error Rate Distribution',
          data: [
            errorRates.filter(r => r >= 0 && r < 1).length,
            errorRates.filter(r => r >= 1 && r < 2).length,
            errorRates.filter(r => r >= 2 && r < 3).length,
            errorRates.filter(r => r >= 3 && r < 4).length,
            errorRates.filter(r => r >= 4 && r < 5).length,
            errorRates.filter(r => r >= 5).length
          ],
          backgroundColor: [
            'rgba(16, 185, 129, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(139, 92, 246, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(249, 115, 22, 0.7)',
            'rgba(239, 68, 68, 0.7)'
          ],
          borderWidth: 1,
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

  const requestsChartOptions = {
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
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Requests'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Errors'
        }
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  const getPerformanceSummary = () => {
    if (performanceData.length === 0) return null;
    
    const latest = performanceData[performanceData.length - 1];
    const first = performanceData[0];
    
    const accuracyChange = latest.accuracy - first.accuracy;
    const latencyChange = latest.latency - first.latency;
    
    const totalRequests = performanceData.reduce((sum, d) => sum + d.requests, 0);
    const totalErrors = performanceData.reduce((sum, d) => sum + d.errors, 0);
    const errorRate = totalErrors / totalRequests;
    
    return {
      accuracy: latest.accuracy,
      accuracyChange,
      latency: latest.latency,
      latencyChange,
      totalRequests,
      errorRate
    };
  };

  const summary = getPerformanceSummary();

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <Button
                variant={selectedMetric === 'accuracy' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('accuracy')}
              >
                Accuracy
              </Button>
              <Button
                variant={selectedMetric === 'precision' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('precision')}
              >
                Precision
              </Button>
              <Button
                variant={selectedMetric === 'recall' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('recall')}
              >
                Recall
              </Button>
              <Button
                variant={selectedMetric === 'f1Score' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('f1Score')}
              >
                F1 Score
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Filter className="w-4 h-4" />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Download className="w-4 h-4" />}
              >
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Refresh
              </Button>
            </div>
          </div>

          {showFilters && (
            <Card>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Minimum Accuracy
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.minAccuracy}
                    onChange={(e) => setFilters({ ...filters, minAccuracy: parseInt(e.target.value) })}
                    className="w-full h-2 mt-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>0%</span>
                    <span>{filters.minAccuracy}%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Show Errors
                  </label>
                  <div className="mt-2">
                    <button
                      onClick={() => setFilters({ ...filters, showErrors: !filters.showErrors })}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                        filters.showErrors ? 'bg-primary-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className="sr-only">Show errors</span>
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          filters.showErrors ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    User Segment
                  </label>
                  <select
                    className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={filters.userSegment}
                    onChange={(e) => setFilters({ ...filters, userSegment: e.target.value })}
                  >
                    <option value="all">All Users</option>
                    <option value="new">New Users</option>
                    <option value="returning">Returning Users</option>
                    <option value="high_value">High Value Users</option>
                  </select>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                  <BarChart2 className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Accuracy</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-semibold text-gray-900">
                      {summary ? (summary.accuracy * 100).toFixed(1) + '%' : 'N/A'}
                    </p>
                    {summary && summary.accuracyChange !== 0 && (
                      <span className={`ml-2 flex items-center text-sm ${
                        summary.accuracyChange > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {summary.accuracyChange > 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {Math.abs(summary.accuracyChange * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg. Response Time</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-semibold text-gray-900">
                      {summary ? summary.latency.toFixed(1) + 'ms' : 'N/A'}
                    </p>
                    {summary && summary.latencyChange !== 0 && (
                      <span className={`ml-2 flex items-center text-sm ${
                        summary.latencyChange < 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {summary.latencyChange < 0 ? (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        )}
                        {Math.abs(summary.latencyChange).toFixed(1)}ms
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Requests</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {summary ? summary.totalRequests.toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Error Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {summary ? (summary.errorRate * 100).toFixed(2) + '%' : 'N/A'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Performance Metrics</h3>
              </div>
              <div className="h-80">
                <Line
                  key={`perf-metrics-${selectedModelId}`}
                  redraw={true}
                  data={getPerformanceChartData()}
                  options={chartOptions}
                />
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Response Time</h3>
              </div>
              <div className="h-80">
                <Line
                  key={`latency-${selectedModelId}`}
                  redraw={true}
                  data={getLatencyChartData()}
                  options={chartOptions}
                />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Request Volume & Errors</h3>
              </div>
              <div className="h-80">
                <Line
                  key={`requests-${selectedModelId}`}
                  redraw={true}
                  data={getRequestVolumeChartData()}
                  options={requestsChartOptions}
                />
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Error Rate Distribution</h3>
              </div>
              <div className="h-80 flex items-center justify-center">
                <div className="w-3/4 h-3/4">
                  <Doughnut
                    key={`error-rate-${selectedModelId}`}
                    redraw={true}
                    data={getErrorRateChartData()}
                    options={doughnutOptions}
                  />
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default ModelPerformanceDashboard;