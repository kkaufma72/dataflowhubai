/**
 * Hybrid Data Management - Best of Both Worlds
 * 
 * Excel-style tabs + Rich cards with quality scores + Friendly AI assistant
 */

import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { useMLContext } from '../context/MLContext';
import { Dataset } from '../types';
import { 
  Database, 
  Upload, 
  X,
  Plus,
  Bot,
  Sparkles,
  Eye,
  CheckCircle,
  BarChart3,
  Trash2,
  Download
} from 'lucide-react';
import { useAuth } from '../components/auth/AuthProvider';
import { useDatasetActions } from '../hooks/useDatasetActions';
import toast from 'react-hot-toast';
import DataUploader from '../components/data/DataUploader';
import { calculateDatasetHealth, getHealthBadgeProps } from '../utils/datasetHealthScore';
import { useDefaultProjectSetup } from '../hooks/useDefaultProjectSetup';

// Lazy load heavy components
const EnhancedAIChat = lazy(() => import('../components/data/EnhancedAIChat'));
const DataQualityDashboard = lazy(() => import('../components/data/DataQualityDashboard'));

const DataManagementHybrid: React.FC = () => {
  const { datasets, currentProject } = useMLContext();
  const { user } = useAuth();
  const { deleteDataset } = useDatasetActions();
  
  // Auto-setup default project with sample datasets for new users
  useDefaultProjectSetup();
  
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(
    datasets.length > 0 ? datasets[0].id : null
  );
  const [showUploader, setShowUploader] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showAIHelper, setShowAIHelper] = useState(false);

  const activeDataset = useMemo(() => 
    datasets.find(d => d.id === activeDatasetId),
    [datasets, activeDatasetId]
  );

  // Show AI helper on first visit
  useEffect(() => {
    const hasSeenHelper = sessionStorage.getItem('hasSeenDataHelper');
    if (!hasSeenHelper && datasets.length > 0) {
      setTimeout(() => setShowAIHelper(true), 2000);
      sessionStorage.setItem('hasSeenDataHelper', 'true');
    }
  }, [datasets.length]);

  const handleDelete = async (dataset: Dataset) => {
    if (!confirm(`Delete "${dataset.name}"?`)) return;
    const result = await deleteDataset(dataset, user?.id || '');
    if (result.success) {
      if (activeDatasetId === dataset.id && datasets.length > 1) {
        setActiveDatasetId(datasets.find(d => d.id !== dataset.id)?.id || null);
      }
      toast.success('Dataset deleted');
    }
  };

  const handleExport = (dataset: Dataset) => {
    try {
      if (dataset.preview_data && dataset.preview_data.columns && dataset.preview_data.rows) {
        // Create CSV content
        const csv = [
          dataset.preview_data.columns.join(','),
          ...dataset.preview_data.rows.map(row => row.join(','))
        ].join('\n');
        
        // Create and download file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${dataset.name}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        
        toast.success(`Exported ${dataset.name}`);
      } else {
        toast.error('No data available to export');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export dataset');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Bar with Project Info */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {currentProject?.name || 'My Datasets'}
              </h1>
              <p className="text-sm text-gray-600">
                {datasets.length} {datasets.length === 1 ? 'dataset' : 'datasets'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowUploader(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload Dataset
          </button>
        </div>
      </div>

      {/* Main Content Area - Dataset Cards */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {activeDataset ? (
          <div className="space-y-6">
            {/* Dataset Overview Card with Quality Score */}
            {(() => {
              const health = calculateDatasetHealth(activeDataset);
              const badge = getHealthBadgeProps(health.score);
              
              return (
                <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden">
                  {/* Card Header with Health Badge */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <Database className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            {activeDataset.name}
                          </h2>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {activeDataset.description || 'No description'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Health Score Badge */}
                      <div 
                        className="px-4 py-2 rounded-full border-2 flex items-center gap-2"
                        style={{
                          backgroundColor: badge.color + '15',
                          borderColor: badge.color + '40',
                          color: badge.color
                        }}
                      >
                        <span className="text-2xl">{badge.emoji}</span>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{health.score}</div>
                          <div className="text-xs font-semibold uppercase">
                            Grade {health.grade}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4 p-6 bg-white">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-blue-700 uppercase">Rows</span>
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-3xl font-bold text-blue-900">
                        {activeDataset.row_count?.toLocaleString() || 0}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-purple-700 uppercase">Columns</span>
                        <Database className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="text-3xl font-bold text-purple-900">
                        {activeDataset.column_count || 0}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-green-700 uppercase">Complete</span>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-3xl font-bold text-green-900">
                        {health.completeness}%
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-orange-700 uppercase">Unique</span>
                        <Sparkles className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="text-3xl font-bold text-orange-900">
                        {health.uniqueness}%
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-6 pb-6 flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedDataset(activeDataset);
                        setShowPreview(true);
                      }}
                      className="flex-1 px-4 py-3 bg-cyan-50 border-2 border-cyan-200 text-cyan-700 hover:bg-cyan-100 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <Eye className="w-5 h-5" />
                      Preview Data (25 Rows)
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDataset(activeDataset);
                        setShowQuality(true);
                      }}
                      className="flex-1 px-4 py-3 bg-green-50 border-2 border-green-200 text-green-700 hover:bg-green-100 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Data Quality Report
                    </button>
                    <button
                      onClick={() => handleExport(activeDataset!)}
                      className="flex-1 px-4 py-3 bg-blue-50 border-2 border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDataset(activeDataset);
                        setShowChat(true);
                      }}
                      className="flex-1 px-4 py-3 bg-purple-50 border-2 border-purple-200 text-purple-700 hover:bg-purple-100 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Ask AI
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Data Profiling Cards (like before!) */}
            <div className="grid grid-cols-3 gap-4">
              {activeDataset.preview_data?.columns?.slice(0, 6).map((col: string, idx: number) => {
                const values = activeDataset.preview_data.rows?.map((r: any) => 
                  Array.isArray(r) ? r[idx] : r[col]
                );
                const uniqueCount = new Set(values).size;
                
                return (
                  <div key={col} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-900 truncate">
                        {col}
                      </h4>
                      <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                        Column {idx + 1}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-semibold text-gray-900">
                          {typeof values?.[0] === 'number' ? 'Numeric' : 'Text'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Unique:</span>
                        <span className="font-semibold text-gray-900">
                          {uniqueCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sample:</span>
                        <span className="font-semibold text-gray-900 truncate max-w-[100px]">
                          {String(values?.[0])}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Database className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No Dataset Selected
              </h3>
              <p className="text-gray-600 mb-6">
                Click a dataset tab below or upload a new one
              </p>
              <button
                onClick={() => setShowUploader(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Upload Your First Dataset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Excel-Style Dataset Tabs at Bottom */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2 overflow-x-auto">
          {datasets.map((dataset) => {
            const health = calculateDatasetHealth(dataset);
            const badge = getHealthBadgeProps(health.score);
            
            return (
              <button
                key={dataset.id}
                onClick={() => setActiveDatasetId(dataset.id)}
                className={`
                  group relative px-4 py-2 rounded-t-lg transition-all flex items-center gap-2 flex-shrink-0 border-2
                  ${activeDatasetId === dataset.id
                    ? 'bg-white text-indigo-600 border-indigo-500 border-b-white -mb-0.5 shadow-md'
                    : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200 hover:text-gray-900'
                  }
                `}
              >
                <Database className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {dataset.name}
                </span>
                <span className="text-xs text-gray-500">
                  ({dataset.row_count?.toLocaleString()})
                </span>
                
                {/* Health indicator */}
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: badge.color }}
                  title={`Health: ${health.score}/100`}
                ></div>

                {/* Export button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport(dataset);
                  }}
                  className="p-1 rounded hover:bg-indigo-100 opacity-70 hover:opacity-100 transition-all"
                  title="Export CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(dataset);
                  }}
                  className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 hover:bg-red-100 rounded transition-opacity"
                >
                  <X className="w-3 h-3 text-red-600" />
                </button>
              </button>
            );
          })}

          {/* Add New Tab */}
          <button
            onClick={() => setShowUploader(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 hover:bg-green-100 rounded-t-lg transition-all flex items-center gap-1 flex-shrink-0 font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">New Dataset</span>
          </button>
        </div>
      </div>

      {/* Friendly AI Helper Bot */}
      {showAIHelper && (
        <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border-2 border-indigo-200 z-50 animate-bounce-in">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Data Assistant</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-white/90 text-sm">Ready to help!</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowAIHelper(false)}>
                <X className="w-5 h-5 text-white/80 hover:text-white" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100 mb-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-900 font-semibold mb-1">
                    👋 Hi {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}!
                  </p>
                  <p className="text-gray-700">
                    How can I help you transform your data today?
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setSelectedDataset(activeDataset);
                  setShowPreview(true);
                  setShowAIHelper(false);
                }}
                className="w-full text-left px-4 py-3 bg-white border-2 border-gray-200 hover:border-cyan-400 hover:bg-cyan-50 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-cyan-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-cyan-600">
                      Preview First 25 Rows
                    </p>
                    <p className="text-xs text-gray-600">
                      See your data to plan transformations
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedDataset(activeDataset);
                  setShowQuality(true);
                  setShowAIHelper(false);
                }}
                className="w-full text-left px-4 py-3 bg-white border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600">
                      Check Data Quality
                    </p>
                    <p className="text-xs text-gray-600">
                      Find issues, get recommendations
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedDataset(activeDataset);
                  setShowChat(true);
                  setShowAIHelper(false);
                }}
                className="w-full text-left px-4 py-3 bg-white border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-600">
                      Ask AI Questions
                    </p>
                    <p className="text-xs text-gray-600">
                      Get insights and transformation ideas
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="px-6 pb-4 flex justify-between text-sm text-gray-500">
            <button onClick={() => setShowAIHelper(false)}>Minimize</button>
            <button onClick={() => {
              setShowAIHelper(false);
              sessionStorage.setItem('dismissedDataHelper', 'true');
            }}>
              Don't show again
            </button>
          </div>
        </div>
      )}

      {/* Minimized AI Helper */}
      {!showAIHelper && (
        <button
          onClick={() => setShowAIHelper(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group hover:scale-110 z-40"
        >
          <Bot className="w-6 h-6 text-white" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
        </button>
      )}

      {/* Upload Modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Upload Dataset</h2>
                <button onClick={() => setShowUploader(false)}>
                  <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <DataUploader onClose={() => {
                setShowUploader(false);
                window.location.reload();
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedDataset?.preview_data && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
              <h2 className="text-xl font-bold">{selectedDataset.name}</h2>
              <p className="text-sm opacity-90 mt-1">
                First 25 rows of {selectedDataset.row_count?.toLocaleString()}
              </p>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-gray-50 border-b-2 border-cyan-500">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">#</th>
                    {selectedDataset.preview_data.columns?.map((col: string) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedDataset.preview_data.rows?.slice(0, 25).map((row: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-2 text-xs font-mono text-gray-500">{idx + 1}</td>
                      {(Array.isArray(row) ? row : Object.values(row)).map((cell: any, cellIdx: number) => (
                        <td key={cellIdx} className="px-4 py-2 text-sm text-gray-900">
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setShowChat(true);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
              >
                Ask AI About This Data
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quality Modal */}
      {showQuality && selectedDataset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <h2 className="text-xl font-bold">Data Quality: {selectedDataset.name}</h2>
              <p className="text-sm opacity-90 mt-1">
                Health analysis and recommendations
              </p>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                <DataQualityDashboard
                  dataset={selectedDataset}
                  onFixIssue={() => toast.success('Quality improvements applied!')}
                />
              </Suspense>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
              <button
                onClick={() => setShowQuality(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Modal */}
      {showChat && selectedDataset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[80vh] overflow-hidden">
            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
              <EnhancedAIChat
                dataset={selectedDataset}
                onClose={() => setShowChat(false)}
                isModal={true}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagementHybrid;

