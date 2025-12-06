// FRED Dataset Importer Component
// Enhanced with caching, progress indicators, and loading skeletons
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  TrendingUp, 
  Download, 
  Calendar,
  Info,
  Database,
  Sparkles,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Check,
  Eye,
  Table,
  Cloud,
  Copy,
  CheckCircle2,
  ArrowRight,
  X,
  Loader2,
  RefreshCw,
  Zap
} from 'lucide-react';
import {
  searchFREDSeries,
  getFREDSeries,
  convertFREDToDataset,
  isFREDConfigured,
  POPULAR_ECONOMIC_INDICATORS,
  FREDSeries,
  getPopularIndicatorsWithCache,
  prefetchPopularIndicators,
} from '../../lib/fredAPI';
import { getCacheStats, clearFREDCache } from '../../lib/fredCache';
import { useMLContext } from '../../context/MLContext';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import Card from '../common/Card';
import Button from '../common/Button';
import { Dataset } from '../../types';

// Import progress step type
type ImportStep = 'idle' | 'fetching' | 'processing' | 'saving' | 'complete' | 'error';

interface ImportProgress {
  step: ImportStep;
  message: string;
  percent: number;
}

// Loading skeleton component for popular indicators
const IndicatorSkeleton: React.FC = () => (
  <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
    <div className="flex items-start justify-between mb-2">
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
      </div>
      <div className="w-5 h-5 bg-gray-200 rounded"></div>
    </div>
    <div className="flex items-center gap-4 mt-3">
      <div className="h-3 bg-gray-100 rounded w-32"></div>
    </div>
  </div>
);

