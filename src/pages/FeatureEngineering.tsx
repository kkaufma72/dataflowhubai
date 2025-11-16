import React, { useState, useEffect } from 'react';
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
    const epochs = Array.from({ length: 30 }, (_, i) => i + 1);
    const features = ['Age', 'Income', 'Location', 'Education', 'Occupation'];
    
    return features.map((feature, idx) => {
      const baseValue = 0.3 - (idx * 0.05);
      const data = epochs.map((_, i) => {
        const trend = i * 0.001;
        const noise = (Math.random() - 0.5) * 0.02;
        return Math.max(0, Math.min(1, baseValue + trend + noise));
      });
      
      const hue = idx * 60;
      return {
        label: feature,
        data,
        borderColor: `hsl(${hue + 220}, 70%, 50%)`,
        backgroundColor: `hsla(${hue + 220}, 70%, 50%, 0.1)`,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      };
    });
  };

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
                <div className="space-y-1">
                  <div className="flex gap-1 mb-3 text-[9px] text-gray-500">
                    <span className="w-16"></span>
                    {['Age', 'Income', 'Loc', 'Edu', 'Occ'].map((f) => (
                      <div key={f} className="w-12 text-center font-mono">{f}</div>
                    ))}
                  </div>
                  {['Age', 'Income', 'Loc', 'Edu', 'Occ'].map((rowFeature, rowIdx) => (
                    <div key={rowFeature} className="flex gap-1 items-center">
                      <span className="w-16 text-[9px] text-gray-400 font-mono">{rowFeature}</span>
                      {['Age', 'Income', 'Loc', 'Edu', 'Occ'].map((colFeature, colIdx) => {
                        // Generate realistic correlation values
                        const correlation = rowIdx === colIdx ? 1.0 : 
                          (Math.abs(rowIdx - colIdx) === 1 ? 0.6 + Math.random() * 0.2 :
                          0.2 + Math.random() * 0.3);
                        const intensity = correlation;
                        const hue = correlation > 0.7 ? 220 : correlation > 0.4 ? 45 : 120;
                        return (
                          <div
                            key={`${rowIdx}-${colIdx}`}
                            className="w-12 h-12 rounded border border-gray-800 flex items-center justify-center text-[10px] font-mono"
                            style={{
                              backgroundColor: `hsla(${hue}, 70%, 50%, ${intensity * 0.7})`,
                              color: intensity > 0.5 ? '#fff' : '#9ca3af'
                            }}
                            title={`${rowFeature} vs ${colFeature}: ${correlation.toFixed(2)}`}
                          >
                            {correlation.toFixed(2)}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div className="flex gap-2 items-center justify-center mt-4 text-[9px] text-gray-500">
                    <span>Low</span>
                    <div className="flex gap-0.5">
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
                <div className="space-y-3">
                  {[
                    { name: 'Age', mean: 45.2, std: 12.8, min: 18, max: 85, color: 'blue' },
                    { name: 'Income', mean: 68500, std: 25000, min: 25000, max: 150000, color: 'emerald' },
                    { name: 'Location', mean: 3.4, std: 1.2, min: 1, max: 5, color: 'purple' },
                    { name: 'Education', mean: 14.5, std: 2.3, min: 10, max: 20, color: 'orange' },
                    { name: 'Occupation', mean: 5.2, std: 2.8, min: 1, max: 10, color: 'pink' },
                  ].map((stat) => (
                    <div key={stat.name} className="bg-[#0d1117] rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white">{stat.name}</span>
                        <div className={`w-2 h-2 bg-${stat.color}-400 rounded-full`}></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-gray-500">Mean:</span>
                          <span className="ml-1 text-gray-300 font-mono">{stat.mean.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Std:</span>
                          <span className="ml-1 text-gray-300 font-mono">{stat.std.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Min:</span>
                          <span className="ml-1 text-gray-300 font-mono">{stat.min.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Max:</span>
                          <span className="ml-1 text-gray-300 font-mono">{stat.max.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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