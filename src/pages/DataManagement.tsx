import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useMLContext } from '../context/MLContext';
import Card from '../components/common/Card';
import DataUploader from '../components/data/DataUploader';
import DataConnector from '../components/data/DataConnector';
import DatasetCard from '../components/data/DatasetCard';
import ProjectSelectorModal from '../components/data/ProjectSelectorModal';
import { Dataset, Project } from '../types';
import { Database, Upload, X, Sparkles, MessageSquare, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../components/auth/AuthProvider';
import { useDatasetActions } from '../hooks/useDatasetActions';
import toast from 'react-hot-toast';
import PageHeader from '../components/common/PageHeader';
import { generateSyntheticDataset } from '../lib/syntheticDataGenerator';
import { supabase } from '../lib/supabase';

// Lazy load heavy components
const DataProfiler = lazy(() => import('../components/data/DataProfiler'));
const DataQualityDashboard = lazy(() => import('../components/data/DataQualityDashboard'));
const EnhancedAIChat = lazy(() => import('../components/data/EnhancedAIChat'));
const DatasetHealthCard = lazy(() => import('../components/data/DatasetHealthCard'));
const DataTransformationStudio = lazy(() => import('../components/data/DataTransformationStudio'));

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
  </div>
);

const DataManagement: React.FC = () => {
  const { datasets, currentProject, addDataset } = useMLContext();
  const { user } = useAuth();
  const { moveDatasetToProject, deleteDataset, archiveDataset } = useDatasetActions();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showConnector, setShowConnector] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatDataset, setChatDataset] = useState<Dataset | null>(null);
  const [showTransformStudio, setShowTransformStudio] = useState(false);
  const [transformDataset, setTransformDataset] = useState<Dataset | null>(null);
  const [generatorType, setGeneratorType] = useState<'marketing' | 'sales' | 'customer'>('marketing');
  const [rowCount, setRowCount] = useState(1000);
  const [isGenerating, setIsGenerating] = useState(false);

  // Move dataset state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [datasetToMove, setDatasetToMove] = useState<Dataset | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(6);

  // Memoize expensive calculations
  const totalPages = useMemo(() => 
    Math.ceil(datasets.length / pageSize), 
    [datasets.length, pageSize]
  );

  const startIndex = useMemo(() => 
    (currentPage - 1) * pageSize, 
    [currentPage, pageSize]
  );

  const endIndex = useMemo(() => 
    startIndex + pageSize, 
    [startIndex, pageSize]
  );

  const paginatedDatasets = useMemo(() => 
    datasets.slice(startIndex, endIndex),
    [datasets, startIndex, endIndex]
  );

  // Reset to page 1 when datasets change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [datasets.length, totalPages, currentPage]);

  // Auto-show quality dashboard for newly uploaded datasets
  useEffect(() => {
    const checkNewDatasets = () => {
      const lastViewedId = localStorage.getItem('lastViewedDatasetId');
      const newestDataset = datasets[0];
      
      if (newestDataset && newestDataset.id !== lastViewedId) {
        setSelectedDataset(newestDataset);
        setShowQuality(true);
        localStorage.setItem('lastViewedDatasetId', newestDataset.id);
      }
    };
    
    if (datasets.length > 0) {
      checkNewDatasets();
    }
  }, [datasets]);

  // Memoized callback functions to prevent unnecessary re-renders
  const handlePreview = useCallback((dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowPreview(true);
  }, []);

  const handleAnalyze = useCallback((dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowAnalysis(true);
  }, []);

  const handleQualityCheck = useCallback((dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowQuality(true);
  }, []);

  const openChat = useCallback((dataset: Dataset) => {
    setChatDataset(dataset);
    setShowChat(true);
  }, []);

  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
  }, []);

  const handleCloseAnalysis = useCallback(() => {
    setShowAnalysis(false);
  }, []);

  const handleCloseQuality = useCallback(() => {
    setShowQuality(false);
  }, []);

  const handleCloseChat = useCallback(() => {
    setShowChat(false);
    setChatDataset(null);
  }, []);

  const handleTransform = useCallback((dataset: Dataset) => {
    setTransformDataset(dataset);
    setShowTransformStudio(true);
  }, []);

  const handleCloseTransform = useCallback(() => {
    setShowTransformStudio(false);
    setTransformDataset(null);
  }, []);

  const handleSaveTransformedDataset = useCallback(async (transformed: Dataset) => {
    try {
      await addDataset(transformed);
      toast.success('✨ Transformed dataset saved!');
      setShowTransformStudio(false);
      setTransformDataset(null);
    } catch (error) {
      console.error('Error saving transformed dataset:', error);
      toast.error('Failed to save transformed dataset');
    }
  }, [addDataset]);

  // Move dataset handlers
  const handleMoveDataset = useCallback((dataset: Dataset) => {
    setDatasetToMove(dataset);
    setShowMoveModal(true);
  }, []);

  const handleConfirmMove = useCallback(async (targetProject: Project) => {
    if (!datasetToMove || !user) return;
    
    const result = await moveDatasetToProject(
      datasetToMove.id, 
      targetProject.id, 
      targetProject.name, 
      user.id
    );
    
    if (result.success) {
      // Refresh datasets - in a real app you'd want to update the context
      window.location.reload();
    }
    
    setShowMoveModal(false);
    setDatasetToMove(null);
  }, [datasetToMove, user, moveDatasetToProject]);

  const handleCloseMoveModal = useCallback(() => {
    setShowMoveModal(false);
    setDatasetToMove(null);
  }, []);

  // Delete and archive handlers
  const handleDeleteDataset = useCallback(async (dataset: Dataset) => {
    if (!user) return;
    await deleteDataset(dataset, user.id);
    // Refresh datasets - in a real app you'd want to update the context
    window.location.reload();
  }, [user, deleteDataset]);

  const handleArchiveDataset = useCallback(async (dataset: Dataset) => {
    if (!user) return;
    await archiveDataset(dataset, user.id);
    // Refresh datasets - in a real app you'd want to update the context  
    window.location.reload();
  }, [user, archiveDataset]);

  const handleCloseUploader = useCallback(() => {
    setShowUploader(false);
  }, []);

  const handleCloseConnector = useCallback(() => {
    setShowConnector(false);
  }, []);

  const handleGenerateSyntheticData = useCallback(async () => {
    if (!currentProject) {
      toast.error('Please select a project first');
      return;
    }

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setIsGenerating(true);
    try {
      // Map our generator type to available types in the synthetic data generator
      const typeMapping: Record<string, 'marketing' | 'financial' | 'ecommerce'> = {
        'marketing': 'marketing',
        'sales': 'ecommerce', // Map sales to ecommerce data
        'customer': 'financial' // Map customer to financial data
      };
      
      const result = generateSyntheticDataset(
        typeMapping[generatorType] || 'marketing', 
        rowCount 
      );
      const { columns, rows } = result;
      
      const { error } = await supabase
        .from('datasets')
        .insert([{
          name: `${generatorType.charAt(0).toUpperCase() + generatorType.slice(1)} Sample Dataset`,
          description: `Synthetic ${generatorType} dataset with ${rowCount} rows`,
          file_type: 'csv',
          file_size: `${(rows.length * columns.length * 10 / 1024).toFixed(2)} KB`,
          row_count: rows.length,
          column_count: columns.length,
          preview_data: {
            columns: columns,
            rows: rows.slice(0, 100)
          },
          project_id: currentProject.id,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success(`Generated ${rowCount} rows of ${generatorType} data!`);
      setShowGeneratorModal(false);
      window.location.reload();
      
    } catch (error) {
      console.error('Error generating data:', error);
      toast.error('Failed to generate sample data');
    } finally {
      setIsGenerating(false);
    }
  }, [currentProject, user, generatorType, rowCount]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Memoize page numbers for pagination
  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  return (
    <div className="space-y-6">
      {/* Page Header - Improved visibility */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Database className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Data Management
            </h1>
            <p className="mt-2 text-lg text-gray-600 font-medium">
              Upload, connect, and manage your datasets
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => setShowUploader(true)}
          icon={<Upload className="w-4 h-4" />}
        >
          Upload Dataset
        </Button>
        <Button
          onClick={() => setShowConnector(true)}
          variant="outline"
          icon={<Database className="w-4 h-4" />}
        >
          Connect Data Source
        </Button>
        <Button
          onClick={() => setShowGeneratorModal(true)}
          variant="outline"
          icon={<Sparkles className="w-4 h-4" />}
        >
          Generate Sample Data
        </Button>
      </div>

      {/* Uploader Modal */}
      {showUploader && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Upload Dataset</h3>
              <button
                onClick={handleCloseUploader}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <DataUploader onClose={handleCloseUploader} />
            </div>
          </div>
        </div>
      )}

      {/* Connector Modal */}
      {showConnector && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Connect Data Source</h3>
              <button
                onClick={handleCloseConnector}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <DataConnector onConnect={(connection) => {
                console.log('Connected to:', connection);
                toast.success(`Connected to ${connection.name}`);
                handleCloseConnector();
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Synthetic Data Generator Modal */}
      {showGeneratorModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Generate Sample Data</h3>
              <button
                onClick={() => setShowGeneratorModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dataset Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['marketing', 'sales', 'customer'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setGeneratorType(type)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        generatorType === type
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Rows: {rowCount.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={rowCount}
                  onChange={(e) => setRowCount(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>100</span>
                  <span>10,000</span>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800">
                  <strong>Preview:</strong> This will generate a realistic {generatorType} dataset with {rowCount.toLocaleString()} rows including various metrics and dimensions.
                </p>
              </div>

              <div className="flex space-x-3 pt-2">
                <Button
                  onClick={handleGenerateSyntheticData}
                  disabled={isGenerating}
                  icon={<Sparkles className="w-4 h-4" />}
                  className="flex-1"
                >
                  {isGenerating ? 'Generating...' : 'Generate Dataset'}
                </Button>
                <Button
                  onClick={() => setShowGeneratorModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Datasets Grid with Pagination */}
      <div>
        {datasets.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No datasets</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading a dataset or connecting a data source.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedDatasets.map((dataset) => (
                <DatasetCard
                  key={dataset.id}
                  dataset={dataset}
                  onPreview={handlePreview}
                  onAnalyze={handleAnalyze}
                  onQualityCheck={handleQualityCheck}
                  onChat={openChat}
                  onTransform={handleTransform}
                  onMove={handleMoveDataset}
                  onDelete={handleDeleteDataset}
                  onArchive={handleArchiveDataset}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
                <div className="flex flex-1 justify-between sm:hidden">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{startIndex + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(endIndex, datasets.length)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{datasets.length}</span>
                      {' '}datasets
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      icon={<ChevronLeft className="w-4 h-4" />}
                    >
                      Previous
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex space-x-1">
                      {pageNumbers.map((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-1 text-sm font-medium rounded-md ${
                                currentPage === page
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-2 py-1 text-gray-500">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      icon={<ChevronRight className="w-4 h-4" />}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quality Dashboard Modal with Lazy Loading */}
      {showQuality && selectedDataset && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Data Quality: {selectedDataset.name}
              </h3>
              <button
                onClick={handleCloseQuality}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <Suspense fallback={<LoadingFallback />}>
                <div className="space-y-6">
                  {/* Health Score Card */}
                  <DatasetHealthCard dataset={selectedDataset} showDetails={true} />
                  
                  {/* Detailed Quality Dashboard */}
                  <DataQualityDashboard dataset={selectedDataset} />
                </div>
              </Suspense>
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t">
              <Button
                onClick={() => {
                  handleCloseQuality();
                  handlePreview(selectedDataset);
                }}
              >
                View Data
              </Button>
              <Button
                onClick={() => {
                  handleCloseQuality();
                  openChat(selectedDataset);
                }}
                icon={<MessageSquare className="w-4 h-4" />}
              >
                Ask AI About Quality
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedDataset && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Preview: {selectedDataset.name}
              </h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedDataset.preview_data) {
                      const csv = [
                        selectedDataset.preview_data.columns.join(','),
                        ...selectedDataset.preview_data.rows.map(row => row.join(','))
                      ].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedDataset.name}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('Dataset exported successfully!');
                    }
                  }}
                  icon={<Database className="w-4 h-4" />}
                >
                  Export CSV
                </Button>
                <button
                  onClick={handleClosePreview}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {selectedDataset.preview_data ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {selectedDataset.preview_data.columns?.map((col, idx) => (
                          <th
                            key={idx}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedDataset.preview_data.rows?.slice(0, 20).map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Showing first 20 rows of {selectedDataset.rows?.toLocaleString() || 0} total rows
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No preview data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal with Lazy Loading */}
      {showAnalysis && selectedDataset && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Analyze: {selectedDataset.name}
              </h3>
              <button
                onClick={handleCloseAnalysis}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <Suspense fallback={<LoadingFallback />}>
                <DataProfiler 
                  dataset={selectedDataset}
                  onApplyRecommendations={(recommendations) => {
                    console.log('Applying recommendations:', recommendations);
                    toast.success('Recommendations applied!');
                  }}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced AI Chat Modal with Marketing Intelligence */}
      {showChat && chatDataset && (
        <Suspense fallback={<LoadingFallback />}>
          <EnhancedAIChat
            dataset={chatDataset}
            onClose={handleCloseChat}
            isModal={true}
          />
        </Suspense>
      )}

      {/* Data Transformation Studio */}
      {showTransformStudio && transformDataset && (
        <Suspense fallback={<LoadingFallback />}>
          <DataTransformationStudio
            dataset={transformDataset}
            onSave={handleSaveTransformedDataset}
            onClose={handleCloseTransform}
            isModal={true}
          />
        </Suspense>
      )}

      {/* Move Dataset Modal */}
      <ProjectSelectorModal
        isOpen={showMoveModal}
        onClose={handleCloseMoveModal}
        onSelectProject={handleConfirmMove}
        currentProjectId={currentProject?.id}
        datasetName={datasetToMove?.name || ''}
      />
    </div>
  );
};

export default DataManagement;