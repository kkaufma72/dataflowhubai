import React, { useState, useEffect } from 'react';
import { ListTodo, RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ActiveTask {
  id: string;
  name: string;
  args: string;
  kwargs: string;
  time_start: number;
  worker: string;
}

interface TasksList {
  active: { [worker: string]: ActiveTask[] };
  scheduled: { [worker: string]: any[] };
  reserved: { [worker: string]: any[] };
}

export const ActiveTasksPanel: React.FC = () => {
  const [tasks, setTasks] = useState<TasksList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  const fetchTasks = async () => {
    if (!isAvailable) return; // Skip if we know the endpoint isn't available
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/ml/tasks');
      if (!response.ok) {
        // API endpoint doesn't exist or backend not running
        if (response.status === 404 || response.status >= 500) {
          console.warn('Celery tasks endpoint not available');
          setIsAvailable(false);
          setAutoRefresh(false);
          setTasks({ active: {}, scheduled: {}, reserved: {} });
          return;
        }
        throw new Error('Failed to fetch tasks');
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Celery tasks endpoint not available (got HTML response)');
        setIsAvailable(false);
        setAutoRefresh(false);
        setTasks({ active: {}, scheduled: {}, reserved: {} });
        return;
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Don't show error toast on initial load failure
      // toast.error('Failed to fetch active tasks');
      setIsAvailable(false);
      setAutoRefresh(false);
      setTasks({ active: {}, scheduled: {}, reserved: {} });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getTaskCount = (taskList: { [worker: string]: any[] }) => {
    return Object.values(taskList).reduce((sum, arr) => sum + arr.length, 0);
  };

  const formatDuration = (startTime: number) => {
    const seconds = Math.floor((Date.now() / 1000) - startTime);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getTaskIcon = (taskName: string) => {
    if (taskName.includes('train')) return '🎓';
    if (taskName.includes('predict')) return '🔮';
    if (taskName.includes('quality')) return '🔍';
    if (taskName.includes('drift')) return '📊';
    if (taskName.includes('health')) return '💚';
    if (taskName.includes('cleanup')) return '🧹';
    return '⚙️';
  };

  const getTaskDisplayName = (taskName: string) => {
    return taskName.split('.').pop() || taskName;
  };

  if (!tasks) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading tasks...</span>
        </div>
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <ListTodo className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-400">Active Tasks</h3>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Backend API Not Available</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            The Celery tasks endpoint is not running.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
            Start the backend with: docker-compose up -d backend
          </p>
        </div>
      </div>
    );
  }

  const activeCount = getTaskCount(tasks.active);
  const scheduledCount = getTaskCount(tasks.scheduled);
  const reservedCount = getTaskCount(tasks.reserved);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ListTodo className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold">Active Tasks</h3>
        </div>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Auto-refresh</span>
          </label>
          <button
            onClick={fetchTasks}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-600 dark:text-blue-400">Active</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
            {activeCount}
          </p>
        </div>

        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-yellow-600 dark:text-yellow-400">Scheduled</span>
            <AlertCircle className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
            {scheduledCount}
          </p>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600 dark:text-green-400">Reserved</span>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
            {reservedCount}
          </p>
        </div>
      </div>

      {/* Active Tasks List */}
      {activeCount > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Running Tasks
          </h4>
          {Object.entries(tasks.active).map(([worker, workerTasks]) => (
            <div key={worker} className="space-y-2">
              {workerTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getTaskIcon(task.name)}</span>
                    <div>
                      <p className="font-medium text-sm">
                        {getTaskDisplayName(task.name)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Task ID: {task.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(task.time_start)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-gray-600 dark:text-gray-400">Running</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">No active tasks</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            All workers are idle
          </p>
        </div>
      )}

      {/* Scheduled Tasks */}
      {scheduledCount > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Scheduled Tasks ({scheduledCount})
          </h4>
          <p className="text-xs text-gray-500">
            Tasks waiting to be executed
          </p>
        </div>
      )}
    </div>
  );
};

export default ActiveTasksPanel;
