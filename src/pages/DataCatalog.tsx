import React, { useState, useMemo, useEffect } from 'react';
import { useMLContext } from '../context/MLContext';
import { useAuth } from '../components/auth/AuthProvider';
import { Dataset } from '../types';
import { 
  Search, 
  Download, 
  Share2, 
  Star, 
  Clock, 
  Database, 
  Tag, 
  CheckCircle2,
  AlertCircle,
  Users,
  FileText,
  Calendar,
  Trash2,
  Archive,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

let ChartComponents: any = null;
const loadCharts = async () => {
  if (!ChartComponents) {
    const [{ Bar, Doughnut }, { Chart: ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler }] = await Promise.all([
      import('react-chartjs-2'),
      import('chart.js')
    ]);

    ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);
    ChartComponents = { Bar, Doughnut };
  }
  return ChartComponents;
};

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: 10,
    },
  },
};

const formatRelativeTime = (iso?: string) => {
  if (!iso) return 'unknown';
  const target = new Date(iso).getTime();
  if (!Number.isFinite(target)) return 'unknown';
  const diffMs = Date.now() - target;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
};

const inferColumnTypeLabel = (value: any) => {
  if (value === null || value === undefined || value === '') return 'Unknown';
  if (!Number.isNaN(Number(value))) return 'Numeric';
  const asDate = Date.parse(value);
  if (!Number.isNaN(asDate)) return 'Datetime';
  return 'Text';
};