// Progress indicator component
const ImportProgressIndicator: React.FC<{ progress: ImportProgress }> = ({ progress }) => {
  const steps = [
    { key: 'fetching', label: 'Fetching Data', icon: Download },
    { key: 'processing', label: 'Processing', icon: Zap },
    { key: 'saving', label: 'Saving to Cloud', icon: Cloud },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === progress.step);

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl border border-gray-200 p-5 w-80 animate-popIn z-50">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary-100 rounded-full">
          <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Importing from FRED</p>
          <p className="text-sm text-gray-600">{progress.message}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{progress.percent}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.key === progress.step;
          const isComplete = currentStepIndex > index || progress.step === 'complete';
          
          return (
            <div 
              key={step.key}
              className={`flex flex-col items-center gap-1 ${
                isComplete ? 'text-green-600' : 
                isActive ? 'text-primary-600' : 
                'text-gray-300'
              }`}
            >
              <div className={`p-1.5 rounded-full ${
                isComplete ? 'bg-green-100' : 
                isActive ? 'bg-primary-100' : 
                'bg-gray-100'
              }`}>
                {isComplete ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'animate-pulse' : ''}`} />
                )}
              </div>
              <span className="text-[10px] font-medium">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Type for imported dataset info
interface ImportedDatasetInfo {
  id: string;
  name: string;
  rows: number;
  columns: number;
  source: string;
  fileSize: string;
  createdAt: string;
}

const FREDDatasetImporter: React.FC = () => {
  const { user } = useAuth();
  const { addDataset, currentProject } = useMLContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FREDSeries[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<FREDSeries | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [frequency, setFrequency] = useState<string>('');
  const [popularSeries, setPopularSeries] = useState<FREDSeries[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [popularLoadProgress, setPopularLoadProgress] = useState({ loaded: 0, total: 5 });
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [lastImported, setLastImported] = useState<ImportedDatasetInfo | null>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  
  // Import progress state
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    step: 'idle',
    message: '',
    percent: 0,
  });

  // Cache stats for display
  const [cacheStats, setCacheStats] = useState<{ entries: number; sizeKB: number } | null>(null);

  // Load popular indicators with caching on mount
  useEffect(() => {
    loadPopularIndicators();
    
    // Pre-fetch in background for next visit
    prefetchPopularIndicators();
    
    // Update cache stats
    setCacheStats(getCacheStats());
  }, []);

  const loadPopularIndicators = useCallback(async () => {
    setIsLoadingPopular(true);
    try {
      const results = await getPopularIndicatorsWithCache(5, (loaded, total) => {
        setPopularLoadProgress({ loaded, total });
      });
      setPopularSeries(results);
    } catch (error) {
      console.error('Error loading popular indicators:', error);
      toast.error('Failed to load popular indicators');
    } finally {
      setIsLoadingPopular(false);
    }
  }, []);

  // Refresh popular indicators (bypass cache)
  const refreshPopularIndicators = useCallback(async () => {
    clearFREDCache();
    setCacheStats({ entries: 0, sizeKB: 0 });
    toast.success('Cache cleared. Refreshing...');
    await loadPopularIndicators();
    setCacheStats(getCacheStats());
  }, [loadPopularIndicators]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchFREDSeries(searchQuery, {
        limit: 20,
        orderBy: 'popularity',
        sortOrder: 'desc'
      });
      
      setSearchResults(results.seriess);
      
      if (results.seriess.length === 0) {
        toast('No results found. Try a different search term.', { icon: '🔍' });
      } else {
        toast.success(`Found ${results.count.toLocaleString()} series`);
      }
    } catch (error: any) {
      console.error('FRED search error:', error);
      toast.error(error.message || 'Failed to search FRED database');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (series: FREDSeries) => {
    if (!user) {
      toast.error('Please sign in to import datasets');
      return;
    }

    setIsImporting(true);
    const startTime = Date.now();
    
    try {
      // Step 1: Fetching data from FRED
      setImportProgress({
        step: 'fetching',
        message: `Downloading ${series.title}...`,
        percent: 15,
      });

      // Convert FRED data to dataset format
      const datasetData = await convertFREDToDataset(series.id, {
        observationStart: dateRange.start || undefined,
        observationEnd: dateRange.end || undefined,
        frequency: frequency as any || undefined
      });

      // Step 2: Processing data
      setImportProgress({
        step: 'processing',
        message: `Processing ${datasetData.data.length.toLocaleString()} data points...`,
        percent: 50,
      });

      // Calculate file size
      const dataSize = JSON.stringify(datasetData.data).length;
      const fileSizeKB = (dataSize / 1024).toFixed(1) + ' KB';

      // Prepare dataset payload (using snake_case for Supabase columns)
      const datasetPayload = {
        user_id: user?.id || 'local-user',
        project_id: currentProject?.id,
        name: datasetData.name,
        description: datasetData.description,
        source: 'FRED',
        preview_data: {
          columns: ['date', 'value', 'realtime_start', 'realtime_end'],
          rows: datasetData.data.slice(0, 100)
        },
        row_count: datasetData.data.length,
        column_count: 4,
        file_size: fileSizeKB,
        file_type: 'json',
        metadata: datasetData.metadata,
        tags: ['economic', 'fred', 'time-series']
      };

      // Step 3: Saving to cloud
      setImportProgress({
        step: 'saving',
        message: 'Saving to Supabase Cloud...',
        percent: 80,
      });

      let newDataset: any = null;

      // Save to Supabase
      const { data, error } = await supabase
        .from('datasets')
        .insert(datasetPayload)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      newDataset = data;
      
      // Step 4: Complete
      setImportProgress({
        step: 'complete',
        message: 'Import complete!',
        percent: 100,
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ Saved to Supabase: ${newDataset.id} in ${duration}s`);

      // Add to context and show success panel
      if (newDataset) {
        addDataset(newDataset as Dataset);
        
        // Set last imported info for success panel
        setLastImported({
          id: newDataset.id,
          name: newDataset.name,
          rows: datasetData.data.length,
          columns: 4,
          source: 'FRED',
          fileSize: fileSizeKB,
          createdAt: new Date().toISOString()
        });
        
        toast.success(`📊 Imported ${datasetData.data.length.toLocaleString()} data points in ${duration}s!`);
        setSelectedSeries(null);
        setSearchQuery('');
        setSearchResults([]);
      }
      
      // Brief delay before hiding progress
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error: any) {
      console.error('Import error:', error);
      setImportProgress({
        step: 'error',
        message: error.message || 'Import failed',
        percent: 0,
      });
      toast.error(error.message || 'Failed to import dataset');
    } finally {
      setIsImporting(false);
      // Reset progress after a brief delay
      setTimeout(() => {
        setImportProgress({ step: 'idle', message: '', percent: 0 });
      }, 1000);
    }
  };

  const toggleSeriesExpansion = (seriesId: string) => {
    setExpandedSeries(expandedSeries === seriesId ? null : seriesId);
  };

  if (!isFREDConfigured()) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            FRED API Not Configured
          </h3>
          <p className="text-gray-600 mb-4">
            To use the FRED dataset importer, you need to add your FRED API key.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Steps to enable:</strong>
            </p>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Get a free API key from <a href="https://fred.stlouisfed.org/docs/api/api_key.html" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">FRED</a></li>
              <li>Add <code className="bg-gray-200 px-1 rounded">VITE_FRED_API_KEY=your_key</code> to your .env file</li>
              <li>Restart your dev server</li>
            </ol>
          </div>
        </div>
      </Card>
    );
  }

  // Copy dataset ID to clipboard
  const copyDatasetId = () => {
    if (lastImported) {
      navigator.clipboard.writeText(lastImported.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      toast.success('Dataset ID copied!');
    }
  };

  // Open Supabase dashboard
  const openSupabaseDashboard = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
      window.open(`https://supabase.com/dashboard/project/${projectRef}/editor/29785`, '_blank');
    } else {
      window.open('https://supabase.com/dashboard', '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Panel - Shows after import */}
      {lastImported && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">Dataset Imported Successfully!</h3>
                <p className="text-green-700 text-sm">{lastImported.name}</p>
              </div>
            </div>
            <button
              onClick={() => setLastImported(null)}
              className="p-1 hover:bg-green-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-green-600" />
            </button>
          </div>

          {/* Storage Info */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Supabase Storage */}
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-900">Cloud Storage</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Saved to Supabase PostgreSQL</p>
              <button
                onClick={openSupabaseDashboard}
                className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View in Supabase
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Dataset Details */}
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Table className="w-5 h-5 text-purple-500" />
                <span className="font-medium text-gray-900">Dataset Info</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Rows:</span>
                  <span className="font-medium">{lastImported.rows.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Columns:</span>
                  <span className="font-medium">{lastImported.columns}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Size:</span>
                  <span className="font-medium">{lastImported.fileSize}</span>
                </div>
              </div>
            </div>

            {/* Dataset ID */}
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-indigo-500" />
                <span className="font-medium text-gray-900">Dataset ID</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-gray-100 px-2 py-1 rounded font-mono truncate">
                  {lastImported.id}
                </code>
                <button
                  onClick={copyDatasetId}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copy ID"
                >
                  {copiedId ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="px-4 py-2 bg-white border border-green-200 hover:border-green-400 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Eye className="w-4 h-4" />
              {showRawData ? 'Hide' : 'View'} Raw Data
            </button>
            <button
              onClick={() => {
                setLastImported(null);
                toast.success('Ready to import another dataset!');
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              Import Another
            </button>
          </div>

          {/* Raw Data Preview */}
          {showRawData && (
            <div className="mt-4 bg-gray-900 rounded-lg p-4 overflow-auto max-h-64">
              <pre className="text-green-400 text-xs font-mono">
{JSON.stringify({
  id: lastImported.id,
  name: lastImported.name,
  source: lastImported.source,
  rows: lastImported.rows,
  columns: lastImported.columns,
  file_size: lastImported.fileSize,
  created_at: lastImported.createdAt,
  storage: {
    primary: 'Supabase PostgreSQL (datasets table)',
    cache: 'React Context (MLContext)',
    offline: 'IndexedDB (if enabled)'
  }
}, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-primary-600" />
            FRED Economic Data
          </h2>
          <p className="text-gray-600 mt-1">
            Search and import 800,000+ economic time series from the Federal Reserve
          </p>
        </div>
        <a
          href="https://fred.stlouisfed.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
        >
          Visit FRED <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for GDP, unemployment, inflation, S&P 500..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              icon={<Search className="w-5 h-5" />}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 animate-fadeIn">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Original</option>
                    <option value="d">Daily</option>
                    <option value="w">Weekly</option>
                    <option value="m">Monthly</option>
                    <option value="q">Quarterly</option>
                    <option value="a">Annual</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Popular Indicators */}
      {searchResults.length === 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              Popular Economic Indicators
              {isLoadingPopular && (
                <span className="text-xs font-normal text-gray-500 ml-2">
                  Loading {popularLoadProgress.loaded}/{popularLoadProgress.total}...
                </span>
              )}
            </h3>
            <div className="flex items-center gap-3">
              {/* Cache stats */}
              {cacheStats && cacheStats.entries > 0 && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  {cacheStats.entries} cached ({cacheStats.sizeKB} KB)
                </span>
              )}
              {/* Refresh button */}
              <button
                onClick={refreshPopularIndicators}
                disabled={isLoadingPopular}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                title="Refresh indicators (clear cache)"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingPopular ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Show skeletons while loading */}
            {isLoadingPopular && popularSeries.length === 0 && (
              <>
                <IndicatorSkeleton />
                <IndicatorSkeleton />
                <IndicatorSkeleton />
                <IndicatorSkeleton />
                <IndicatorSkeleton />
              </>
            )}
            
            {/* Show actual indicators */}
            {popularSeries.map((series) => (
              <div
                key={series.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition cursor-pointer group"
                onClick={() => handleImport(series)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                      {series.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {series.id} • {series.frequency_short} • {series.units_short}
                    </p>
                  </div>
                  <Download className="w-5 h-5 text-primary-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {series.observation_start} to {series.observation_end}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Empty state */}
          {!isLoadingPopular && popularSeries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Failed to load popular indicators.</p>
              <button 
                onClick={loadPopularIndicators}
                className="mt-2 text-primary-600 hover:underline text-sm"
              >
                Try again
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Search Results ({searchResults.length})
          </h3>
          <div className="space-y-3">
            {searchResults.map((series) => (
              <div
                key={series.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <button
                      onClick={() => toggleSeriesExpansion(series.id)}
                      className="text-left w-full"
                    >
                      <h4 className="font-medium text-gray-900 hover:text-primary-600">
                        {series.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {series.id} • {series.frequency} • {series.units}
                      </p>
                    </button>
                    
                    {expandedSeries === series.id && series.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg animate-fadeIn">
                        <p className="text-sm text-gray-700">{series.notes}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleImport(series)}
                    disabled={isImporting}
                    size="sm"
                    icon={isImporting ? <Download className="w-4 h-4 animate-bounce" /> : <Download className="w-4 h-4" />}
                  >
                    Import
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {series.observation_start} to {series.observation_end}
                  </span>
                  <span>Updated: {new Date(series.last_updated).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Popularity: {series.popularity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Import Progress Indicator */}
      {isImporting && importProgress.step !== 'idle' && (
        <ImportProgressIndicator progress={importProgress} />
      )}
    </div>
  );
};

export default FREDDatasetImporter;

