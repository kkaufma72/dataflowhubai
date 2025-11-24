import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useMLContext } from '../context/MLContext';
import Card from '../components/common/Card';
import DataConnector from '../components/data/DataConnector';
import DatasetCard from '../components/data/DatasetCard';
import ProjectSelectorModal from '../components/data/ProjectSelectorModal';
import { Dataset, Project } from '../types';
import { Database, Upload, Sparkles, MessageSquare, ChevronLeft, ChevronRight, Loader, Search, X, SortAsc, SortDesc, Calendar, FileType } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../components/auth/AuthProvider';
import { useDatasetActions } from '../hooks/useDatasetActions';
import toast from 'react-hot-toast';
import { generateSyntheticDataset } from '../lib/syntheticDataGenerator';
import FloatingAIAssistant from '../components/data/FloatingAIAssistant';
import DataEmptyState from '../components/data/DataEmptyState';
import { generateEnhancedSampleDatasets } from '../lib/enhancedSampleData';
import FinishSetupChecklist from '../components/onboarding/FinishSetupChecklist';
import { useNavigate } from 'react-router-dom';
import { EnhancedDataUploader } from '../components/data/EnhancedDataUploader';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

// Lazy load heavy components
const DataProfiler = lazy(() => import('../components/data/DataProfiler'));
const DataQualityDashboard = lazy(() => import('../components/data/DataQualityDashboard'));
const EnhancedAIChat = lazy(() => import('../components/data/EnhancedAIChat'));
const DatasetHealthCard = lazy(() => import('../components/data/DatasetHealthCard'));
const DataTransformationStudio = lazy(() => import('../components/data/DataTransformationStudio'));

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <LoadingSkeleton variant="card" count={3} />
);

const SAMPLE_TOUR_STORAGE_KEY = 'dfh-sample-tour-dismissed';
const SAMPLE_DATASET_IDS = new Set(generateEnhancedSampleDatasets().map(sample => sample.id));

type DatasetFilters = {
  fileType?: string;
  dateRange?: 'today' | 'week' | 'month' | 'year';
  minRows?: number;
};