// IBM Watson-inspired design with clean data catalog layout
const DataCatalog: React.FC = () => {
  const { datasets } = useMLContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'quality'>('date');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [ChartComp, setChartComp] = useState<any>(null);
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const pipelineSteps = [
    { label: 'Data', route: '/app/data' },
    { label: 'Profile', route: '/app/profile' },
    { label: 'Features', route: '/app/train?step=2' },
    { label: 'Train', route: '/app/train' },
    { label: 'Evaluate', route: '/app/evaluate' },
    { label: 'Deploy', route: '/app/deploy' },
    { label: 'Monitor', route: '/app/train?step=3' },
    { label: 'Insights', route: '/app/insights' },
  ];
  const ChartBar = ChartComp?.Bar;
  const ChartDoughnut = ChartComp?.Doughnut;
  
  // Favorites state
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Bulk actions state
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  
  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    minRows: '',
    maxRows: '',
    minColumns: '',
    maxColumns: '',
    minQuality: '',
    maxQuality: '',
    dateFrom: '',
    dateTo: '',
    columnSearch: ''
  });

  // Load favorites from localStorage
  useEffect(() => {
    if (user?.id) {
      const savedFavorites = localStorage.getItem(`favorites_${user.id}`);
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    }
  }, [user?.id]);

  // Auto-detect category from dataset name and description
  const detectCategory = (dataset: Dataset): string => {
    const text = `${dataset.name} ${dataset.description || ''}`.toLowerCase();
    
    if (text.match(/customer|client|user|churn|retention|ltv/)) return 'customer';
    if (text.match(/sales|revenue|marketing|campaign|conversion|roi/)) return 'sales';
    if (text.match(/operation|inventory|supply|logistics|maintenance/)) return 'operations';
    if (text.match(/analytic|metric|kpi|dashboard|report|insight/)) return 'analytics';
    if (text.match(/employee|hr|attrition|performance|payroll/)) return 'hr';
    if (text.match(/finance|accounting|transaction|payment|invoice/)) return 'finance';
    
    return 'other';
  };

  // Categories with auto-counted datasets
  const categories = useMemo(() => {
    const counts: Record<string, number> = {
      all: datasets.length,
      customer: 0,
      sales: 0,
      operations: 0,
      analytics: 0,
      hr: 0,
      finance: 0,
      other: 0
    };
    
    datasets.forEach(ds => {
      const category = detectCategory(ds);
      counts[category] = (counts[category] || 0) + 1;
    });
    
    return [
      { id: 'all', name: 'All Assets', count: counts.all },
      { id: 'customer', name: 'Customer Data', count: counts.customer },
      { id: 'sales', name: 'Sales & Marketing', count: counts.sales },
      { id: 'operations', name: 'Operations', count: counts.operations },
      { id: 'analytics', name: 'Analytics', count: counts.analytics },
      { id: 'hr', name: 'HR & People', count: counts.hr },
      { id: 'finance', name: 'Finance', count: counts.finance },
      { id: 'other', name: 'Other', count: counts.other },
    ];
  }, [datasets]);

  // Load Chart.js components for preview charts
  useEffect(() => {
    loadCharts()
      .then((comps) => {
        setChartComp(comps);
        setChartsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load charts:', error);
        setChartsLoaded(false);
      });
  }, []);

  // Calculate data quality score (0-100)
  const getQualityScore = (dataset: Dataset): number => {
    let score = 100;
    
    // Deduct points for missing description
    if (!dataset.description || dataset.description.length < 20) score -= 15;
    
    // Deduct points for small datasets
    if (dataset.rows < 100) score -= 20;
    
    // Deduct points for few columns
    if (dataset.columns < 5) score -= 10;
    
    // Bonus for having preview data
    if (dataset.preview_data?.columns && dataset.preview_data.columns.length > 0) score += 5;
    
    return Math.max(0, Math.min(100, score));
  };

  // Get quality badge color
  const getQualityBadge = (score: number) => {
    if (score >= 85) return { color: 'text-green-700 bg-green-50 border-green-200', label: 'Excellent', icon: CheckCircle2 };
    if (score >= 70) return { color: 'text-blue-700 bg-blue-50 border-blue-200', label: 'Good', icon: CheckCircle2 };
    if (score >= 50) return { color: 'text-yellow-700 bg-yellow-50 border-yellow-200', label: 'Fair', icon: AlertCircle };
    return { color: 'text-red-700 bg-red-50 border-red-200', label: 'Poor', icon: AlertCircle };
  };

  // Toggle favorite
  const toggleFavorite = (datasetId: string) => {
    const newFavorites = favorites.includes(datasetId)
      ? favorites.filter(id => id !== datasetId)
      : [...favorites, datasetId];
    
    setFavorites(newFavorites);
    if (user?.id) {
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(newFavorites));
      toast.success(favorites.includes(datasetId) ? 'Removed from favorites' : 'Added to favorites');
    }
  };

  // Bulk selection functions
  const toggleSelectDataset = (datasetId: string) => {
    setSelectedDatasets(prev => 
      prev.includes(datasetId) 
        ? prev.filter(id => id !== datasetId)
        : [...prev, datasetId]
    );
  };

  const selectAll = () => {
    setSelectedDatasets(filteredDatasets.map(ds => ds.id));
  };

  const deselectAll = () => {
    setSelectedDatasets([]);
  };

  // Bulk actions
  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedDatasets.length} datasets?`)) {
      toast.success(`${selectedDatasets.length} datasets deleted`);
      setSelectedDatasets([]);
      // TODO: Call actual delete API
    }
  };

  const handleBulkArchive = () => {
    toast.success(`${selectedDatasets.length} datasets archived`);
    setSelectedDatasets([]);
    // TODO: Call actual archive API
  };

  // Export to CSV
  const exportToCsv = () => {
    const headers = ['Name', 'Description', 'Type', 'Rows', 'Columns', 'Quality Score', 'Last Modified'];
    const rows = filteredDatasets.map(ds => [
      ds.name,
      ds.description || '',
      ds.fileType || 'CSV',
      ds.rows,
      ds.columns,
      getQualityScore(ds),
      new Date(ds.dateUploaded).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-catalog-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Catalog exported successfully');
  };

  // Filter and sort datasets
  const filteredDatasets = useMemo(() => {
    let result = datasets.filter(ds => {
      // Text search
      const matchesSearch = ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ds.description?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      
      // Category filter
      if (selectedCategory !== 'all' && detectCategory(ds) !== selectedCategory) return false;
      
      // Favorites filter
      if (selectedCategory === 'favorites' && !favorites.includes(ds.id)) return false;
      
      // Advanced filters
      if (filters.minRows && ds.rows < parseInt(filters.minRows)) return false;
      if (filters.maxRows && ds.rows > parseInt(filters.maxRows)) return false;
      if (filters.minColumns && ds.columns < parseInt(filters.minColumns)) return false;
      if (filters.maxColumns && ds.columns > parseInt(filters.maxColumns)) return false;
      
      const quality = getQualityScore(ds);
      if (filters.minQuality && quality < parseInt(filters.minQuality)) return false;
      if (filters.maxQuality && quality > parseInt(filters.maxQuality)) return false;
      
      if (filters.dateFrom && new Date(ds.dateUploaded) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(ds.dateUploaded) > new Date(filters.dateTo)) return false;
      
      // Column search
      if (filters.columnSearch) {
        const columnMatch = ds.preview_data?.columns?.some(col => 
          col.toLowerCase().includes(filters.columnSearch.toLowerCase())
        );
        if (!columnMatch) return false;
      }
      
      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'quality') return getQualityScore(b) - getQualityScore(a);
      return new Date(b.dateUploaded || 0).getTime() - new Date(a.dateUploaded || 0).getTime();
    });

    return result;
  }, [datasets, searchQuery, sortBy, selectedCategory, favorites, filters]);

  useEffect(() => {
    if (filteredDatasets.length === 0) {
      setSelectedDatasetId(null);
      return;
    }
    if (!selectedDatasetId || !filteredDatasets.some(ds => ds.id === selectedDatasetId)) {
      setSelectedDatasetId(filteredDatasets[0].id);
    }
  }, [filteredDatasets, selectedDatasetId]);

  const selectedDataset = useMemo(() => {
    if (!filteredDatasets.length) return null;
    if (selectedDatasetId) {
      return filteredDatasets.find(ds => ds.id === selectedDatasetId) || filteredDatasets[0];
    }
    return filteredDatasets[0];
  }, [filteredDatasets, selectedDatasetId]);

  const previewRows = selectedDataset?.preview_data?.rows || [];
  const previewColumns = selectedDataset?.preview_data?.columns || [];
  const previewSampleSize = previewRows.length;
  const freshnessSource = selectedDataset?.quality?.lastChecked || selectedDataset?.dateUploaded;
  const freshnessLabel = formatRelativeTime(freshnessSource);
  const updatedLabel = formatRelativeTime(selectedDataset?.dateUploaded);
  const hasPreviewData = previewColumns.length > 0 && previewSampleSize > 0;
  const healthScore = selectedDataset ? getQualityScore(selectedDataset) : null;
  const qualityIssues = selectedDataset?.quality?.issues || 0;

  const columnProfiles = useMemo(() => {
    if (!hasPreviewData) return [];
    const totalRows = previewRows.length;
    return previewColumns.slice(0, 6).map((col, idx) => {
      let nullCount = 0;
      const distinct = new Set<string>();
      let sampleValue: any = null;
      previewRows.forEach((row) => {
        const value = Array.isArray(row) ? row[idx] : row[col];
        if (value === null || value === undefined || value === '') nullCount += 1;
        else {
          distinct.add(String(value));
          if (sampleValue === null) sampleValue = value;
        }
      });
      const completeness = totalRows ? Math.round(((totalRows - nullCount) / totalRows) * 100) : 0;
      return {
        name: col,
        type: inferColumnTypeLabel(sampleValue),
        completeness,
        distinctCount: distinct.size,
      };
    });
  }, [hasPreviewData, previewColumns, previewRows]);

  const firstNumericColumn = useMemo(() => {
    if (!hasPreviewData) return null;
    return previewColumns.find((col, idx) => {
      const sampleValues = previewRows.slice(0, 12).map((row) => (Array.isArray(row) ? row[idx] : row[col]));
      return sampleValues.some((value) => !Number.isNaN(parseFloat(value)));
    }) || null;
  }, [hasPreviewData, previewColumns, previewRows]);

  const firstCategoricalColumn = useMemo(() => {
    if (!hasPreviewData) return null;
    return previewColumns.find((col, idx) => {
      const sampleValues = previewRows.slice(0, 12).map((row) => (Array.isArray(row) ? row[idx] : row[col]));
      return sampleValues.every((value) => typeof value === 'string' || value === null || value === undefined);
    }) || null;
  }, [hasPreviewData, previewColumns, previewRows]);

  const numericDistributionData = useMemo(() => {
    if (!firstNumericColumn || !hasPreviewData) return null;
    const colIndex = previewColumns.indexOf(firstNumericColumn);
    const values = previewRows
      .map((row) => (Array.isArray(row) ? row[colIndex] : row[firstNumericColumn]))
      .map((val) => parseFloat(val))
      .filter((val) => !Number.isNaN(val));
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const bins = 6;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const binSize = (max - min || 1) / bins;
    const counts = Array.from({ length: bins }, () => 0);
    sorted.forEach((val) => {
      const idx = Math.min(bins - 1, Math.floor((val - min) / binSize));
      counts[idx] += 1;
    });
    const labels = counts.map((_, i) => {
      const start = min + i * binSize;
      const end = start + binSize;
      return `${start.toFixed(1)}–${end.toFixed(1)}`;
    });
    return {
      labels,
      datasets: [
        {
          label: firstNumericColumn,
          data: counts,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderRadius: 8,
          borderWidth: 1,
        },
      ],
    };
  }, [firstNumericColumn, hasPreviewData, previewColumns, previewRows]);

  const categoricalDistributionData = useMemo(() => {
    if (!firstCategoricalColumn || !hasPreviewData) return null;
    const colIndex = previewColumns.indexOf(firstCategoricalColumn);
    const counts: Record<string, number> = {};
    previewRows.forEach((row) => {
      const value = Array.isArray(row) ? row[colIndex] : row[firstCategoricalColumn];
      const key = value === null || value === undefined || value === '' ? 'Unknown' : String(value);
      counts[key] = (counts[key] || 0) + 1;
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7);
    if (!entries.length) return null;
    return {
      labels: entries.map(([label]) => label),
      datasets: [
        {
          label: firstCategoricalColumn,
          data: entries.map(([, value]) => value),
          backgroundColor: [
            'rgba(99, 102, 241, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(14, 165, 233, 0.8)',
          ].slice(0, entries.length),
          borderWidth: 1,
        },
      ],
    };
  }, [firstCategoricalColumn, hasPreviewData, previewColumns, previewRows]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* IBM-style Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Data Catalog</h1>
              <p className="text-sm text-gray-600 mt-1">Browse, search, and analyze your data assets</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={exportToCsv}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Export CSV
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
                <Share2 className="w-4 h-4 inline mr-2" />
                Share
              </button>
              <button 
                onClick={() => navigate('/app/data')}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                <Database className="w-4 h-4 inline mr-2" />
                Add Data
              </button>
            </div>
          </div>

          {/* Search Bar - IBM Watson Style */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search data assets by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-3 text-sm font-medium border rounded-lg flex items-center gap-2 ${
                showAdvancedFilters 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Advanced
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="quality">Sort by Quality</option>
            </select>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-xs text-white">
            {pipelineSteps.map((step) => (
              <button
                key={step.label}
                onClick={() => navigate(step.route)}
                className="px-3 py-2 rounded-lg bg-gray-900 border border-white/10 hover:bg-white/10 transition"
                aria-current={step.label === 'Data' ? 'page' : undefined}
              >
                {step.label}
              </button>
            ))}
          </div>
          
          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Advanced Filters</h3>
                <button 
                  onClick={() => setFilters({
                    minRows: '', maxRows: '', minColumns: '', maxColumns: '',
                    minQuality: '', maxQuality: '', dateFrom: '', dateTo: '', columnSearch: ''
                  })}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Clear all
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                {/* Row filters */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min Rows</label>
                  <input
                    type="number"
                    value={filters.minRows}
                    onChange={(e) => setFilters(f => ({ ...f, minRows: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Rows</label>
                  <input
                    type="number"
                    value={filters.maxRows}
                    onChange={(e) => setFilters(f => ({ ...f, maxRows: e.target.value }))}
                    placeholder="∞"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Column filters */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min Columns</label>
                  <input
                    type="number"
                    value={filters.minColumns}
                    onChange={(e) => setFilters(f => ({ ...f, minColumns: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Columns</label>
                  <input
                    type="number"
                    value={filters.maxColumns}
                    onChange={(e) => setFilters(f => ({ ...f, maxColumns: e.target.value }))}
                    placeholder="∞"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Quality filters */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min Quality %</label>
                  <input
                    type="number"
                    value={filters.minQuality}
                    onChange={(e) => setFilters(f => ({ ...f, minQuality: e.target.value }))}
                    placeholder="0"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Quality %</label>
                  <input
                    type="number"
                    value={filters.maxQuality}
                    onChange={(e) => setFilters(f => ({ ...f, maxQuality: e.target.value }))}
                    placeholder="100"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Date filters */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Column search */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Search in Columns</label>
                <input
                  type="text"
                  value={filters.columnSearch}
                  onChange={(e) => setFilters(f => ({ ...f, columnSearch: e.target.value }))}
                  placeholder="Filter by column names (e.g., 'age', 'revenue', 'email')..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {filters.columnSearch && (
                  <p className="mt-1 text-xs text-gray-600">
                    Showing datasets containing column: <span className="font-semibold">{filters.columnSearch}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar - Categories */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-1">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="float-right text-gray-500">{cat.count}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => setSelectedCategory('favorites')}
                    className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 ${
                      selectedCategory === 'favorites'
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                    Favorites
                    <span className="ml-auto text-gray-500">{favorites.length}</span>
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recent
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Shared with me
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Data Table */}
          <div className="flex-1">
            {/* Bulk Actions Bar */}
            {selectedDatasets.length > 0 && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-blue-900">
                      {selectedDatasets.length} dataset{selectedDatasets.length > 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={deselectAll}
                      className="text-sm text-blue-700 hover:text-blue-800 font-medium"
                    >
                      Clear selection
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulkArchive}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-6">
              <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] gap-6">
                <div className="bg-white rounded-lg border border-gray-200">
                  {/* Table Header */}
                  <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={selectedDatasets.length === filteredDatasets.length ? deselectAll : selectAll}
                          className="p-1 hover:bg-gray-100 rounded"
                          title={selectedDatasets.length === filteredDatasets.length ? 'Deselect all' : 'Select all'}
                        >
                          {selectedDatasets.length === filteredDatasets.length && filteredDatasets.length > 0 ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {filteredDatasets.length} Data Assets
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>View:</span>
                        <button className="px-3 py-1 bg-blue-50 text-blue-700 rounded">Table</button>
                        <button className="px-3 py-1 text-gray-700 hover:bg-gray-50 rounded">Cards</button>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 w-12">
                            {/* Checkbox column */}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Size
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Quality
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Last Modified
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredDatasets.map(dataset => {
                          const qualityScore = getQualityScore(dataset);
                          const qualityBadge = getQualityBadge(qualityScore);
                          const QualityIcon = qualityBadge.icon;
                          const isActivePreview = selectedDataset?.id === dataset.id;

                          return (
                            <tr 
                              key={dataset.id} 
                              className={`hover:bg-gray-50 transition-colors ${
                                selectedDatasets.includes(dataset.id) ? 'bg-blue-50' : ''
                              } ${isActivePreview ? 'ring-1 ring-blue-200 bg-blue-50' : ''}`}
                              aria-selected={isActivePreview}
                            >
                              <td className="px-6 py-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelectDataset(dataset.id);
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  {selectedDatasets.includes(dataset.id) ? (
                                    <CheckSquare className="w-5 h-5 text-blue-600" />
                                  ) : (
                                    <Square className="w-5 h-5 text-gray-400" />
                                  )}
                                </button>
                              </td>
                              <td 
                                className="px-6 py-4 cursor-pointer"
                                onClick={() => setSelectedDatasetId(dataset.id)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Database className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{dataset.name}</div>
                                    <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                      {dataset.description || 'No description'}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                        <Tag className="w-3 h-3 mr-1" />
                                        {dataset.fileType?.toUpperCase() || 'CSV'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-700">Structured</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {dataset.rows?.toLocaleString()} rows
                                </div>
                                <div className="text-xs text-gray-500">
                                  {dataset.columns} columns
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${qualityBadge.color}`}>
                                    <QualityIcon className="w-3.5 h-3.5" />
                                    <span className="text-xs font-semibold">{qualityScore}%</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  {new Date(dataset.dateUploaded || '').toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDatasetId(dataset.id);
                                      navigate(`/app/datasets/${dataset.id}`);
                                    }}
                                    className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Preview"
                                    aria-label={`Open preview for ${dataset.name}`}
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Handle download
                                    }}
                                    className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(dataset.id);
                                    }}
                                    className={`p-1.5 rounded transition-colors ${
                                      favorites.includes(dataset.id)
                                        ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                                        : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                                    }`}
                                    title={favorites.includes(dataset.id) ? 'Remove from favorites' : 'Add to favorites'}
                                  >
                                    <Star className={`w-4 h-4 ${favorites.includes(dataset.id) ? 'fill-current' : ''}`} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Empty State */}
                  {filteredDatasets.length === 0 && (
                    <div className="px-6 py-16 text-center">
                      <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No data assets found</h3>
                      <p className="text-sm text-gray-600 mb-6">
                        {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first dataset'}
                      </p>
                      <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700">
                        Add Data Asset
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {!selectedDataset && (
                    <div className="bg-[#0d1117] border border-gray-900 rounded-2xl p-6 text-white space-y-3">
                      <p className="text-sm text-gray-400">Select a dataset to unlock preview-driven quality indicators.</p>
                      <button
                        onClick={() => navigate('/app/data')}
                        className="text-sm font-medium text-white border border-white/30 px-4 py-2 rounded-lg"
                      >
                        Upload / Import
                      </button>
                    </div>
                  )}
                  {selectedDataset && (
                    <div className="bg-gradient-to-br from-[#0f1117] to-[#1f2432] border border-white/10 rounded-2xl p-6 text-white space-y-4 shadow-lg">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold">{selectedDataset.name}</h3>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-400" aria-label="Health score label">Health</span>
                            <span className="px-2 py-1 rounded-full border border-white/40 bg-white/10 font-semibold">
                              {healthScore !== null ? `${healthScore}%` : '—'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">
                          Using {selectedDataset.name} • Updated {updatedLabel}
                        </p>
                        <p className="text-xs text-gray-400">
                          <span title="Freshness is relative to the last catalog update">Freshness {freshnessLabel}</span>
                        </p>
                      </div>
                      <div className="space-y-3">
                        <button
                          onClick={() => navigate('/app/data')}
                          className="w-full text-sm font-semibold px-4 py-3 bg-[#2563eb] hover:bg-[#1d4bd8] rounded-xl"
                          aria-label="Upload or import data"
                        >
                          Upload / Import
                        </button>
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          <button
                            onClick={() => navigate(`/app/datasets/${selectedDataset.id}`)}
                            className="px-3 py-2 bg-white/10 text-white rounded-lg border border-white/10"
                            aria-label="Open preview"
                          >
                            Open preview
                          </button>
                          <button
                            onClick={() => navigate('/app/profile')}
                            className="px-3 py-2 bg-white/10 text-white rounded-lg border border-white/10"
                            aria-label="Profile quality"
                          >
                            Profile quality
                          </button>
                          <button
                            onClick={() => navigate('/app/train?step=2')}
                            className="px-3 py-2 bg-white/10 text-white rounded-lg border border-white/10"
                            aria-label="Transform or feature engineer"
                          >
                            Transform & feature engineer
                          </button>
                          <button
                            onClick={() => navigate('/app/train')}
                            className="px-3 py-2 bg-white/10 text-white rounded-lg border border-white/10"
                            aria-label="Train model"
                          >
                            Train model
                          </button>
                        </div>
                      </div>
                      {qualityIssues > 0 && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-white/70">{qualityIssues} quality issue{qualityIssues > 1 ? 's' : ''}</span>
                          <button
                            onClick={() => navigate('/app/profile')}
                            className="px-2 py-1 text-[11px] font-semibold bg-red-600/80 rounded-full"
                            aria-label="Fix quality issues"
                          >
                            Fix {qualityIssues}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedDataset && (
                    <div className="bg-[#0b1221] border border-white/10 rounded-2xl p-4 shadow-lg space-y-4 text-white">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-gray-400">
                        <span>Column completeness</span>
                        <span title="Sample size shown from preview rows">Sample size: {previewSampleSize.toLocaleString()}</span>
                      </div>
                      <div className="space-y-3">
                        {columnProfiles.length ? columnProfiles.map(profile => (
                          <div key={profile.name} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-semibold text-white">{profile.name}</span>
                              <span className="text-xs text-gray-400">{profile.type} · {profile.distinctCount} distinct</span>
                            </div>
                            <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#22d3ee] to-[#818cf8] rounded-full"
                                style={{ width: `${profile.completeness}%` }}
                              />
                            </div>
                          </div>
                        )) : (
                          <p className="text-sm text-gray-400">No preview data available yet.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedDataset && (
                    <div className="space-y-4">
                      <div className="bg-[#0b1221] border border-white/10 rounded-2xl p-4 shadow-lg text-white">
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-gray-400">
                          <span>Numeric distribution</span>
                          <span title="Freshness of the numeric sample">Freshness {freshnessLabel}</span>
                        </div>
                        <div className="relative h-48">
                          {(!chartsLoaded || !ChartBar) && (
                            <div className="flex h-full w-full items-center justify-center text-white/60">
                              <Loader className="h-6 w-6 animate-spin" aria-label="Loading chart" />
                            </div>
                          )}
                          {chartsLoaded && ChartBar && numericDistributionData && (
                            <ChartBar
                              data={numericDistributionData}
                              options={baseChartOptions}
                              aria-label={`Numeric distribution of ${firstNumericColumn}`}
                            />
                          )}
                          {chartsLoaded && !numericDistributionData && (
                            <p className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                              Need more numeric preview data.
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="bg-[#0b1221] border border-white/10 rounded-2xl p-4 shadow-lg text-white">
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-gray-400">
                          <span>Categorical distribution</span>
                          <span title="Sample size for categorical values">Sample size: {previewSampleSize.toLocaleString()}</span>
                        </div>
                        <div className="relative h-48">
                          {(!chartsLoaded || !ChartDoughnut) && (
                            <div className="flex h-full w-full items-center justify-center text-white/60">
                              <Loader className="h-6 w-6 animate-spin" aria-label="Loading chart" />
                            </div>
                          )}
                          {chartsLoaded && ChartDoughnut && categoricalDistributionData && (
                            <ChartDoughnut
                              data={categoricalDistributionData}
                              options={baseChartOptions}
                              aria-label={`Categorical distribution of ${firstCategoricalColumn}`}
                            />
                          )}
                          {chartsLoaded && !categoricalDistributionData && (
                            <p className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                              Need more categorical preview data.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCatalog;
