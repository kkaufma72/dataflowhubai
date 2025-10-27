import React, { useState, useMemo, useEffect } from 'react';
import { useMLContext } from '../context/MLContext';
import Card from '../components/common/Card';
import { Database, BarChart2, TrendingUp, Calendar, FileText, Filter, Loader, Activity, PieChart } from 'lucide-react';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { calculateDatasetHealth, getHealthBadgeProps } from '../utils/datasetHealthScore';

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

const DatasetInsights: React.FC = () => {
  const { datasets } = useMLContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'visualizations'>('overview');
  const [filterType, setFilterType] = useState<string>('all');
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [ChartComp, setChartComp] = useState<any>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

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

  // Dataset uploads over time chart
  const uploadsOverTimeData = useMemo(() => {
    const uploadsByDate: { [key: string]: number } = {};
    
    datasets.forEach(dataset => {
      try {
        const dateStr = dataset.dateUploaded || new Date().toISOString();
        const date = new Date(dateStr).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        uploadsByDate[date] = (uploadsByDate[date] || 0) + 1;
      } catch (e) {
        console.warn('Invalid date for dataset:', dataset.id);
      }
    });

    const sortedDates = Object.keys(uploadsByDate).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    return {
      labels: sortedDates.length > 0 ? sortedDates : ['No Data'],
      datasets: [{
        label: 'Dataset Uploads',
        data: sortedDates.length > 0 ? sortedDates.map(date => uploadsByDate[date]) : [0],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  }, [datasets]);

  // File type distribution chart
  const fileTypeDistributionData = useMemo(() => {
    const typeCounts: { [key: string]: number } = {};
    
    datasets.forEach(dataset => {
      const type = dataset.fileType || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const colors = [
      'rgba(99, 102, 241, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(251, 146, 60, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(239, 68, 68, 0.8)'
    ];

    return {
      labels: Object.keys(typeCounts),
      datasets: [{
        data: Object.values(typeCounts),
        backgroundColor: colors.slice(0, Object.keys(typeCounts).length),
        borderColor: colors.slice(0, Object.keys(typeCounts).length).map(c => c.replace('0.8', '1')),
        borderWidth: 2
      }]
    };
  }, [datasets]);

  // Row count distribution chart
  const rowCountDistributionData = useMemo(() => {
    const rowRanges = {
      '0-100': 0,
      '101-1K': 0,
      '1K-10K': 0,
      '10K-100K': 0,
      '100K+': 0
    };

    datasets.forEach(dataset => {
      const rows = dataset.rows || 0;
      if (rows <= 100) rowRanges['0-100']++;
      else if (rows <= 1000) rowRanges['101-1K']++;
      else if (rows <= 10000) rowRanges['1K-10K']++;
      else if (rows <= 100000) rowRanges['10K-100K']++;
      else rowRanges['100K+']++;
    });

    return {
      labels: Object.keys(rowRanges),
      datasets: [{
        label: 'Number of Datasets',
        data: Object.values(rowRanges),
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2
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
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        enabled: true
      }
    }
  };

  if (datasets.length === 0) {
    return (
      <div className="text-center py-12">
        <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Datasets Available</h2>
        <p className="text-gray-600 mb-4">Upload datasets to view insights and visualizations.</p>
        <Button onClick={() => navigate('/app/data')}>
          Go to Data Management
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dataset Insights</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive analytics and visualizations for your datasets
          </p>
        </div>
        <Button onClick={() => navigate('/app/data')}>
          Manage Datasets
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Activity className="w-5 h-5 mr-2" />
            Overview & Statistics
          </button>
          <button
            onClick={() => setActiveTab('visualizations')}
            className={`${
              activeTab === 'visualizations'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <PieChart className="w-5 h-5 mr-2" />
            Detailed Visualizations
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
                  <Database className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Datasets</p>
                  <p className="text-2xl font-bold text-gray-900">{datasets.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Rows</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalRows.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                  <BarChart2 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Columns</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalColumns.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Rows/Dataset</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.avgRows.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Uploads Over Time */}
            <Card title="Uploads Over Time">
              <div className="h-64">
                {chartsLoaded && ChartComp ? (
                  <ChartComp.Line data={uploadsOverTimeData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                )}
              </div>
            </Card>

            {/* File Type Distribution */}
            <Card title="File Type Distribution">
              <div className="h-64">
                {chartsLoaded && ChartComp ? (
                  <ChartComp.Pie data={fileTypeDistributionData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                )}
              </div>
            </Card>

            {/* Row Count Distribution */}
            <Card title="Row Count Distribution">
              <div className="h-64">
                {chartsLoaded && ChartComp ? (
                  <ChartComp.Bar data={rowCountDistributionData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                )}
              </div>
            </Card>

            {/* Column Count Stats */}
            <Card title="Column Statistics">
              <div className="space-y-4">
                {datasets.slice(0, 5).map((dataset) => (
                  <div key={dataset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-900">{dataset.name}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{dataset.columns || 0} columns</span>
                      <span>{(dataset.rows || 0).toLocaleString()} rows</span>
                    </div>
                  </div>
                ))}
                {datasets.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    +{datasets.length - 5} more datasets
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Dataset List */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">All Datasets</h3>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Types</option>
                  {fileTypes.map(type => (
                    <option key={type} value={type}>{type.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDatasets.map((dataset) => {
              const health = calculateDatasetHealth(dataset);
              const badge = getHealthBadgeProps(health.score);
              
              return (
                <div
                  key={dataset.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer relative"
                  onClick={() => navigate(`/app/data?dataset=${dataset.id}`)}
                >
                  {/* Health Badge */}
                  <div className="absolute top-2 right-2">
                    <div 
                      className="px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                      style={{ 
                        backgroundColor: health.color + '20',
                        color: health.color
                      }}
                      title={`Health: ${health.score}/100 - ${badge.label}`}
                    >
                      <span>{badge.emoji}</span>
                      <span>{health.score}</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between mb-3 pr-16">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">{dataset.name}</h4>
                        <p className="text-xs text-gray-500">{(dataset.fileType || 'unknown').toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">{(dataset.rows || 0).toLocaleString()}</span> rows
                    </div>
                    <div>
                      <span className="font-medium">{dataset.columns || 0}</span> columns
                    </div>
                    <div>
                      <span className="font-medium">{dataset.fileSize || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                    {dataset.dateUploaded ? new Date(dataset.dateUploaded).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                </div>
              );
            })}
            </div>
          </Card>
        </div>
      )}

      {/* Visualizations Tab */}
      {activeTab === 'visualizations' && (
        <div className="space-y-6">
          {/* Dataset Selector */}
          <Card className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Dataset
            </label>
            <select
              value={selectedDatasetId || ''}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {datasets.map(dataset => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name} ({dataset.rows?.toLocaleString()} rows, {dataset.columns} columns)
                </option>
              ))}
            </select>
          </Card>

          {/* Visualizations */}
          {visualizationData ? (
            <div className="space-y-6">
              {/* Numeric Columns */}
              {visualizationData.numericColumns.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Numeric Data Visualizations</h3>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {visualizationData.numericColumns.slice(0, 4).map((column: string) => {
                      const data = generateBarChartData(column);
                      return data ? (
                        <Card key={column} title={column}>
                          <div className="h-64">
                            {chartsLoaded && ChartComp ? (
                              <ChartComp.Bar data={data} options={chartOptions} />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
                              </div>
                            )}
                          </div>
                        </Card>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Categorical Columns */}
              {visualizationData.categoricalColumns.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Categorical Data Visualizations</h3>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {visualizationData.categoricalColumns.slice(0, 4).map((column: string) => {
                      const data = generatePieChartData(column);
                      return data ? (
                        <Card key={column} title={column}>
                          <div className="h-64">
                            {chartsLoaded && ChartComp ? (
                              <ChartComp.Pie data={data} options={chartOptions} />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
                              </div>
                            )}
                          </div>
                        </Card>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <BarChart2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Preview Data Available</h3>
                <p className="text-gray-600">
                  This dataset doesn't have preview data for visualizations.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default DatasetInsights;



