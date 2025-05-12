import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import { 
  Wand2, 
  Plus, 
  X, 
  ArrowDown, 
  ArrowUp, 
  Edit, 
  Save, 
  Trash2,
  Code,
  RefreshCw,
  Play,
  Check,
  Settings,
  Eye,
  Download,
  AlertTriangle
} from 'lucide-react';
import { Dataset } from '../../types';
import { 
  PreprocessingOptions, 
  PreprocessingResult,
  applyPreprocessingPipeline,
  PreprocessingRecommendation
} from '../../lib/dataProcessing';
import toast from 'react-hot-toast';
import DataProfiler from './DataProfiler';
import BatchProcessingManager from './BatchProcessingManager';
import StreamingDataProcessor from './StreamingDataProcessor';

interface PreprocessingPipelineProps {
  dataset: Dataset;
  onPreprocessingComplete: (result: PreprocessingResult) => void;
}

const PreprocessingPipeline: React.FC<PreprocessingPipelineProps> = ({
  dataset,
  onPreprocessingComplete
}) => {
  const [preprocessingOptions, setPreprocessingOptions] = useState<PreprocessingOptions>({
    missingValues: {
      strategy: 'impute_mean',
      columns: undefined,
      threshold: 0.5
    },
    outliers: {
      strategy: 'cap',
      method: 'iqr',
      threshold: 1.5
    },
    encoding: {
      strategy: 'one_hot',
      columns: undefined,
      handleUnknown: 'ignore'
    },
    scaling: {
      strategy: 'standard',
      columns: undefined
    },
    batchSize: 1000,
    storeIntermediateResults: false
  });
  
  const [activeTab, setActiveTab] = useState<'profile' | 'pipeline' | 'batch' | 'streaming'>('profile');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [previewData, setPreviewData] = useState<{
    original: any[][];
    processed: any[][];
    columns: string[];
  } | null>(null);
  const [processingResult, setProcessingResult] = useState<PreprocessingResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Apply preprocessing recommendations
  const handleApplyRecommendations = (recommendations: PreprocessingRecommendation[]) => {
    const newOptions: PreprocessingOptions = { ...preprocessingOptions };
    
    recommendations.forEach(rec => {
      switch (rec.type) {
        case 'missing_values':
          newOptions.missingValues = {
            ...newOptions.missingValues,
            strategy: rec.suggestedMethod as any,
            columns: rec.column ? [rec.column] : undefined
          };
          break;
        case 'outliers':
          newOptions.outliers = {
            ...newOptions.outliers,
            strategy: rec.suggestedMethod.includes('cap') ? 'cap' : 'remove',
            method: 'iqr',
            columns: rec.column ? [rec.column] : undefined
          };
          break;
        case 'encoding':
          newOptions.encoding = {
            ...newOptions.encoding,
            strategy: rec.suggestedMethod as any,
            columns: rec.column ? [rec.column] : undefined
          };
          break;
        case 'scaling':
          newOptions.scaling = {
            ...newOptions.scaling,
            strategy: rec.suggestedMethod as any,
            columns: rec.column ? [rec.column] : undefined
          };
          break;
        case 'feature_selection':
          newOptions.featureSelection = {
            ...newOptions.featureSelection,
            strategy: rec.suggestedMethod as any,
            threshold: 0.01
          };
          break;
        case 'dimensionality_reduction':
          newOptions.dimensionalityReduction = {
            ...newOptions.dimensionalityReduction,
            strategy: rec.suggestedMethod as any,
            components: 5
          };
          break;
      }
    });
    
    setPreprocessingOptions(newOptions);
    setActiveTab('pipeline');
    toast.success('Recommendations applied to pipeline');
  };

  // Run preprocessing pipeline
  const runPreprocessing = async () => {
    if (!dataset.previewData) {
      toast.error('No data available for preprocessing');
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 200);
      
      // Process the data
      const { columns, rows } = dataset.previewData;
      const result = applyPreprocessingPipeline(rows, columns, preprocessingOptions);
      
      // Clear interval and set progress to 100%
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      // Set result and preview data
      setProcessingResult(result);
      setPreviewData({
        original: rows.slice(0, 5),
        processed: result.data.slice(0, 5),
        columns: result.columns
      });
      
      // Show preview
      setShowPreview(true);
      
      // Complete processing
      setTimeout(() => {
        setIsProcessing(false);
        toast.success('Preprocessing completed successfully');
      }, 500);
    } catch (error) {
      console.error('Preprocessing error:', error);
      setIsProcessing(false);
      toast.error('Preprocessing failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Handle batch processing completion
  const handleBatchProcessingComplete = (result: PreprocessingResult) => {
    setProcessingResult(result);
    onPreprocessingComplete(result);
  };

  // Handle streaming data processing
  const handleStreamingDataProcessed = (processedData: any[][], columns: string[]) => {
    // In a real application, you might want to accumulate or sample the streaming data
    // For now, we'll just update the preview with the latest batch
    setPreviewData({
      original: dataset.previewData?.rows.slice(0, 5) || [],
      processed: processedData.slice(0, 5),
      columns
    });
  };

  // Save preprocessing result
  const savePreprocessingResult = () => {
    if (!processingResult) return;
    
    onPreprocessingComplete(processingResult);
    toast.success('Preprocessing result saved');
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Data Profile
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pipeline'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Preprocessing Pipeline
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'batch'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Batch Processing
            </button>
            <button
              onClick={() => setActiveTab('streaming')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'streaming'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Streaming
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'profile' && (
        <DataProfiler 
          dataset={dataset}
          onApplyRecommendations={handleApplyRecommendations}
        />
      )}

      {activeTab === 'pipeline' && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
                <Wand2 className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">Preprocessing Pipeline</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Configure and run data preprocessing steps
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              {processingResult && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  icon={<Eye className="w-4 h-4" />}
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
              )}
              <Button
                onClick={runPreprocessing}
                disabled={isProcessing}
                icon={isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              >
                {isProcessing ? 'Processing...' : 'Run Pipeline'}
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Pipeline Configuration</h4>
            
            <div className="space-y-6">
              {/* Missing Values */}
              <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-sm font-medium text-gray-900">Missing Values</h5>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enable-missing-values"
                      checked={!!preprocessingOptions.missingValues}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPreprocessingOptions({
                            ...preprocessingOptions,
                            missingValues: {
                              strategy: 'impute_mean',
                              threshold: 0.5
                            }
                          });
                        } else {
                          const { missingValues, ...rest } = preprocessingOptions;
                          setPreprocessingOptions(rest);
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enable-missing-values" className="ml-2 block text-sm text-gray-900">
                      Enable
                    </label>
                  </div>
                </div>
                
                {preprocessingOptions.missingValues && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Strategy
                      </label>
                      <select
                        value={preprocessingOptions.missingValues.strategy}
                        onChange={(e) => setPreprocessingOptions({
                          ...preprocessingOptions,
                          missingValues: {
                            ...preprocessingOptions.missingValues,
                            strategy: e.target.value as any
                          }
                        })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="drop_rows">Drop Rows</option>
                        <option value="drop_columns">Drop Columns</option>
                        <option value="impute_mean">Impute with Mean</option>
                        <option value="impute_median">Impute with Median</option>
                        <option value="impute_mode">Impute with Mode</option>
                        <option value="impute_constant">Impute with Constant</option>
                      </select>
                    </div>
                    
                    {preprocessingOptions.missingValues.strategy === 'impute_constant' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Constant Value
                        </label>
                        <input
                          type="text"
                          value={preprocessingOptions.missingValues.constantValue || ''}
                          onChange={(e) => setPreprocessingOptions({
                            ...preprocessingOptions,
                            missingValues: {
                              ...preprocessingOptions.missingValues,
                              constantValue: e.target.value
                            }
                          })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Value to use for imputation"
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Missing Threshold
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={preprocessingOptions.missingValues.threshold || 0.5}
                        onChange={(e) => setPreprocessingOptions({
                          ...preprocessingOptions,
                          missingValues: {
                            ...preprocessingOptions.missingValues,
                            threshold: parseFloat(e.target.value)
                          }
                        })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Threshold for dropping columns (if strategy is 'drop_columns')
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Outliers */}
              <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-sm font-medium text-gray-900">Outliers</h5>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enable-outliers"
                      checked={!!preprocessingOptions.outliers}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPreprocessingOptions({
                            ...preprocessingOptions,
                            outliers: {
                              strategy: 'cap',
                              method: 'iqr',
                              threshold: 1.5
                            }
                          });
                        } else {
                          const { outliers, ...rest } = preprocessingOptions;
                          setPreprocessingOptions(rest);
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enable-outliers" className="ml-2 block text-sm text-gray-900">
                      Enable
                    </label>
                  </div>
                </div>
                
                {preprocessingOptions.outliers && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Detection Method
                      </label>
                      <select
                        value={preprocessingOptions.outliers.method}
                        onChange={(e) => setPreprocessingOptions({
                          ...preprocessingOptions,
                          outliers: {
                            ...preprocessingOptions.outliers,
                            method: e.target.value as any
                          }
                        })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="z_score">Z-Score</option>
                        <option value="iqr">IQR (Interquartile Range)</option>
                        <option value="isolation_forest">Isolation Forest</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Handling Strategy
                      </label>
                      <select
                        value={preprocessingOptions.outliers.strategy}
                        onChange={(e) => setPreprocessingOptions({
                          ...preprocessingOptions,
                          outliers: {
                            ...preprocessingOptions.outliers,
                            strategy: e.target.value as any
                          }
                        })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="remove">Remove Outliers</option>
                        <option value="cap">Cap Outliers</option>
                        <option value="replace_mean">Replace with Mean</option>
                        <option value="replace_median">Replace with Median</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Threshold
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.1"
                        value={preprocessingOptions.outliers.threshold || 1.5}
                        onChange={(e) => setPreprocessingOptions({
                          ...preprocessingOptions,
                          outliers: {
                            ...preprocessingOptions.outliers,
                            threshold: parseFloat(e.target.value)
                          }
                        })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {preprocessingOptions.outliers.method === 'z_score' 
                          ? 'Number of standard deviations' 
                          : preprocessingOptions.outliers.method === 'iqr'
                          ? 'Multiplier for IQR'
                          : 'Threshold parameter'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Encoding */}
              <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-sm font-medium text-gray-900">Categorical Encoding</h5>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enable-encoding"
                      checked={!!preprocessingOptions.encoding}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPreprocessingOptions({
                            ...preprocessingOptions,
                            encoding: {
                              strategy: 'one_hot',
                              handleUnknown: 'ignore'
                            }
                          });
                        } else {
                          const { encoding, ...rest } = preprocessingOptions;
                          setPreprocessingOptions(rest);
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enable-encoding" className="ml-2 block text-sm text-gray-900">
                      Enable
                    </label>
                  </div>
                </div>
                
                {preprocessingOptions.encoding && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Encoding Method
                      </label>
                      <select
                        value={preprocessingOptions.encoding.strategy}
                        onChange={(e) => setPreprocessingOptions({
                          ...preprocessingOptions,
                          encoding: {
                            ...preprocessingOptions.encoding,
                            strategy: e.target.value as any
                          }
                        })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="one_hot">One-Hot Encoding</option>
                        <option value="label">Label Encoding</option>
                        <option value="frequency">Frequency Encoding</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Handle Unknown
                      </label>
                      <select
                        value={preprocessingOptions.encoding.handleUnknown}
                        onChange={(e) => setPreprocessingOptions({
                          ...preprocessingOptions,
                          encoding: {
                            ...preprocessingOptions.encoding,
                            handleUnknown: e.target.value as any
                          }
                        })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="error">Raise Error</option>
                        <option value="ignore">Ignore</option>
                        <option value="infrequent">Group as Infrequent</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Scaling */}
              <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-sm font-medium text-gray-900">Feature Scaling</h5>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enable-scaling"
                      checked={!!preprocessingOptions.scaling}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPreprocessingOptions({
                            ...preprocessingOptions,
                            scaling: {
                              strategy: 'standard'
                            }
                          });
                        } else {
                          const { scaling, ...rest } = preprocessingOptions;
                          setPreprocessingOptions(rest);
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enable-scaling" className="ml-2 block text-sm text-gray-900">
                      Enable
                    </label>
                  </div>
                </div>
                
                {preprocessingOptions.scaling && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Scaling Method
                    </label>
                    <select
                      value={preprocessingOptions.scaling.strategy}
                      onChange={(e) => setPreprocessingOptions({
                        ...preprocessingOptions,
                        scaling: {
                          ...preprocessingOptions.scaling,
                          strategy: e.target.value as any
                        }
                      })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="standard">Standard Scaling (Z-score)</option>
                      <option value="min_max">Min-Max Scaling</option>
                      <option value="robust">Robust Scaling</option>
                      <option value="max_abs">Max Absolute Scaling</option>
                      <option value="normalizer">Normalizer</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {preprocessingOptions.scaling.strategy === 'standard' 
                        ? 'Standardizes features by removing the mean and scaling to unit variance' 
                        : preprocessingOptions.scaling.strategy === 'min_max'
                        ? 'Scales features to a given range, usually [0, 1]'
                        : preprocessingOptions.scaling.strategy === 'robust'
                        ? 'Scales features using statistics that are robust to outliers'
                        : preprocessingOptions.scaling.strategy === 'max_abs'
                        ? 'Scales each feature by its maximum absolute value'
                        : 'Normalizes samples individually to unit norm'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Feature Selection */}
              <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-sm font-medium text-gray-900">Feature Selection</h5>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enable-feature-selection"
                      checked={!!preprocessingOptions.featureSelection}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPreprocessingOptions({
                            ...preprocessingOptions,
                            featureSelection: {
                              strategy: 'variance',
                              threshold: 0.01
                            }
                          });
                        } else {
                          const { featureSelection, ...rest } = preprocessingOptions;
                          setPreprocessingOptions(rest);
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enable-feature-selection" className="ml-2 block text-sm text-gray-900">
                      Enable
                    </label>
                  </div>
                </div>
                
                {preprocessingOptions.featureSelection && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Selection Method
                      </label>
                      <select
                        value={preprocessingOptions.featureSelection.strategy}
                        onChange={(e) => setPreprocessingOptions({
                          ...preprocessingOptions,
                          featureSelection: {
                            ...preprocessingOptions.featureSelection,
                            strategy: e.target.value as any
                          }
                        })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="variance">Variance Threshold</option>
                        <option value="k_best">Select K Best</option>
                        <option value="correlation">Correlation Filter</option>
                        <option value="tree_importance">Tree-based Importance</option>
                      </select>
                    </div>
                    
                    {preprocessingOptions.featureSelection.strategy === 'variance' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Variance Threshold
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={preprocessingOptions.featureSelection.threshold || 0.01}
                          onChange={(e) => setPreprocessingOptions({
                            ...preprocessingOptions,
                            featureSelection: {
                              ...preprocessingOptions.featureSelection,
                              threshold: parseFloat(e.target.value)
                            }
                          })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    )}
                    
                    {preprocessingOptions.featureSelection.strategy === 'k_best' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Number of Features (K)
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={preprocessingOptions.featureSelection.k || 10}
                          onChange={(e) => setPreprocessingOptions({
                            ...preprocessingOptions,
                            featureSelection: {
                              ...preprocessingOptions.featureSelection,
                              k: parseInt(e.target.value)
                            }
                          })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    )}
                    
                    {preprocessingOptions.featureSelection.strategy === 'correlation' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Correlation Threshold
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={preprocessingOptions.featureSelection.threshold || 0.8}
                          onChange={(e) => setPreprocessingOptions({
                            ...preprocessingOptions,
                            featureSelection: {
                              ...preprocessingOptions.featureSelection,
                              threshold: parseFloat(e.target.value)
                            }
                          })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Dimensionality Reduction */}
              <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-sm font-medium text-gray-900">Dimensionality Reduction</h5>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enable-dim-reduction"
                      checked={!!preprocessingOptions.dimensionalityReduction}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPreprocessingOptions({
                            ...preprocessingOptions,
                            dimensionalityReduction: {
                              strategy: 'pca',
                              components: 5
                            }
                          });
                        } else {
                          const { dimensionalityReduction, ...rest } = preprocessingOptions;
                          setPreprocessingOptions(rest);
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enable-dim-reduction" className="ml-2 block text-sm text-gray-900">
                      Enable
                    </label>
                  </div>
                </div>
                
                {preprocessingOptions.dimensionalityReduction && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Reduction Method
                      </label>
                      <select
                        value={preprocessingOptions.dimensionalityReduction.strategy}
                        onChange={(e) => setPreprocessingOptions({
                          ...preprocessingOptions,
                          dimensionalityReduction: {
                            ...preprocessingOptions.dimensionalityReduction,
                            strategy: e.target.value as any
                          }
                        })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="pca">PCA</option>
                        <option value="tsne">t-SNE</option>
                        <option value="umap">UMAP</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Number of Components
                      </label>
                      <input
                        type="number"
                        min="2"
                        step="1"
                        value={preprocessingOptions.dimensionalityReduction.components || 5}
                        onChange={(e) => setPreprocessingOptions({
                          ...preprocessingOptions,
                          dimensionalityReduction: {
                            ...preprocessingOptions.dimensionalityReduction,
                            components: parseInt(e.target.value)
                          }
                        })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {isProcessing && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Processing</span>
                  <span className="text-sm font-medium text-gray-700">{Math.round(processingProgress)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            {showPreview && previewData && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Preview</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Row
                        </th>
                        {previewData.columns.map((column, i) => (
                          <th 
                            key={i} 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.processed.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {rowIndex + 1}
                          </td>
                          {row.map((cell, cellIndex) => (
                            <td 
                              key={cellIndex} 
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                            >
                              {cell !== null && cell !== undefined ? cell.toString() : 'null'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={savePreprocessingResult}
                    icon={<Save className="w-4 h-4" />}
                  >
                    Save Preprocessed Dataset
                  </Button>
                </div>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Preprocessing Pipeline Information</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      This pipeline will apply the following transformations in order:
                    </p>
                    <ol className="mt-2 list-decimal list-inside space-y-1">
                      {preprocessingOptions.missingValues && (
                        <li>Handle missing values using {preprocessingOptions.missingValues.strategy.replace(/_/g, ' ')}</li>
                      )}
                      {preprocessingOptions.outliers && (
                        <li>{preprocessingOptions.outliers.strategy.replace(/_/g, ' ')} outliers using {preprocessingOptions.outliers.method.replace(/_/g, ' ')} method</li>
                      )}
                      {preprocessingOptions.encoding && (
                        <li>Apply {preprocessingOptions.encoding.strategy.replace(/_/g, ' ')} encoding to categorical features</li>
                      )}
                      {preprocessingOptions.scaling && (
                        <li>Apply {preprocessingOptions.scaling.strategy.replace(/_/g, ' ')} to numeric features</li>
                      )}
                      {preprocessingOptions.featureSelection && (
                        <li>Select features using {preprocessingOptions.featureSelection.strategy.replace(/_/g, ' ')} method</li>
                      )}
                      {preprocessingOptions.dimensionalityReduction && (
                        <li>Reduce dimensionality using {preprocessingOptions.dimensionalityReduction.strategy.toUpperCase()}</li>
                      )}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'batch' && (
        <BatchProcessingManager
          dataset={dataset}
          preprocessingOptions={preprocessingOptions}
          onProcessingComplete={handleBatchProcessingComplete}
        />
      )}

      {activeTab === 'streaming' && (
        <StreamingDataProcessor
          dataset={dataset}
          preprocessingOptions={preprocessingOptions}
          onDataProcessed={handleStreamingDataProcessed}
        />
      )}
    </div>
  );
};

export default PreprocessingPipeline;

// Additional icon needed
const Info = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);