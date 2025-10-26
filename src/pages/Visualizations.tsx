import React, { useState, useEffect, useMemo } from 'react';
import { useMLContext } from '../context/MLContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Database, BarChart2, PieChart, RefreshCw, Download } from 'lucide-react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Visualizations: React.FC = () => {
  const { datasets } = useMLContext();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-select first dataset
  useEffect(() => {
    if (datasets.length > 0 && !selectedDatasetId) {
      setSelectedDatasetId(datasets[0].id);
    }
  }, [datasets, selectedDatasetId]);

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId);

  // Generate chart data from actual dataset
  const chartData = useMemo(() => {
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

    // Generate bar chart for numeric columns
    const numericColumns = dataColumns.filter((col: string) => {
      const sampleValues = rows.slice(0, 10).map((row: any) => row[col]);
      return sampleValues.some((val: any) => typeof val === 'number');
    });

    // Generate pie chart for categorical columns
    const categoricalColumns = dataColumns.filter((col: string) => {
      const sampleValues = rows.slice(0, 10).map((row: any) => row[col]);
      return sampleValues.every((val: any) => typeof val === 'string' || val === null);
    });

    return {
      numericColumns,
      categoricalColumns,
      rows,
      columns: dataColumns
    };
  }, [selectedDataset]);

  // Generate bar chart data
  const generateBarChartData = (column: string) => {
    if (!chartData) return null;

    const values = chartData.rows
      .map((row: any) => row[column])
      .filter((val: any) => val !== null && val !== undefined && typeof val === 'number')
      .slice(0, 20); // Limit to 20 points

    if (values.length === 0) return null;

    return {
      labels: values.map((_: any, i: number) => `Item ${i + 1}`),
      datasets: [
        {
          label: column,
          data: values,
          backgroundColor: 'rgba(79, 70, 229, 0.6)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Generate line chart data
  const generateLineChartData = (column: string) => {
    if (!chartData) return null;

    const values = chartData.rows
      .map((row: any) => row[column])
      .filter((val: any) => val !== null && val !== undefined && typeof val === 'number')
      .slice(0, 30); // Limit to 30 points

    if (values.length === 0) return null;

    return {
      labels: values.map((_: any, i: number) => i + 1),
      datasets: [
        {
          label: column,
          data: values,
          borderColor: 'rgb(79, 70, 229)',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  // Generate pie chart data
  const generatePieChartData = (column: string) => {
    if (!chartData) return null;

    const valueCounts: Record<string, number> = {};
    chartData.rows.forEach((row: any) => {
      const value = row[column];
      if (value !== null && value !== undefined) {
        const key = String(value);
        valueCounts[key] = (valueCounts[key] || 0) + 1;
      }
    });

    const sortedEntries = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8); // Top 8 values

    if (sortedEntries.length === 0) return null;

    const colors = [
      'rgba(79, 70, 229, 0.6)',
      'rgba(16, 185, 129, 0.6)',
      'rgba(245, 158, 11, 0.6)',
      'rgba(239, 68, 68, 0.6)',
      'rgba(139, 92, 246, 0.6)',
      'rgba(236, 72, 153, 0.6)',
      'rgba(14, 165, 233, 0.6)',
      'rgba(251, 146, 60, 0.6)',
    ];

    return {
      labels: sortedEntries.map(([key]) => key),
      datasets: [
        {
          label: column,
          data: sortedEntries.map(([, count]) => count),
          backgroundColor: colors.slice(0, sortedEntries.length),
          borderWidth: 1,
        },
      ],
    };
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Data refreshed');
    }, 500);
  };

  const handleDownload = () => {
    toast.success('Chart export started');
  };

  if (datasets.length === 0) {
    return (
      <div className="text-center py-12">
        <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Datasets Available</h2>
        <p className="text-gray-600 mb-4">Upload datasets to visualize them here.</p>
        <Button onClick={() => window.location.href = '/app/data'}>
          Go to Data Management
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col justify-between mb-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Visualizations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Visualize your datasets with interactive charts
          </p>
        </div>
        <div className="flex items-center mt-4 space-x-3 md:mt-0">
          <select
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            value={selectedDatasetId || ''}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
          >
            {datasets.map(dataset => (
              <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            icon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {!selectedDataset ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600">Select a dataset to visualize</p>
          </div>
        </Card>
      ) : !chartData ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600">No valid data available for visualization</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Numeric Column Charts */}
          {chartData.numericColumns.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart2 className="w-5 h-5 mr-2" />
                Numeric Data Analysis
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {chartData.numericColumns.slice(0, 4).map((column: string) => {
                  const barData = generateBarChartData(column);
                  const lineData = generateLineChartData(column);
                  
                  return (
                    <React.Fragment key={column}>
                      {barData && (
                        <Card>
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-medium text-gray-700">{column}</h3>
                            <div className="flex space-x-2">
                              <button
                                onClick={handleDownload}
                                className="p-1 text-gray-500 hover:text-gray-700"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <Bar data={barData} options={{
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: {
                              legend: { display: false },
                              tooltip: { enabled: true }
                            }
                          }} />
                        </Card>
                      )}
                      {lineData && (
                        <Card>
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-medium text-gray-700">{column} Trend</h3>
                            <div className="flex space-x-2">
                              <button
                                onClick={handleDownload}
                                className="p-1 text-gray-500 hover:text-gray-700"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <Line data={lineData} options={{
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: {
                              legend: { display: false },
                              tooltip: { enabled: true }
                            }
                          }} />
                        </Card>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categorical Column Charts */}
          {chartData.categoricalColumns.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Categorical Data Distribution
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {chartData.categoricalColumns.slice(0, 6).map((column: string) => {
                  const pieData = generatePieChartData(column);
                  
                  return pieData ? (
                    <Card key={column}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium text-gray-700">{column}</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleDownload}
                            className="p-1 text-gray-500 hover:text-gray-700"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="h-64">
                        <Pie data={pieData} options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: { 
                              display: true,
                              position: 'bottom' as const
                            },
                            tooltip: { enabled: true }
                          }
                        }} />
                      </div>
                    </Card>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Dataset Summary */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dataset Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Rows</p>
                <p className="text-2xl font-bold text-gray-900">{chartData.rows.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Columns</p>
                <p className="text-2xl font-bold text-gray-900">{chartData.columns.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Numeric Columns</p>
                <p className="text-2xl font-bold text-gray-900">{chartData.numericColumns.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Categorical Columns</p>
                <p className="text-2xl font-bold text-gray-900">{chartData.categoricalColumns.length}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Visualizations;
