import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { useTimescaleMetrics, useAllModelsMetrics } from "../hooks/useTimescaleMetrics";
import { Activity, TrendingUp, TrendingDown, Database, RefreshCw, Clock, Zap } from 'lucide-react';

const MetricsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(undefined);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds default
  const [timeRange, setTimeRange] = useState(24); // 24 hours default

  // Fetch all models' latest metrics
  const { models, loading: modelsLoading, refresh: refreshModels, isAvailable } = useAllModelsMetrics(10000);

  // Fetch selected model's historical metrics
  const { metrics, loading: metricsLoading, refresh: refreshMetrics } = useTimescaleMetrics(
    selectedModelId,
    refreshInterval,
    timeRange
  );

  // Calculate trends
  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 0;
    const recent = values.slice(-5);
    const older = values.slice(-10, -5);
    if (older.length === 0) return 0;
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    return ((recentAvg - olderAvg) / olderAvg) * 100;
  };

  const accuracyTrend = metrics ? calculateTrend(metrics.accuracies) : 0;
  const lossTrend = metrics ? calculateTrend(metrics.losses) : 0;

  // Chart data for accuracy over time
  const accuracyChartData = metrics ? {
    labels: metrics.timestamps.map((t) => t.toLocaleTimeString()),
    datasets: [
      {
        label: 'Accuracy',
        data: metrics.accuracies,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  } : null;

  // Chart data for loss over time
  const lossChartData = metrics ? {
    labels: metrics.timestamps.map((t) => t.toLocaleTimeString()),
    datasets: [
      {
        label: 'Loss',
        data: metrics.losses,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  } : null;

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#a0aec0',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { 
          display: false,
          color: 'rgba(75, 85, 99, 0.2)' 
        },
        ticks: { 
          color: '#6b7280',
          font: { size: 10 },
          maxTicksLimit: 10
        },
      },
      y: {
        grid: { color: 'rgba(75, 85, 99, 0.2)' },
        ticks: {
          color: '#9ca3af',
          font: { size: 10 },
        },
        min: 0,
      },
    },
  };

  const currentAccuracy = metrics?.accuracies[metrics.accuracies.length - 1] || 0;
  const currentLoss = metrics?.losses[metrics.losses.length - 1] || 0;
  const avgAccuracy = metrics ? metrics.accuracies.reduce((a, b) => a + b, 0) / metrics.accuracies.length : 0;
  const avgLoss = metrics ? metrics.losses.reduce((a, b) => a + b, 0) / metrics.losses.length : 0;

  if (!isAvailable) {
    return (
      <div className="min-h-screen bg-[#0d1117] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#161b22] border border-yellow-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-white">TimescaleDB Not Available</h2>
            </div>
            <p className="text-gray-400 mb-4">
              TimescaleDB is not currently available. Make sure the TimescaleDB container is running:
            </p>
            <pre className="bg-[#0d1117] p-4 rounded text-sm text-gray-300 overflow-x-auto">
              docker ps | grep timescaledb
            </pre>
            <p className="text-gray-400 mt-4">
              If it's not running, start it with:
            </p>
            <pre className="bg-[#0d1117] p-4 rounded text-sm text-gray-300 overflow-x-auto">
              docker start dataflow_timescaledb
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <span className="text-gray-500 hover:text-blue-400 cursor-pointer transition-colors">Home</span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-500 hover:text-blue-400 cursor-pointer transition-colors">Deploy & Monitor</span>
          <span className="text-gray-600">/</span>
          <span className="text-white font-medium">Monitoring</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">Real-Time Metrics Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Refresh Interval Selector */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="bg-[#161b22] text-white border border-gray-700 rounded px-3 py-2 text-sm"
                >
                  <option value={1000}>1s</option>
                  <option value={5000}>5s</option>
                  <option value={10000}>10s</option>
                  <option value={30000}>30s</option>
                  <option value={60000}>1m</option>
                </select>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(Number(e.target.value))}
                  className="bg-[#161b22] text-white border border-gray-700 rounded px-3 py-2 text-sm"
                >
                  <option value={1}>Last 1 hour</option>
                  <option value={6}>Last 6 hours</option>
                  <option value={24}>Last 24 hours</option>
                  <option value={168}>Last 7 days</option>
                </select>
              </div>

              {/* Live Indicator */}
              <div className="flex items-center gap-2 text-sm text-gray-400 bg-[#161b22] px-3 py-2 rounded border border-gray-700">
                <Activity className="w-4 h-4 animate-pulse text-green-400" />
                <span>Live</span>
              </div>
            </div>
          </div>
          <p className="text-gray-400">
            Monitor model training metrics in real-time from TimescaleDB
          </p>
        </div>

        {/* Models List */}
        <div className="bg-[#161b22] border border-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              Available Models
            </h2>
            <button
              onClick={refreshModels}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
              disabled={modelsLoading}
            >
              <RefreshCw className={`w-4 h-4 ${modelsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {modelsLoading ? (
            <div className="text-center py-8 text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              Loading models...
            </div>
          ) : models.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">No models found in TimescaleDB</p>
              <p className="text-sm">Train a model to see metrics here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {models.map((model) => (
                <button
                  key={model.modelId}
                  onClick={() => {
                    console.log('Selected model:', model.modelId, model.modelName);
                    setSelectedModelId(model.modelId);
                  }}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selectedModelId === model.modelId
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-700 bg-[#0d1117] hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-white truncate">{model.modelName}</h3>
                    {selectedModelId === model.modelId && (
                      <Zap className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mb-2">
                    {model.timestamp.toLocaleString()}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Accuracy:</span>
                      <span className="ml-1 text-white font-mono">
                        {model.accuracy ? `${(model.accuracy * 100).toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Loss:</span>
                      <span className="ml-1 text-white font-mono">
                        {model.loss ? model.loss.toFixed(3) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Metrics Display */}
        {selectedModelId && (
          <>
            {metricsLoading ? (
              <div className="bg-[#161b22] border border-gray-800 rounded-lg p-12 mb-6">
                <div className="text-center text-gray-400">
                  <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">Loading metrics...</p>
                  <p className="text-sm">Fetching data from TimescaleDB</p>
                </div>
              </div>
            ) : !metrics || metrics.timestamps.length === 0 ? (
              <div className="bg-[#161b22] border border-gray-800 rounded-lg p-12 mb-6">
                <div className="text-center text-gray-400">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">No metrics data available</p>
                  <p className="text-sm">This model hasn't logged metrics yet, or data is outside the selected time range.</p>
                  <p className="text-sm mt-2">Try training the model again or adjusting the time range.</p>
                </div>
              </div>
            ) : (
            <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Current Accuracy */}
              <div className="bg-[#161b22] border border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Current Accuracy</span>
                  {accuracyTrend > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="text-3xl font-bold text-white mb-1 font-mono">
                  {(currentAccuracy * 100).toFixed(1)}%
                </div>
                <div className={`text-xs ${accuracyTrend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {accuracyTrend > 0 ? '+' : ''}{accuracyTrend.toFixed(1)}% vs recent
                </div>
              </div>

              {/* Current Loss */}
              <div className="bg-[#161b22] border border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Current Loss</span>
                  {lossTrend < 0 ? (
                    <TrendingDown className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="text-3xl font-bold text-white mb-1 font-mono">
                  {currentLoss.toFixed(3)}
                </div>
                <div className={`text-xs ${lossTrend < 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {lossTrend > 0 ? '+' : ''}{lossTrend.toFixed(1)}% vs recent
                </div>
              </div>

              {/* Average Accuracy */}
              <div className="bg-[#161b22] border border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Avg Accuracy</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1 font-mono">
                  {(avgAccuracy * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  Over {metrics?.timestamps.length || 0} points
                </div>
              </div>

              {/* Average Loss */}
              <div className="bg-[#161b22] border border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Avg Loss</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1 font-mono">
                  {avgLoss.toFixed(3)}
                </div>
                <div className="text-xs text-gray-500">
                  Over {metrics?.timestamps.length || 0} points
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Accuracy Chart */}
              <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Accuracy Over Time</h3>
                  </div>
                  {metricsLoading && (
                    <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                  )}
                </div>
                <div className="p-6" style={{ height: '400px' }}>
                  {accuracyChartData ? (
                    <Line data={accuracyChartData} options={chartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No data available
                    </div>
                  )}
                </div>
              </div>

              {/* Loss Chart */}
              <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                    <h3 className="text-lg font-semibold text-white">Loss Over Time</h3>
                  </div>
                  {metricsLoading && (
                    <RefreshCw className="w-4 h-4 text-red-400 animate-spin" />
                  )}
                </div>
                <div className="p-6" style={{ height: '400px' }}>
                  {lossChartData ? (
                    <Line data={lossChartData} options={chartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No data available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Data Table */}
            {metrics && metrics.timestamps.length > 0 && (
              <div className="mt-6 bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800">
                  <h3 className="text-lg font-semibold text-white">Recent Data Points</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#0d1117] border-b border-gray-800">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400">Timestamp</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">Accuracy</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">Loss</th>
                        {metrics.epochs && metrics.epochs.length > 0 && (
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400">Epoch</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.timestamps.slice(-10).reverse().map((timestamp, idx) => {
                        const actualIdx = metrics.timestamps.length - 1 - idx;
                        return (
                          <tr key={idx} className="border-b border-gray-800 hover:bg-[#0d1117] transition-colors">
                            <td className="px-6 py-3 text-sm text-gray-300">
                              {timestamp.toLocaleString()}
                            </td>
                            <td className="px-6 py-3 text-sm text-right font-mono text-white">
                              {(metrics.accuracies[actualIdx] * 100).toFixed(2)}%
                            </td>
                            <td className="px-6 py-3 text-sm text-right font-mono text-white">
                              {metrics.losses[actualIdx].toFixed(4)}
                            </td>
                            {metrics.epochs && metrics.epochs.length > 0 && (
                              <td className="px-6 py-3 text-sm text-right font-mono text-gray-300">
                                {metrics.epochs[actualIdx]}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </>
            )}
          </>
        )}

        {!selectedModelId && models.length > 0 && (
          <div className="text-center py-12 text-gray-400">
            <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Select a model above to view detailed metrics</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsDashboard;
