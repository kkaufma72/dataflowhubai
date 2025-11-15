/**
 * Professional AI CRM Database Interface
 * 
 * Clean, modern, easy-to-use design with excellent visibility
 * Inspired by: Notion, Airtable, Linear
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
  ChevronDown,
  Grid3x3,
  List,
  Calendar,
  FileText,
  MoreHorizontal,
  TrendingUp,
  Zap
} from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../components/auth/AuthProvider';
import { useDatasetActions } from '../hooks/useDatasetActions';
import toast from 'react-hot-toast';

// Lazy load heavy components
const DataProfiler = lazy(() => import('../components/data/DataProfiler'));
const EnhancedAIChat = lazy(() => import('../components/data/EnhancedAIChat'));

const DataManagementPro: React.FC = () => {
  const { datasets, currentProject } = useMLContext();
  const { user } = useAuth();
  const { deleteDataset } = useDatasetActions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploader, setShowUploader] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Simple, fast search
  const filteredDatasets = useMemo(() => {
    if (!searchQuery.trim()) return datasets;
    const query = searchQuery.toLowerCase();
    return datasets.filter(ds => 
      ds.name.toLowerCase().includes(query) ||
      ds.description?.toLowerCase().includes(query)
    );
  }, [datasets, searchQuery]);

  const handleDelete = async (dataset: Dataset) => {
    if (!confirm(`Delete "${dataset.name}"? This cannot be undone.`)) return;
    
    const result = await deleteDataset(dataset, user?.id || '');
    if (result.success) {
      toast.success('Dataset deleted');
    }
  };

  const handleView = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowPreview(true);
  };

  const handleChat = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowChat(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar - Clean & Professional */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title & Count */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Datasets
                </h1>
                <p className="text-sm text-gray-600">
                  {filteredDatasets.length} of {datasets.length} datasets
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowUploader(true)}
                icon={<Plus className="w-5 h-5" />}
                className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
              >
                New Dataset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search & View Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Search Bar - Large & Clear */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search datasets..."
                className="w-full pl-12 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid View"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {datasets.length === 0 && (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-16 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Database className="w-10 h-10 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No datasets yet
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Upload your first dataset to start analyzing data with AI
            </p>
            <Button
              onClick={() => setShowUploader(true)}
              icon={<Upload className="w-5 h-5" />}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 text-lg"
            >
              Upload Your First Dataset
            </Button>
          </div>
        )}

        {/* Dataset Grid View */}
        {filteredDatasets.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDatasets.map((dataset) => (
              <div
                key={dataset.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all duration-200 overflow-hidden group"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Database className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {dataset.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {new Date(dataset.created_at || dataset.dateUploaded || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Stats */}
                <div className="p-5 bg-gray-50">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Rows</p>
                      <p className="text-xl font-bold text-gray-900">
                        {(dataset.row_count || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Columns</p>
                      <p className="text-xl font-bold text-gray-900">
                        {dataset.column_count || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
                  <Button
                    onClick={() => handleView(dataset)}
                    variant="outline"
                    size="sm"
                    icon={<Eye className="w-4 h-4" />}
                    className="flex-1"
                  >
                    View
                  </Button>
                  <Button
                    onClick={() => handleChat(dataset)}
                    variant="outline"
                    size="sm"
                    icon={<Sparkles className="w-4 h-4" />}
                    className="flex-1 text-primary-600 border-primary/20 hover:bg-primary/5"
                  >
                    AI Chat
                  </Button>
                  <button
                    onClick={() => handleDelete(dataset)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dataset List View */}
        {filteredDatasets.length > 0 && viewMode === 'list' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Rows
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Columns
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDatasets.map((dataset) => (
                  <tr
                    key={dataset.id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex items-center justify-center">
                          <Database className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-gray-900">
                            {dataset.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {dataset.file_type?.toUpperCase() || 'CSV'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-base font-semibold text-gray-900">
                        {(dataset.row_count || 0).toLocaleString()}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-base font-semibold text-gray-900">
                        {dataset.column_count || 0}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-gray-600">
                        {new Date(dataset.created_at || dataset.dateUploaded || '').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(dataset)}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary/5 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleChat(dataset)}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary/5 rounded-lg transition-colors"
                          title="AI Chat"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(dataset)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

        {/* No Results */}
        {searchQuery && filteredDatasets.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No datasets found
            </h3>
            <p className="text-gray-600 mb-6">
              Try a different search term or upload a new dataset
            </p>
            <Button
              onClick={() => setSearchQuery('')}
              variant="outline"
            >
              Clear Search
            </Button>
          </div>
        )}
      </div>

      {/* Upload Modal - Clean & Simple */}
      {showUploader && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Upload Dataset
                  </h2>
                  <p className="text-primary/10 mt-1">
                    CSV, Excel, or JSON files supported
                  </p>
                </div>
                <button
                  onClick={() => setShowUploader(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Upload Area */}
            <div className="p-8">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-primary-400 hover:bg-primary/5/30 transition-all">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Drop file here or click to browse
                </h3>
                <p className="text-gray-600 mb-6">
                  Supports CSV, Excel (.xlsx, .xls), JSON files up to 50MB
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  className="hidden"
                  id="file-upload-pro"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      toast.loading(`Uploading ${file.name}...`);
                      setShowUploader(false);
                    }
                  }}
                />
                <label
                  htmlFor="file-upload-pro"
                  className="inline-block px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Preview Modal */}
      {showPreview && selectedDataset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedDataset.name}
                  </h2>
                  <p className="text-primary/10 mt-1">
                    {selectedDataset.row_count?.toLocaleString()} rows • {selectedDataset.column_count} columns
                  </p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-8">
              <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                <DataProfiler
                  dataset={selectedDataset}
                  onApplyRecommendations={() => {}}
                />
              </Suspense>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 flex justify-end gap-3">
              <Button
                onClick={() => {
                  setShowPreview(false);
                  handleChat(selectedDataset);
                }}
                icon={<Sparkles className="w-4 h-4" />}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                Ask AI About This Data
              </Button>
              <Button
                onClick={() => setShowPreview(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Modal */}
      {showChat && selectedDataset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[80vh] overflow-hidden">
            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading AI...</div>}>
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

export default DataManagementPro;

