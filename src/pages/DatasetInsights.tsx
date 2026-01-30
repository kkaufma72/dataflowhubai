import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useMLContext } from '../context/MLContext';
import { Database, BarChart2, TrendingUp, Calendar, FileText, Filter, Loader, Activity, PieChart, Brain, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { calculateDatasetHealth, getHealthBadgeProps } from '../utils/datasetHealthScore';
import QueryBuilderModal from '../components/data/QueryBuilderModal';

const WarehouseAnalyticsDashboard = lazy(() => import('../components/analytics/WarehouseAnalyticsDashboard'));
const DatasetKnowledgePanel = lazy(() => import('../components/data/DatasetKnowledgePanel'));

// Dynamic import for Chart.js
let ChartComponents: any = null;
const loadCharts = async () => {
  if (!ChartComponents) {
    const [{ Bar, Pie, Line, Doughnut }, { Chart: ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler }] = await Promise.all([
      import('react-chartjs-2'),
      import('chart.js')
    ]);
    
    ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);
    
    ChartComponents = { Bar, Pie, Line, Doughnut };
  }
  return ChartComponents;
};

const DatasetInsights: React.FC = () => {
  const { datasets } = useMLContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'visualizations' | 'knowledge' | 'warehouse'>('overview');
  const [filterType, setFilterType] = useState<string>('all');
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [ChartComp, setChartComp] = useState<any>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [selectedCategoricalColumn, setSelectedCategoricalColumn] = useState<string>('');
  const [selectedNumericColumn, setSelectedNumericColumn] = useState<string>('');
  const pipelineRibbon = [
    { label: 'Ingest', route: '/app/data' },
    { label: 'Profile', route: '/app/data' },
    { label: 'Features', route: '/app/train?step=2' },
    { label: 'Train', route: '/app/train' },
    { label: 'Evaluate', route: '/app/evaluate' },
    { label: 'Deploy', route: '/app/deploy' },
    { label: 'Monitor', route: '/app/train?step=3' },
    { label: 'Insights', route: '/app/insights' },
  ];

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

  const selectedDatasetLabel = selectedDataset?.name?.trim() || 'Untitled dataset';

  type ColumnProfile = {
    name: string;
    sampleCount: number;
    nullCount: number;
    nonNullCount: number;
    completenessPct: number; // 0..100
    distinctCount: number;
    inferredType: 'numeric' | 'categorical' | 'mixed' | 'unknown';
    numeric?: { min: number; median: number; max: number; count: number };
    topCategories?: Array<{ label: string; count: number }>;
  };

  const columnProfiles = useMemo(() => {
    const cols = selectedDataset?.preview_data?.columns;
    const rows = selectedDataset?.preview_data?.rows;
    if (!cols || !rows || rows.length === 0) return null;

    const normalize = (v: any) => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      if (!s) return null;
      const lowered = s.toLowerCase();
      if (lowered === 'null' || lowered === 'none' || lowered === 'nan' || lowered === 'undefined') return null;
      return s;
    };

    const profiles: ColumnProfile[] = cols.map((colName: string, colIndex: number) => {
      const values = rows.map((r: any) => (Array.isArray(r) ? r[colIndex] : r?.[colName]));
      const normalized = values.map(normalize);
      const sampleCount = normalized.length;
      const nonNullValues = normalized.filter((v) => v !== null) as string[];
      const nonNullCount = nonNullValues.length;
      const nullCount = sampleCount - nonNullCount;
      const completenessPct = sampleCount > 0 ? (nonNullCount / sampleCount) * 100 : 0;

      const distinctSet = new Set(nonNullValues.map((v) => v));
      const distinctCount = distinctSet.size;

      const numericParsed = nonNullValues
        .map((v) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : NaN;
        })
        .filter((n) => Number.isFinite(n));
      const numericRatio = nonNullCount > 0 ? numericParsed.length / nonNullCount : 0;

      const isNumeric = numericParsed.length > 0 && numericRatio >= 0.6;
      const isCategorical = nonNullCount > 0 && !isNumeric;

      let inferredType: ColumnProfile['inferredType'] = 'unknown';
      if (isNumeric) inferredType = 'numeric';
      else if (isCategorical) inferredType = 'categorical';
      else if (nonNullCount > 0) inferredType = 'mixed';

      const profile: ColumnProfile = {
        name: colName,
        sampleCount,
        nullCount,
        nonNullCount,
        completenessPct,
        distinctCount,
        inferredType,
      };

      if (isNumeric) {
        const sorted = [...numericParsed].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
        profile.numeric = { min: sorted[0], median, max: sorted[sorted.length - 1], count: sorted.length };
      } else if (isCategorical) {
        const counts: Record<string, number> = {};
        nonNullValues.forEach((v) => {
          const key = v.length > 60 ? `${v.slice(0, 57)}…` : v;
          counts[key] = (counts[key] || 0) + 1;
        });
        profile.topCategories = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([label, count]) => ({ label, count }));
      }

      return profile;
    });

    return profiles;
  }, [selectedDatasetId, selectedDataset?.preview_data]);

  const numericColumns = useMemo(
    () => (columnProfiles ? columnProfiles.filter((c) => c.inferredType === 'numeric').map((c) => c.name) : []),
    [columnProfiles]
  );
  const categoricalColumns = useMemo(
    () => (columnProfiles ? columnProfiles.filter((c) => c.inferredType === 'categorical').map((c) => c.name) : []),
    [columnProfiles]
  );

  useEffect(() => {
    // Reset or update column selections when dataset or available columns change
    const catColValid = selectedCategoricalColumn && categoricalColumns.includes(selectedCategoricalColumn);
    const numColValid = selectedNumericColumn && numericColumns.includes(selectedNumericColumn);
    
    if (!catColValid && categoricalColumns.length > 0) {
      setSelectedCategoricalColumn(categoricalColumns[0]);
    } else if (!categoricalColumns.length) {
      setSelectedCategoricalColumn('');
    }
    
    if (!numColValid && numericColumns.length > 0) {
      setSelectedNumericColumn(numericColumns[0]);
    } else if (!numericColumns.length) {
      setSelectedNumericColumn('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDatasetId, categoricalColumns.join('|'), numericColumns.join('|')]);

  const completenessChartData = useMemo(() => {
    if (!columnProfiles) return null;
    const top = [...columnProfiles]
      .sort((a, b) => a.completenessPct - b.completenessPct)
      .slice(0, 12);
    return {
      labels: top.map((c) => c.name),
      datasets: [
        {
          label: 'Completeness %',
          data: top.map((c) => Math.round(c.completenessPct)),
          backgroundColor: (context: any) => {
            const value = context.raw || 0;
            // Gradient from red (low) to green (high)
            if (value >= 90) return 'rgba(16, 185, 129, 0.7)';
            if (value >= 70) return 'rgba(34, 197, 94, 0.6)';
            if (value >= 50) return 'rgba(250, 204, 21, 0.6)';
            if (value >= 30) return 'rgba(251, 146, 60, 0.6)';
            return 'rgba(239, 68, 68, 0.6)';
          },
          borderColor: (context: any) => {
            const value = context.raw || 0;
            if (value >= 90) return 'rgb(16, 185, 129)';
            if (value >= 70) return 'rgb(34, 197, 94)';
            if (value >= 50) return 'rgb(250, 204, 21)';
            if (value >= 30) return 'rgb(251, 146, 60)';
            return 'rgb(239, 68, 68)';
          },
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
          hoverBorderWidth: 3,
        },
      ],
    };
  }, [columnProfiles]);

  const selectedCategoryProfile = useMemo(() => {
    if (!columnProfiles || !selectedCategoricalColumn) return null;
    return columnProfiles.find((c) => c.name === selectedCategoricalColumn) || null;
  }, [columnProfiles, selectedCategoricalColumn]);

  const topCategoryChartData = useMemo(() => {
    const cats = selectedCategoryProfile?.topCategories;
    if (!cats || cats.length === 0) return null;
    // Premium gradient colors
    const colors = [
      'rgba(99, 102, 241, 0.75)',   // Indigo
      'rgba(168, 85, 247, 0.75)',   // Purple
      'rgba(236, 72, 153, 0.75)',   // Pink
      'rgba(14, 165, 233, 0.75)',   // Sky
      'rgba(34, 197, 94, 0.75)',    // Green
      'rgba(251, 146, 60, 0.75)',   // Orange
      'rgba(250, 204, 21, 0.75)',   // Yellow
      'rgba(239, 68, 68, 0.75)',    // Red
    ];
    const borderColors = [
      'rgb(99, 102, 241)',
      'rgb(168, 85, 247)',
      'rgb(236, 72, 153)',
      'rgb(14, 165, 233)',
      'rgb(34, 197, 94)',
      'rgb(251, 146, 60)',
      'rgb(250, 204, 21)',
      'rgb(239, 68, 68)',
    ];
    return {
      labels: cats.map((c) => c.label),
      datasets: [
        {
          label: selectedCategoricalColumn,
          data: cats.map((c) => c.count),
          backgroundColor: colors.slice(0, cats.length),
          borderColor: borderColors.slice(0, cats.length),
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 8,
        },
      ],
    };
  }, [selectedCategoryProfile, selectedCategoricalColumn]);

  const selectedNumericProfile = useMemo(() => {
    if (!columnProfiles || !selectedNumericColumn) return null;
    const p = columnProfiles.find((c) => c.name === selectedNumericColumn) || null;
    return p?.numeric ? p : null;
  }, [columnProfiles, selectedNumericColumn]);

  const numericBandChartData = useMemo(() => {
    const n = selectedNumericProfile?.numeric;
    if (!n) return null;
    return {
      labels: ['Min', 'Median', 'Max'],
      datasets: [
        {
          label: selectedNumericColumn,
          data: [n.min, n.median, n.max],
          backgroundColor: [
            'rgba(59, 130, 246, 0.65)',  // Blue
            'rgba(168, 85, 247, 0.65)',  // Purple  
            'rgba(16, 185, 129, 0.65)'   // Emerald
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(168, 85, 247)',
            'rgb(16, 185, 129)'
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          hoverBorderWidth: 3,
        },
      ],
    };
  }, [selectedNumericProfile, selectedNumericColumn]);

  // Filter datasets by type
  const filteredDatasets = useMemo(() => {
    if (filterType === 'all') return datasets;
    return datasets.filter(d => d.fileType?.toLowerCase() === filterType.toLowerCase());
  }, [datasets, filterType]);

  const formatRelativeTime = (iso?: string) => {
    if (!iso) return 'unknown';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return 'unknown';
    const diffMs = Date.now() - then;
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  const datasetStats = useMemo(() => {
    if (!selectedDataset) return null;
    const qualityScore = selectedDataset.quality?.score;
    const nulls = selectedDataset.preview_data?.rows?.length
      ? selectedDataset.preview_data.columns.map((col, idx) => {
          let nullCount = 0;
          selectedDataset.preview_data?.rows?.forEach((row: any) => {
            const value = Array.isArray(row) ? row[idx] : row[col];
            if (value === null || value === undefined || value === '') nullCount += 1;
          });
          return { col, nullPct: selectedDataset.preview_data!.rows.length ? (nullCount / selectedDataset.preview_data!.rows.length) * 100 : 0 };
        })
      : [];
    const topNull = nulls.length ? [...nulls].sort((a, b) => b.nullPct - a.nullPct)[0] : null;
    return {
      rows: selectedDataset.rows || 0,
      columns: selectedDataset.columns || 0,
      fileType: selectedDataset.fileType || 'Unknown',
      fileSize: selectedDataset.fileSize || 'N/A',
      uploaded: selectedDataset.dateUploaded,
      qualityScore,
      topNull,
    };
  }, [selectedDataset]);

  const firstNumericColumn = useMemo(() => {
    if (!selectedDataset?.preview_data?.columns || !selectedDataset.preview_data.rows?.length) return null;
    const { columns, rows } = selectedDataset.preview_data;
    return columns.find((col, idx) => {
      const sampleValues = rows.slice(0, 12).map((row: any) => (Array.isArray(row) ? row[idx] : row[col]));
      return sampleValues.some((val) => !Number.isNaN(parseFloat(val)));
    }) || null;
  }, [selectedDataset]);

  const firstCategoricalColumn = useMemo(() => {
    if (!selectedDataset?.preview_data?.columns || !selectedDataset.preview_data.rows?.length) return null;
    const { columns, rows } = selectedDataset.preview_data;
    return columns.find((col, idx) => {
      const sampleValues = rows.slice(0, 12).map((row: any) => (Array.isArray(row) ? row[idx] : row[col]));
      return sampleValues.every((val) => typeof val === 'string' || val === null || val === undefined);
    }) || null;
  }, [selectedDataset]);

  const numericDistributionData = useMemo(() => {
    if (!firstNumericColumn || !selectedDataset?.preview_data) return null;
    const { columns, rows } = selectedDataset.preview_data;
    const colIndex = columns.indexOf(firstNumericColumn);
    const values = rows
      .map((row: any) => (Array.isArray(row) ? row[colIndex] : row[firstNumericColumn]))
      .map((v: any) => parseFloat(v))
      .filter((v) => !Number.isNaN(v));
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const bins = 8;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const binSize = (max - min || 1) / bins;
    const counts = Array.from({ length: bins }, () => 0);
    sorted.forEach((v) => {
      const idx = Math.min(bins - 1, Math.floor((v - min) / binSize));
      counts[idx] += 1;
    });
    const labels = counts.map((_, idx) => {
      const start = min + idx * binSize;
      const end = start + binSize;
      return `${start.toFixed(1)} - ${end.toFixed(1)}`;
    });
    return {
      labels,
      datasets: [{
        label: firstNumericColumn,
        data: counts,
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(99, 102, 241, 0.8)',
        hoverBorderWidth: 3,
      }]
    };
  }, [firstNumericColumn, selectedDataset]);

  const categoricalDistributionData = useMemo(() => {
    if (!firstCategoricalColumn || !selectedDataset?.preview_data) return null;
    const { columns, rows } = selectedDataset.preview_data;
    const colIndex = columns.indexOf(firstCategoricalColumn);
    const counts: Record<string, number> = {};
    rows.forEach((row: any) => {
      const value = Array.isArray(row) ? row[colIndex] : row[firstCategoricalColumn];
      const key = value === null || value === undefined || value === '' ? 'Unknown' : String(value);
      counts[key] = (counts[key] || 0) + 1;
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (!entries.length) return null;
    // Premium gradient colors for pie/doughnut
    const colors = [
      'rgba(99, 102, 241, 0.8)',   // Indigo
      'rgba(16, 185, 129, 0.8)',   // Emerald
      'rgba(236, 72, 153, 0.8)',   // Pink
      'rgba(251, 146, 60, 0.8)',   // Orange
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(168, 85, 247, 0.8)',   // Purple
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(14, 165, 233, 0.8)',   // Sky
    ];
    const borderColors = [
      'rgb(99, 102, 241)',
      'rgb(16, 185, 129)',
      'rgb(236, 72, 153)',
      'rgb(251, 146, 60)',
      'rgb(59, 130, 246)',
      'rgb(168, 85, 247)',
      'rgb(239, 68, 68)',
      'rgb(14, 165, 233)',
    ];
    return {
      labels: entries.map(([k]) => k),
      datasets: [{
        label: firstCategoricalColumn,
        data: entries.map(([, v]) => v),
        backgroundColor: colors.slice(0, entries.length),
        borderColor: borderColors.slice(0, entries.length),
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 10,
      }]
    };
  }, [firstCategoricalColumn, selectedDataset]);

  const previewDistributionData = useMemo(
    () => ({
      numeric: numericDistributionData,
      categorical: categoricalDistributionData,
    }),
    [numericDistributionData, categoricalDistributionData]
  );

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

  const parseFileSizeMB = (sizeStr: string | undefined) => {
    const s = (sizeStr || '0 KB').trim().toUpperCase();
    const n = Number.parseFloat(s);
    if (!Number.isFinite(n)) return 0;
    if (s.includes('GB')) return n * 1024;
    if (s.includes('MB')) return n;
    if (s.includes('KB')) return n / 1024;
    return n;
  };

  const formatDayLabel = (d: Date) =>
    d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });


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

  // Generate histogram for numeric column (distribution chart)
  const generateHistogramData = (column: string) => {
    if (!visualizationData) return null;

    const colIndex = visualizationData.columns.indexOf(column);
    const rawValues = visualizationData.rows
      .map((row: any) => {
        const value = Array.isArray(row) ? row[colIndex] : row[column];
        return parseFloat(value);
      })
      .filter((v: number) => !isNaN(v) && isFinite(v));

    if (rawValues.length === 0) return null;

    // Create histogram bins
    const min = Math.min(...rawValues);
    const max = Math.max(...rawValues);
    const binCount = Math.min(10, Math.ceil(Math.sqrt(rawValues.length)));
    const binSize = (max - min) / binCount || 1;
    
    const bins: number[] = Array(binCount).fill(0);
    rawValues.forEach((v: number) => {
      const binIndex = Math.min(binCount - 1, Math.floor((v - min) / binSize));
      bins[binIndex]++;
    });

    const labels = bins.map((_, idx) => {
      const start = min + idx * binSize;
      const end = start + binSize;
      return `${start.toFixed(1)}-${end.toFixed(1)}`;
    });

    // Calculate stats for display
    const mean = rawValues.reduce((a: number, b: number) => a + b, 0) / rawValues.length;
    const sortedVals = [...rawValues].sort((a, b) => a - b);
    const median = sortedVals[Math.floor(sortedVals.length / 2)];

    return {
      chartData: {
        labels,
        datasets: [{
          label: `Distribution of ${column}`,
          data: bins,
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 2,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(99, 102, 241, 0.85)',
        }]
      },
      stats: {
        min: min.toFixed(2),
        max: max.toFixed(2),
        mean: mean.toFixed(2),
        median: median.toFixed(2),
        count: rawValues.length
      }
    };
  };

  // Generate doughnut chart for categorical column
  const generateDoughnutChartData = (column: string) => {
    if (!visualizationData) return null;

    const colIndex = visualizationData.columns.indexOf(column);
    const valueCounts: Record<string, number> = {};
    let totalCount = 0;
    
    visualizationData.rows.forEach((row: any) => {
      const value = Array.isArray(row) ? row[colIndex] : row[column];
      if (value !== null && value !== undefined && value !== '') {
        const key = String(value).length > 20 ? String(value).slice(0, 17) + '...' : String(value);
        valueCounts[key] = (valueCounts[key] || 0) + 1;
        totalCount++;
      }
    });

    const sortedEntries = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    if (sortedEntries.length === 0) return null;

    // Premium gradient colors
    const colors = [
      'rgba(99, 102, 241, 0.85)',   // Indigo
      'rgba(168, 85, 247, 0.85)',   // Purple
      'rgba(236, 72, 153, 0.85)',   // Pink
      'rgba(14, 165, 233, 0.85)',   // Sky
      'rgba(34, 197, 94, 0.85)',    // Green
      'rgba(251, 146, 60, 0.85)',   // Orange
    ];
    const borderColors = [
      'rgb(99, 102, 241)',
      'rgb(168, 85, 247)',
      'rgb(236, 72, 153)',
      'rgb(14, 165, 233)',
      'rgb(34, 197, 94)',
      'rgb(251, 146, 60)',
    ];

    return {
      chartData: {
        labels: sortedEntries.map(([key]) => key),
        datasets: [{
          data: sortedEntries.map(([, count]) => count),
          backgroundColor: colors.slice(0, sortedEntries.length),
          borderColor: borderColors.slice(0, sortedEntries.length),
          borderWidth: 2,
          hoverOffset: 8,
        }]
      },
      stats: {
        uniqueValues: Object.keys(valueCounts).length,
        topValue: sortedEntries[0]?.[0] || 'N/A',
        topPercent: totalCount > 0 ? ((sortedEntries[0]?.[1] || 0) / totalCount * 100).toFixed(1) : '0',
        totalCount
      }
    };
  };

  // Enhanced chart options with premium styling
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750,
      easing: 'easeOutQuart' as const,
    },
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
          color: 'rgba(255, 255, 255, 0.85)',
          font: {
            size: 11,
            family: "'Inter', sans-serif",
            weight: '500'
          },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 6,
          boxHeight: 6,
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#fff',
        titleFont: {
          size: 13,
          weight: '600',
          family: "'Inter', sans-serif"
        },
        bodyColor: 'rgba(255, 255, 255, 0.85)',
        bodyFont: {
          size: 12,
          family: "'Inter', sans-serif"
        },
        borderColor: 'rgba(99, 102, 241, 0.4)',
        borderWidth: 1,
        padding: { top: 10, bottom: 10, left: 14, right: 14 },
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 6,
        caretSize: 6,
        caretPadding: 10,
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
          color: 'rgba(255, 255, 255, 0.04)',
          drawBorder: false,
          lineWidth: 1,
        },
        border: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.55)',
          font: {
            size: 10,
            family: "'Inter', sans-serif",
            weight: '400'
          },
          padding: 8,
          maxRotation: 45,
          minRotation: 0,
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.04)',
          drawBorder: false,
          lineWidth: 1,
        },
        border: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.55)',
          font: {
            size: 10,
            family: "'Inter', sans-serif",
            weight: '400'
          },
          padding: 8,
        },
        beginAtZero: true,
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
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 hover:text-blue-400 cursor-pointer transition-colors" onClick={() => navigate('/app')}>Home</span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-500 hover:text-blue-400 cursor-pointer transition-colors" onClick={() => navigate('/app/data')}>Data</span>
          <span className="text-gray-600">/</span>
          <span className="text-white font-medium">Insights</span>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">Dataset Insights</h1>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Live</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Using <span className="text-white font-semibold">{selectedDatasetLabel}</span>
              {selectedDataset?.dateUploaded && (
                <> • Updated {formatRelativeTime(selectedDataset.dateUploaded)}</>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {pipelineRibbon.map((step) => (
                <button
                  key={step.label}
                  onClick={() => navigate(step.route)}
                  className={`text-xs px-3 py-1 rounded-full border transition ${
                    step.label === 'Insights'
                      ? 'border-blue-500 text-blue-300 bg-blue-500/10'
                      : 'border-white/10 text-gray-300 hover:border-blue-400 hover:text-blue-200'
                  }`}
                  aria-label={`Go to ${step.label}`}
                >
                  {step.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
              <label htmlFor="dataset-select" className="text-xs text-gray-400">Dataset</label>
              <select
                id="dataset-select"
                value={selectedDatasetId || ''}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none"
              >
                {datasets.map((ds) => (
                  <option key={ds.id} value={ds.id} className="bg-gray-900 text-white">
                    {ds.name}
                  </option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => setShowQueryBuilder(true)}
              disabled={!selectedDataset}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-md flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Query
            </button>
            <button
              onClick={() =>
                selectedDataset &&
                navigate(`/app/train?datasetId=${encodeURIComponent(selectedDataset.id)}`)
              }
              disabled={!selectedDataset}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Train
            </button>
            <button onClick={() => navigate('/app/data')} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-all">
              Data Explorer
            </button>
          </div>
        </div>

        {datasetStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4">
              <p className="text-xs uppercase text-gray-500 tracking-wide mb-1">Rows</p>
              <p className="text-xl font-semibold text-white">{datasetStats.rows.toLocaleString()}</p>
            </div>
            <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4">
              <p className="text-xs uppercase text-gray-500 tracking-wide mb-1">Columns</p>
              <p className="text-xl font-semibold text-white">{datasetStats.columns}</p>
            </div>
            <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4">
              <p className="text-xs uppercase text-gray-500 tracking-wide mb-1">Format / Size</p>
              <p className="text-sm font-semibold text-white">{datasetStats.fileType} • {datasetStats.fileSize}</p>
            </div>
            <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4">
              <p className="text-xs uppercase text-gray-500 tracking-wide mb-1">Data Quality</p>
              <p className="text-sm font-semibold text-white">
                {datasetStats.qualityScore !== undefined ? `${datasetStats.qualityScore}/100` : 'N/A'}
              </p>
              {datasetStats.topNull && (
                <p className="text-xs text-gray-400 mt-1">Most nulls: {datasetStats.topNull.col} ({datasetStats.topNull.nullPct.toFixed(1)}%)</p>
              )}
            </div>
          </div>
        )}
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
          {/* Dataset Profile (preview-driven) */}
          <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-white truncate">Dataset Profile</h3>
                  <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded truncate max-w-[260px]">
                    {selectedDatasetLabel}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{columnProfiles ? columnProfiles.length : 0}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Profiled cols</div>
                  </div>
                  <button className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-400" aria-label="Dataset profile actions">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              {!selectedDataset?.preview_data || !columnProfiles ? (
                <div className="bg-[#0d1117] border border-gray-800 rounded p-4 text-sm text-gray-400">
                  No preview sample available for this dataset. Import a dataset with preview rows to see column completeness, distinct counts, and distributions.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 pb-4 border-b border-gray-800">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Rows sampled</div>
                      <div className="text-2xl font-bold text-white">{selectedDataset.preview_data.rows.length.toLocaleString()}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Avg completeness</div>
                      <div className="text-2xl font-bold text-emerald-400">
                        {Math.round(
                          columnProfiles.reduce((sum, c) => sum + c.completenessPct, 0) / Math.max(1, columnProfiles.length)
                        )}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Numeric / Categorical</div>
                      <div className="text-2xl font-bold text-white">
                        {numericColumns.length} / {categoricalColumns.length}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-400">Lowest completeness (sample)</div>
                      </div>
                      <div className="h-64">
                        {chartsLoaded && ChartComp && completenessChartData ? (
                          <ChartComp.Bar
                            key={`completeness-bar-${selectedDatasetId}`}
                            redraw={true}
                            data={completenessChartData}
                            options={{
                              ...chartOptions,
                              plugins: { ...chartOptions.plugins, legend: { display: false } },
                              scales: {
                                x: {
                                  ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 10 } },
                                  grid: { display: false },
                                },
                                y: {
                                  min: 0,
                                  max: 100,
                                  ticks: {
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    font: { size: 10 },
                                    callback: (v: any) => `${v}%`,
                                  },
                                  grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
                                },
                              },
                            }}
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <Loader className="w-6 h-6 animate-spin text-cyan-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-400">Top categories</div>
                        <select
                          value={selectedCategoricalColumn}
                          onChange={(e) => setSelectedCategoricalColumn(e.target.value)}
                          disabled={categoricalColumns.length === 0}
                          className="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        >
                          {categoricalColumns.length === 0 ? (
                            <option value="">No categorical columns</option>
                          ) : (
                            categoricalColumns.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div className="h-64">
                        {chartsLoaded && ChartComp && topCategoryChartData ? (
                          <ChartComp.Doughnut
                            key={`top-category-doughnut-${selectedDatasetId}-${selectedCategoricalColumn}`}
                            redraw={true}
                            data={topCategoryChartData}
                            options={{
                              ...chartOptions,
                              plugins: {
                                ...chartOptions.plugins,
                                legend: {
                                  display: true,
                                  position: 'right' as const,
                                  labels: { color: 'rgba(255,255,255,0.7)', font: { size: 10 }, boxWidth: 10 },
                                },
                              },
                            }}
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-gray-500 border border-gray-800 rounded bg-[#0d1117]">
                            {categoricalColumns.length === 0 ? 'No categorical columns in preview sample.' : 'Loading chart…'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-400">Numeric range (min / median / max)</div>
                      <select
                        value={selectedNumericColumn}
                        onChange={(e) => setSelectedNumericColumn(e.target.value)}
                        disabled={numericColumns.length === 0}
                        className="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
                      >
                        {numericColumns.length === 0 ? (
                          <option value="">No numeric columns</option>
                        ) : (
                          numericColumns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <div className="h-56">
                      {chartsLoaded && ChartComp && numericBandChartData ? (
                        <ChartComp.Bar
                          key={`numeric-band-${selectedDatasetId}-${selectedNumericColumn}`}
                          redraw={true}
                          data={numericBandChartData}
                          options={{
                            ...chartOptions,
                            plugins: { ...chartOptions.plugins, legend: { display: false } },
                            scales: {
                              x: {
                                ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 10 } },
                                grid: { display: false },
                              },
                              y: {
                                ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } },
                                grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
                              },
                            },
                          }}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-gray-500 border border-gray-800 rounded bg-[#0d1117]">
                          {numericColumns.length === 0 ? 'No numeric columns in preview sample.' : 'Loading chart…'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
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

          {/* Time Range & Controls Bar - TimescaleDB Query Style */}
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

          {/* Charts Grid - TimescaleDB Cell Style */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Numeric Distribution */}
            <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors">
              <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-white">Numeric Distribution</h3>
                  </div>
                  <span className="text-xs text-gray-400 truncate max-w-[200px]">{firstNumericColumn || 'No numeric column detected'}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="h-64 relative">
                  {chartsLoaded && ChartComp && numericDistributionData ? (
                    <ChartComp.Bar
                      key={`preview-numeric-dist-${selectedDatasetId}`}
                      redraw={true}
                      data={previewDistributionData.numeric} options={{
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
                          grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                          ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 10 } }
                        },
                        x: {
                          ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 9 }, maxRotation: 0, minRotation: 0 },
                          grid: { display: false }
                        }
                      }
                    }} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-gray-500 border border-dashed border-gray-800 rounded">
                      {firstNumericColumn ? 'Loading…' : 'No numeric columns in preview.'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Categorical distribution */}
            <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors">
              <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-white">Top Categories</h3>
                  </div>
                  <span className="text-xs text-gray-400 truncate max-w-[200px]">{firstCategoricalColumn || 'No categorical column detected'}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="h-64">
                  {chartsLoaded && ChartComp && categoricalDistributionData ? (
                    <ChartComp.Pie
                      key={`preview-cat-pie-${selectedDatasetId}`}
                      redraw={true}
                      data={previewDistributionData.categorical} options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          display: true,
                          position: 'right' as const,
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
                    <div className="flex items-center justify-center h-full text-sm text-gray-500 border border-dashed border-gray-800 rounded">
                      {firstCategoricalColumn ? 'Loading…' : 'No categorical columns in preview.'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column Completeness */}
            <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors">
              <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-white">Column Completeness</h3>
                  </div>
                  <div className="flex items-center gap-3">
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
                  {chartsLoaded && ChartComp && completenessChartData ? (
                    <ChartComp.Bar
                      key={`completeness-chart-2-${selectedDatasetId}`}
                      redraw={true}
                      data={completenessChartData} options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: { display: false },
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            label: (ctx: any) => `${ctx.parsed.y.toFixed(1)}% complete`
                          }
                        }
                      },
                      scales: {
                        y: {
                          min: 0,
                          max: 100,
                          grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
                          ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 10 }, callback: (v: any) => `${v}%` }
                        },
                        x: {
                          grid: { display: false },
                          ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 10 } }
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

            {/* Schema Snapshot */}
            <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors">
              <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-white">Schema Snapshot</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{selectedDataset?.columns || 0}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Columns</div>
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
                  {selectedDataset?.preview_data?.columns?.length ? (
                    selectedDataset.preview_data.columns.slice(0, 12).map((col, idx) => {
                      const profile = columnProfiles?.find((c) => c.name === col);
                      return (
                        <div key={col} className="group flex items-center justify-between p-3 bg-[#0d1117] hover:bg-gray-800/50 rounded border border-gray-800 hover:border-gray-700 transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-orange-500/10 flex items-center justify-center border border-orange-500/30">
                              <span className="text-[10px] font-bold text-orange-400">{idx + 1}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-white block group-hover:text-blue-400 transition-colors">{col}</span>
                              <span className="text-[10px] text-gray-500 uppercase">{profile?.inferredType || 'unknown'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-[11px]">
                            <div className="text-right">
                              <div className="text-white font-semibold">
                                {profile ? `${profile.completenessPct.toFixed(0)}%` : '—'}
                              </div>
                              <div className="text-gray-500">complete</div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-semibold">
                                {profile?.distinctCount ?? '—'}
                              </div>
                              <div className="text-gray-500">distinct</div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-800 rounded">
                      No schema preview available for this dataset.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional TimescaleDB-Style Charts - Row 2 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Data Ingestion Rate - TimescaleDB Cell */}
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
                          const last30Days: string[] = [];
                          for (let i = 29; i >= 0; i--) {
                            const d = new Date();
                            d.setDate(d.getDate() - i);
                            last30Days.push(formatDayLabel(d));
                          }
                          const mbByDay: Record<string, number> = {};
                          last30Days.forEach((label) => (mbByDay[label] = 0));
                          datasets.forEach((dataset) => {
                            if (!dataset.dateUploaded) return;
                            const parsed = new Date(dataset.dateUploaded);
                            if (Number.isNaN(parsed.getTime())) return;
                            const label = formatDayLabel(parsed);
                            if (Object.prototype.hasOwnProperty.call(mbByDay, label)) {
                              mbByDay[label] += parseFileSizeMB(dataset.fileSize);
                            }
                          });
                          const values = last30Days.map((label) => mbByDay[label] || 0);
                          const avg = values.reduce((s, v) => s + v, 0) / Math.max(1, values.length);
                          return `${avg.toFixed(0)}`;
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
                      key={`uploads-line-${selectedDatasetId}`}
                      redraw={true}
                      data={(() => {
                        const last30Days: string[] = [];
                        for (let i = 29; i >= 0; i--) {
                          const d = new Date();
                          d.setDate(d.getDate() - i);
                          last30Days.push(formatDayLabel(d));
                        }
                        const mbByDay: Record<string, number> = {};
                        last30Days.forEach((label) => (mbByDay[label] = 0));
                        datasets.forEach((dataset) => {
                          if (!dataset.dateUploaded) return;
                          const parsed = new Date(dataset.dateUploaded);
                          if (Number.isNaN(parsed.getTime())) return;
                          const label = formatDayLabel(parsed);
                          if (Object.prototype.hasOwnProperty.call(mbByDay, label)) {
                            mbByDay[label] += parseFileSizeMB(dataset.fileSize);
                          }
                        });
                        return {
                          labels: last30Days,
                          datasets: [
                            {
                              label: 'Ingested (MB)',
                              data: last30Days.map((label) => Math.round(mbByDay[label] || 0)),
                              borderColor: 'rgb(34, 211, 238)',
                              backgroundColor: 'rgba(34, 211, 238, 0.1)',
                              tension: 0.4,
                              fill: true,
                              pointRadius: 0,
                              pointHoverRadius: 4,
                              pointBackgroundColor: 'rgb(34, 211, 238)',
                              pointBorderColor: '#fff',
                              pointBorderWidth: 2,
                              borderWidth: 2,
                            },
                          ],
                        };
                      })()}
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
                                return `Ingested: ${context.parsed.y} MB`;
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

          </div>

          {/* Dataset List - TimescaleDB Table Style */}
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
          {/* Dataset Selector */}
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
            <div className="space-y-8" key={selectedDatasetId}>
              {/* Numeric Column Distributions */}
              {visualizationData.numericColumns.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center">
                      <BarChart2 className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Numeric Distributions</h3>
                      <p className="text-xs text-gray-500">Histogram analysis of numeric columns</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {visualizationData.numericColumns.slice(0, 6).map((column: string) => {
                      const result = generateHistogramData(column);
                      if (!result) return null;
                      const { chartData, stats } = result;
                      return (
                        <div key={`${selectedDatasetId}-hist-${column}`} className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden hover:border-blue-500/30 transition-colors">
                          <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                                <h4 className="text-sm font-semibold text-white">{column}</h4>
                              </div>
                              <span className="text-xs text-gray-500">{stats.count} values</span>
                            </div>
                          </div>
                          <div className="p-4">
                            {/* Stats row */}
                            <div className="grid grid-cols-4 gap-2 mb-4">
                              <div className="bg-gray-800/50 rounded px-2 py-1.5 text-center">
                                <div className="text-[10px] text-gray-500 uppercase">Min</div>
                                <div className="text-xs font-medium text-gray-300">{stats.min}</div>
                              </div>
                              <div className="bg-gray-800/50 rounded px-2 py-1.5 text-center">
                                <div className="text-[10px] text-gray-500 uppercase">Max</div>
                                <div className="text-xs font-medium text-gray-300">{stats.max}</div>
                              </div>
                              <div className="bg-gray-800/50 rounded px-2 py-1.5 text-center">
                                <div className="text-[10px] text-gray-500 uppercase">Mean</div>
                                <div className="text-xs font-medium text-blue-400">{stats.mean}</div>
                              </div>
                              <div className="bg-gray-800/50 rounded px-2 py-1.5 text-center">
                                <div className="text-[10px] text-gray-500 uppercase">Median</div>
                                <div className="text-xs font-medium text-purple-400">{stats.median}</div>
                              </div>
                            </div>
                            <div className="h-48">
                              {chartsLoaded && ChartComp ? (
                                <ChartComp.Bar
                                  key={`hist-${selectedDatasetId}-${column}`}
                                  redraw={true}
                                  data={chartData} options={{
                                  ...chartOptions,
                                  plugins: { ...chartOptions.plugins, legend: { display: false } }
                                }} />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Loader className="w-6 h-6 animate-spin text-blue-400" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Categorical Column Distributions */}
              {visualizationData.categoricalColumns.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-center">
                      <PieChart className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Category Distributions</h3>
                      <p className="text-xs text-gray-500">Value distribution for categorical columns</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                    {visualizationData.categoricalColumns.slice(0, 6).map((column: string) => {
                      const result = generateDoughnutChartData(column);
                      if (!result) return null;
                      const { chartData, stats } = result;
                      return (
                        <div key={`${selectedDatasetId}-cat-${column}`} className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden hover:border-purple-500/30 transition-colors">
                          <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                                <h4 className="text-sm font-semibold text-white">{column}</h4>
                              </div>
                              <span className="text-xs text-gray-500">{stats.uniqueValues} unique</span>
                            </div>
                          </div>
                          <div className="p-4">
                            {/* Stats row */}
                            <div className="flex items-center justify-between mb-3 px-1">
                              <div>
                                <div className="text-[10px] text-gray-500 uppercase">Top Value</div>
                                <div className="text-xs font-medium text-white">{stats.topValue}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] text-gray-500 uppercase">Frequency</div>
                                <div className="text-xs font-medium text-purple-400">{stats.topPercent}%</div>
                              </div>
                            </div>
                            <div className="h-44">
                              {chartsLoaded && ChartComp && ChartComp.Doughnut ? (
                                <ChartComp.Doughnut
                                  key={`cat-doughnut-${selectedDatasetId}-${column}`}
                                  redraw={true}
                                  data={chartData} options={{
                                  ...chartOptions,
                                  cutout: '55%',
                                  plugins: { 
                                    ...chartOptions.plugins, 
                                    legend: { 
                                      display: true,
                                      position: 'right' as const,
                                      labels: {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        font: { size: 10, family: "'Inter', sans-serif" },
                                        padding: 8,
                                        boxWidth: 8,
                                        boxHeight: 8,
                                        usePointStyle: true,
                                      }
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
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state for no columns */}
              {visualizationData.numericColumns.length === 0 && visualizationData.categoricalColumns.length === 0 && (
                <div className="bg-[#161b22] border border-gray-800 rounded-lg p-12 text-center">
                  <div className="w-14 h-14 bg-gray-500/10 border border-gray-500/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <BarChart2 className="w-7 h-7 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Visualizable Columns</h3>
                  <p className="text-sm text-gray-400">
                    This dataset doesn't have numeric or categorical columns suitable for visualization.
                  </p>
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
                dataset={selectedDataset}
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
