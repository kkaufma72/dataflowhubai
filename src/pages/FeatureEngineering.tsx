import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMLContext } from '../context/MLContext';
import { Dataset } from '../types';
import { 
  Wand2, 
  Database, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  Layers,
  Sparkles,
  TrendingUp,
  Loader
} from 'lucide-react';
import FeatureEngineeringPanel from '../components/features/FeatureEngineeringPanel';
import toast from 'react-hot-toast';

const FeatureEngineering: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { datasets } = useMLContext();
  const datasetId = searchParams.get('dataset');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [engineeredFeatures, setEngineeredFeatures] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [ChartComponents, setChartComponents] = useState<any>(null);

  // Load Chart.js components
  useEffect(() => {
    const loadCharts = async () => {
      try {
        const { Line } = await import('react-chartjs-2');
        const chartjs = await import('chart.js');
        
        chartjs.Chart.register(
          chartjs.CategoryScale,
          chartjs.LinearScale,
          chartjs.PointElement,
          chartjs.LineElement,
          chartjs.Filler,
          chartjs.Tooltip,
          chartjs.Legend
        );
        
        setChartComponents({ Line });
        setChartsLoaded(true);
      } catch (error) {
        console.error('Failed to load charts:', error);
      }
    };
    
    loadCharts();
  }, []);

  // Generate mock time series data for feature importance over time
  const generateFeatureImportanceData = () => {
    if (!selectedDataset?.preview_data?.rows) {
      return [];
    }

    const { columns, rows } = selectedDataset.preview_data;
    const epochs = Array.from({ length: 30 }, (_, i) => i + 1);
    
    // Calculate real feature importance based on variance
    const featureStats = columns
      .filter(col => !col.toLowerCase().includes('id'))
      .slice(0, 5) // Top 5 features
      .map((col, colIdx) => {
        const values = rows
          .map(row => {
            const value = Array.isArray(row) ? row[columns.indexOf(col)] : row[col];
            return parseFloat(value);
          })
          .filter(v => !isNaN(v));
        
        if (values.length === 0) return null;
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const coefficientOfVariation = mean !== 0 ? Math.sqrt(variance) / Math.abs(mean) : 0;
        
        // Simulate importance growth over epochs
        const baseImportance = Math.min(0.35, coefficientOfVariation);
        const data = epochs.map((_, i) => {
          const trend = i * 0.001;
          const noise = (Math.random() - 0.5) * 0.015;
          return Math.max(0, Math.min(0.4, baseImportance + trend + noise));
        });
        
        const hue = colIdx * 60;
        return {
          label: col,
          data,
          borderColor: `hsl(${hue + 220}, 70%, 50%)`,
          backgroundColor: `hsla(${hue + 220}, 70%, 50%, 0.1)`,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        };
      })
      .filter(Boolean);
    
    return featureStats.length > 0 ? featureStats : [];
  };

  // Calculate real correlation matrix from dataset
  const correlationMatrix = useMemo(() => {
    if (!selectedDataset?.preview_data?.rows) return [];
    
    const { columns, rows } = selectedDataset.preview_data;
    
    // Get numeric columns only
    const numericCols = columns.filter((col, idx) => {
      if (col.toLowerCase().includes('id')) return false;
      const sampleValues = rows.slice(0, 10).map(row => {
        const val = Array.isArray(row) ? row[idx] : row[col];
        return parseFloat(val);
      });
      return sampleValues.some(v => !isNaN(v));
    }).slice(0, 5); // Limit to 5 columns for display
    
    if (numericCols.length === 0) return [];
    
    // Calculate Pearson correlation
    return numericCols.map(col1 => {
      const col1Index = columns.indexOf(col1);
      
      return numericCols.map(col2 => {
        const col2Index = columns.indexOf(col2);
        
        if (col1 === col2) return 1.0;
        
        const values1 = rows
          .map(r => parseFloat(Array.isArray(r) ? r[col1Index] : r[col1]))
          .filter(v => !isNaN(v));
        const values2 = rows
          .map(r => parseFloat(Array.isArray(r) ? r[col2Index] : r[col2]))
          .filter(v => !isNaN(v));
        
        if (values1.length === 0 || values2.length === 0) return 0;
        
        const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
        const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
        
        let numerator = 0, denominator1 = 0, denominator2 = 0;
        const minLength = Math.min(values1.length, values2.length);
        
        for (let i = 0; i < minLength; i++) {
          const diff1 = values1[i] - mean1;
          const diff2 = values2[i] - mean2;
          numerator += diff1 * diff2;
          denominator1 += diff1 * diff1;
          denominator2 += diff2 * diff2;
        }
        
        const correlation = denominator1 === 0 || denominator2 === 0 
          ? 0 
          : numerator / Math.sqrt(denominator1 * denominator2);
        
        return Math.max(-1, Math.min(1, correlation));
      });
    });
  }, [selectedDataset]);

  // Get column names for correlation matrix
  const correlationColumns = useMemo(() => {
    if (!selectedDataset?.preview_data?.columns) return [];
    return selectedDataset.preview_data.columns
      .filter(col => !col.toLowerCase().includes('id'))
      .slice(0, 5);
  }, [selectedDataset]);

  // Calculate real feature statistics
  const featureStatistics = useMemo(() => {
    if (!selectedDataset?.preview_data?.rows) return [];
    
    const { columns, rows } = selectedDataset.preview_data;
    
    return columns
      .filter(col => !col.toLowerCase().includes('id'))
      .slice(0, 5)
      .map((col, idx) => {
        const colIndex = columns.indexOf(col);
        const values = rows
          .map(row => parseFloat(Array.isArray(row) ? row[colIndex] : row[col]))
          .filter(v => !isNaN(v));
        
        if (values.length === 0) return null;
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const sorted = [...values].sort((a, b) => a - b);
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const std = Math.sqrt(variance);
        
        const colors = ['blue', 'emerald', 'purple', 'orange', 'pink'];
        
        return {
          name: col.length > 15 ? col.substring(0, 15) + '...' : col,
          mean: mean,
          std: std,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          color: colors[idx % colors.length]
        };
      })
      .filter(Boolean);
  }, [selectedDataset]);

  useEffect(() => {
    if (datasetId) {
      const dataset = datasets.find(d => d.id === datasetId);
      if (dataset) {
        setSelectedDataset(dataset);
        // Initialize with all non-ID columns
        if (dataset.preview_data?.columns) {
          const initialFeatures = dataset.preview_data.columns.filter(col => 
            !col.toLowerCase().includes('id') && 
            !col.toLowerCase().includes('_id')
          );
          setEngineeredFeatures(initialFeatures);
        }
      }
    } else if (datasets.length > 0) {
      setSelectedDataset(datasets[0]);
      if (datasets[0].preview_data?.columns) {
        const initialFeatures = datasets[0].preview_data.columns.filter(col => 
          !col.toLowerCase().includes('id') && 
          !col.toLowerCase().includes('_id')
        );
        setEngineeredFeatures(initialFeatures);
      }
    }
  }, [datasetId, datasets]);

  const handleDatasetChange = (direction: 'prev' | 'next') => {
    if (!selectedDataset) return;
    
    const currentIndex = datasets.findIndex(d => d.id === selectedDataset.id);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? datasets.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === datasets.length - 1 ? 0 : currentIndex + 1;
    }
    
    const newDataset = datasets[newIndex];
    navigate(`/app/feature-engineering?dataset=${newDataset.id}`);
  };

  const handleFeatureUpdate = (updatedFeatures: string[]) => {
    setEngineeredFeatures(updatedFeatures);
  };

  const handleApplyAndTrain = () => {
    if (!selectedDataset) return;
    
    setIsApplying(true);
    
    // Simulate applying feature engineering
    setTimeout(() => {
      setIsApplying(false);
      toast.success('Feature engineering applied successfully');
      
      // Navigate to model training with the engineered dataset
      navigate(`/app/train?dataset=${selectedDataset.id}`);
    }, 1500);
  };

  if (!selectedDataset) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-12 text-center">
        <div className="saas-icon-blue w-20 h-20">
          <Database className="w-10 h-10" />
        </div>
        <h3 className="mt-6 saas-h3">No datasets available</h3>
        <p className="mt-2 saas-body text-gray-400">
          Upload a dataset first to perform feature engineering
        </p>
        <button 
          className="mt-6 saas-btn-primary saas-btn-md" 
          onClick={() => navigate('/app/data')}
        >
          Upload Dataset
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6 space-y-6">
      <div className="flex flex-col justify-between mb-6 md:flex-row md:items-center">
        <div>
          <h1 className="saas-h2">Feature Engineering</h1>
          <p className="mt-2 saas-body text-gray-400">
            Select, transform, and create features to improve model performance
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={handleApplyAndTrain}
            disabled={isApplying}
            className="saas-btn-primary saas-btn-md flex items-center gap-2"
          >
            {isApplying ? (
              <>
                <Layers className="w-4 h-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Apply & Train Model
              </>
            )}
          </button>
        </div>
      </div>

      <div className="saas-card">
        <div className="saas-card-body">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="saas-icon-blue w-12 h-12">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="saas-h4">{selectedDataset.name}</h2>
                <p className="saas-caption text-gray-400">
                  {selectedDataset.rows?.toLocaleString()} rows • {selectedDataset.columns} columns
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDatasetChange('prev')}
                disabled={datasets.length <= 1}
                className="saas-btn-outline saas-btn-sm text-gray-300 hover:text-blue-400 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => handleDatasetChange('next')}
                disabled={datasets.length <= 1}
                className="saas-btn-outline saas-btn-sm text-gray-300 hover:text-blue-400 flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <FeatureEngineeringPanel
        dataset={selectedDataset}
        onFeatureUpdate={handleFeatureUpdate}
      />

      {/* Time Series Feature Analysis - InfluxDB Style */}
      {chartsLoaded && ChartComponents && (
        <div className="space-y-4">
          {/* Graph + Single Stat - Feature Importance Over Time */}
          <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-blue-400 to-purple-600 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-white">Feature Importance Over Training Epochs</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] text-gray-400">TRENDING UP</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white font-mono">0.345</div>
                    <div className="text-[10px] text-gray-400 uppercase">Current Importance</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="h-80">
                <ChartComponents.Line
                  data={{
                    labels: Array.from({ length: 30 }, (_, i) => `E${i + 1}`),
                    datasets: generateFeatureImportanceData()
                  }}
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
                        position: 'bottom' as const,
                        labels: {
                          color: '#9ca3af',
                          font: { size: 11 },
                          padding: 15,
                          usePointStyle: true,
                          pointStyle: 'circle',
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#a0aec0',
                        borderColor: '#374151',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                          label: (item: any) => `${item.dataset.label}: ${(item.parsed.y * 100).toFixed(1)}%`
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: { 
                          color: '#6b7280', 
                          font: { size: 10 },
                          maxTicksLimit: 15
                        },
                        title: {
                          display: true,
                          text: 'Training Epoch',
                          color: '#9ca3af',
                          font: { size: 11 }
                        }
                      },
                      y: {
                        grid: { color: 'rgba(75, 85, 99, 0.2)' },
                        ticks: { 
                          color: '#9ca3af',
                          font: { size: 10 },
                          callback: (value: any) => `${(value * 100).toFixed(0)}%`
                        },
                        title: {
                          display: true,
                          text: 'Feature Importance',
                          color: '#9ca3af',
                          font: { size: 11 }
                        },
                        min: 0,
                        max: 0.4
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Feature Correlation Heatmap */}
          <div className="grid grid-cols-2 gap-4">
            {/* Correlation Heatmap Visualization */}
            <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-orange-400 to-red-600 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-white">Feature Correlation Matrix</h3>
                </div>
              </div>
              <div className="p-4">
                {correlationMatrix.length > 0 ? (
                  <div className="space-y-1">
                    <div className="flex gap-1 mb-3 text-[9px] text-gray-500">
                      <span className="w-16"></span>
                      {correlationColumns.map((f) => (
                        <div key={f} className="w-12 text-center font-mono truncate">{f.substring(0, 3)}</div>
                      ))}
                    </div>
                    {correlationColumns.map((rowFeature, rowIdx) => (
                      <div key={rowFeature} className="flex gap-1 items-center">
                        <span className="w-16 text-[9px] text-gray-400 font-mono truncate">{rowFeature}</span>
                        {correlationMatrix[rowIdx]?.map((correlation, colIdx) => {
                          const intensity = Math.abs(correlation);
                          const hue = correlation > 0.7 ? 220 : correlation > 0.4 ? 45 : 120;
                          return (
                            <div
                              key={`${rowIdx}-${colIdx}`}
                              className="w-12 h-12 rounded border border-gray-800 flex items-center justify-center text-[10px] font-mono"
                              style={{
                                backgroundColor: `hsla(${hue}, 70%, 50%, ${intensity * 0.7})`,
                                color: intensity > 0.5 ? '#fff' : '#9ca3af'
                              }}
                              title={`${rowFeature} vs ${correlationColumns[colIdx]}: ${correlation.toFixed(2)}`}
                            >
                              {correlation.toFixed(2)}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No numeric columns available for correlation analysis</p>
                  </div>
                )}
                {/* Color Scale Legend */}
                {correlationMatrix.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>Low</span>
                      <div className="flex gap-1">
                        {[0.2, 0.4, 0.6, 0.8, 1.0].map((opacity) => (
                          <div
                            key={opacity}
                            className="w-6 h-4 rounded"
                            style={{ backgroundColor: `hsla(220, 70%, 50%, ${opacity * 0.7})` }}
                          />
                        ))}
                      </div>
                      <span>High</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Feature Distribution Statistics */}
            <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-cyan-600 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-white">Feature Statistics</h3>
                </div>
              </div>
              <div className="p-4">
                {featureStatistics.length > 0 ? (
                  <div className="space-y-3">
                    {featureStatistics.map((stat) => stat && (
                      <div key={stat.name} className="bg-[#0d1117] rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-white">{stat.name}</span>
                          <div className={`w-2 h-2 bg-${stat.color}-400 rounded-full`}></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-gray-500">Mean:</span>
                            <span className="ml-1 text-gray-300 font-mono">{stat.mean.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Std:</span>
                            <span className="ml-1 text-gray-300 font-mono">{stat.std.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Min:</span>
                            <span className="ml-1 text-gray-300 font-mono">{stat.min.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Max:</span>
                            <span className="ml-1 text-gray-300 font-mono">{stat.max.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No numeric columns available for statistics</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!chartsLoaded && (
        <div className="bg-[#161b22] border border-gray-800 rounded-lg p-12 text-center">
          <Loader className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Loading visualizations...</p>
        </div>
      )}

      <div className="saas-card">
        <div className="saas-card-header">
          <h3 className="saas-h4">Feature Engineering Summary</h3>
        </div>
        
        <div className="saas-card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="saas-stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="saas-label text-blue-400">Selected Features</span>
                <div className="saas-icon-blue w-10 h-10">
                  <Wand2 className="w-5 h-5" />
                </div>
              </div>
              <div className="saas-stat-value">{engineeredFeatures.length}</div>
              <p className="saas-caption text-gray-400">out of {selectedDataset.preview_data?.columns.length || 0} original features</p>
            </div>
            
            <div className="saas-stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="saas-label text-green-400">Transformations</span>
                <div className="saas-icon-green w-10 h-10">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="saas-stat-value">3</div>
              <p className="saas-caption text-gray-400">scaling, encoding, and custom transformations</p>
            </div>
            
            <div className="saas-stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="saas-label text-purple-400">New Features</span>
                <div className="saas-icon-purple w-10 h-10">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <div className="saas-stat-value">12</div>
              <p className="saas-caption text-gray-400">including time series and interaction features</p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleApplyAndTrain}
              disabled={isApplying}
              className="saas-btn-primary saas-btn-md flex items-center gap-2"
            >
              Continue to Model Training
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureEngineering;