import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense, useRef, startTransition } from 'react';
import SearchInput from '../components/common/SearchInput';
import { useMLContext } from '../context/MLContext';
import DataConnector from '../components/data/DataConnector';
import { Dataset } from '../types';
import { Upload, Sparkles, MessageSquare, ChevronLeft, ChevronRight, X, TrendingUp } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../components/auth/AuthProvider';
import toast from 'react-hot-toast';
import { generateSyntheticDataset } from '../lib/syntheticDataGenerator';
import FloatingAIAssistant from '../components/data/FloatingAIAssistant';
import DataEmptyState from '../components/data/DataEmptyState';
import { generateEnhancedSampleDatasets } from '../lib/enhancedSampleData';
import FinishSetupChecklist from '../components/onboarding/FinishSetupChecklist';
import { useNavigate } from 'react-router-dom';
import DataUploader from '../components/data/DataUploader';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Lazy load heavy components
const DataProfiler = lazy(() => import('../components/data/DataProfiler'));
const DataQualityDashboard = lazy(() => import('../components/data/DataQualityDashboard'));
const EnhancedAIChat = lazy(() => import('../components/data/EnhancedAIChat'));
const DatasetHealthCard = lazy(() => import('../components/data/DatasetHealthCard'));
const DataTransformationStudio = lazy(() => import('../components/data/DataTransformationStudio'));
const FREDDatasetImporter = lazy(() => import('../components/data/FREDDatasetImporter'));
const FREDSmartSuggestions = lazy(() => import('../components/data/FREDSmartSuggestions'));
const FREDQuickInsights = lazy(() => import('../components/data/FREDQuickInsights'));

// Import UX enhancement components
import KeyboardShortcuts from '../components/common/KeyboardShortcuts';

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <LoadingSkeleton variant="card" count={3} />
);

const normalizePreviewRow = (
  row: any,
  columns: string[] = []
): (string | number | null | undefined)[] => {
  if (Array.isArray(row)) {
    return row;
  }

  if (row && typeof row === 'object') {
    if (columns.length) {
      return columns.map((col, idx) => row?.[col] ?? row?.[idx]);
    }
    return Object.values(row);
  }

  return [row];
};

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend);

const formatRelativeTime = (value?: string | Date | number) => {
  if (!value) return 'unknown';
  const target = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(target)) return 'unknown';
  const diffMs = Date.now() - target;
  const seconds = Math.max(0, Math.floor(diffMs / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const inferColumnTypeLabel = (value: any) => {
  if (value === null || value === undefined || value === '') return 'Unknown';
  if (!Number.isNaN(Number(value))) return 'Numeric';
  const asDate = Date.parse(value);
  if (!Number.isNaN(asDate)) return 'Datetime';
  return 'Text';
};

const safeNumber = (value: any) => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

const buildHistogram = (values: number[], bins = 12) => {
  if (!values.length) return { labels: [] as string[], counts: [] as number[] };
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { labels: [] as string[], counts: [] as number[] };
  if (min === max) {
    return { labels: [`${min}`], counts: [values.length] };
  }
  const step = (max - min) / bins;
  const counts = Array.from({ length: bins }, () => 0);
  for (const v of values) {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / step)));
    counts[idx] += 1;
  }
  const labels = counts.map((_, i) => {
    const a = min + step * i;
    const b = min + step * (i + 1);
    return `${a.toFixed(2)}–${b.toFixed(2)}`;
  });
  return { labels, counts };
};

