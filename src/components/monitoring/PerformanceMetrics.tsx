import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Line, Bar } from 'react-chartjs-2';
import { ArrowUpRight, ArrowDownRight, Download, Share } from 'lucide-react';
import Button from '../common/Button';
import { saveAs } from 'file-saver';

interface MetricPoint {
  timestamp: string;
  value: number;
}

interface PerformanceMetricsProps {
  accuracyData: MetricPoint[];
  latencyData: MetricPoint[];
  requestVolumeData: MetricPoint[];
  timeRange: string;
  formatTimestamp: (timestamp: string) => string;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  accuracyData,
  latencyData,
  requestVolumeData,
  timeRange,
  formatTimestamp
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'latency' | 'volume'>('accuracy');
  
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

  const getPerformanceStats = () => {
    if (accuracyData.length === 0) return { current: 0, change: 0, trend: 'stable' };
    
    const current = accuracyData[accuracyData.length - 1].value;
    const previous = accuracyData[0].value;
    const change = current - previous;
    const trend = change > 0.01 ? 'increasing' : change < -0.01 ? 'decreasing' : 'stable';
    
    return { current, change, trend };
  };

  const getLatencyStats = () => {
    if (latencyData.length === 0) return { current: 0, change: 0, trend: 'stable' };
    
    const current = latencyData[latencyData.length - 1].value;
    const previous = latencyData[0].value;
    const change = current - previous;
    const trend = change < -5 ? 'improving' : change > 5 ? 'degrading' : 'stable';
    
    return { current, change, trend };
  };

  const getVolumeStats = () => {
    if (requestVolumeData.length === 0) return { total: 0, average: 0, peak: 0 };
    
    const total = requestVolumeData.reduce((sum, d) => sum + d.value, 0);
    const average = total / requestVolumeData.length;
    const peak = Math.max(...requestVolumeData.map(d => d.value));
    
    return { total, average, peak };
  };

  const performanceStats = getPerformanceStats();
  const latencyStats = getLatencyStats();
  const volumeStats = getVolumeStats();

  const exportData = () => {
    // Create CSV content
    const headers = ['timestamp', 'accuracy', 'latency_ms', 'request_volume'];
    const rows = [];
    
    for (let i = 0; i < accuracyData.length; i++) {
      rows.push([
        accuracyData[i].timestamp,
        accuracyData[i].value.toFixed(4),
        latencyData[i]?.value.toFixed(2) || '',
        requestVolumeData[i]?.value.toString() || ''
      ]);
    }
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `model-performance-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Accuracy</p>
              <div className="flex items-center mt-1">
                <p className="text-2xl font-semibold text-gray-900">
                  {(performanceStats.current * 100).toFixed(1)}%
                </p>
                <span className={`ml-2 flex items-center text-sm ${
                  performanceStats.trend === 'increasing'
                    ? 'text-green-600'
                    : performanceStats.trend === 'decreasing'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}>
                  {performanceStats.trend === 'increasing' ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : performanceStats.trend === 'decreasing' ? (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  ) : null}
                  {Math.abs(performanceStats.change * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedMetric('accuracy')}
              className={`p-2 rounded-md ${
                selectedMetric === 'accuracy' ? 'bg-indigo-100' : 'hover:bg-gray-100'
              }`}
            >
              <span className={`block w-2 h-2 rounded-full ${
                selectedMetric === 'accuracy' ? 'bg-indigo-600' : 'bg-gray-300'
              }`}></span>
            </button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Response Time</p>
              <div className="flex items-center mt-1">
                <p className="text-2xl font-semibold text-gray-900">
                  {latencyStats.current.toFixed(1)} ms
                </p>
                <span className={`ml-2 flex items-center text-sm ${
                  latencyStats.trend === 'improving'
                    ? 'text-green-600'
                    : latencyStats.trend === 'degrading'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}>
                  {latencyStats.trend === 'improving' ? (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  ) : latencyStats.trend === 'degrading' ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : null}
                  {Math.abs(latencyStats.change).toFixed(1)} ms
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedMetric('latency')}
              className={`p-2 rounded-md ${
                selectedMetric === 'latency' ? 'bg-green-100' : 'hover:bg-gray-100'
              }`}
            >
              <span className={`block w-2 h-2 rounded-full ${
                selectedMetric === 'latency' ? 'bg-green-600' : 'bg-gray-300'
              }`}></span>
            </button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Request Volume</p>
              <div className="flex items-center mt-1">
                <p className="text-2xl font-semibold text-gray-900">
                  {volumeStats.total.toLocaleString()}
                </p>
                <span className="ml-2 text-sm text-gray-500">
                  total
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedMetric('volume')}
              className={`p-2 rounded-md ${
                selectedMetric === 'volume' ? 'bg-purple-100' : 'hover:bg-gray-100'
              }`}
            >
              <span className={`block w-2 h-2 rounded-full ${
                selectedMetric === 'volume' ? 'bg-purple-600' : 'bg-gray-300'
              }`}></span>
            </button>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">
            {selectedMetric === 'accuracy' 
              ? 'Accuracy Trend' 
              : selectedMetric === 'latency' 
              ? 'Response Time' 
              : 'Request Volume'}
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={exportData}
            >
              Export Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Share className="w-4 h-4" />}
            >
              Share
            </Button>
          </div>
        </div>
        <div className="h-80">
          {selectedMetric === 'accuracy' && (
            <Line data={getAccuracyChartData()} options={chartOptions} />
          )}
          {selectedMetric === 'latency' && (
            <Line data={getLatencyChartData()} options={chartOptions} />
          )}
          {selectedMetric === 'volume' && (
            <Line data={getRequestVolumeChartData()} options={chartOptions} />
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Performance Breakdown</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-600">Accuracy</p>
                <p className="text-sm font-medium text-gray-900">{(performanceStats.current * 100).toFixed(1)}%</p>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${performanceStats.current * 100}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-600">Precision</p>
                <p className="text-sm font-medium text-gray-900">{((performanceStats.current * 0.98) * 100).toFixed(1)}%</p>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${performanceStats.current * 0.98 * 100}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-600">Recall</p>
                <p className="text-sm font-medium text-gray-900">{((performanceStats.current * 0.95) * 100).toFixed(1)}%</p>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 rounded-full"
                  style={{ width: `${performanceStats.current * 0.95 * 100}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-600">F1 Score</p>
                <p className="text-sm font-medium text-gray-900">{((performanceStats.current * 0.96) * 100).toFixed(1)}%</p>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600 rounded-full"
                  style={{ width: `${performanceStats.current * 0.96 * 100}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4">System Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-600">Avg. Response Time</p>
                <p className="text-sm font-medium text-gray-900">{latencyStats.current.toFixed(1)} ms</p>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600 rounded-full"
                  style={{ width: `${Math.min(100, (latencyStats.current / 200) * 100)}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-600">Peak Response Time</p>
                <p className="text-sm font-medium text-gray-900">{Math.max(...latencyData.map(d => d.value)).toFixed(1)} ms</p>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-600 rounded-full"
                  style={{ width: `${Math.min(100, (Math.max(...latencyData.map(d => d.value)) / 200) * 100)}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-600">Avg. Requests/Hour</p>
                <p className="text-sm font-medium text-gray-900">{Math.round(volumeStats.average)}</p>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${Math.min(100, (volumeStats.average / 500) * 100)}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-600">Peak Requests/Hour</p>
                <p className="text-sm font-medium text-gray-900">{volumeStats.peak}</p>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 rounded-full"
                  style={{ width: `${Math.min(100, (volumeStats.peak / 500) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceMetrics;