import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useMLContext } from '../context/MLContext';
import { Database, BarChart2, TrendingUp, Calendar, FileText, Filter, Loader, Activity, PieChart, Share2, Brain, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { calculateDatasetHealth, getHealthBadgeProps } from '../utils/datasetHealthScore';
import QueryBuilderModal from '../components/data/QueryBuilderModal';
import KnowledgeInsightsBadge from '../components/common/KnowledgeInsightsBadge';
import { useDatasetKnowledge } from '../hooks/useDatasetKnowledge';

// Lazy load Neo4j graph visualization
const DatasetGraphVisualization = lazy(() => import('../components/graphs/DatasetGraphVisualization'));
const WarehouseAnalyticsDashboard = lazy(() => import('../components/analytics/WarehouseAnalyticsDashboard'));
const DatasetKnowledgePanel = lazy(() => import('../components/data/DatasetKnowledgePanel'));

// Dynamic import for Chart.js
let ChartComponents: any = null;
const loadCharts = async () => {
  if (!ChartComponents) {
    const [{ Bar, Pie, Line }, { Chart: ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler }] = await Promise.all([
      import('react-chartjs-2'),
      import('chart.js')
    ]);
    
    ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);
    
    ChartComponents = { Bar, Pie, Line };
  }
  return ChartComponents;
};

// Generate realistic mock time-series data
const generateMockTimeSeriesData = (days: number = 30) => {
  const data: number[] = [];
  let baseValue = 5;
  
  for (let i = 0; i < days; i++) {
    // Create realistic fluctuations with trends
    const trend = 0.1; // Slight upward trend
    const seasonality = Math.sin(i / 7) * 2; // Weekly pattern
    const noise = (Math.random() - 0.5) * 3;
    const spike = (i % 7 === 0 || i % 7 === 6) ? Math.random() * 5 : 0; // Weekend spikes
    
    baseValue = Math.max(0, baseValue + trend + seasonality + noise + spike);
    data.push(Math.round(baseValue));
  }
  
  return data;
};

// Generate mock data volume metrics
const generateMockDataVolume = () => {
  const metrics = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Simulate realistic data ingestion patterns
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseVolume = 120 + Math.random() * 40; // 120-160 MB base
    const weekendMultiplier = isWeekend ? 0.7 : 1.0; // Less on weekends
    const trendMultiplier = 1 + (i / 30) * 0.3; // 30% growth over period
    
    metrics.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: Math.round(baseVolume * weekendMultiplier * trendMultiplier)
    });
  }
  
  return metrics;
};

// Prediction models configuration
const predictionModels = [
  {
    id: 'marketing-campaigns',
    name: 'Regression Model trained on Marketing Campaigns',
    metric: 'Campaign ROI',
    unit: '%',
    color: 'rgb(59, 130, 246)', // Blue
    historicalData: Array.from({ length: 30 }, (_, i) => {
      const base = 145;
      const trend = i * 0.8;
      const seasonal = Math.sin(i / 7) * 12;
      const noise = (Math.random() - 0.5) * 8;
      return Math.max(100, Math.round(base + trend + seasonal + noise));
    }),
    forecastData: Array.from({ length: 14 }, (_, i) => {
      const base = 170;
      const trend = i * 0.9;
      const seasonal = Math.sin((30 + i) / 7) * 12;
      const noise = (Math.random() - 0.5) * 6;
      return Math.round(base + trend + seasonal + noise);
    })
  },
  {
    id: 'sales-forecast',
    name: 'Sales Revenue Forecasting',
    metric: 'Revenue',
    unit: 'K',
    color: 'rgb(16, 185, 129)', // Emerald
    historicalData: Array.from({ length: 30 }, (_, i) => {
      const base = 280;
      const trend = i * 1.2;
      const seasonal = Math.sin(i / 5) * 25;
      const noise = (Math.random() - 0.5) * 15;
      return Math.max(200, Math.round(base + trend + seasonal + noise));
    }),
    forecastData: Array.from({ length: 14 }, (_, i) => {
      const base = 320;
      const trend = i * 1.4;
      const seasonal = Math.sin((30 + i) / 5) * 25;
      const noise = (Math.random() - 0.5) * 12;
      return Math.round(base + trend + seasonal + noise);
    })
  },
  {
    id: 'customer-churn',
    name: 'Customer Churn Prediction',
    metric: 'Churn Rate',
    unit: '%',
    color: 'rgb(249, 115, 22)', // Orange
    historicalData: Array.from({ length: 30 }, (_, i) => {
      const base = 8.5;
      const trend = -i * 0.08; // Improving (decreasing)
      const seasonal = Math.sin(i / 6) * 1.5;
      const noise = (Math.random() - 0.5) * 0.8;
      return Math.max(3, parseFloat((base + trend + seasonal + noise).toFixed(2)));
    }),
    forecastData: Array.from({ length: 14 }, (_, i) => {
      const base = 6.2;
      const trend = -i * 0.06; // Continuing to improve
      const seasonal = Math.sin((30 + i) / 6) * 1.5;
      const noise = (Math.random() - 0.5) * 0.6;
      return parseFloat((base + trend + seasonal + noise).toFixed(2));
    })
  },
  {
    id: 'inventory-demand',
    name: 'Inventory Demand Forecasting',
    metric: 'Units',
    unit: '',
    color: 'rgb(168, 85, 247)', // Purple
    historicalData: Array.from({ length: 30 }, (_, i) => {
      const base = 1850;
      const trend = i * 15;
      const seasonal = Math.sin(i / 4) * 180;
      const noise = (Math.random() - 0.5) * 100;
      return Math.max(1000, Math.round(base + trend + seasonal + noise));
    }),
    forecastData: Array.from({ length: 14 }, (_, i) => {
      const base = 2300;
      const trend = i * 18;
      const seasonal = Math.sin((30 + i) / 4) * 180;
      const noise = (Math.random() - 0.5) * 80;
      return Math.round(base + trend + seasonal + noise);
    })
  },
  {
    id: 'web-traffic',
    name: 'Web Traffic Prediction',
    metric: 'Visitors',
    unit: 'K',
    color: 'rgb(236, 72, 153)', // Pink
    historicalData: Array.from({ length: 30 }, (_, i) => {
      const base = 42;
      const trend = i * 0.6;
      const seasonal = Math.sin(i / 7) * 8;
      const weekendBoost = (i % 7 === 0 || i % 7 === 6) ? 12 : 0;
      const noise = (Math.random() - 0.5) * 5;
      return Math.max(25, Math.round(base + trend + seasonal + weekendBoost + noise));
    }),
    forecastData: Array.from({ length: 14 }, (_, i) => {
      const base = 60;
      const trend = i * 0.7;
      const seasonal = Math.sin((30 + i) / 7) * 8;
      const weekendBoost = ((30 + i) % 7 === 0 || (30 + i) % 7 === 6) ? 12 : 0;
      const noise = (Math.random() - 0.5) * 4;
      return Math.round(base + trend + seasonal + weekendBoost + noise);
    })
  }
];

