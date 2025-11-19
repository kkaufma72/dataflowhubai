// Celery Health Badge Component
// Shows real-time Celery worker status mirroring Flower metrics

import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';

interface CeleryStats {
  activeWorkers: number;
  queuedTasks: number;
  activeTasks: number;
  failedTasks: number;
  successRate: number;
  avgTaskDuration: number;
}

interface CeleryHealthBadgeProps {
  refreshInterval?: number;
  showDetails?: boolean;
}

const CeleryHealthBadge: React.FC<CeleryHealthBadgeProps> = ({ 
  refreshInterval = 5000,
  showDetails = false
}) => {
  const [stats, setStats] = useState<CeleryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/celery/stats');
        if (!response.ok) throw new Error('Failed to fetch Celery stats');
        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Celery stats error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getHealthStatus = (): 'healthy' | 'warning' | 'error' | 'offline' => {
    if (loading || !stats) return 'offline';
    if (stats.activeWorkers === 0) return 'offline';
    if (stats.successRate < 0.8 || stats.failedTasks > 10) return 'error';
    if (stats.queuedTasks > 100 || stats.activeTasks > 50) return 'warning';
    return 'healthy';
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'offline':
        return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      case 'error':
        return <X className="w-4 h-4" />;
      case 'offline':
        return <Clock className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getHealthLabel = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'warning':
        return 'Degraded';
      case 'error':
        return 'Issues';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const status = getHealthStatus();

  return (
    <div className="relative">
      {/* Badge */}
      <button
        onClick={() => setShowDetailsPanel(!showDetailsPanel)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${getHealthColor(
          status
        )} hover:opacity-80`}
      >
        {getHealthIcon(status)}
        <span className="text-xs font-medium uppercase tracking-wide">
          Celery {getHealthLabel(status)}
        </span>
        {stats && stats.activeWorkers > 0 && (
          <span className="text-xs opacity-75">
            {stats.activeWorkers}W
          </span>
        )}
      </button>

      {/* Details Panel */}
      {showDetailsPanel && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetailsPanel(false)}
          />
          <div className="absolute right-0 top-12 w-80 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-100">
                  Celery Status
                </h3>
              </div>
              <button
                onClick={() => setShowDetailsPanel(false)}
                className="p-1 text-gray-400 hover:text-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stats */}
            {loading ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                Loading...
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            ) : stats ? (
              <div className="p-4 space-y-3">
                {/* Workers */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Active Workers</span>
                  <span className="text-sm font-semibold text-gray-100">
                    {stats.activeWorkers}
                  </span>
                </div>

                {/* Tasks */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Queued Tasks</span>
                  <span className="text-sm font-semibold text-gray-100">
                    {stats.queuedTasks}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Active Tasks</span>
                  <span className="text-sm font-semibold text-gray-100">
                    {stats.activeTasks}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Failed Tasks</span>
                  <span
                    className={`text-sm font-semibold ${
                      stats.failedTasks > 0 ? 'text-red-400' : 'text-gray-100'
                    }`}
                  >
                    {stats.failedTasks}
                  </span>
                </div>

                {/* Success Rate */}
                <div className="pt-3 border-t border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Success Rate</span>
                    <span className="text-sm font-semibold text-gray-100">
                      {(stats.successRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stats.successRate >= 0.95
                          ? 'bg-green-500'
                          : stats.successRate >= 0.8
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${stats.successRate * 100}%` }}
                    />
                  </div>
                </div>

                {/* Avg Duration */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Avg Task Time</span>
                  <span className="text-sm font-semibold text-gray-100">
                    {stats.avgTaskDuration.toFixed(2)}s
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-400 text-sm">
                No data available
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-800 bg-gray-800/50">
              <a
                href="/flower"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Activity className="w-3 h-3" />
                View in Flower Dashboard
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CeleryHealthBadge;
