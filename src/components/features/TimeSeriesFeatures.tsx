import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { 
  Clock, 
  Plus, 
  X, 
  BarChart2, 
  TrendingUp, 
  Calendar, 
  Save,
  Info,
  Trash2
} from 'lucide-react';
import Button from '../common/Button';
import { Dataset } from '../../types';
import { Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';

interface TimeSeriesFeaturesProps {
  dataset: Dataset;
  config: {
    timestampColumn: string;
    lagFeatures: {feature: string; lags: number[]}[];
    rollingFeatures: {feature: string; windows: number[]; operations: ('mean' | 'sum' | 'min' | 'max' | 'std')[]}[];
    seasonalFeatures: boolean;
  };
  onConfigUpdate: (config: TimeSeriesFeaturesProps['config']) => void;
}

const TimeSeriesFeatures: React.FC<TimeSeriesFeaturesProps> = ({
  dataset,
  config,
  onConfigUpdate
}) => {
  const [showAddLagForm, setShowAddLagForm] = useState(false);
  const [showAddRollingForm, setShowAddRollingForm] = useState(false);
  const [newLagFeature, setNewLagFeature] = useState<{
    feature: string;
    lags: number[];
  }>({
    feature: '',
    lags: [1]
  });
  const [newRollingFeature, setNewRollingFeature] = useState<{
    feature: string;
    windows: number[];
    operations: ('mean' | 'sum' | 'min' | 'max' | 'std')[];
  }>({
    feature: '',
    windows: [3],
    operations: ['mean']
  });
  const [preview_data, setPreviewData] = useState<any[] | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [newLag, setNewLag] = useState<number>(1);
  const [newWindow, setNewWindow] = useState<number>(3);
  const [newOperation, setNewOperation] = useState<'mean' | 'sum' | 'min' | 'max' | 'std'>('mean');

  // Check if dataset has potential timestamp column
  useEffect(() => {
    if (dataset && dataset.preview_data && !config.timestampColumn) {
      const columns = dataset.preview_data.columns;
      const timestampCol = columns.find(col => 
        col.toLowerCase().includes('timestamp') || 
        col.toLowerCase().includes('date') ||
        col.toLowerCase().includes('time')
      );
      
      if (timestampCol) {
        onConfigUpdate({
          ...config,
          timestampColumn: timestampCol
        });
      }
    }
  }, [dataset, config, onConfigUpdate]);

  const handleAddLag = () => {
    if (!newLagFeature.feature) {
      toast.error('Please select a feature');
      return;
    }
    
    // Check if feature already exists
    const existingFeatureIndex = config.lagFeatures.findIndex(f => f.feature === newLagFeature.feature);
    
    if (existingFeatureIndex >= 0) {
      // Update existing feature
      const updatedLagFeatures = [...config.lagFeatures];
      updatedLagFeatures[existingFeatureIndex] = {
        ...updatedLagFeatures[existingFeatureIndex],
        lags: [...new Set([...updatedLagFeatures[existingFeatureIndex].lags, ...newLagFeature.lags])]
      };
      
      onConfigUpdate({
        ...config,
        lagFeatures: updatedLagFeatures
      });
    } else {
      // Add new feature
      onConfigUpdate({
        ...config,
        lagFeatures: [...config.lagFeatures, newLagFeature]
      });
    }
    
    setShowAddLagForm(false);
    setNewLagFeature({
      feature: '',
      lags: [1]
    });
    
    toast.success('Lag features added');
  };

  const handleAddRolling = () => {
    if (!newRollingFeature.feature) {
      toast.error('Please select a feature');
      return;
    }
    
    // Check if feature already exists
    const existingFeatureIndex = config.rollingFeatures.findIndex(f => f.feature === newRollingFeature.feature);
    
    if (existingFeatureIndex >= 0) {
      // Update existing feature
      const updatedRollingFeatures = [...config.rollingFeatures];
      updatedRollingFeatures[existingFeatureIndex] = {
        ...updatedRollingFeatures[existingFeatureIndex],
        windows: [...new Set([...updatedRollingFeatures[existingFeatureIndex].windows, ...newRollingFeature.windows])],
        operations: [...new Set([...updatedRollingFeatures[existingFeatureIndex].operations, ...newRollingFeature.operations])]
      };
      
      onConfigUpdate({
        ...config,
        rollingFeatures: updatedRollingFeatures
      });
    } else {
      // Add new feature
      onConfigUpdate({
        ...config,
        rollingFeatures: [...config.rollingFeatures, newRollingFeature]
      });
    }
    
    setShowAddRollingForm(false);
    setNewRollingFeature({
      feature: '',
      windows: [3],
      operations: ['mean']
    });
    
    toast.success('Rolling features added');
  };

  const handleRemoveLagFeature = (feature: string) => {
    onConfigUpdate({
      ...config,
      lagFeatures: config.lagFeatures.filter(f => f.feature !== feature)
    });
    
    toast.success('Lag feature removed');
  };

  const handleRemoveRollingFeature = (feature: string) => {
    onConfigUpdate({
      ...config,
      rollingFeatures: config.rollingFeatures.filter(f => f.feature !== feature)
    });
    
    toast.success('Rolling feature removed');
  };

  const handleToggleSeasonalFeatures = () => {
    onConfigUpdate({
      ...config,
      seasonalFeatures: !config.seasonalFeatures
    });
    
    toast.success(config.seasonalFeatures 
      ? 'Seasonal features disabled' 
      : 'Seasonal features enabled'
    );
  };

  const handleAddLagValue = () => {
    if (newLag <= 0) {
      toast.error('Lag value must be positive');
      return;
    }
    
    if (newLagFeature.lags.includes(newLag)) {
      toast.error('Lag value already added');
      return;
    }
    
    setNewLagFeature({
      ...newLagFeature,
      lags: [...newLagFeature.lags, newLag]
    });
    
    setNewLag(1);
  };

  const handleRemoveLagValue = (lag: number) => {
    setNewLagFeature({
      ...newLagFeature,
      lags: newLagFeature.lags.filter(l => l !== lag)
    });
  };

  const handleAddWindowValue = () => {
    if (newWindow <= 0) {
      toast.error('Window size must be positive');
      return;
    }
    
    if (newRollingFeature.windows.includes(newWindow)) {
      toast.error('Window size already added');
      return;
    }
    
    setNewRollingFeature({
      ...newRollingFeature,
      windows: [...newRollingFeature.windows, newWindow]
    });
    
    setNewWindow(3);
  };

  const handleRemoveWindowValue = (window: number) => {
    setNewRollingFeature({
      ...newRollingFeature,
      windows: newRollingFeature.windows.filter(w => w !== window)
    });
  };

  const handleAddOperation = () => {
    if (newRollingFeature.operations.includes(newOperation)) {
      toast.error('Operation already added');
      return;
    }
    
    setNewRollingFeature({
      ...newRollingFeature,
      operations: [...newRollingFeature.operations, newOperation]
    });
  };

  const handleRemoveOperation = (operation: 'mean' | 'sum' | 'min' | 'max' | 'std') => {
    setNewRollingFeature({
      ...newRollingFeature,
      operations: newRollingFeature.operations.filter(o => o !== operation)
    });
  };

  const handleGeneratePreview = () => {
    if (!config.timestampColumn) {
      toast.error('Please select a timestamp column');
      return;
    }
    
    setIsGeneratingPreview(true);
    
    // Simulate generating preview data
    setTimeout(() => {
      // Create mock time series data
      const dates = [];
      const values = [];
      const lagValues = [];
      const rollingValues = [];
      
      // Generate 30 days of data
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - 29 + i);
        dates.push(date.toISOString().split('T')[0]);
        
        // Generate a value with some trend and seasonality
        const trend = i * 0.5;
        const seasonality = 5 * Math.sin(i * Math.PI / 7); // Weekly seasonality
        const noise = Math.random() * 10 - 5;
        const value = 50 + trend + seasonality + noise;
        values.push(value);
        
        // Generate lag values
        if (i >= 1) {
          lagValues.push(values[i - 1]);
        } else {
          lagValues.push(null);
        }
        
        // Generate rolling mean (window size 7)
        if (i >= 6) {
          const windowValues = values.slice(i - 6, i + 1);
          const mean = windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length;
          rollingValues.push(mean);
        } else {
          rollingValues.push(null);
        }
      }
      
      setPreviewData({
        dates,
        values,
        lagValues,
        rollingValues
      });
      
      setIsGeneratingPreview(false);
    }, 1500);
  };

  const getPreviewChartData = () => {
    if (!preview_data) return null;
    
    return {
      labels: preview_data.dates,
      datasets: [
        {
          label: 'Original',
          data: preview_data.values,
          borderColor: 'rgb(79, 70, 229)',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: false,
          tension: 0.4,
        },
        {
          label: 'Lag (t-1)',
          data: preview_data.lagValues,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
          tension: 0.4,
        },
        {
          label: 'Rolling Mean (7-day)',
          data: preview_data.rollingValues,
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: false,
          tension: 0.4,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: false,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const getNumericFeatures = () => {
    if (!dataset.preview_data) return [];
    
    const { columns, rows } = dataset.preview_data;
    const numericFeatures: string[] = [];
    
    columns.forEach((column, colIndex) => {
      // Check if column has mostly numeric values
      const values = rows.map(row => row[colIndex]);
      const numericCount = values.filter(v => !isNaN(Number(v))).length;
      
      if (numericCount / values.length > 0.8) {
        numericFeatures.push(column);
      }
    });
    
    return numericFeatures;
  };

  const getDatetimeFeatures = () => {
    if (!dataset.preview_data) return [];
    
    const { columns, rows } = dataset.preview_data;
    const datetimeFeatures: string[] = [];
    
    columns.forEach((column, colIndex) => {
      // Check if column has mostly date values
      const values = rows.map(row => row[colIndex]);
      const dateCount = values.filter(v => !isNaN(Date.parse(v))).length;
      
      if (dateCount / values.length > 0.8) {
        datetimeFeatures.push(column);
      }
    });
    
    return datetimeFeatures;
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
              <Clock className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Time Series Feature Engineering</h3>
              <p className="mt-1 text-xs text-gray-500">
                Create lag, rolling window, and seasonal features for time series data
              </p>
            </div>
          </div>
          <Button
            onClick={handleGeneratePreview}
            disabled={isGeneratingPreview || !config.timestampColumn}
            icon={isGeneratingPreview ? <Clock className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
          >
            {isGeneratingPreview ? 'Generating...' : 'Preview Features'}
          </Button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">Timestamp Configuration</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timestamp Column
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                value={config.timestampColumn}
                onChange={(e) => onConfigUpdate({
                  ...config,
                  timestampColumn: e.target.value
                })}
              >
                <option value="">Select a timestamp column</option>
                {getDatetimeFeatures().map(feature => (
                  <option key={feature} value={feature}>{feature}</option>
                ))}
              </select>
              {!config.timestampColumn && (
                <p className="mt-1 text-xs text-red-500">
                  A timestamp column is required for time series features
                </p>
              )}
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="seasonal-features"
                className="h-4 w-4 text-primary-600 focus:ring-primary border-gray-300 rounded"
                checked={config.seasonalFeatures}
                onChange={handleToggleSeasonalFeatures}
              />
              <label htmlFor="seasonal-features" className="ml-2 text-sm text-gray-700">
                Generate Seasonal Features
              </label>
              <div className="ml-2 group relative">
                <Info className="h-4 w-4 text-gray-400" />
                <div className="hidden group-hover:block absolute z-10 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg -top-2 left-6">
                  Creates features for day of week, month, quarter, year, etc. to capture seasonal patterns
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">Lag Features</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddLagForm(!showAddLagForm)}
                icon={showAddLagForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              >
                {showAddLagForm ? 'Cancel' : 'Add'}
              </Button>
            </div>
            
            {showAddLagForm && (
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feature
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      value={newLagFeature.feature}
                      onChange={(e) => setNewLagFeature({
                        ...newLagFeature,
                        feature: e.target.value
                      })}
                    >
                      <option value="">Select a feature</option>
                      {getNumericFeatures().map(feature => (
                        <option key={feature} value={feature}>{feature}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lag Values
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newLagFeature.lags.map(lag => (
                        <div key={lag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary-800">
                          t-{lag}
                          <button
                            className="ml-1 text-primary-600 hover:text-primary-800"
                            onClick={() => handleRemoveLagValue(lag)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      <div className="flex-1">
                        <input
                          type="number"
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                          value={newLag}
                          onChange={(e) => setNewLag(parseInt(e.target.value))}
                          placeholder="Lag value"
                        />
                      </div>
                      <button
                        className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        onClick={handleAddLagValue}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddLag}
                      disabled={!newLagFeature.feature || newLagFeature.lags.length === 0}
                    >
                      Add Lag Features
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {config.lagFeatures.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                <TrendingUp className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  No lag features configured
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {config.lagFeatures.map(feature => (
                  <div key={feature.feature} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">{feature.feature}</div>
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        onClick={() => handleRemoveLagFeature(feature.feature)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {feature.lags.map(lag => (
                        <span key={lag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary-800">
                          t-{lag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">Rolling Window Features</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddRollingForm(!showAddRollingForm)}
                icon={showAddRollingForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              >
                {showAddRollingForm ? 'Cancel' : 'Add'}
              </Button>
            </div>
            
            {showAddRollingForm && (
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feature
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      value={newRollingFeature.feature}
                      onChange={(e) => setNewRollingFeature({
                        ...newRollingFeature,
                        feature: e.target.value
                      })}
                    >
                      <option value="">Select a feature</option>
                      {getNumericFeatures().map(feature => (
                        <option key={feature} value={feature}>{feature}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Window Sizes
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newRollingFeature.windows.map(window => (
                        <div key={window} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {window} periods
                          <button
                            className="ml-1 text-green-600 hover:text-green-800"
                            onClick={() => handleRemoveWindowValue(window)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      <div className="flex-1">
                        <input
                          type="number"
                          min="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                          value={newWindow}
                          onChange={(e) => setNewWindow(parseInt(e.target.value))}
                          placeholder="Window size"
                        />
                      </div>
                      <button
                        className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        onClick={handleAddWindowValue}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Operations
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newRollingFeature.operations.map(operation => (
                        <div key={operation} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary-800">
                          {operation}
                          <button
                            className="ml-1 text-primary-600 hover:text-primary-800"
                            onClick={() => handleRemoveOperation(operation)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        value={newOperation}
                        onChange={(e) => setNewOperation(e.target.value as any)}
                      >
                        <option value="mean">Mean</option>
                        <option value="sum">Sum</option>
                        <option value="min">Min</option>
                        <option value="max">Max</option>
                        <option value="std">Std</option>
                      </select>
                      <button
                        className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        onClick={handleAddOperation}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddRolling}
                      disabled={
                        !newRollingFeature.feature || 
                        newRollingFeature.windows.length === 0 || 
                        newRollingFeature.operations.length === 0
                      }
                    >
                      Add Rolling Features
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {config.rollingFeatures.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                <BarChart2 className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  No rolling window features configured
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {config.rollingFeatures.map(feature => (
                  <div key={feature.feature} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">{feature.feature}</div>
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        onClick={() => handleRemoveRollingFeature(feature.feature)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-medium text-gray-500 mb-1">Windows:</div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {feature.windows.map(window => (
                          <span key={window} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {window} periods
                          </span>
                        ))}
                      </div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Operations:</div>
                      <div className="flex flex-wrap gap-2">
                        {feature.operations.map(operation => (
                          <span key={operation} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary-800">
                            {operation}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {config.seasonalFeatures && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">Seasonal Features</h4>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="ml-3">
                  <h5 className="text-sm font-medium text-blue-900">Enabled Seasonal Features</h5>
                  <p className="mt-1 text-sm text-blue-700">
                    The following features will be generated from the timestamp column:
                  </p>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      'hour_of_day',
                      'day_of_week',
                      'day_of_month',
                      'day_of_year',
                      'week_of_year',
                      'month',
                      'quarter',
                      'year',
                      'is_weekend',
                      'is_holiday'
                    ].map(feature => (
                      <div key={feature} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {feature.split('_').join(' ')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            icon={<Save className="w-4 h-4" />}
            onClick={() => {
              onConfigUpdate(config);
              toast.success('Time series configuration saved');
            }}
          >
            Save Configuration
          </Button>
        </div>
      </Card>

      {preview_data && (
        <Card>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Time Series Feature Preview</h3>
          
          <div className="h-80">
            <Line data={getPreviewChartData()} options={chartOptions} />
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Generated Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h5 className="text-xs font-medium text-gray-700 mb-1">Lag Features</h5>
                <div className="space-y-1">
                  {config.lagFeatures.flatMap(feature => 
                    feature.lags.map(lag => (
                      <div key={`${feature.feature}_lag_${lag}`} className="text-sm text-gray-600">
                        {feature.feature}_lag_{lag}
                      </div>
                    ))
                  )}
                  {config.lagFeatures.length === 0 && (
                    <div className="text-sm text-gray-500 italic">None configured</div>
                  )}
                </div>
              </div>
              
              <div>
                <h5 className="text-xs font-medium text-gray-700 mb-1">Rolling Window Features</h5>
                <div className="space-y-1">
                  {config.rollingFeatures.flatMap(feature => 
                    feature.windows.flatMap(window => 
                      feature.operations.map(operation => (
                        <div key={`${feature.feature}_${operation}_${window}`} className="text-sm text-gray-600">
                          {feature.feature}_{operation}_{window}
                        </div>
                      ))
                    )
                  )}
                  {config.rollingFeatures.length === 0 && (
                    <div className="text-sm text-gray-500 italic">None configured</div>
                  )}
                </div>
              </div>
              
              <div>
                <h5 className="text-xs font-medium text-gray-700 mb-1">Seasonal Features</h5>
                <div className="space-y-1">
                  {config.seasonalFeatures ? (
                    <>
                      <div className="text-sm text-gray-600">hour_of_day</div>
                      <div className="text-sm text-gray-600">day_of_week</div>
                      <div className="text-sm text-gray-600">day_of_month</div>
                      <div className="text-sm text-gray-600">month</div>
                      <div className="text-sm text-gray-600">is_weekend</div>
                      <div className="text-sm text-gray-600">...</div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500 italic">None configured</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TimeSeriesFeatures;