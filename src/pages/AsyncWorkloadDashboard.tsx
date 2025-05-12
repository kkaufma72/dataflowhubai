import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import Button from '../components/common/Button';
import { 
  Activity, 
  Clock, 
  Database, 
  BarChart2, 
  RefreshCw, 
  Play, 
  Pause, 
  X, 
  Check, 
  AlertTriangle,
  Download,
  Filter,
  List,
  Layers
} from 'lucide-react';
import { listWorkloads, getWorkloadStatus, cancelWorkload } from '../lib/asyncWorkload';
import toast from 'react-hot-toast';
import PageHeader from '../components/common/PageHeader';

const AsyncWorkloadDashboard: React.FC = () => {
  const [workloads, setWorkloads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWorkload, setSelectedWorkload] = useState<string | null>(null);
  const [workloadDetails, setWorkloadDetails] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Load workloads on component mount
  useEffect(() => {
    fetchWorkloads();
  }, [statusFilter]);

  // Fetch workloads from API
  const fetchWorkloads = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const status = statusFilter !== 'all' ? statusFilter as any : undefined;
      const result = await listWorkloads(status);
      
      setWorkloads(result.workloads);
    } catch (err) {
      console.error('Error fetching workloads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch workloads');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch workload details
  const fetchWorkloadDetails = async (workloadId: string) => {
    try {
      setIsLoadingDetails(true);
      setError(null);
      
      const details = await getWorkloadStatus(workloadId);
      setWorkloadDetails(details);
      setSelectedWorkload(workloadId);
    } catch (err) {
      console.error('Error fetching workload details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch workload details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Cancel a workload
  const handleCancelWorkload = async (workloadId: string) => {
    try {
      await cancelWorkload(workloadId);
      toast.success('Workload canceled successfully');
      
      // Refresh workloads
      fetchWorkloads();
      
      // Refresh details if this is the selected workload
      if (selectedWorkload === workloadId) {
        fetchWorkloadDetails(workloadId);
      }
    } catch (err) {
      console.error('Error canceling workload:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to cancel workload');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Format duration
  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const durationMs = end - start;
    
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${hours > 0 ? `${hours}h ` : ''}${minutes % 60}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Async Workload Dashboard"
        description="Monitor and manage your asynchronous processing tasks"
        icon={Activity}
        actions={
          <div className="flex space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="canceled">Canceled</option>
            </select>
            <Button
              variant="outline"
              onClick={fetchWorkloads}
              icon={<RefreshCw className="w-4 h-4" />}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
              <Activity className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Workloads</p>
              <p className="text-2xl font-semibold text-gray-900">
                {isLoading ? '...' : workloads.length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {isLoading ? '...' : workloads.filter(w => w.status === 'completed').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <Play className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Running</p>
              <p className="text-2xl font-semibold text-gray-900">
                {isLoading ? '...' : workloads.filter(w => w.status === 'running' || w.status === 'pending').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {isLoading ? '...' : workloads.filter(w => w.status === 'failed').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Workloads</h3>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : workloads.length === 0 ? (
              <div className="text-center py-8">
                <Layers className="w-12 h-12 text-gray-300 mx-auto" />
                <p className="mt-2 text-sm text-gray-500">No workloads found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {workloads.map((workload) => (
                  <div
                    key={workload.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedWorkload === workload.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => fetchWorkloadDetails(workload.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {workload.status === 'completed' && <Check className="w-4 h-4 text-green-500 mr-2" />}
                        {workload.status === 'running' && <Play className="w-4 h-4 text-blue-500 mr-2" />}
                        {workload.status === 'pending' && <Clock className="w-4 h-4 text-amber-500 mr-2" />}
                        {workload.status === 'failed' && <X className="w-4 h-4 text-red-500 mr-2" />}
                        {workload.status === 'canceled' && <Pause className="w-4 h-4 text-gray-500 mr-2" />}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {workload.type.split('-').map((word: string) => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(workload.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        workload.status === 'completed' ? 'bg-green-100 text-green-800' :
                        workload.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        workload.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        workload.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {workload.status.charAt(0).toUpperCase() + workload.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        
        <div className="md:col-span-2">
          {selectedWorkload && workloadDetails ? (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Workload Details</h3>
                <div className="flex space-x-2">
                  {(workloadDetails.status === 'running' || workloadDetails.status === 'pending') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelWorkload(selectedWorkload)}
                      icon={<X className="w-4 h-4" />}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchWorkloadDetails(selectedWorkload)}
                    icon={<RefreshCw className="w-4 h-4" />}
                    disabled={isLoadingDetails}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
              
              {isLoadingDetails ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Workload ID</p>
                      <p className="mt-1 text-sm text-gray-900">{workloadDetails.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <p className="mt-1 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          workloadDetails.status === 'completed' ? 'bg-green-100 text-green-800' :
                          workloadDetails.status === 'running' ? 'bg-blue-100 text-blue-800' :
                          workloadDetails.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          workloadDetails.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {workloadDetails.status.charAt(0).toUpperCase() + workloadDetails.status.slice(1)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Started</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {workloadDetails.metrics?.startTime ? formatDate(workloadDetails.metrics.startTime) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Duration</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {workloadDetails.metrics?.startTime ? 
                          formatDuration(
                            workloadDetails.metrics.startTime, 
                            workloadDetails.metrics.endTime
                          ) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {(workloadDetails.status === 'running' || workloadDetails.status === 'pending') && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-medium text-gray-700">{Math.round(workloadDetails.progress * 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${workloadDetails.progress * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {workloadDetails.metrics && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Resource Usage</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {workloadDetails.metrics.peakMemoryMb && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Peak Memory</p>
                            <p className="mt-1 text-sm text-gray-900">{workloadDetails.metrics.peakMemoryMb} MB</p>
                          </div>
                        )}
                        {workloadDetails.metrics.currentMemoryMb && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Current Memory</p>
                            <p className="mt-1 text-sm text-gray-900">{workloadDetails.metrics.currentMemoryMb} MB</p>
                          </div>
                        )}
                        {workloadDetails.metrics.duration && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Processing Time</p>
                            <p className="mt-1 text-sm text-gray-900">{(workloadDetails.metrics.duration / 1000).toFixed(2)} seconds</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {workloadDetails.status === 'completed' && workloadDetails.result && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Results</h4>
                      <div className="p-3 bg-gray-50 rounded-lg overflow-auto max-h-60">
                        <pre className="text-xs text-gray-800">
                          {JSON.stringify(workloadDetails.result, null, 2)}
                        </pre>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Download className="w-4 h-4" />}
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(workloadDetails.result, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `workload-${selectedWorkload}-result.json`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                        >
                          Download Results
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {workloadDetails.status === 'failed' && workloadDetails.error && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="flex">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error</h3>
                          <p className="mt-1 text-sm text-red-700">{workloadDetails.error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-12">
                <List className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Workload Selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a workload from the list to view details
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">About Async Workload API</h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            The Async Workload API allows you to offload resource-intensive tasks to a dedicated processing service.
            This improves application performance and user experience by preventing UI blocking during heavy computations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h4 className="text-sm font-medium text-indigo-900 mb-2">Data Processing</h4>
              <ul className="space-y-1 text-sm text-indigo-700">
                <li>• Batch processing of large datasets</li>
                <li>• Real-time streaming data processing</li>
                <li>• ETL operations and data transformations</li>
                <li>• Data cleaning and preprocessing</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-900 mb-2">Model Training</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• Training machine learning models</li>
                <li>• Hyperparameter optimization</li>
                <li>• Cross-validation</li>
                <li>• Model evaluation and testing</li>
              </ul>
            </div>
            
            <div className="p-4 bg-amber-50 rounded-lg">
              <h4 className="text-sm font-medium text-amber-900 mb-2">Batch Prediction</h4>
              <ul className="space-y-1 text-sm text-amber-700">
                <li>• Bulk predictions on large datasets</li>
                <li>• Scheduled inference jobs</li>
                <li>• Batch scoring and evaluation</li>
                <li>• Report generation</li>
              </ul>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Getting Started</h4>
            <p className="text-sm text-blue-700 mb-2">
              To use the Async Workload API in your application:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li>Import the necessary functions from the asyncWorkload module</li>
              <li>Submit a workload using the submitWorkload function</li>
              <li>Poll for status updates using getWorkloadStatus</li>
              <li>Process the results when the workload completes</li>
            </ol>
            <p className="text-sm text-blue-700 mt-2">
              See the documentation for more details and examples.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AsyncWorkloadDashboard;