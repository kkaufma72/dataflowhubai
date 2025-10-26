import React, { useState, useMemo, useEffect } from 'react';
import { useMLContext } from '../context/MLContext';
import Card from '../components/common/Card';
import { Database, BarChart2, TrendingUp, Calendar, FileText, Filter, Loader } from 'lucide-react';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

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

const DatasetOverview: React.FC = () => {
  const { datasets } = useMLContext();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<string>('all');
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [ChartComp, setChartComp] = useState<any>(null);

  // Load charts on mount
  useEffect(() => {
    loadCharts().then((comps) => {
      setChartComp(comps);
      setChartsLoaded(true);
    });
  }, []);

  // Filter datasets by type
  const filteredDatasets = useMemo(() => {
    if (filterType === 'all') return datasets;
    return datasets.filter(d => d.fileType === filterType);
  }, [datasets, filterType]);

  // Get unique file types
  const fileTypes = useMemo(() => {
    const types = new Set(datasets.map(d => d.fileType));
    return Array.from(types);
  }, [datasets]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRows = datasets.reduce((sum, d) => sum + (d.rows || 0), 0);
    const totalColumns = datasets.reduce((sum, d) => sum + (d.columns || 0), 0);
    const avgRows = datasets.length > 0 ? Math.round(totalRows / datasets.length) : 0;
    const avgColumns = datasets.length > 0 ? Math.round(totalColumns / datasets.length) : 0;
    
    // Calculate size if available
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
      const date = new Date(dataset.dateUploaded).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      uploadsByDate[date] = (uploadsByDate[date] || 0) + 1;
    });

    const sortedDates = Object.keys(uploadsByDate).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    return {
      labels: sortedDates,
      datasets: [{
        label: 'Dataset Uploads',
        data: sortedDates.map(date => uploadsByDate[date]),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dataset Overview</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive insights into your uploaded datasets
          </p>
        </div>
        <Button onClick={() => navigate('/app/data')}>
          Manage Datasets
        </Button>
      </div>

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
            {datasets.slice(0, 5).map((dataset, idx) => (
              <div key={dataset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900">{dataset.name}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{dataset.columns} columns</span>
                  <span>{dataset.rows?.toLocaleString()} rows</span>
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

      {/* Filter and Dataset List */}
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

        {filteredDatasets.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No datasets found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDatasets.map((dataset) => (
              <div
                key={dataset.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/app/data?dataset=${dataset.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">{dataset.name}</h4>
                      <p className="text-xs text-gray-500">{dataset.fileType.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">{dataset.rows?.toLocaleString()}</span> rows
                  </div>
                  <div>
                    <span className="font-medium">{dataset.columns}</span> columns
                  </div>
                  <div>
                    <span className="font-medium">{dataset.fileSize}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(dataset.dateUploaded).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DatasetOverview;