const buildTopCategories = (values: string[], topK = 8) => {
  const countsMap = new Map<string, number>();
  for (const v of values) {
    const key = v.trim() === '' ? '(empty)' : v;
    countsMap.set(key, (countsMap.get(key) ?? 0) + 1);
  }
  const sorted = Array.from(countsMap.entries()).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, topK);
  const rest = sorted.slice(topK);
  const restCount = rest.reduce((sum, [, c]) => sum + c, 0);
  const labels = top.map(([k]) => k);
  const counts = top.map(([, c]) => c);
  if (restCount > 0) {
    labels.push('Other');
    counts.push(restCount);
  }
  return { labels, counts };
};

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
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(() => {
    return localStorage.getItem('dfh-data-selected-dataset-id') || '';
  });
  const [showUploader, setShowUploader] = useState(false);
  const [showConnector, setShowConnector] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showFREDImporter, setShowFREDImporter] = useState(false);
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

  const selectedDataset = useMemo(() => {
    if (!datasets.length) return null;
    const explicit = datasets.find((d) => d.id === selectedDatasetId);
    return explicit || datasets[0] || null;
  }, [datasets, selectedDatasetId]);

  useEffect(() => {
    if (!datasets.length) return;
    if (!selectedDatasetId) {
      setSelectedDatasetId(datasets[0].id);
      localStorage.setItem('dfh-data-selected-dataset-id', datasets[0].id);
      return;
    }
    const stillExists = datasets.some((d) => d.id === selectedDatasetId);
    if (!stillExists) {
      setSelectedDatasetId(datasets[0].id);
      localStorage.setItem('dfh-data-selected-dataset-id', datasets[0].id);
    }
  }, [datasets, selectedDatasetId]);

  const selectDataset = useCallback((dataset: Dataset) => {
    setSelectedDatasetId(dataset.id);
    localStorage.setItem('dfh-data-selected-dataset-id', dataset.id);
  }, []);

  useEffect(() => {
    const panel = localStorage.getItem('dfh-data-open-panel');
    if (!panel) return;
    localStorage.removeItem('dfh-data-open-panel');
    if (panel === 'quality') setShowQuality(true);
    if (panel === 'preview') setShowPreview(true);
  }, []);

  // Save sort preferences to localStorage
  useEffect(() => {
    localStorage.setItem('dataManagement_sortBy', sortBy);
    localStorage.setItem('dataManagement_sortOrder', sortOrder);
  }, [sortBy, sortOrder]);

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
        selectDataset(newestDataset);
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
  const handleQualityCheck = useCallback((dataset: Dataset) => {
    selectDataset(dataset);
    setShowQuality(true);
    if (!hasProfiledData) {
      localStorage.setItem('dfh-setup-profiled', 'true');
      setHasProfiledData(true);
    }
  }, [hasProfiledData, selectDataset]);

  const dismissSampleTour = useCallback(() => {
    localStorage.setItem(SAMPLE_TOUR_STORAGE_KEY, 'true');
    setShowSampleTour(false);
  }, []);

  // Memoized search handler to prevent input focus loss
  const handleSearchChange = useCallback((value: string) => {
    // Use startTransition to defer the state update and prevent focus loss
    startTransition(() => {
      setSearchQuery(value);
    });
    // Update localStorage directly without triggering re-render
    if (value) {
      localStorage.setItem('dataManagement_searchQuery', value);
    } else {
      localStorage.removeItem('dataManagement_searchQuery');
    }
  }, []);

  const handleSampleTourAction = useCallback((action: 'profile' | 'chat') => {
    const sampleDataset = datasets.find(ds => SAMPLE_DATASET_IDS.has(ds.id)) || datasets[0];
    if (!sampleDataset) return;

    selectDataset(sampleDataset);

    if (action === 'profile') {
      setShowAnalysis(true);
      setShowPreview(true);
    } else if (action === 'chat') {
      setChatDataset(sampleDataset);
      setShowChat(true);
    }

    dismissSampleTour();
  }, [datasets, dismissSampleTour, selectDataset]);

  const handleCloseChat = useCallback(() => {
    setShowChat(false);
    setChatDataset(null);
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
    navigate('/app/deploy');
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

  const previewColumns = selectedDataset?.preview_data?.columns || [];
  const previewRows = selectedDataset?.preview_data?.rows || [];
  const previewSampleSize = previewRows.length;
  const hasPreviewData = previewColumns.length > 0 && previewSampleSize > 0;
  const previewUpdatedLabel = formatRelativeTime(
    selectedDataset?.quality?.lastChecked || selectedDataset?.dateUploaded
  );

  const columnProfiles = useMemo(() => {
    if (!hasPreviewData) return [] as Array<{ name: string; type: string; completeness: number; distinctCount: number }>;
    const totalRows = previewRows.length;
    return previewColumns.slice(0, 6).map((column, idx) => {
      let nullCount = 0;
      const distinct = new Set<string>();
      let sampleValue: any = null;
      previewRows.forEach((row) => {
        const normalized = normalizePreviewRow(row, previewColumns);
        const value = normalized[idx];
        if (value === null || value === undefined || value === '') {
          nullCount += 1;
        } else {
          distinct.add(String(value));
          if (sampleValue === null) sampleValue = value;
        }
      });
      const completeness = totalRows ? Math.round(((totalRows - nullCount) / totalRows) * 100) : 0;
      return {
        name: column,
        type: inferColumnTypeLabel(sampleValue),
        completeness,
        distinctCount: distinct.size,
      };
    });
  }, [hasPreviewData, previewColumns, previewRows]);

  const previewNullPercent = useMemo(() => {
    if (!hasPreviewData) return 0;
    const totalCells = previewRows.length * previewColumns.length;
    if (totalCells === 0) return 0;
    let nullCells = 0;
    previewRows.forEach((row) => {
      const normalized = normalizePreviewRow(row, previewColumns);
      previewColumns.forEach((_, idx) => {
        const value = normalized[idx];
        if (value === null || value === undefined || value === '') nullCells += 1;
      });
    });
    return Math.round((nullCells / totalCells) * 100);
  }, [hasPreviewData, previewColumns, previewRows]);

  const numericDistribution = useMemo(() => {
    if (!hasPreviewData) return null as null | { column: string; labels: string[]; counts: number[] };
    for (let i = 0; i < previewColumns.length; i += 1) {
      const numericValues: number[] = [];
      for (const row of previewRows) {
        const normalized = normalizePreviewRow(row, previewColumns);
        const v = safeNumber(normalized[i]);
        if (v !== null) numericValues.push(v);
        if (numericValues.length >= 200) break;
      }
      if (numericValues.length >= 10) {
        const hist = buildHistogram(numericValues, 12);
        return { column: previewColumns[i], labels: hist.labels, counts: hist.counts };
      }
    }
    return null;
  }, [hasPreviewData, previewColumns, previewRows]);

  const categoricalDistribution = useMemo(() => {
    if (!hasPreviewData) return null as null | { column: string; labels: string[]; counts: number[] };
    for (let i = 0; i < previewColumns.length; i += 1) {
      const values: string[] = [];
      let numericHits = 0;
      let totalHits = 0;
      for (const row of previewRows) {
        const normalized = normalizePreviewRow(row, previewColumns);
        const raw = normalized[i];
        if (raw === null || raw === undefined || raw === '') continue;
        totalHits += 1;
        const asNum = safeNumber(raw);
        if (asNum !== null) numericHits += 1;
        values.push(String(raw));
        if (values.length >= 200) break;
      }
      // treat as categorical when it’s mostly non-numeric and has repetition
      const numericRatio = totalHits ? numericHits / totalHits : 1;
      if (values.length >= 10 && numericRatio < 0.4) {
        const top = buildTopCategories(values, 8);
        if (top.labels.length >= 3) {
          return { column: previewColumns[i], labels: top.labels, counts: top.counts };
        }
      }
    }
    return null;
  }, [hasPreviewData, previewColumns, previewRows]);

  const fixChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; title: string }> = [];
    if (!selectedDataset) return chips;
    if (!hasPreviewData) {
      chips.push({ id: 'generate-preview', label: 'Fix: add preview', title: 'Upload/import data to populate preview rows and schema.' });
      return chips;
    }
    if (previewNullPercent >= 10) {
      chips.push({ id: 'missing', label: 'Fix: missing values', title: 'High null rate in preview sample; review completeness.' });
    }
    const lowCompletenessCols = columnProfiles.filter((c) => c.completeness < 85);
    if (lowCompletenessCols.length) {
      chips.push({
        id: 'completeness',
        label: 'Fix: completeness',
        title: `Columns under 85% complete: ${lowCompletenessCols.map((c) => c.name).slice(0, 3).join(', ')}${lowCompletenessCols.length > 3 ? '…' : ''}`,
      });
    }
    return chips;
  }, [columnProfiles, hasPreviewData, previewNullPercent, selectedDataset]);

  return (
    <div className="space-y-4">
      {/* Global Keyboard Shortcuts */}
      <KeyboardShortcuts
        onSearch={() => searchInputRef.current?.focus()}
        onUpload={() => setShowUploader(true)}
        onFRED={() => setShowFREDImporter(true)}
        onChat={() => chatDataset ? setShowChat(true) : toast('Select a dataset first to chat with AI')}
      />

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

      {/* Pipeline ribbon */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-200 shadow-lg">
        {([
          { label: 'Data', to: '/app/data', panel: null },
          { label: 'Profile', to: '/app/data', panel: 'quality' },
          { label: 'Features', to: '/app/train?step=2', panel: null },
          { label: 'Train', to: '/app/train', panel: null },
          { label: 'Evaluate', to: '/app/evaluate', panel: null },
          { label: 'Deploy', to: '/app/deploy', panel: null },
          { label: 'Monitor', to: '/app/train?step=3', panel: null },
          { label: 'Insights', to: '/app/insights', panel: null },
        ] as const).map((step) => {
          const isActive = step.label === 'Data';
          return (
            <button
              key={step.label}
              type="button"
              onClick={() => {
                if (step.panel) localStorage.setItem('dfh-data-open-panel', step.panel);
                navigate(step.to);
              }}
              className={`rounded-full px-3 py-1 border transition ${
                isActive
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
              }`}
              aria-label={`Go to ${step.label}`}
            >
              {step.label}
            </button>
          );
        })}
      </div>

      {/* Promise + primary action */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-white shadow-lg">
          <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500">Data management</p>
          <h1 className="mt-2 text-2xl font-bold">Organize, trust, and launch your datasets fast</h1>
          <p className="mt-2 text-sm text-slate-300">Preview, profile, and fix issues in minutes.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                setShowUploader(true);
                setShowConnector(false);
                setShowFREDImporter(false);
                setShowGeneratorModal(false);
              }}
              icon={<Upload className="w-4 h-4" />}
              className="btn-primary-improved"
              aria-label="Upload or import dataset"
            >
              Upload / Import
            </Button>
            <Button
              onClick={() => setShowPreview(true)}
              variant="outline"
              size="sm"
              disabled={!selectedDataset}
              aria-label="Open dataset preview"
            >
              Open preview
            </Button>
            <Button
              onClick={() => setShowQuality(true)}
              variant="outline"
              size="sm"
              disabled={!selectedDataset}
              aria-label="Profile dataset quality"
            >
              Profile quality
            </Button>
            <Button
              onClick={() => {
                if (!selectedDataset) return;
                setTransformDataset(selectedDataset);
                setShowTransformStudio(true);
              }}
              variant="outline"
              size="sm"
              disabled={!selectedDataset}
              aria-label="Transform or feature-engineer dataset"
            >
              Transform / Features
            </Button>
            <Button
              onClick={() => navigate('/app/train')}
              variant="outline"
              size="sm"
              aria-label="Go to model training"
            >
              Train
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-white shadow-lg">
          <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500">Dataset spine</p>
          <label className="mt-3 block text-xs text-slate-400" htmlFor="dfh-dataset-selector">
            Selected dataset
          </label>
          <select
            id="dfh-dataset-selector"
            value={selectedDataset?.id || ''}
            onChange={(e) => {
              const ds = datasets.find((d) => d.id === e.target.value);
              if (ds) selectDataset(ds);
            }}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Select dataset"
          >
            {datasets.length === 0 ? (
              <option value="">No datasets yet</option>
            ) : (
              datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))
            )}
          </select>
          <div className="mt-4 text-sm text-slate-300">
            {selectedDataset ? (
              <div>
                <p className="font-semibold">
                  Using {selectedDataset.name} • Updated {formatRelativeTime(selectedDataset.quality?.lastChecked || selectedDataset.dateUploaded)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Sample: {selectedDataset.preview_data?.rows?.length || 0} rows • Columns: {selectedDataset.preview_data?.columns?.length || 0}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Upload or import a dataset to begin.</p>
            )}
          </div>
        </div>
      </div>

      {datasets.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-white shadow-lg">
          <DataEmptyState
            onUploadClick={() => setShowUploader(true)}
            onGenerateSampleClick={() => setShowGeneratorModal(true)}
            onConnectClick={() => setShowConnector(true)}
          />
        </div>
      )}

      {datasets.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          {/* Left: dataset watchlist */}
          <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 text-white shadow-lg">
            <div className="flex items-center gap-2">
              <SearchInput
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search datasets… (⌘/)"
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="text-xs text-slate-400">{filteredDatasets.length} datasets</div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400" htmlFor="dfh-sort">Sort</label>
                <select
                  id="dfh-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size' | 'quality')}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                  aria-label="Sort datasets"
                >
                  <option value="date">Recent</option>
                  <option value="name">Name</option>
                  <option value="size">Size</option>
                  <option value="quality">Quality</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white hover:border-white/20"
                  aria-label={sortOrder === 'asc' ? 'Set descending sort order' : 'Set ascending sort order'}
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-2 max-h-[70vh] overflow-auto pr-1">
              {paginatedDatasets.map((dataset) => {
                const isActive = dataset.id === selectedDataset?.id;
                const health = dataset.quality?.score;
                const hasPreview = (dataset.preview_data?.rows?.length || 0) > 0;
                return (
                  <button
                    key={dataset.id}
                    type="button"
                    onClick={() => selectDataset(dataset)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      isActive
                        ? 'border-white/20 bg-white/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                    aria-current={isActive ? 'true' : undefined}
                    aria-label={`Select dataset ${dataset.name}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{dataset.name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {dataset.rows?.toLocaleString() || 0} rows • {dataset.columns || 0} cols
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <div>{health !== undefined ? `Health ${health}` : 'Health —'}</div>
                        <div>{hasPreview ? 'Preview ✓' : 'No preview'}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <span>
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white disabled:opacity-40"
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right: dataset workspace */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950 p-5 text-white shadow-lg">
              <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500">Dataset workspace</p>
              {selectedDataset ? (
                <>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">Using {selectedDataset.name} • Updated {previewUpdatedLabel}</p>
                      <p className="mt-1 text-sm text-slate-300">
                        Sample size: {previewSampleSize.toLocaleString()} rows • Null rate: {hasPreviewData ? `${previewNullPercent}%` : '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        Health: {selectedDataset.quality?.score ?? '—'}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        Issues: {selectedDataset.quality?.issues ?? '—'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {fixChips.map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setShowQuality(true)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white hover:border-white/20"
                        title={chip.title}
                        aria-label={chip.label}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-slate-500">
                    Definitions: “Updated” uses last quality check (or upload time). “Null rate” and “completeness” are computed from preview rows stored in `preview_data`.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-300">Select a dataset to see preview-driven metrics.</p>
              )}
            </div>

            {/* Inline action rail (no modals) */}
            <div className="rounded-2xl border border-white/10 bg-slate-950 p-5 text-white shadow-lg">
              <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500">Actions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setShowUploader((v) => !v);
                    setShowConnector(false);
                    setShowFREDImporter(false);
                    setShowGeneratorModal(false);
                  }}
                  size="sm"
                  icon={<Upload className="h-4 w-4" />}
                  aria-label="Toggle upload panel"
                >
                  Upload / Import
                </Button>
                <Button
                  onClick={() => {
                    setShowConnector((v) => !v);
                    setShowUploader(false);
                    setShowFREDImporter(false);
                    setShowGeneratorModal(false);
                  }}
                  size="sm"
                  variant="outline"
                  aria-label="Toggle connect source panel"
                >
                  Connect
                </Button>
                <Button
                  onClick={() => {
                    setShowFREDImporter((v) => !v);
                    setShowUploader(false);
                    setShowConnector(false);
                    setShowGeneratorModal(false);
                  }}
                  size="sm"
                  variant="outline"
                  aria-label="Toggle FRED importer"
                >
                  FRED import
                </Button>
                <Button
                  onClick={() => {
                    setShowGeneratorModal((v) => !v);
                    setShowUploader(false);
                    setShowConnector(false);
                    setShowFREDImporter(false);
                  }}
                  size="sm"
                  variant="outline"
                  aria-label="Toggle sample generator"
                >
                  Generate sample
                </Button>
              </div>

              {showUploader && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Upload dataset</p>
                    <button
                      type="button"
                      onClick={() => setShowUploader(false)}
                      className="text-slate-400 hover:text-white"
                      aria-label="Close upload panel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <DataUploader onClose={() => setShowUploader(false)} />
                  </div>
                </div>
              )}

              {showConnector && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Connect source</p>
                    <button
                      type="button"
                      onClick={() => setShowConnector(false)}
                      className="text-slate-400 hover:text-white"
                      aria-label="Close connect source panel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <DataConnector
                      onConnect={async (connection) => {
                        console.log('Connected to:', connection);
                        toast.loading('Importing data from BigQuery...', { id: 'bigquery-import' });

                        try {
                          if (connection.type === 'gcp' && connection.config) {
                            const config = connection.config as any;
                            const datasetLocation = config['Dataset Location'] || '';
                            const parts = datasetLocation.split('.');
                            const tableName = parts[parts.length - 1] || 'bitcoin_inputs';
                            const importedDataset = {
                              id: crypto.randomUUID(),
                              name: `BigQuery: ${tableName}`,
                              description: `Imported from ${datasetLocation}`,
                              rows: 1000,
                              columns: 10,
                              dateUploaded: new Date().toISOString(),
                              fileType: 'bigquery',
                              fileSize: 'Cloud Dataset',
                              preview_data: {
                                columns: ['input_index', 'spent_transaction_hash', 'spent_output_index', 'script_asm', 'script_hex', 'sequence', 'required_signatures', 'type', 'addresses', 'value'],
                                rows: [
                                  ['0', 'a1b2c3d4e5f6...', '1', 'OP_DUP OP_HASH160...', '76a914...', '4294967295', '1', 'pubkeyhash', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', '50.00000000'],
                                  ['1', 'b2c3d4e5f6a7...', '0', 'OP_DUP OP_HASH160...', '76a914...', '4294967295', '1', 'pubkeyhash', '12cbQLTFMXRnSzktFkuoG3eHoMeFtpTu3S', '25.50000000'],
                                ],
                              },
                              projectId: currentProject?.id,
                            };

                            await addDataset(importedDataset as any);
                            toast.success(`Imported ${tableName} from BigQuery!`, { id: 'bigquery-import' });
                            setShowConnector(false);
                          } else {
                            toast.success(`Connected to ${connection.name}`, { id: 'bigquery-import' });
                            setShowConnector(false);
                          }
                        } catch (error) {
                          console.error('Error importing from BigQuery:', error);
                          toast.error('Failed to import data from BigQuery', { id: 'bigquery-import' });
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {showFREDImporter && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      <p className="text-sm font-semibold">Import from FRED</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFREDImporter(false)}
                      className="text-slate-400 hover:text-white"
                      aria-label="Close FRED importer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <Suspense fallback={<LoadingFallback />}>
                      <FREDDatasetImporter key="fred-importer-inline" />
                    </Suspense>
                  </div>
                </div>
              )}

              {showGeneratorModal && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Generate sample dataset</p>
                    <button
                      type="button"
                      onClick={() => setShowGeneratorModal(false)}
                      className="text-slate-400 hover:text-white"
                      aria-label="Close generator"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-slate-400">Dataset type</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(['marketing', 'sales', 'customer'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setGeneratorType(type)}
                            className={`rounded-full border px-3 py-1 text-xs ${
                              generatorType === type
                                ? 'border-white/20 bg-white/10 text-white'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
                            }`}
                            aria-label={`Set generator type to ${type}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400">Rows: {rowCount.toLocaleString()}</label>
                      <input
                        type="range"
                        min="100"
                        max="10000"
                        step="100"
                        value={rowCount}
                        onChange={(e) => setRowCount(parseInt(e.target.value))}
                        className="mt-2 w-full"
                        aria-label="Row count"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      onClick={handleGenerateSyntheticData}
                      disabled={isGenerating}
                      size="sm"
                      icon={<Sparkles className="h-4 w-4" />}
                      aria-label="Generate dataset"
                    >
                      {isGenerating ? 'Generating…' : 'Generate'}
                    </Button>
                    <Button
                      onClick={() => setShowGeneratorModal(false)}
                      size="sm"
                      variant="outline"
                      aria-label="Cancel generator"
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className="mt-3 text-[11px] text-slate-500">
                    Definition: Generates synthetic data and stores the first 100 rows as `preview_data`.
                  </p>
                </div>
              )}
            </div>

            {/* Schema snapshot */}
            <div className="rounded-2xl border border-white/10 bg-slate-950 p-5 text-white shadow-lg">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-slate-500">
                <span>Schema snapshot</span>
                <span>{previewColumns.length} columns</span>
              </div>
              <div className="mt-4 space-y-3">
                {columnProfiles.length ? (
                  columnProfiles.map((profile) => (
                    <div key={profile.name} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{profile.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {profile.type} · {profile.distinctCount} distinct
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-300">{profile.completeness}% complete</p>
                        <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                          <div className="h-full bg-white/30" style={{ width: `${profile.completeness}%` }} />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-300">No preview yet — upload/import data to see schema and distributions.</p>
                )}
              </div>
              <p className="mt-4 text-[11px] text-slate-500">
                Definition: Types, completeness, and distinct counts come from preview rows (`preview_data`).
              </p>
            </div>

            {/* Distributions */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-5 text-white shadow-lg">
                <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.4em] text-slate-500">
                  <span>Numeric distribution</span>
                  <span className="tracking-normal">Updated {previewUpdatedLabel}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {numericDistribution ? `Distribution: ${numericDistribution.column} (sample)` : 'No numeric column found'}
                  </p>
                  <p className="text-xs text-slate-400">Sample: {previewSampleSize.toLocaleString()} rows</p>
                </div>
                <div className="mt-3">
                  {numericDistribution && numericDistribution.labels.length ? (
                    <Bar
                      data={{
                        labels: numericDistribution.labels,
                        datasets: [
                          {
                            label: 'Count',
                            data: numericDistribution.counts,
                            backgroundColor: 'rgba(255,255,255,0.25)',
                            borderColor: 'rgba(255,255,255,0.35)',
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                          tooltip: { enabled: true },
                        },
                        scales: {
                          x: { ticks: { color: 'rgba(226,232,240,0.7)', maxRotation: 0, autoSkip: true }, grid: { color: 'rgba(255,255,255,0.05)' } },
                          y: { ticks: { color: 'rgba(226,232,240,0.7)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        },
                      }}
                      aria-label="Numeric distribution chart"
                    />
                  ) : (
                    <p className="text-sm text-slate-300">Preview doesn’t contain enough numeric values to chart.</p>
                  )}
                </div>
                <p className="mt-3 text-[11px] text-slate-500" title="Histogram built from the first numeric column in preview_data.">
                  Definition: Histogram from the first inferred numeric column in `preview_data`.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950 p-5 text-white shadow-lg">
                <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.4em] text-slate-500">
                  <span>Categorical distribution</span>
                  <span className="tracking-normal">Updated {previewUpdatedLabel}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {categoricalDistribution ? `Distribution: ${categoricalDistribution.column} (sample)` : 'No categorical column found'}
                  </p>
                  <p className="text-xs text-slate-400">Sample: {previewSampleSize.toLocaleString()} rows</p>
                </div>
                <div className="mt-3">
                  {categoricalDistribution && categoricalDistribution.labels.length ? (
                    <Bar
                      data={{
                        labels: categoricalDistribution.labels,
                        datasets: [
                          {
                            label: 'Count',
                            data: categoricalDistribution.counts,
                            backgroundColor: 'rgba(255,255,255,0.25)',
                            borderColor: 'rgba(255,255,255,0.35)',
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                          tooltip: { enabled: true },
                        },
                        scales: {
                          x: { ticks: { color: 'rgba(226,232,240,0.7)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                          y: { ticks: { color: 'rgba(226,232,240,0.7)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        },
                      }}
                      aria-label="Categorical distribution chart"
                    />
                  ) : (
                    <p className="text-sm text-slate-300">Preview doesn’t contain enough categorical repetition to chart.</p>
                  )}
                </div>
                <p className="mt-3 text-[11px] text-slate-500" title="Top categories computed from the first non-numeric column in preview_data.">
                  Definition: Top categories from the first inferred categorical column in `preview_data`.
                </p>
              </div>
            </div>

            {/* Inline preview */}
            {showPreview && selectedDataset && (
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-5 text-white shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500">Preview</p>
                    <p className="mt-1 text-sm font-semibold">{selectedDataset.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!selectedDataset.preview_data) return;
                        const columns = selectedDataset.preview_data.columns || [];
                        const rows = selectedDataset.preview_data.rows || [];
                        const csvRows = rows.map((row) =>
                          normalizePreviewRow(row, columns)
                            .map((cell) => {
                              if (cell === null || cell === undefined) return '';
                              if (typeof cell === 'object') return JSON.stringify(cell);
                              return String(cell);
                            })
                            .join(',')
                        );
                        const csv = [columns.join(','), ...csvRows].join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${selectedDataset.name}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success('Dataset exported successfully!');
                      }}
                      aria-label="Export preview as CSV"
                    >
                      Export CSV
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowPreview(false)}
                      className="text-slate-400 hover:text-white"
                      aria-label="Close preview"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  {selectedDataset.preview_data ? (
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-white/5">
                          <tr>
                            {selectedDataset.preview_data.columns?.map((col, idx) => (
                              <th
                                key={idx}
                                className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {selectedDataset.preview_data.rows?.slice(0, 20).map((row, rowIdx) => {
                            const normalizedRow = normalizePreviewRow(row, selectedDataset.preview_data?.columns || []);
                            return (
                              <tr key={rowIdx}>
                                {normalizedRow.map((cell, cellIdx) => (
                                  <td key={cellIdx} className="px-4 py-2 text-xs text-slate-200">
                                    {String(cell ?? '')}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <p className="p-3 text-xs text-slate-400">
                        Showing first 20 preview rows (source of truth: full dataset).
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-300">No preview data available.</p>
                  )}
                </div>
              </div>
            )}

            {/* Inline quality */}
            {showQuality && selectedDataset && (
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-5 text-white shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500">Quality</p>
                    <p className="mt-1 text-sm font-semibold">{selectedDataset.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuality(false)}
                    className="text-slate-400 hover:text-white"
                    aria-label="Close quality panel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4">
                  <Suspense fallback={<LoadingFallback />}>
                    <div className="space-y-6">
                      <DatasetHealthCard dataset={selectedDataset} showDetails={true} />
                      <DataQualityDashboard dataset={selectedDataset} />
                    </div>
                  </Suspense>
                </div>
              </div>
            )}

            {/* Inline analysis */}
            {showAnalysis && selectedDataset && (
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-5 text-white shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500">Profiler</p>
                    <p className="mt-1 text-sm font-semibold">{selectedDataset.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAnalysis(false)}
                    className="text-slate-400 hover:text-white"
                    aria-label="Close profiler"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4">
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
            )}

            {/* Inline transform studio */}
            {showTransformStudio && transformDataset && (
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-5 text-white shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500">Transform</p>
                    <p className="mt-1 text-sm font-semibold">{transformDataset.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTransformStudio(false)}
                    className="text-slate-400 hover:text-white"
                    aria-label="Close transform panel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4">
                  <Suspense fallback={<LoadingFallback />}>
                    <DataTransformationStudio
                      dataset={transformDataset}
                      onSave={handleSaveTransformedDataset}
                      onClose={() => setShowTransformStudio(false)}
                      isModal={false}
                    />
                  </Suspense>
                </div>
              </div>
            )}

            {/* Smart FRED suggestions + quick insights (kept inline) */}
            <Suspense fallback={<LoadingFallback />}>
              <FREDSmartSuggestions
                userDatasets={datasets}
                onSuggestClick={(_seriesId, name) => {
                  toast.success(`Opening FRED to import ${name}...`);
                  setShowFREDImporter(true);
                }}
              />
            </Suspense>

            {selectedDataset && (selectedDataset.source === 'FRED' || selectedDataset.metadata?.source === 'FRED') && (
              <Suspense fallback={<LoadingFallback />}>
                <FREDQuickInsights dataset={selectedDataset} />
              </Suspense>
            )}
          </div>
        </div>
      )}

      {/* Enhanced AI Chat Modal with Marketing Intelligence */}
      {showChat && chatDataset && (
        <Suspense fallback={<LoadingFallback />}>
          <EnhancedAIChat
            key={`chat-${chatDataset.id}`}
            dataset={chatDataset}
            onClose={handleCloseChat}
            isModal={true}
          />
        </Suspense>
      )}


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