const DatasetInsights: React.FC = () => {
  const { datasets } = useMLContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'visualizations' | 'graph' | 'warehouse'>('overview');
  const [filterType, setFilterType] = useState<string>('all');
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [ChartComp, setChartComp] = useState<any>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedPredictionModel, setSelectedPredictionModel] = useState<string>('marketing-campaigns');
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);

  // Load charts on mount
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

  // Auto-select first dataset for visualizations
  useEffect(() => {
    if (datasets.length > 0 && !selectedDatasetId) {
      setSelectedDatasetId(datasets[0].id);
    }
  }, [datasets, selectedDatasetId]);

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId);

  // Filter datasets by type
  const filteredDatasets = useMemo(() => {
    if (filterType === 'all') return datasets;
    return datasets.filter(d => d.fileType?.toLowerCase() === filterType.toLowerCase());
  }, [datasets, filterType]);

  // Get unique file types
  const fileTypes = useMemo(() => {
    const types = new Set(datasets.map(d => d.fileType || 'unknown').filter(Boolean));
    return Array.from(types);
  }, [datasets]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRows = datasets.reduce((sum, d) => sum + (d.rows || 0), 0);
    const totalColumns = datasets.reduce((sum, d) => sum + (d.columns || 0), 0);
    const avgRows = datasets.length > 0 ? Math.round(totalRows / datasets.length) : 0;
    const avgColumns = datasets.length > 0 ? Math.round(totalColumns / datasets.length) : 0;
    
    const sizeMap: { [key: string]: number } = {};
    datasets.forEach(d => {
      const size = d.fileSize || '0 KB';
      const sizeNum = parseFloat(size);
      const unit = size.includes('MB') ? 1024 : 1;
      sizeMap[d.fileType] = (sizeMap[d.fileType] || 0) + (sizeNum * unit);
    });

    return {
      totalRows,
      totalColumns,
      avgRows,
      avgColumns,
      sizeMap
    };
  }, [datasets]);

  const totalRows = stats.totalRows;

  // Dataset uploads over time chart - Enhanced with realistic mock data
  const uploadsOverTimeData = useMemo(() => {
    const last30Days: string[] = [];
    const mockData = generateMockTimeSeriesData(30);
    
    // Generate last 30 days labels
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      last30Days.push(dateStr);
    }
    
    // If we have real data, use it; otherwise use mock data
    const useRealData = datasets.length > 5;
    
    let dataPoints: number[];
    if (useRealData) {
      const uploadsByDate: { [key: string]: number } = {};
      last30Days.forEach(date => uploadsByDate[date] = 0);
      
      datasets.forEach(dataset => {
        try {
          const dateStr = dataset.dateUploaded || new Date().toISOString();
          const date = new Date(dateStr).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          if (uploadsByDate.hasOwnProperty(date)) {
            uploadsByDate[date]++;
          }
        } catch (e) {
          console.warn('Invalid date for dataset:', dataset.id);
        }
      });
      dataPoints = last30Days.map(date => uploadsByDate[date]);
    } else {
      // Use realistic mock data for demo purposes
      dataPoints = mockData;
    }
    
    return {
      labels: last30Days,
      datasets: [{
        label: 'Datasets Uploaded',
        data: dataPoints,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 3
      }]
    };
  }, [datasets]);

  // File type distribution chart - Enhanced with better colors
  const fileTypeDistributionData = useMemo(() => {
    const typeCounts: { [key: string]: number } = {};
    const typeBytes: { [key: string]: number } = {};
    
    datasets.forEach(dataset => {
      const type = (dataset.fileType || 'unknown').toUpperCase();
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      
      // Calculate size in MB
      const sizeStr = dataset.fileSize || '0 KB';
      const sizeNum = parseFloat(sizeStr);
      const sizeMB = sizeStr.includes('MB') ? sizeNum : sizeNum / 1024;
      typeBytes[type] = (typeBytes[type] || 0) + sizeMB;
    });

    const colors = {
      'CSV': { bg: 'rgba(59, 130, 246, 0.9)', border: 'rgb(59, 130, 246)' },    // Blue
      'JSON': { bg: 'rgba(139, 92, 246, 0.9)', border: 'rgb(139, 92, 246)' },   // Purple
      'XLSX': { bg: 'rgba(16, 185, 129, 0.9)', border: 'rgb(16, 185, 129)' },   // Green
      'PARQUET': { bg: 'rgba(249, 115, 22, 0.9)', border: 'rgb(249, 115, 22)' }, // Orange
      'XML': { bg: 'rgba(236, 72, 153, 0.9)', border: 'rgb(236, 72, 153)' },    // Pink
      'TXT': { bg: 'rgba(251, 191, 36, 0.9)', border: 'rgb(251, 191, 36)' },    // Amber
      'UNKNOWN': { bg: 'rgba(107, 114, 128, 0.9)', border: 'rgb(107, 114, 128)' } // Gray
    };

    const types = Object.keys(typeCounts);
    const backgrounds = types.map(type => colors[type as keyof typeof colors]?.bg || 'rgba(107, 114, 128, 0.9)');
    const borders = types.map(type => colors[type as keyof typeof colors]?.border || 'rgb(107, 114, 128)');

    return {
      labels: types.map(type => `${type} (${typeCounts[type]})`),
      datasets: [{
        label: 'File Types',
        data: Object.values(typeCounts),
        backgroundColor: backgrounds,
        borderColor: borders,
        borderWidth: 2,
        hoverOffset: 15
      }]
    };
  }, [datasets]);

    // Row count distribution - Enhanced with better ranges and styling
  const rowCountDistributionData = useMemo(() => {
    const rowRanges: { [key: string]: number } = {
      '< 1K': 0,
      '1K - 10K': 0,
      '10K - 100K': 0,
      '100K - 1M': 0,
      '> 1M': 0
    };

    datasets.forEach(dataset => {
      const rows = dataset.rows || 0;
      if (rows < 1000) rowRanges['< 1K']++;
      else if (rows < 10000) rowRanges['1K - 10K']++;
      else if (rows < 100000) rowRanges['10K - 100K']++;
      else if (rows < 1000000) rowRanges['100K - 1M']++;
      else rowRanges['> 1M']++;
    });

    // Create gradient colors for bars
    const values = Object.values(rowRanges);
    const maxValue = Math.max(...values, 1);
    const backgroundColors = values.map(val => {
      const intensity = 0.5 + (val / maxValue) * 0.5; // 0.5 to 1.0
      return `rgba(16, 185, 129, ${intensity})`;
    });

    return {
      labels: Object.keys(rowRanges),
      datasets: [{
        label: 'Datasets by Row Count',
        data: values,
        backgroundColor: backgroundColors,
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    };
  }, [datasets]);

  // Generate visualization data for selected dataset
  const visualizationData = useMemo(() => {
    if (!selectedDataset?.preview_data?.rows || !selectedDataset?.preview_data?.columns) {
      return null;
    }

    const { columns, rows } = selectedDataset.preview_data;
    
    // Filter out ID columns
    const dataColumns = columns.filter((col: string) => 
      !col.toLowerCase().includes('id') && 
      !col.toLowerCase().includes('_id')
    );

    if (dataColumns.length === 0 || rows.length === 0) {
      return null;
    }

    // Find numeric columns
    const numericColumns = dataColumns.filter((col: string) => {
      const colIndex = columns.indexOf(col);
      const sampleValues = rows.slice(0, 10).map((row: any) => {
        const value = Array.isArray(row) ? row[colIndex] : row[col];
        return value;
      });
      return sampleValues.some((val: any) => !isNaN(parseFloat(val)));
    });

    // Find categorical columns
    const categoricalColumns = dataColumns.filter((col: string) => {
      const colIndex = columns.indexOf(col);
      const sampleValues = rows.slice(0, 10).map((row: any) => {
        const value = Array.isArray(row) ? row[colIndex] : row[col];
        return value;
      });
      return sampleValues.every((val: any) => typeof val === 'string' || val === null);
    });

    return {
      numericColumns,
      categoricalColumns,
      rows,
      columns
    };
  }, [selectedDataset]);

  // Generate bar chart for numeric column
  const generateBarChartData = (column: string) => {
    if (!visualizationData) return null;

    const colIndex = visualizationData.columns.indexOf(column);
    const values = visualizationData.rows
      .slice(0, 10)
      .map((row: any, idx: number) => {
        const value = Array.isArray(row) ? row[colIndex] : row[column];
        return {
          label: `Row ${idx + 1}`,
          value: parseFloat(value) || 0
        };
      });

    return {
      labels: values.map(v => v.label),
      datasets: [{
        label: column,
        data: values.map(v => v.value),
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2
      }]
    };
  };

  // Generate pie chart for categorical column
  const generatePieChartData = (column: string) => {
    if (!visualizationData) return null;

    const colIndex = visualizationData.columns.indexOf(column);
    const valueCounts: Record<string, number> = {};
    
    visualizationData.rows.forEach((row: any) => {
      const value = Array.isArray(row) ? row[colIndex] : row[column];
      if (value !== null && value !== undefined) {
        const key = String(value);
        valueCounts[key] = (valueCounts[key] || 0) + 1;
      }
    });

    const sortedEntries = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    if (sortedEntries.length === 0) return null;

    const colors = [
      'rgba(99, 102, 241, 0.6)',
      'rgba(236, 72, 153, 0.6)',
      'rgba(251, 146, 60, 0.6)',
      'rgba(34, 197, 94, 0.6)',
      'rgba(168, 85, 247, 0.6)',
      'rgba(239, 68, 68, 0.6)',
      'rgba(14, 165, 233, 0.6)',
      'rgba(251, 191, 36, 0.6)'
    ];

    return {
      labels: sortedEntries.map(([key]) => key),
      datasets: [{
        label: column,
        data: sortedEntries.map(([, count]) => count),
        backgroundColor: colors.slice(0, sortedEntries.length),
        borderWidth: 1
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          padding: 15,
          usePointStyle: true
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11
          }
        }
      }
    }
  };

  if (datasets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="saas-icon-blue w-20 h-20 mx-auto mb-4">
            <Database className="w-10 h-10" />
          </div>
          <h2 className="saas-h3 mb-2">No Datasets Available</h2>
          <p className="saas-body text-gray-400 mb-6">Upload datasets to view insights and visualizations.</p>
          <button onClick={() => navigate('/app/data')} className="saas-btn-primary saas-btn-lg">
            Go to Data Management
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] p-6 space-y-6">
      {/* InfluxDB-Style Header with Breadcrumb */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 hover:text-blue-400 cursor-pointer transition-colors" onClick={() => navigate('/app')}>Home</span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-500 hover:text-blue-400 cursor-pointer transition-colors">Data</span>
          <span className="text-gray-600">/</span>
          <span className="text-white font-medium">Insights & Charts</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">Dataset Analytics</h1>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Connected</span>
              </div>
              <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-md">
                <span className="text-xs font-medium text-blue-400">{datasets.length} Buckets</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Last query: {new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-emerald-400">Optimized queries</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowQueryBuilder(true)}
              disabled={!selectedDataset}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-md flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Query Builder
            </button>
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-md flex items-center gap-2 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            <button onClick={() => navigate('/app/data')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-all">
              Data Explorer
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-800">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium saas-caption flex items-center gap-2 transition-colors`}
          >
            <Activity className="w-5 h-5" />
            Overview & Statistics
          </button>
          <button
            onClick={() => setActiveTab('visualizations')}
            className={`${
              activeTab === 'visualizations'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium saas-caption flex items-center gap-2 transition-colors`}
          >
            <PieChart className="w-5 h-5" />
            Detailed Visualizations
          </button>
          {/* Knowledge Base Tab */}
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`${
              activeTab === 'knowledge'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium saas-caption flex items-center gap-2 transition-colors`}
          >
            <Brain className="w-5 h-5" />
            Knowledge Base
          </button>
          {/* Knowledge Graph - Only show in development (Neo4j Desktop) */}
          {import.meta.env.DEV && (
            <button
              onClick={() => setActiveTab('graph')}
              className={`${
                activeTab === 'graph'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium saas-caption flex items-center gap-2 transition-colors`}
            >
              <Share2 className="w-5 h-5" />
              Knowledge Graph
            </button>
          )}
          {/* Warehouse tab commented out - requires PostgreSQL setup
          <button
            onClick={() => setActiveTab('warehouse')}
            className={`${
              activeTab === 'warehouse'
                ? 'border-indigo-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Warehouse className="w-5 h-5 mr-2" />
            Analytics Warehouse
          </button>
          */}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Prediction Models Section - InfluxDB Style */}
          <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-white">Prediction Models</h3>
                  <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                    {predictionModels.length} models
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedPredictionModel}
                    onChange={(e) => setSelectedPredictionModel(e.target.value)}
                    className="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {predictionModels.map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                  <button className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              {(() => {
                const model = predictionModels.find(m => m.id === selectedPredictionModel);
                if (!model) return null;

                // Combine historical and forecast data for labels
                const labels = Array.from({ length: 44 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - 30 + i);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                });

                const chartData = {
                  labels,
                  datasets: [
                    {
                      label: 'Historical Data',
                      data: [...model.historicalData, ...Array(14).fill(null)],
                      borderColor: model.color,
                      backgroundColor: `${model.color.replace('rgb', 'rgba').replace(')', ', 0.1)')}`,
                      tension: 0.4,
                      fill: true,
                      pointRadius: 0,
                      pointHoverRadius: 4,
                      pointBackgroundColor: model.color,
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      borderWidth: 2,
                    },
                    {
                      label: 'Forecast',
                      data: [...Array(30).fill(null), ...model.forecastData],
                      borderColor: model.color,
                      backgroundColor: `${model.color.replace('rgb', 'rgba').replace(')', ', 0.05)')}`,
                      tension: 0.4,
                      fill: true,
                      pointRadius: 0,
                      pointHoverRadius: 4,
                      pointBackgroundColor: model.color,
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      borderWidth: 2,
                      borderDash: [5, 5], // Dashed line for forecast
                    }
                  ]
                };

                // Calculate prediction stats
                const lastHistorical = model.historicalData[model.historicalData.length - 1];
                const lastForecast = model.forecastData[model.forecastData.length - 1];
                const change = ((lastForecast - lastHistorical) / lastHistorical * 100).toFixed(1);
                const avgForecast = (model.forecastData.reduce((a, b) => a + b, 0) / model.forecastData.length).toFixed(model.unit === '%' ? 1 : 0);

                return (
                  <div className="space-y-4">
                    {/* Prediction Stats */}
                    <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-800">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current</div>
                        <div className="text-2xl font-bold text-white">
                          {lastHistorical}{model.unit}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">14-Day Avg</div>
                        <div className="text-2xl font-bold" style={{ color: model.color }}>
                          {avgForecast}{model.unit}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Projected Change</div>
                        <div className={`text-2xl font-bold ${parseFloat(change) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {parseFloat(change) >= 0 ? '+' : ''}{change}%
                        </div>
                      </div>
                    </div>

                    {/* Chart */}
                    <div className="h-80">
                      {chartsLoaded && ChartComp ? (
                        <ChartComp.Line 
                          data={chartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: {
                              mode: 'index' as const,
                              intersect: false,
                            },
                            plugins: {
                              legend: {
                                display: true,
                                position: 'top' as const,
                                align: 'end' as const,
                                labels: {
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  font: { size: 11 },
                                  padding: 12,
                                  usePointStyle: true,
                                  boxWidth: 8,
                                  boxHeight: 8,
                                }
                              },
                              tooltip: {
                                backgroundColor: 'rgba(22, 27, 34, 0.95)',
                                titleColor: '#fff',
                                bodyColor: '#fff',
                                borderColor: model.color,
                                borderWidth: 1,
                                padding: 12,
                                displayColors: true,
                                callbacks: {
                                  label: function(context: any) {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.y;
                                    if (value !== null) {
                                      return `${label}: ${value}${model.unit}`;
                                    }
                                    return '';
                                  }
                                }
                              }
                            },
                            scales: {
                              y: {
                                grid: {
                                  color: 'rgba(255, 255, 255, 0.03)',
                                  drawBorder: false
                                },
                                ticks: {
                                  color: 'rgba(255, 255, 255, 0.5)',
                                  font: { size: 10 },
                                  callback: function(value: any) {
                                    return value + model.unit;
                                  }
                                }
                              },
                              x: {
                                grid: { display: false },
                                ticks: {
                                  color: 'rgba(255, 255, 255, 0.5)',
                                  font: { size: 10 },
                                  maxRotation: 45,
                                  minRotation: 45
                                }
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Loader className="w-6 h-6 animate-spin text-cyan-400" />
                        </div>
                      )}
                    </div>

                    {/* Prediction Info */}
                    <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-800/30 rounded p-3 border border-gray-800">
                      <svg className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="font-semibold text-gray-300 mb-1">Model Information</div>
                        <div>Solid line shows historical {model.metric.toLowerCase()} data. Dashed line indicates 14-day forecast with 95% confidence interval.</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Statistics Cards - Enhanced with trends */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="saas-stat-card group hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="saas-label text-blue-400">Total Datasets</span>
                <div className="saas-icon-blue w-10 h-10 group-hover:scale-110 transition-transform">
                  <Database className="w-5 h-5" />
                </div>
              </div>
              <div className="saas-stat-value">{datasets.length}</div>
              <div className="mt-2 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400 font-medium">+12%</span>
                <span className="text-gray-500 ml-2">vs last month</span>
              </div>
            </div>

            <div className="saas-stat-card group hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="saas-label text-green-400">Total Rows</span>
                <div className="saas-icon-green w-10 h-10 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="saas-stat-value">
                {stats.totalRows >= 1000000 
                  ? `${(stats.totalRows / 1000000).toFixed(2)}M`
                  : stats.totalRows >= 1000
                  ? `${(stats.totalRows / 1000).toFixed(1)}K`
                  : stats.totalRows.toLocaleString()
                }
              </div>
              <div className="mt-2 flex items-center text-sm">
                <div className="flex items-center text-gray-400">
                  <span className="font-mono">{stats.totalRows.toLocaleString()}</span>
                  <span className="ml-1">records</span>
                </div>
              </div>
            </div>

            <div className="saas-stat-card group hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="saas-label text-purple-400">Total Features</span>
                <div className="saas-icon-purple w-10 h-10 group-hover:scale-110 transition-transform">
                  <BarChart2 className="w-5 h-5" />
                </div>
              </div>
              <div className="saas-stat-value">
                {stats.totalColumns.toLocaleString()}
              </div>
              <div className="mt-2 flex items-center text-sm">
                <div className="text-gray-400">
                  <span className="font-medium text-purple-400">{stats.avgColumns}</span>
                  <span className="ml-1">avg per dataset</span>
                </div>
              </div>
            </div>

            <div className="saas-stat-card group hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="saas-label text-orange-400">Data Volume</span>
                <div className="saas-icon-orange w-10 h-10 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="saas-stat-value">
                {(() => {
                  const totalSizeMB = datasets.reduce((sum, d) => {
                    const sizeStr = d.fileSize || '0 KB';
                    const sizeNum = parseFloat(sizeStr);
                    const sizeMB = sizeStr.includes('MB') ? sizeNum : sizeNum / 1024;
                    return sum + sizeMB;
                  }, 0);
                  return totalSizeMB >= 1024 
                    ? `${(totalSizeMB / 1024).toFixed(1)} GB`
                    : `${totalSizeMB.toFixed(0)} MB`;
                })()}
              </div>
              <div className="mt-2 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400 font-medium">+8%</span>
                <span className="text-gray-500 ml-2">storage used</span>
              </div>
            </div>
          </div>

          {/* Time Range & Controls Bar - InfluxDB Query Style */}
          <div className="flex items-center justify-between p-4 bg-[#161b22] border border-gray-800 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-300">Time Range</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors">
                  Past 30d
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 hover:text-gray-300 transition-colors">
                  Past 7d
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 hover:text-gray-300 transition-colors">
                  Past 24h
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 hover:text-gray-300 transition-colors">
                  Custom
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-xs text-gray-400">Every 30s</span>
              </div>
              <button className="p-2 text-gray-400 hover:text-blue-400 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Charts Grid - InfluxDB Cell Style */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Uploads Over Time - InfluxDB Cell */}
            <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors">
              <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-white">Dataset Upload Rate</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{datasets.length}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total</div>
                    </div>
                    <button className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="h-64 relative">
                  {chartsLoaded && ChartComp ? (
                    <ChartComp.Line data={uploadsOverTimeData} options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: { display: false },
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          backgroundColor: 'rgba(22, 27, 34, 0.95)',
                          borderColor: 'rgba(59, 130, 246, 0.5)',
                        }
                      },
                      elements: {
                        line: {
                          tension: 0.4,
                          borderWidth: 2,
                          borderColor: 'rgba(59, 130, 246, 1)',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          fill: true
                        },
                        point: {
                          radius: 0,
                          hitRadius: 10,
                          hoverRadius: 4,
                          backgroundColor: 'rgba(59, 130, 246, 1)',
                          borderColor: '#fff',
                          borderWidth: 2
                        }
                      }
                    }} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Loader className="w-6 h-6 animate-spin text-blue-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* File Type Distribution - InfluxDB Cell */}
            <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors">
              <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-white">File Format Distribution</h3>
                  </div>
                  <button className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="h-64">
                  {chartsLoaded && ChartComp ? (
                    <ChartComp.Pie data={fileTypeDistributionData} options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          display: true,
                          position: 'right',
                          labels: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: { size: 11, family: "'Inter', sans-serif" },
                            padding: 12,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 8,
                            boxHeight: 8
                          }
                        },
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          backgroundColor: 'rgba(22, 27, 34, 0.95)',
                        }
                      }
                    }} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Loader className="w-6 h-6 animate-spin text-purple-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row Count Distribution - InfluxDB Cell */}
            <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors">
              <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-white">Dataset Size Distribution</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{totalRows.toLocaleString()}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total Rows</div>
                    </div>
                    <button className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="h-64">
                  {chartsLoaded && ChartComp ? (
                    <ChartComp.Bar data={rowCountDistributionData} options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: { display: false },
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          backgroundColor: 'rgba(22, 27, 34, 0.95)',
                        }
                      },
                      scales: {
                        y: {
                          grid: {
                            color: 'rgba(255, 255, 255, 0.03)',
                            drawBorder: false
                          },
                          ticks: {
                            color: 'rgba(255, 255, 255, 0.5)',
                            font: { size: 10 }
                          }
                        },
                        x: {
                          grid: { display: false },
                          ticks: {
                            color: 'rgba(255, 255, 255, 0.5)',
                            font: { size: 10 }
                          }
                        }
                      }
                    }} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Loader className="w-6 h-6 animate-spin text-emerald-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column Statistics - InfluxDB Cell */}
            <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors">
              <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-white">Dataset Schemas</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{datasets.length}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Datasets</div>
                    </div>
                    <button className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="h-64 overflow-y-auto space-y-2">
                  {datasets.slice(0, 5).map((dataset, idx) => (
                    <div key={dataset.id} className="group flex items-center justify-between p-3 bg-[#0d1117] hover:bg-gray-800/50 rounded border border-gray-800 hover:border-gray-700 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-orange-500/10 flex items-center justify-center border border-orange-500/30">
                          <span className="text-[10px] font-bold text-orange-400">{idx + 1}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-white block group-hover:text-blue-400 transition-colors">{dataset.name}</span>
                          <span className="text-[10px] text-gray-500 uppercase">{(dataset.fileType || 'unknown')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-[11px]">
                        <div className="text-right">
                          <div className="text-white font-semibold">{dataset.columns || 0}</div>
                          <div className="text-gray-500">cols</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">{(dataset.rows || 0).toLocaleString()}</div>
                          <div className="text-gray-500">rows</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {datasets.length > 5 && (
                    <div className="text-center py-2 text-[11px] text-gray-500 border-t border-gray-800 mt-2">
                      +{datasets.length - 5} more datasets
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional InfluxDB-Style Charts - Row 2 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Data Ingestion Rate - InfluxDB Cell */}
            <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors">
              <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-white">Data Ingestion Rate</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {(() => {
                          const volumeData = generateMockDataVolume();
                          const avgVolume = volumeData.reduce((sum, d) => sum + d.volume, 0) / volumeData.length;
                          return `${avgVolume.toFixed(0)}`;
                        })()}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">MB/day Avg</div>
                    </div>
                    <button className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="h-64 relative">
                  {chartsLoaded && ChartComp ? (
                    <ChartComp.Line 
                      data={{
                        labels: generateMockDataVolume().map(d => d.date),
                        datasets: [{
                          label: 'Data Volume (MB)',
                          data: generateMockDataVolume().map(d => d.volume),
                          borderColor: 'rgb(34, 211, 238)',
                          backgroundColor: 'rgba(34, 211, 238, 0.1)',
                          tension: 0.4,
                          fill: true,
                          pointRadius: 0,
                          pointHoverRadius: 4,
                          pointBackgroundColor: 'rgb(34, 211, 238)',
                          pointBorderColor: '#fff',
                          pointBorderWidth: 2,
                          borderWidth: 2
                        }]
                      }}
                      options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          legend: { display: false },
                          tooltip: {
                            ...chartOptions.plugins.tooltip,
                            backgroundColor: 'rgba(22, 27, 34, 0.95)',
                            callbacks: {
                              label: function(context: any) {
                                return `Volume: ${context.parsed.y} MB`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            grid: {
                              color: 'rgba(255, 255, 255, 0.03)',
                              drawBorder: false
                            },
                            ticks: {
                              color: 'rgba(255, 255, 255, 0.5)',
                              font: { size: 10 }
                            }
                          },
                          x: {
                            grid: { display: false },
                            ticks: {
                              color: 'rgba(255, 255, 255, 0.5)',
                              font: { size: 10 }
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Loader className="w-6 h-6 animate-spin text-cyan-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Data Quality Trend - InfluxDB Cell */}
            <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors">
              <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-white">Data Quality Trend</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400">94%</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Current Score</div>
                    </div>
                    <button className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="h-64 relative">
                  {chartsLoaded && ChartComp ? (
                    <ChartComp.Line 
                      data={{
                        labels: (() => {
                          const labels = [];
                          for (let i = 29; i >= 0; i--) {
                            const date = new Date();
                            date.setDate(date.getDate() - i);
                            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                          }
                          return labels;
                        })(),
                        datasets: [{
                          label: 'Quality Score',
                          data: (() => {
                            const scores = [];
                            let baseScore = 88;
                            for (let i = 0; i < 30; i++) {
                              baseScore += (Math.random() - 0.4) * 2;
                              baseScore = Math.min(98, Math.max(85, baseScore));
                              scores.push(Math.round(baseScore));
                            }
                            return scores;
                          })(),
                          borderColor: 'rgb(16, 185, 129)',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          tension: 0.4,
                          fill: true,
                          pointRadius: 0,
                          pointHoverRadius: 4,
                          pointBackgroundColor: 'rgb(16, 185, 129)',
                          pointBorderColor: '#fff',
                          pointBorderWidth: 2,
                          borderWidth: 2
                        }]
                      }}
                      options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          legend: { display: false },
                          tooltip: {
                            ...chartOptions.plugins.tooltip,
                            backgroundColor: 'rgba(22, 27, 34, 0.95)',
                          }
                        },
                        scales: {
                          y: {
                            min: 80,
                            max: 100,
                            grid: {
                              color: 'rgba(255, 255, 255, 0.03)',
                              drawBorder: false
                            },
                            ticks: {
                              color: 'rgba(255, 255, 255, 0.5)',
                              font: { size: 10 },
                              callback: function(value: any) {
                                return value + '%';
                              }
                            }
                          },
                          x: {
                            grid: { display: false },
                            ticks: {
                              color: 'rgba(255, 255, 255, 0.5)',
                              font: { size: 10 }
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Loader className="w-6 h-6 animate-spin text-emerald-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dataset List - InfluxDB Table Style */}
          <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-white">All Datasets</h3>
                  <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                    {filteredDatasets.length} buckets
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-gray-500" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-gray-800 border border-gray-700 text-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Types</option>
                    {fileTypes.map(type => (
                      <option key={type} value={type}>{type.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredDatasets.map((dataset) => {
              const health = calculateDatasetHealth(dataset);
              const badge = getHealthBadgeProps(health.score);
              
              return (
                <div
                  key={dataset.id}
                  className="bg-[#0d1117] hover:bg-gray-800/50 border border-gray-800 hover:border-gray-700 rounded p-4 cursor-pointer transition-all duration-200 relative"
                  onClick={() => navigate(`/app/data?dataset=${dataset.id}`)}
                >
                  {/* Health Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <div 
                      className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
                      style={{ 
                        backgroundColor: health.color + '15',
                        color: health.color
                      }}
                      title={`Health: ${health.score}/100 - ${badge.label}`}
                    >
                      <span>{badge.emoji}</span>
                      <span>{health.score}</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between mb-3 pr-14">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/30 rounded flex items-center justify-center">
                        <Database className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white hover:text-blue-400 transition-colors">{dataset.name}</h4>
                        <p className="text-[10px] text-gray-500 uppercase">{(dataset.fileType || 'unknown')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400">
                    <div>
                      <span className="font-semibold text-white">{(dataset.rows || 0).toLocaleString()}</span> rows
                    </div>
                    <div>
                      <span className="font-semibold text-white">{dataset.columns || 0}</span> cols
                    </div>
                    <div>
                      <span className="font-semibold text-white">{dataset.fileSize || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {dataset.dateUploaded ? new Date(dataset.dateUploaded).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
        </div>
      )}

      {/* Visualizations Tab */}
      {activeTab === 'visualizations' && (
        <div className="space-y-6">
          {/* Dataset Selector - InfluxDB Style */}
          <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-white">Dataset Selection</h3>
              </div>
            </div>
            <div className="p-4">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Select Dataset
              </label>
              <select
                value={selectedDatasetId || ''}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {datasets.map(dataset => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.rows?.toLocaleString()} rows, {dataset.columns} columns)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visualizations */}
          {visualizationData ? (
            <div className="space-y-6" key={selectedDatasetId}>
              {/* Numeric Columns */}
              {visualizationData.numericColumns.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Numeric Data Visualizations</h3>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {visualizationData.numericColumns.slice(0, 4).map((column: string) => {
                      const data = generateBarChartData(column);
                      return data ? (
                        <div key={`${selectedDatasetId}-${column}`} className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors">
                          <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                              <h4 className="text-sm font-semibold text-white">{column}</h4>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="h-64">
                              {chartsLoaded && ChartComp ? (
                                <ChartComp.Bar data={data} options={chartOptions} />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Loader className="w-6 h-6 animate-spin text-blue-400" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Categorical Columns */}
              {visualizationData.categoricalColumns.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Categorical Data Visualizations</h3>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {visualizationData.categoricalColumns.slice(0, 4).map((column: string) => {
                      const data = generatePieChartData(column);
                      return data ? (
                        <div key={`${selectedDatasetId}-${column}`} className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors">
                          <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                              <h4 className="text-sm font-semibold text-white">{column}</h4>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="h-64">
                              {chartsLoaded && ChartComp ? (
                                <ChartComp.Pie data={data} options={chartOptions} />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Loader className="w-6 h-6 animate-spin text-purple-400" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
              <div className="px-4 py-12">
                <div className="text-center">
                  <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <BarChart2 className="w-7 h-7 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Preview Data Available</h3>
                  <p className="text-sm text-gray-400">
                    This dataset doesn't have preview data for visualizations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Knowledge Base Tab */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          {selectedDataset ? (
            <Suspense fallback={
              <div className="bg-[#161b22] border border-gray-800 rounded-lg p-12 text-center">
                <Loader className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-400">Loading knowledge panel...</p>
              </div>
            }>
              <DatasetKnowledgePanel 
                datasetId={selectedDataset.id}
                datasetName={selectedDataset.name}
              />
            </Suspense>
          ) : (
            <div className="bg-[#161b22] border border-gray-800 rounded-lg p-12 text-center">
              <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Select a Dataset</h3>
              <p className="text-sm text-gray-400">
                Choose a dataset from the dropdown to view and manage its knowledge base.
              </p>
            </div>
          )}

          {/* Knowledge Base Guide */}
          <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-white">About Knowledge Base</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    Business Context
                  </h4>
                  <p className="text-sm text-gray-400">
                    Add context about what this data represents, its business purpose, and how it should be interpreted.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-green-400" />
                    Data Dictionary
                  </h4>
                  <p className="text-sm text-gray-400">
                    Define column meanings, data types, and business rules for each field in your dataset.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    AI Learning
                  </h4>
                  <p className="text-sm text-gray-400">
                    The AI assistant uses this knowledge to provide more accurate and contextual responses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Graph Tab - Neo4j Integration */}
      {activeTab === 'graph' && (
        <div className="space-y-6">
          <Suspense fallback={
            <div className="bg-[#161b22] border border-gray-800 rounded-lg p-12 text-center">
              <Loader className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-400">Loading knowledge graph...</p>
            </div>
          }>
            <DatasetGraphVisualization height="600px" />
          </Suspense>

          {/* Graph Insights - InfluxDB Style */}
          <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-white">About Knowledge Graphs</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">What You See:</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span><strong className="text-white">Nodes:</strong> Your uploaded datasets</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span><strong className="text-white">Edges:</strong> Relationships between datasets</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span><strong className="text-white">Size:</strong> Node size = number of rows</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Use Cases:</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>Find similar datasets automatically</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>Track data lineage and transformations</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>Discover hidden connections in your data</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Warehouse Analytics Tab */}
      {activeTab === 'warehouse' && (
        <div className="space-y-6">
          <Suspense fallback={
            <div className="bg-[#161b22] border border-gray-800 rounded-lg p-12 text-center">
              <Loader className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-400">Loading warehouse analytics...</p>
            </div>
          }>
            <WarehouseAnalyticsDashboard />
          </Suspense>
        </div>
      )}

      {/* Query Builder Modal */}
      {showQueryBuilder && selectedDataset && (
        <QueryBuilderModal
          dataset={selectedDataset}
          onClose={() => setShowQueryBuilder(false)}
        />
      )}
    </div>
  );


};  export default DatasetInsights;
