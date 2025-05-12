import React, { useState, useEffect } from 'react';
import InteractiveChart, { ChartDashboard, D3Visualization } from '../components/visualizations/InteractiveCharts';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { BarChart2, PieChart, LineChart, ScatterChart as ScatterPlot, RefreshCw, Download, Share, Filter, Sliders, Plus } from 'lucide-react';
import { useMLContext } from '../context/MLContext';
import toast from 'react-hot-toast';

const Visualizations: React.FC = () => {
  const { datasets, models } = useMLContext();
  const [activeTab, setActiveTab] = useState<'charts' | 'dashboard' | 'advanced'>('charts');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Generate sample data based on selected dataset
  const generateChartData = () => {
    setIsLoading(true);
    
    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Data refreshed');
    }, 1000);
  };
  
  useEffect(() => {
    if (datasets.length > 0 && !selectedDataset) {
      setSelectedDataset(datasets[0].id);
    }
    
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [datasets, models, selectedDataset, selectedModel]);
  
  // Sample data for charts
  const barChartData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Dataset 1',
        data: [65, 59, 80, 81, 56, 55, 40],
        backgroundColor: 'rgba(79, 70, 229, 0.6)',
      },
      {
        label: 'Dataset 2',
        data: [28, 48, 40, 19, 86, 27, 90],
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
      },
    ],
  };
  
  const lineChartData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Accuracy',
        data: [0.65, 0.73, 0.79, 0.82, 0.85, 0.86, 0.88],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Loss',
        data: [0.35, 0.28, 0.22, 0.19, 0.15, 0.14, 0.12],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };
  
  const pieChartData = {
    labels: ['Random Forest', 'XGBoost', 'Linear Regression', 'Neural Network', 'SVM'],
    datasets: [
      {
        label: 'Model Usage',
        data: [35, 25, 15, 15, 10],
        backgroundColor: [
          'rgba(79, 70, 229, 0.6)',
          'rgba(16, 185, 129, 0.6)',
          'rgba(245, 158, 11, 0.6)',
          'rgba(239, 68, 68, 0.6)',
          'rgba(139, 92, 246, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const scatterChartData = {
    datasets: [
      {
        label: 'Features',
        data: Array.from({ length: 50 }, () => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
        })),
        backgroundColor: 'rgba(79, 70, 229, 0.6)',
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };
  
  // Sample data for dashboard
  const dashboardCharts = [
    {
      id: 'chart1',
      type: 'bar' as const,
      title: 'Feature Importance',
      description: 'Relative importance of top features',
      data: {
        labels: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5'],
        datasets: [
          {
            label: 'Importance',
            data: [0.85, 0.72, 0.64, 0.53, 0.41],
            backgroundColor: 'rgba(79, 70, 229, 0.6)',
          },
        ],
      },
    },
    {
      id: 'chart2',
      type: 'line' as const,
      title: 'Model Performance',
      description: 'Accuracy and loss over training epochs',
      data: {
        labels: ['Epoch 1', 'Epoch 2', 'Epoch 3', 'Epoch 4', 'Epoch 5', 'Epoch 6', 'Epoch 7', 'Epoch 8', 'Epoch 9', 'Epoch 10'],
        datasets: [
          {
            label: 'Accuracy',
            data: [0.65, 0.73, 0.79, 0.82, 0.85, 0.86, 0.88, 0.89, 0.91, 0.92],
            borderColor: 'rgb(79, 70, 229)',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Loss',
            data: [0.35, 0.28, 0.22, 0.19, 0.15, 0.14, 0.12, 0.11, 0.09, 0.08],
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
    },
    {
      id: 'chart3',
      type: 'pie' as const,
      title: 'Prediction Distribution',
      description: 'Distribution of model predictions',
      data: {
        labels: ['Class A', 'Class B', 'Class C', 'Class D'],
        datasets: [
          {
            label: 'Predictions',
            data: [45, 25, 20, 10],
            backgroundColor: [
              'rgba(79, 70, 229, 0.6)',
              'rgba(16, 185, 129, 0.6)',
              'rgba(245, 158, 11, 0.6)',
              'rgba(239, 68, 68, 0.6)',
            ],
          },
        ],
      },
    },
    {
      id: 'chart4',
      type: 'doughnut' as const,
      title: 'Data Distribution',
      description: 'Distribution of training data',
      data: {
        labels: ['Training', 'Validation', 'Test'],
        datasets: [
          {
            label: 'Data Split',
            data: [70, 15, 15],
            backgroundColor: [
              'rgba(79, 70, 229, 0.6)',
              'rgba(16, 185, 129, 0.6)',
              'rgba(245, 158, 11, 0.6)',
            ],
          },
        ],
      },
    },
  ];
  
  // Sample data for D3 visualizations
  const forceDirectedData = {
    nodes: [
      { id: 'A', name: 'Node A', color: '#4F46E5' },
      { id: 'B', name: 'Node B', color: '#10B981' },
      { id: 'C', name: 'Node C', color: '#F59E0B' },
      { id: 'D', name: 'Node D', color: '#EF4444' },
      { id: 'E', name: 'Node E', color: '#8B5CF6' },
      { id: 'F', name: 'Node F', color: '#EC4899' },
      { id: 'G', name: 'Node G', color: '#06B6D4' },
    ],
    links: [
      { source: 'A', target: 'B', value: 1 },
      { source: 'A', target: 'C', value: 2 },
      { source: 'B', target: 'D', value: 1 },
      { source: 'C', target: 'E', value: 3 },
      { source: 'D', target: 'F', value: 2 },
      { source: 'E', target: 'F', value: 1 },
      { source: 'F', target: 'G', value: 2 },
    ],
  };
  
  const treeData = {
    name: 'Root',
    children: [
      {
        name: 'Branch A',
        children: [
          { name: 'Leaf A1' },
          { name: 'Leaf A2' },
          { name: 'Leaf A3' },
        ],
      },
      {
        name: 'Branch B',
        children: [
          { name: 'Leaf B1' },
          { name: 'Leaf B2' },
        ],
      },
    ],
  };
  
  const heatmapData = Array.from({ length: 10 }, (_, i) => 
    Array.from({ length: 10 }, (_, j) => ({
      x: `X${i+1}`,
      y: `Y${j+1}`,
      value: Math.random() * 100
    }))
  ).flat();

  return (
    <div>
      <div className="flex flex-col justify-between mb-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interactive Visualizations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Explore your data and models with interactive charts and visualizations
          </p>
        </div>
        <div className="flex items-center mt-4 space-x-3 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter className="w-4 h-4" />}
          >
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={generateChartData}
            disabled={isLoading}
            icon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          >
            Refresh Data
          </Button>
          <Button
            size="sm"
            icon={<Plus className="w-4 h-4" />}
          >
            New Visualization
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Visualization Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Dataset
              </label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={selectedDataset || ''}
                onChange={(e) => setSelectedDataset(e.target.value)}
              >
                <option value="">Select dataset</option>
                {datasets.map(dataset => (
                  <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Model
              </label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={selectedModel || ''}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="">Select model</option>
                {models.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Time Range
              </label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                defaultValue="7d"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              className="mr-2"
              icon={<Sliders className="w-4 h-4" />}
            >
              Advanced Filters
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowFilters(false);
                generateChartData();
              }}
            >
              Apply Filters
            </Button>
          </div>
        </Card>
      )}

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('charts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'charts'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Individual Charts
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'advanced'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Advanced Visualizations
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'charts' && (
        <div className="grid gap-6 md:grid-cols-2">
          <InteractiveChart
            type="bar"
            data={barChartData}
            title="Feature Importance"
            description="Relative importance of features in the model"
            isLoading={isLoading}
            onRefresh={generateChartData}
          />
          
          <InteractiveChart
            type="line"
            data={lineChartData}
            title="Model Performance"
            description="Accuracy and loss over training epochs"
            isLoading={isLoading}
            onRefresh={generateChartData}
          />
          
          <InteractiveChart
            type="pie"
            data={pieChartData}
            title="Model Distribution"
            description="Distribution of model types in use"
            isLoading={isLoading}
            onRefresh={generateChartData}
          />
          
          <InteractiveChart
            type="scatter"
            data={scatterChartData}
            title="Feature Clustering"
            description="Clustering of data points in feature space"
            isLoading={isLoading}
            onRefresh={generateChartData}
          />
        </div>
      )}

      {activeTab === 'dashboard' && (
        <ChartDashboard
          charts={dashboardCharts}
          title="Model Performance Dashboard"
          onRefresh={generateChartData}
        />
      )}

      {activeTab === 'advanced' && (
        <div className="space-y-6">
          <D3Visualization
            type="force-directed"
            data={forceDirectedData}
            title="Model Relationship Graph"
            description="Force-directed graph showing relationships between model components"
            width={600}
            height={400}
          />
          
          <D3Visualization
            type="tree"
            data={treeData}
            title="Decision Tree Visualization"
            description="Hierarchical visualization of a decision tree model"
            width={600}
            height={400}
          />
          
          <D3Visualization
            type="heatmap"
            data={heatmapData}
            title="Correlation Heatmap"
            description="Heatmap showing correlations between features"
            width={600}
            height={400}
          />
        </div>
      )}
    </div>
  );
};

export default Visualizations;