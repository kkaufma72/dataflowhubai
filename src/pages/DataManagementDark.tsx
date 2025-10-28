/**
 * Dark Theme Data Management - Matches Professional Dashboard Style
 * 
 * Inspired by: Linear, Vercel, Railway dark interfaces
 * - Dark background (#0A0A0A, #1A1A1A)
 * - Clean table layout
 * - Purple accent buttons
 * - High contrast white text
 */

import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useMLContext } from '../context/MLContext';
import { Dataset } from '../types';
import { 
  Database, 
  Upload, 
  Search, 
  Eye, 
  Trash2,
  Sparkles,
  Plus,
  X,
  ExternalLink,
  Download,
  BarChart2,
  Grid3x3,
  List,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../components/auth/AuthProvider';
import { useDatasetActions } from '../hooks/useDatasetActions';
import { syncDatasetToNeo4j } from '../lib/neo4jSync';
import toast from 'react-hot-toast';

// Lazy load heavy components
const EnhancedAIChat = lazy(() => import('../components/data/EnhancedAIChat'));
const DataQualityDashboard = lazy(() => import('../components/data/DataQualityDashboard'));

// Import DataUploader for real file uploads
import DataUploader from '../components/data/DataUploader';
import { useMLContext } from '../context/MLContext';

const DataManagementDark: React.FC = () => {
  const { datasets, currentProject, addDataset } = useMLContext();
  const { user } = useAuth();
  const { deleteDataset } = useDatasetActions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showUploader, setShowUploader] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showQuality, setShowQuality] = useState(false);

  // Fast search
  const filteredDatasets = useMemo(() => {
    if (!searchQuery.trim()) return datasets;
    const query = searchQuery.toLowerCase();
    return datasets.filter(ds => 
      ds.name.toLowerCase().includes(query) ||
      ds.description?.toLowerCase().includes(query)
    );
  }, [datasets, searchQuery]);

  const handleDelete = async (dataset: Dataset) => {
    if (!confirm(`Delete "${dataset.name}"?`)) return;
    const result = await deleteDataset(dataset, user?.id || '');
    if (result.success) {
      toast.success('Dataset deleted');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Top Bar */}
      <div className="border-b border-gray-800 bg-[#0A0A0A] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Datasets
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {filteredDatasets.length} {filteredDatasets.length === 1 ? 'dataset' : 'datasets'}
              </p>
            </div>

            {/* New Dataset Button - Purple like the reference */}
            <button
              onClick={() => setShowUploader(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Dataset
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs & Search */}
        <div className="flex items-center justify-between mb-6">
          {/* Tabs */}
          <div className="flex items-center gap-6 border-b border-gray-800">
            <button className="px-1 py-3 text-sm font-medium text-white border-b-2 border-white -mb-px">
              All Datasets
            </button>
            <button className="px-1 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Recent
            </button>
          </div>

          {/* Search & View Toggle */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-[#1A1A1A] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-gray-700 focus:outline-none w-64 text-sm"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-[#1A1A1A] border border-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {datasets.length === 0 && (
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-16 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No datasets yet
            </h3>
            <p className="text-gray-400 mb-6">
              Upload your first dataset to get started
            </p>
            <button
              onClick={() => setShowUploader(true)}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Dataset
            </button>
          </div>
        )}

        {/* Table View - Like the reference image */}
        {filteredDatasets.length > 0 && viewMode === 'table' && (
          <div className="bg-[#0A0A0A] border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Dataset Name
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Rows
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Columns
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredDatasets.map((dataset, idx) => (
                  <tr
                    key={dataset.id}
                    className="hover:bg-[#1A1A1A] transition-colors group"
                  >
                    <td className="py-3 px-4 text-sm text-gray-400 font-mono">
                      {dataset.id.slice(0, 12)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
                          <Database className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {dataset.name}
                          </p>
                          {dataset.description && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {dataset.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-white">
                      {(dataset.row_count || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-white">
                      {dataset.column_count || 0}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {dataset.file_size || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {formatDate(dataset.created_at || dataset.dateUploaded)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedDataset(dataset);
                            setShowPreview(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors"
                          title="Preview Data (First 25 Rows)"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDataset(dataset);
                            setShowQuality(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
                          title="Data Quality"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDataset(dataset);
                            setShowChat(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-colors"
                          title="AI Chat"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(dataset)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid View */}
        {filteredDatasets.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDatasets.map((dataset) => (
              <div
                key={dataset.id}
                className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-5 hover:border-gray-700 hover:bg-[#1F1F1F] transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {dataset.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(dataset.created_at || dataset.dateUploaded)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#0A0A0A] rounded p-3 border border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Rows</p>
                    <p className="text-lg font-bold text-white">
                      {(dataset.row_count || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-[#0A0A0A] rounded p-3 border border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Columns</p>
                    <p className="text-lg font-bold text-white">
                      {dataset.column_count || 0}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedDataset(dataset);
                      setShowChat(true);
                    }}
                    className="flex-1 px-3 py-2 bg-purple-600/10 border border-purple-500/20 text-purple-400 hover:bg-purple-600/20 hover:border-purple-500/40 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Chat
                  </button>
                  <button
                    onClick={() => handleDelete(dataset)}
                    className="px-3 py-2 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 hover:border-red-500/40 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {searchQuery && filteredDatasets.length === 0 && (
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-16 text-center">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No datasets found
            </h3>
            <p className="text-gray-400 mb-6">
              Try a different search term
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal - Dark Theme with Real Uploader */}
      {showUploader && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Upload Dataset
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Saves to Supabase & syncs to Knowledge Graph
                </p>
              </div>
              <button
                onClick={() => setShowUploader(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Real DataUploader Component */}
            <div className="p-6">
              <DataUploader
                onClose={() => {
                  setShowUploader(false);
                  // Refresh to show new dataset
                  window.location.reload();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dataset Preview Modal - Dark Theme */}
      {showPreview && selectedDataset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {selectedDataset.name}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Showing first 25 rows of {selectedDataset.row_count?.toLocaleString()} total
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Table */}
            <div className="flex-1 overflow-auto p-6">
              {selectedDataset.preview_data && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-[#0A0A0A] border-b-2 border-cyan-500/30">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider border-r border-gray-800">
                          #
                        </th>
                        {selectedDataset.preview_data.columns?.map((col: string, idx: number) => (
                          <th
                            key={idx}
                            className="px-4 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider border-r border-gray-800 last:border-r-0"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDataset.preview_data.rows?.slice(0, 25).map((row: any, rowIdx: number) => (
                        <tr
                          key={rowIdx}
                          className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-xs font-mono text-gray-500 border-r border-gray-800">
                            {rowIdx + 1}
                          </td>
                          {(Array.isArray(row) ? row : Object.values(row)).map((cell: any, cellIdx: number) => (
                            <td
                              key={cellIdx}
                              className="px-4 py-3 text-sm text-white border-r border-gray-800 last:border-r-0 font-mono"
                            >
                              {String(cell).slice(0, 50)}
                              {String(cell).length > 50 && '...'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!selectedDataset.preview_data && (
                <div className="text-center py-12">
                  <Eye className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No preview data available</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-800 bg-[#0A0A0A] flex items-center justify-between">
              <div className="text-sm text-gray-400">
                <span className="font-semibold text-white">{selectedDataset.row_count?.toLocaleString()}</span> rows × {' '}
                <span className="font-semibold text-white">{selectedDataset.column_count}</span> columns
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setShowChat(true);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Ask AI About This Data
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Quality Modal - Dark Theme */}
      {showQuality && selectedDataset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-green-900/20 to-emerald-900/20">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Data Quality: {selectedDataset.name}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Health score, missing values, and quality recommendations
                </p>
              </div>
              <button
                onClick={() => setShowQuality(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quality Dashboard */}
            <div className="flex-1 overflow-auto p-6 bg-[#0A0A0A]">
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-400">Loading quality analysis...</div>
                </div>
              }>
                <DataQualityDashboard
                  dataset={selectedDataset}
                  onFixIssue={() => {
                    // Handle quality fixes
                    toast.success('Quality improvements applied!');
                  }}
                />
              </Suspense>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-800 bg-[#0A0A0A] flex justify-end gap-3">
              <button
                onClick={() => setShowQuality(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Modal - Dark Theme */}
      {showChat && selectedDataset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl shadow-2xl max-w-4xl w-full h-[80vh] overflow-hidden flex flex-col">
            <Suspense fallback={
              <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-400">Loading AI Chat...</div>
              </div>
            }>
              <div className="flex-1 overflow-hidden">
                <EnhancedAIChat
                  dataset={selectedDataset}
                  onClose={() => setShowChat(false)}
                  isModal={true}
                />
              </div>
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagementDark;

