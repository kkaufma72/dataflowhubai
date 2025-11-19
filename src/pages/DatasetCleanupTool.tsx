import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import { Trash2, RefreshCw, AlertCircle, Eye, X, Undo2, Database, Columns, HardDrive, Clock, Download, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

interface DatasetInfo {
  id: string;
  name: string;
  created_at: string;
  file_size?: string;
  row_count?: number;
  column_count?: number;
  preview_data?: {
    columns?: string[];
    rows?: any[][];
  };
}

interface DuplicateGroup {
  name: string;
  datasets: DatasetInfo[];
}

interface DeletedDataset {
  dataset: DatasetInfo;
  deletedAt: number;
  expiresAt: number;
}

interface PreviewData {
  columns: string[];
  rows: any[][];
  rowCount: number;
  columnCount: number;
}

export default function DatasetCleanupTool() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [projectNameConfirm, setProjectNameConfirm] = useState('');
  const [deletedDatasets, setDeletedDatasets] = useState<DeletedDataset[]>([]);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Derive a project name for confirmation (use first dataset's name pattern or "datasets")
  const projectIdentifier = duplicates.length > 0 ? duplicates[0].name.split('_')[0] || 'datasets' : 'datasets';

  // Auto-cleanup expired undo buffer entries
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDeletedDatasets(prev => prev.filter(d => d.expiresAt > now));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const exportDuplicatesToCSV = () => {
    const selectedDatasets = duplicates
      .flatMap(g => g.datasets)
      .filter(d => selectedIds.has(d.id));

    if (selectedDatasets.length === 0) {
      toast.error('No datasets selected for export');
      return;
    }

    // Create CSV content
    const headers = ['ID', 'Name', 'Created At', 'File Size', 'Row Count', 'Column Count'];
    const rows = selectedDatasets.map(d => [
      d.id,
      d.name,
      new Date(d.created_at).toISOString(),
      d.file_size || 'N/A',
      d.row_count?.toString() || 'N/A',
      d.column_count?.toString() || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `duplicate_datasets_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${selectedDatasets.length} datasets to CSV`);
  };

  const analyzeDatasets = useCallback(async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('id, name, created_at, file_size, row_count, column_count, preview_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setTotalCount(data?.length || 0);

      // Group by name to find duplicates
      const nameGroups: { [key: string]: DatasetInfo[] } = {};
      
      (data || []).forEach((dataset: DatasetInfo) => {
        if (!nameGroups[dataset.name]) {
          nameGroups[dataset.name] = [];
        }
        nameGroups[dataset.name].push(dataset);
      });

      // Filter to only groups with duplicates
      const duplicateGroups = Object.entries(nameGroups)
        .filter(([_, group]) => group.length > 1)
        .map(([name, datasets]) => ({ name, datasets }))
        .sort((a, b) => b.datasets.length - a.datasets.length);

      setDuplicates(duplicateGroups);

      if (duplicateGroups.length === 0) {
        toast.success('No duplicates found!');
      } else {
        const totalDupes = duplicateGroups.reduce((sum, g) => sum + g.datasets.length - 1, 0);
        toast.success(`Found ${totalDupes} duplicate datasets across ${duplicateGroups.length} groups`);
      }
    } catch (error: any) {
      console.error('Error analyzing datasets:', error);
      toast.error(error.message || 'Failed to analyze datasets');
    } finally {
      setAnalyzing(false);
    }
  }, [user]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllDuplicates = () => {
    const allDuplicateIds = new Set<string>();
    duplicates.forEach(group => {
      // Skip first (oldest) in each group
      group.datasets.slice(1).forEach(d => allDuplicateIds.add(d.id));
    });
    setSelectedIds(allDuplicateIds);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const openReviewModal = () => {
    if (selectedIds.size === 0) {
      toast.error('No datasets selected');
      return;
    }
    setShowReviewModal(true);
    setProjectNameConfirm('');
  };

  const fetchPreview = async (datasetId: string) => {
    setLoadingPreview(true);
    setPreviewingId(datasetId);
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('preview_data, row_count, column_count')
        .eq('id', datasetId)
        .single();

      if (error) throw error;

      if (data?.preview_data) {
        setPreviewData({
          columns: data.preview_data.columns || [],
          rows: data.preview_data.rows || [],
          rowCount: data.row_count || 0,
          columnCount: data.column_count || 0,
        });
      } else {
        toast.error('No preview data available');
        setPreviewingId(null);
      }
    } catch (error: any) {
      console.error('Error fetching preview:', error);
      toast.error('Failed to load preview');
      setPreviewingId(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    setPreviewingId(null);
    setPreviewData(null);
  };

  const executeDelete = async () => {
    if (projectNameConfirm.toLowerCase() !== projectIdentifier.toLowerCase()) {
      toast.error(`Please type "${projectIdentifier}" to confirm`);
      return;
    }

    if (selectedIds.size === 0) {
      toast.error('No datasets selected');
      return;
    }

    setLoading(true);
    const now = Date.now();
    const expiresAt = now + 60000; // 60 seconds
    const deleted: DeletedDataset[] = [];

    try {
      // Fetch full dataset info before deletion
      const idsToDelete = Array.from(selectedIds);
      const { data: datasetsToDelete, error: fetchError } = await supabase
        .from('datasets')
        .select('*')
        .in('id', idsToDelete);

      if (fetchError) throw fetchError;

      // Delete datasets
      const { error: deleteError } = await supabase
        .from('datasets')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) throw deleteError;

      // Store in undo buffer
      (datasetsToDelete || []).forEach((dataset: any) => {
        deleted.push({
          dataset,
          deletedAt: now,
          expiresAt,
        });
      });

      setDeletedDatasets(prev => [...prev, ...deleted]);
      toast.success(`Deleted ${deleted.length} datasets (60s undo available)`);

      // Clear selection and close modal
      setSelectedIds(new Set());
      setShowReviewModal(false);
      setProjectNameConfirm('');

      // Re-analyze
      await analyzeDatasets();
    } catch (error: any) {
      console.error('Error during deletion:', error);
      toast.error(error.message || 'Failed to delete datasets');
    } finally {
      setLoading(false);
    }
  };

  const undoDelete = async (deletedItem: DeletedDataset) => {
    try {
      const { error } = await supabase
        .from('datasets')
        .insert([deletedItem.dataset]);

      if (error) throw error;

      toast.success('Dataset restored!');
      setDeletedDatasets(prev => prev.filter(d => d.dataset.id !== deletedItem.dataset.id));

      // Re-analyze
      await analyzeDatasets();
    } catch (error: any) {
      console.error('Error restoring dataset:', error);
      toast.error('Failed to restore dataset');
    }
  };

  const getRemainingTime = (expiresAt: number) => {
    const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    return `${remaining}s`;
  };

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Dataset Cleanup</h1>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Connected</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Analyze and safely remove duplicate datasets with 60-second undo protection
          </p>

          {!user && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-400">Not Logged In</p>
                  <p className="text-sm text-yellow-300/80">Please log in to use this tool</p>
                </div>
              </div>
            </div>
          )}

          {totalCount > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-4">
                <Database className="w-6 h-6 text-blue-400" />
                <div className="flex-1">
                  <p className="text-lg font-semibold text-white">
                    {totalCount} Total Datasets
                  </p>
                  {duplicates.length > 0 && (
                    <p className="text-sm text-gray-400 mt-1">
                      {duplicates.reduce((sum, g) => sum + g.datasets.length - 1, 0)} duplicates 
                      across {duplicates.length} groups
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={analyzeDatasets}
              disabled={analyzing || !user}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${analyzing ? 'animate-spin' : ''}`} />
              {analyzing ? 'Analyzing...' : 'Analyze Datasets'}
            </button>

            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={openReviewModal}
                  disabled={loading || !user}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Selected ({selectedIds.size})
                </button>
                <button
                  onClick={clearSelection}
                  className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg transition-colors"
                >
                  Clear Selection
                </button>
              </>
            )}

            {duplicates.length > 0 && selectedIds.size === 0 && (
              <button
                onClick={selectAllDuplicates}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg transition-colors"
              >
                Select All Duplicates
              </button>
            )}
          </div>
        </div>

        {/* Undo Banner */}
        {deletedDatasets.length > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-orange-400 mb-2">Recently Deleted ({deletedDatasets.length})</p>
                <div className="space-y-2">
                  {deletedDatasets.map((item) => (
                    <div key={item.dataset.id} className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.dataset.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Expires in {getRemainingTime(item.expiresAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => undoDelete(item)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors ml-3"
                      >
                        <Undo2 className="w-4 h-4" />
                        Undo
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate Groups */}
        {duplicates.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Duplicate Groups</h2>
            <div className="space-y-4">
              {duplicates.map((group, idx) => (
                <div key={idx} className="border border-gray-800 rounded-lg p-4 bg-gray-900/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">{group.name}</h3>
                    <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-sm font-semibold">
                      {group.datasets.length} copies
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.datasets.map((dataset, dIdx) => (
                      <div
                        key={dataset.id}
                        className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                          dIdx === 0 
                            ? 'bg-emerald-500/10 border border-emerald-500/20' 
                            : selectedIds.has(dataset.id)
                            ? 'bg-red-500/20 border border-red-500/30'
                            : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {dIdx > 0 && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(dataset.id)}
                              onChange={() => toggleSelection(dataset.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-gray-900"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-mono text-gray-400 truncate">{dataset.id}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span>Created: {new Date(dataset.created_at).toLocaleString()}</span>
                              {dataset.column_count && (
                                <span className="flex items-center gap-1">
                                  <Columns className="w-3 h-3" />
                                  {dataset.column_count} cols
                                </span>
                              )}
                              {dataset.row_count && (
                                <span className="flex items-center gap-1">
                                  <Database className="w-3 h-3" />
                                  {dataset.row_count.toLocaleString()} rows
                                </span>
                              )}
                              {dataset.file_size && (
                                <span className="flex items-center gap-1">
                                  <HardDrive className="w-3 h-3" />
                                  {dataset.file_size}
                                </span>
                              )}
                            </div>
                          </div>
                          {dIdx > 0 && (
                            <button
                              onClick={() => fetchPreview(dataset.id)}
                              disabled={loadingPreview && previewingId === dataset.id}
                              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ml-3 ${
                          dIdx === 0 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {dIdx === 0 ? 'KEEP' : 'DUPLICATE'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Duplicates Found */}
        {totalCount > 0 && duplicates.length === 0 && !analyzing && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
            <div className="text-emerald-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Duplicates Found!</h3>
            <p className="text-gray-400">Your datasets are clean and organized</p>
          </div>
        )}

        {/* Enhanced Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Review Deletion</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Preview and export duplicates before permanent removal
                    </p>
                  </div>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {/* Warning Banner */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-400 mb-1">Confirm Deletion</p>
                      <p className="text-sm text-red-300/80">
                        You are about to permanently delete {selectedIds.size} dataset{selectedIds.size !== 1 ? 's' : ''}. 
                        <strong className="text-red-400"> You will have 60 seconds to undo this action.</strong>
                      </p>
                    </div>
                    <button
                      onClick={exportDuplicatesToCSV}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                      title="Export selected datasets to CSV before deletion"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* Data Preview Table */}
                <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden mb-6">
                  <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-300">
                        Datasets to Delete ({selectedIds.size})
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">Scroll to view all</span>
                  </div>
                  <div className="overflow-auto max-h-80">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-800">
                        <tr className="border-b border-gray-700">
                          <th className="px-4 py-3 text-left font-semibold text-gray-300 w-12">#</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">Created</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">Rows</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">Cols</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">Size</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(selectedIds).map((id, idx) => {
                          const dataset = duplicates
                            .flatMap(g => g.datasets)
                            .find(d => d.id === id);
                          return dataset ? (
                            <tr key={id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                              <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                              <td className="px-4 py-3 text-white font-medium">{dataset.name}</td>
                              <td className="px-4 py-3 text-gray-400 text-xs">
                                {new Date(dataset.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-gray-400">
                                {dataset.row_count?.toLocaleString() || '—'}
                              </td>
                              <td className="px-4 py-3 text-gray-400">
                                {dataset.column_count || '—'}
                              </td>
                              <td className="px-4 py-3 text-gray-400 text-xs">
                                {dataset.file_size || '—'}
                              </td>
                              <td className="px-4 py-3 text-gray-500 font-mono text-xs truncate max-w-xs" title={dataset.id}>
                                {dataset.id.slice(0, 8)}...
                              </td>
                            </tr>
                          ) : null;
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Confirmation Input */}
                <div className="bg-gray-800/30 rounded-lg border border-gray-700 p-4">
                  <label className="block text-sm font-semibold text-white mb-2">
                    Type <span className="text-red-400 font-mono bg-red-500/10 px-2 py-0.5 rounded">{projectIdentifier}</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={projectNameConfirm}
                    onChange={(e) => setProjectNameConfirm(e.target.value)}
                    placeholder={projectIdentifier}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 font-mono"
                    autoComplete="off"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 This safeguard prevents accidental deletions. You'll have 60 seconds to undo after confirming.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-800 flex gap-3">
                <button
                  onClick={executeDelete}
                  disabled={projectNameConfirm.toLowerCase() !== projectIdentifier.toLowerCase() || loading}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Confirm Delete {selectedIds.size} Dataset{selectedIds.size !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed text-gray-300 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewingId && previewData && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Dataset Preview</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {previewData.rowCount.toLocaleString()} rows × {previewData.columnCount} columns
                    </p>
                  </div>
                  <button
                    onClick={closePreview}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-auto flex-1">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        {previewData.columns.map((col, idx) => (
                          <th key={idx} className="px-4 py-3 text-left font-semibold text-gray-300 bg-gray-800/50">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.slice(0, 10).map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-gray-800/50">
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-4 py-3 text-gray-400">
                              {cell !== null && cell !== undefined ? String(cell) : '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