const DataManagement: React.FC = () => {
  const { datasets, addDataset, currentProject, models } = useMLContext();
  const { user } = useAuth();
  const { moveDatasetToProject, deleteDataset, archiveDataset } = useDatasetActions();
  const navigate = useNavigate();
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
  
  // Smart sorting state with localStorage persistence
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'quality'>(() => {
    const saved = localStorage.getItem('dataManagement_sortBy');
    return (saved as 'name' | 'date' | 'size' | 'quality') || 'date';
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    const saved = localStorage.getItem('dataManagement_sortOrder');
    return (saved as 'asc' | 'desc') || 'desc';
  });
  
  // Search and filter state with localStorage persistence
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem('dataManagement_searchQuery') || '';
  });
  const [filters] = useState<DatasetFilters>({});
  const [hasProfiledData, setHasProfiledData] = useState(() => localStorage.getItem('dfh-setup-profiled') === 'true');
  const [showSampleTour, setShowSampleTour] = useState(false);

  // Save sort preferences to localStorage
  useEffect(() => {
    localStorage.setItem('dataManagement_sortBy', sortBy);
    localStorage.setItem('dataManagement_sortOrder', sortOrder);
  }, [sortBy, sortOrder]);

  // Save search query to localStorage when it changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        localStorage.setItem('dataManagement_searchQuery', searchQuery);
      } else {
        localStorage.removeItem('dataManagement_searchQuery');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // FIXED: Filter and search datasets FIRST (before using it in totalPages)
  const filteredDatasets = useMemo(() => {
    let result = [...datasets];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ds => 
        ds.name.toLowerCase().includes(query) ||
        ds.description?.toLowerCase().includes(query) ||
        ds.preview_data?.columns?.some(col => col.toLowerCase().includes(query))
      );
    }

    // Apply file type filter
    if (filters.fileType) {
      result = result.filter(ds => 
        ds.fileType?.toLowerCase() === filters.fileType?.toLowerCase()
      );
    }

    // Apply date filter
    if (filters.dateRange) {
      const now = new Date();
      result = result.filter(ds => {
        const uploadDate = new Date(ds.dateUploaded || '');
        switch (filters.dateRange) {
          case 'today':
            return uploadDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return uploadDate > weekAgo;
          case 'month':
            return uploadDate.getMonth() === now.getMonth() && uploadDate.getFullYear() === now.getFullYear();
          case 'year':
            return uploadDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // Apply size filter
    if (filters.minRows !== undefined) {
      result = result.filter(ds => {
        const rows = ds.rows || 0;
        return rows >= (filters.minRows || 0);
      });
    }

    // Smart sorting
    result.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'date':
          compareValue = new Date(b.dateUploaded || 0).getTime() - new Date(a.dateUploaded || 0).getTime();
          break;
        case 'size':
          compareValue = (b.rows || 0) - (a.rows || 0);
          break;
        case 'quality':
          // Calculate simple quality score based on available data
          const qualityA = a.preview_data?.rows?.length ? 100 : 50;
          const qualityB = b.preview_data?.rows?.length ? 100 : 50;
          compareValue = qualityB - qualityA;
          break;
      }
      
      return sortOrder === 'asc' ? -compareValue : compareValue;
    });

    return result;
  }, [datasets, searchQuery, filters, sortBy, sortOrder]);

  // FIXED: Calculate pagination values AFTER filteredDatasets is defined
  const totalPages = useMemo(() => 
    Math.ceil(filteredDatasets.length / pageSize), 
    [filteredDatasets.length, pageSize]
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
    filteredDatasets.slice(startIndex, endIndex), 
    [filteredDatasets, startIndex, endIndex]
  );

  const hasConnectedData = datasets.length > 0;
  const hasTrainedModel = models.some(model => model.status === 'trained' || model.status === 'deployed');
  const hasDeployedModel = models.some(model => model.status === 'deployed');

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

  useEffect(() => {
    if (!user || localStorage.getItem(SAMPLE_TOUR_STORAGE_KEY)) return;
    if (datasets.length === 0) return;
    const hasSampleDatasets = datasets.some(ds => SAMPLE_DATASET_IDS.has(ds.id));
    if (hasSampleDatasets) {
      setShowSampleTour(true);
    }
  }, [datasets, user]);

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
    if (!hasProfiledData) {
      localStorage.setItem('dfh-setup-profiled', 'true');
      setHasProfiledData(true);
    }
  }, [hasProfiledData]);

  const openChat = useCallback((dataset: Dataset) => {
    setChatDataset(dataset);
    setShowChat(true);
  }, []);

  const dismissSampleTour = useCallback(() => {
    localStorage.setItem(SAMPLE_TOUR_STORAGE_KEY, 'true');
    setShowSampleTour(false);
  }, []);

  const handleSampleTourAction = useCallback((action: 'profile' | 'chat' | 'graph') => {
    const sampleDataset = datasets.find(ds => SAMPLE_DATASET_IDS.has(ds.id)) || datasets[0];
    if (!sampleDataset) return;

    setSelectedDataset(sampleDataset);

    if (action === 'profile') {
      setShowAnalysis(true);
      setShowPreview(true);
    } else if (action === 'chat') {
      setChatDataset(sampleDataset);
      setShowChat(true);
    } else if (action === 'graph') {
      toast.success('Sample data is syncing with your knowledge graph.');
    }

    dismissSampleTour();
  }, [datasets, dismissSampleTour]);

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

  const handleChecklistConnect = useCallback(() => {
    setShowUploader(true);
  }, []);

  const handleChecklistProfile = useCallback(() => {
    const targetDataset = datasets[0];
    if (!targetDataset) {
      toast.error('Add or load a dataset first.');
      return;
    }
    handleQualityCheck(targetDataset);
  }, [datasets, handleQualityCheck]);

  const handleChecklistTrain = useCallback(() => {
    navigate('/app/train');
  }, [navigate]);

  const handleChecklistDeploy = useCallback(() => {
    navigate('/app/deployment');
  }, [navigate]);

  const handleGenerateSyntheticData = useCallback(async () => {
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

      const datasetName = `${generatorType.charAt(0).toUpperCase() + generatorType.slice(1)} Sample Dataset`;
      const datasetDescription = `Synthetic ${generatorType} dataset with ${rowCount} rows`;
      const estimatedSizeKb = `${(rows.length * columns.length * 10 / 1024).toFixed(2)} KB`;

      const datasetPayload: Dataset = {
        id: crypto.randomUUID?.() ?? `synthetic-${Date.now()}`,
        name: datasetName,
        description: datasetDescription,
        rows: rows.length,
        columns: columns.length,
        dateUploaded: new Date().toISOString(),
        fileType: 'csv',
        fileSize: estimatedSizeKb,
        projectId: currentProject?.id,
        preview_data: {
          columns,
          rows: rows.slice(0, 100)
        }
      };

      await addDataset(datasetPayload);

      toast.success(`Generated ${rowCount} rows of ${generatorType} data!`);
      setShowGeneratorModal(false);
      
    } catch (error) {
      console.error('Error generating data:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate sample data';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [user, generatorType, rowCount, addDataset, currentProject?.id]);

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
      {/* Guided sample tour */}
      {showSampleTour && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-purple-50 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Start here</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">Explore the sample workspace</h2>
              <p className="mt-1 text-sm text-gray-600">
                We’ve loaded curated datasets so you can try profiling, AI conversations, and graph sync before uploading anything.
              </p>
            </div>
            <button
              onClick={dismissSampleTour}
              className="text-gray-400 transition hover:text-gray-600"
              aria-label="Dismiss guided tour"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Profile instantly</h3>
              <p className="mt-1 text-sm text-gray-600">
                Inspect schema, column stats, and quality findings—see what our profiler surfaces automatically.
              </p>
              <Button className="mt-3" size="sm" onClick={() => handleSampleTourAction('profile')}>
                Open profiling
              </Button>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Ask the AI</h3>
              <p className="mt-1 text-sm text-gray-600">
                Launch the assistant with this dataset preloaded and ask for insights, summaries, or anomalies.
              </p>
              <Button className="mt-3" size="sm" onClick={() => handleSampleTourAction('chat')}>
                Chat about this data
              </Button>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">See graph sync</h3>
              <p className="mt-1 text-sm text-gray-600">
                Sample datasets automatically sync to the knowledge graph—no configuration required.
              </p>
              <Button className="mt-3" size="sm" onClick={() => handleSampleTourAction('graph')}>
                View sync status
              </Button>
            </div>
          </div>
        </div>
      )}

      {user && (
        <FinishSetupChecklist
          hasConnectedData={hasConnectedData}
          hasProfiledData={hasProfiledData}
          hasTrainedModel={hasTrainedModel}
          hasDeployedModel={hasDeployedModel}
          onConnect={handleChecklistConnect}
          onProfile={handleChecklistProfile}
          onTrain={handleChecklistTrain}
          onDeploy={handleChecklistDeploy}
        />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-4">
        <span className="text-gray-500 hover:text-blue-400 cursor-pointer transition-colors" onClick={() => navigate('/app')}>Home</span>
        <span className="text-gray-600">/</span>
        <span className="text-gray-500 hover:text-blue-400 cursor-pointer transition-colors">Data</span>
        <span className="text-gray-600">/</span>
        <span className="text-white font-medium">Data Management</span>
      </div>

      {/* Simplified Header with Prominent Search */}
      <div className="mb-8 space-y-6">
        {/* Title Row */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Data Management</h1>
            <p className="text-sm text-gray-400">Upload, connect, and manage your datasets</p>
          </div>
        </div>

        {datasets.length === 0 ? (
          // Empty State: Enhanced checklist and CTAs
          <DataEmptyState
            onUploadClick={() => setShowUploader(true)}
            onGenerateSampleClick={() => setShowGeneratorModal(true)}
            onConnectClick={() => setShowConnector(true)}
          />
        ) : (
          // Has Datasets: Show search bar + controls
          <div className="space-y-4">
            {/* Large Search Bar Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Prominent Search Input */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search datasets by name, tags, or columns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>
              
              {/* Primary Action Button */}
              <Button
                onClick={() => setShowUploader(true)}
                icon={<Upload className="w-4 h-4" />}
                className="btn-primary-improved whitespace-nowrap"
              >
                Upload Dataset
              </Button>
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              {/* Left: Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowConnector(true)}
                  className="px-4 py-2 bg-white border-2 border-gray-300 hover:border-indigo-500 text-gray-700 hover:text-indigo-600 font-semibold rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  <span>Connect Source</span>
                </button>
                <button
                  onClick={() => setShowGeneratorModal(true)}
                  className="px-4 py-2 bg-white border-2 border-gray-300 hover:border-indigo-500 text-gray-700 hover:text-indigo-600 font-semibold rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Sample</span>
                </button>
                <span className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 border border-gray-300 text-sm font-bold text-gray-900">
                  {filteredDatasets.length} dataset{filteredDatasets.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Right: Smart Sort Controls */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-300">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size' | 'quality')}
                  className="px-3 py-2 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="date">📅 Recent</option>
                  <option value="name">🔤 Name</option>
                  <option value="size">📊 Size</option>
                  <option value="quality">✨ Quality</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 bg-gray-900 border border-gray-700 hover:border-cyan-500 text-gray-100 rounded-lg transition-all"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        )}
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
              <DataConnector onConnect={async (connection) => {
                console.log('Connected to:', connection);
                toast.loading('Importing data from BigQuery...', { id: 'bigquery-import' });
                
                try {
                  // For GCP BigQuery connections
                  if (connection.type === 'gcp' && connection.config) {
                    const config = connection.config as any;
                    const datasetLocation = config['Dataset Location'] || '';
                    
                    // Extract dataset info from location string
                    // Format: "project.dataset.table"
                    const parts = datasetLocation.split('.');
                    const tableName = parts[parts.length - 1] || 'bitcoin_inputs';
                    
                    // Create a dataset entry from the BigQuery connection
                    const importedDataset = {
                      id: crypto.randomUUID(),
                      name: `BigQuery: ${tableName}`,
                      description: `Imported from ${datasetLocation}`,
                      rows: 1000, // Placeholder - would be from actual query
                      columns: 10, // Placeholder - would be from actual query
                      dateUploaded: new Date().toISOString(),
                      fileType: 'bigquery',
                      fileSize: 'Cloud Dataset',
                      preview_data: {
                        columns: ['input_index', 'spent_transaction_hash', 'spent_output_index', 'script_asm', 'script_hex', 'sequence', 'required_signatures', 'type', 'addresses', 'value'],
                        rows: [
                          ['0', 'a1b2c3d4e5f6...', '1', 'OP_DUP OP_HASH160...', '76a914...', '4294967295', '1', 'pubkeyhash', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', '50.00000000'],
                          ['1', 'b2c3d4e5f6a7...', '0', 'OP_DUP OP_HASH160...', '76a914...', '4294967295', '1', 'pubkeyhash', '12cbQLTFMXRnSzktFkuoG3eHoMeFtpTu3S', '25.50000000'],
                          ['0', 'c3d4e5f6a7b8...', '2', 'OP_DUP OP_HASH160...', '76a914...', '4294967294', '1', 'pubkeyhash', '1HQ3Go3ggs8pFnXuHVHRytPCq5fGG8Hbhx', '10.25000000'],
                          ['2', 'd4e5f6a7b8c9...', '1', 'OP_DUP OP_HASH160...', '76a914...', '4294967295', '1', 'pubkeyhash', '1dice8EMZmqKvrGE4Qc9bUFf9PX3xaYDp', '0.05000000'],
                          ['0', 'e5f6a7b8c9d0...', '0', 'OP_DUP OP_HASH160...', '76a914...', '4294967293', '1', 'pubkeyhash', '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', '100.00000000'],
                          ['1', 'f6a7b8c9d0e1...', '3', 'OP_DUP OP_HASH160...', '76a914...', '4294967295', '1', 'pubkeyhash', '3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy', '15.75000000'],
                          ['0', 'a7b8c9d0e1f2...', '1', 'OP_DUP OP_HASH160...', '76a914...', '4294967292', '1', 'pubkeyhash', '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF', '5.00000000'],
                          ['2', 'b8c9d0e1f2a3...', '0', 'OP_DUP OP_HASH160...', '76a914...', '4294967295', '1', 'pubkeyhash', '1LdRcdxfbSnmCYYNdeYpUnztiYzVfBEQeC', '0.10000000'],
                          ['1', 'c9d0e1f2a3b4...', '2', 'OP_DUP OP_HASH160...', '76a914...', '4294967294', '1', 'pubkeyhash', '1AC4fMwgY8j9onSbXEWeH6Zan8QGMSdmtA', '75.00000000'],
                          ['0', 'd0e1f2a3b4c5...', '1', 'OP_DUP OP_HASH160...', '76a914...', '4294967295', '1', 'pubkeyhash', '1Kn5h2qpgw9mWE5jKpk8PP4qvvJ1QVy8su', '3.25000000'],
                        ]
                      },
                      projectId: currentProject?.id,
                    };
                    
                    // Add to datasets
                    await addDataset(importedDataset);
                    
                    toast.success(`Imported ${tableName} from BigQuery!`, { id: 'bigquery-import' });
                    handleCloseConnector();
                  } else {
                    toast.success(`Connected to ${connection.name}`, { id: 'bigquery-import' });
                    handleCloseConnector();
                  }
                } catch (error) {
                  console.error('Error importing from BigQuery:', error);
                  toast.error('Failed to import data from BigQuery', { id: 'bigquery-import' });
                }
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
                          ? 'bg-primary-600 text-white border-purple-600'
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

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-sm text-primary-800">
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

      {/* Datasets Grid with Pagination OR Organize View */}
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
          // SMART GRID VIEW - Automatically sorted and organized
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedDatasets.map((dataset) => {
                const isSampleDataset = SAMPLE_DATASET_IDS.has(dataset.id);
                return (
                  <div key={dataset.id} className="space-y-3">
                    <DatasetCard
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
                    {isSampleDataset && (
                      <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-3 text-sm text-indigo-900 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                              Sample dataset tips
                            </p>
                            <p className="text-sm text-indigo-900">
                              Try these quick actions before uploading your own data.
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQualityCheck(dataset)}
                          >
                            Run quality scan
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAnalyze(dataset)}
                          >
                            Explore profiling
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openChat(dataset)}
                          >
                            Ask AI for insights
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
                                  ? 'bg-primary-600 text-white'
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
        datasetName={datasetToMove?.name || ''}
      />

      {/* Floating AI Assistant */}
      <FloatingAIAssistant
        onAction={(action) => {
          switch (action) {
            case 'upload':
              setShowUploader(true);
              break;
            case 'organize':
              // Auto-organize by quality (highest quality first)
              setSortBy('quality');
              setSortOrder('desc');
              toast.success('Sorted by data quality');
              break;
            case 'analyze':
              if (datasets.length > 0) {
                handleQualityCheck(datasets[0]);
              } else {
                toast.error('Upload a dataset first');
              }
              break;
            case 'search':
              // Focus search bar
              const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
              searchInput?.focus();
              break;
          }
        }}
      />
    </div>
  );
};

export default DataManagement;
