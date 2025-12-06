import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import { experimentTracker, Experiment } from '../lib/experimentTracking';
import { TestTube, TrendingUp, Clock, GitBranch, Copy, Eye, Download, Filter, Search, Plus, Brain, Package2, X } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const ExperimentTracking: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'running' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);

  useEffect(() => {
    loadExperiments();
  }, [user, filter]);

  const loadExperiments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await experimentTracker.getExperiments(user.id, {
        status: filter === 'all' ? undefined : filter
      });
      setExperiments(data);
    } catch (error) {
      console.error('Failed to load experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExperiments = experiments.filter(exp =>
    searchQuery === '' ||
    exp.model_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    const configs = {
      running: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Running' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' }
    };
    const config = configs[status as keyof typeof configs] || configs.completed;
    
    return (
      <span className={`px-2 py-1 ${config.bg} ${config.text} text-xs font-bold rounded-full`}>
        {config.label}
      </span>
    );
  };

  const formatDuration = (started: string, completed?: string) => {
    const start = new Date(started).getTime();
    const end = completed ? new Date(completed).getTime() : Date.now();
    const duration = Math.floor((end - start) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <LoadingSkeleton variant="table" count={10} />
      </div>
    );
  }

  if (experiments.length === 0 && filter === 'all') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <EmptyState
          icon={TestTube}
          title="No experiments yet"
          description="Experiments are automatically tracked when you train models. Every training run is logged for reproducibility and comparison."
          actions={[
            {
              label: 'Train Your First Model',
              onClick: () => navigate('/app/train'),
              variant: 'primary',
              icon: TrendingUp
            }
          ]}
          tip="Experiment tracking helps you reproduce results and compare different approaches"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Experiment Tracking</h1>
              <p className="text-gray-600">
                All model training runs logged automatically • {experiments.length} total experiments
              </p>
            </div>
            <Button onClick={() => navigate('/app/train')}>
              <Plus className="w-4 h-4 mr-2" />
              New Experiment
            </Button>
          </div>

          {/* Filters & Search */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Search experiments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'completed', 'running', 'failed'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${filter === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Experiments Table */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Experiment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Accuracy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExperiments.map((exp, idx) => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{exp.model_name}</p>
                      <div className="flex gap-1 mt-1">
                        {exp.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(exp.status)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900">
                      {exp.metrics.accuracy ? `${(exp.metrics.accuracy * 100).toFixed(1)}%` : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {formatDuration(exp.started_at, exp.completed_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {new Date(exp.started_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setSelectedExperiment(exp)}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          // Navigate to training with pre-filled parameters
                          toast.success('Reproducing experiment - navigating to training...');
                          navigate('/app/train', { 
                            state: { 
                              reproduce: true,
                              datasetId: exp.dataset_id,
                              parameters: exp.parameters 
                            } 
                          });
                        }}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Reproduce"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Experiment Details Modal */}
      {selectedExperiment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Experiment Details</h2>
              <button 
                onClick={() => setSelectedExperiment(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Model Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Model</h3>
                <p className="text-lg font-semibold text-gray-900">{selectedExperiment.model_name}</p>
                <div className="flex gap-2 mt-2">
                  {selectedExperiment.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(selectedExperiment.metrics).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 capitalize">{key.replace('_', ' ')}</p>
                      <p className="text-lg font-bold text-gray-900">
                        {typeof value === 'number' ? (value * 100).toFixed(1) + '%' : value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parameters */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Parameters</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 overflow-auto">
                    {JSON.stringify(selectedExperiment.parameters, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Started</h3>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedExperiment.started_at).toLocaleString()}
                  </p>
                </div>
                {selectedExperiment.completed_at && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Completed</h3>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedExperiment.completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedExperiment.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Notes</h3>
                  <p className="text-sm text-gray-700">{selectedExperiment.notes}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <Button
                onClick={() => {
                  toast.success('Reproducing experiment...');
                  navigate('/app/train', { 
                    state: { 
                      reproduce: true,
                      datasetId: selectedExperiment.dataset_id,
                      parameters: selectedExperiment.parameters 
                    } 
                  });
                }}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Reproduce Experiment
              </Button>
              <button
                onClick={() => setSelectedExperiment(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperimentTracking;
