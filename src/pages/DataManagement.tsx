import React, { useState, useEffect } from 'react';
import { useMLContext } from '../context/MLContext';
import Card from '../components/common/Card';
import DataUploader from '../components/data/DataUploader';
import DataConnector from '../components/data/DataConnector';
import DatasetCard from '../components/data/DatasetCard';
import DataVersioning from '../components/data/DataVersioning';
import DataQualityChecks from '../components/data/DataQualityChecks';
import DataProfiler from '../components/data/DataProfiler';
import DataLineage from '../components/data/DataLineage';
import DataPreprocessing from '../components/data/DataPreprocessing';
import { Dataset } from '../types';
import { Database, Upload, X, Table, Plus, GitBranch, Check, GitMerge, Wand2, BarChart2 } from 'lucide-react';
import Button from '../components/common/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import toast from 'react-hot-toast';
import PageHeader from '../components/common/PageHeader';
import WorkflowSteps from '../components/workflow/WorkflowSteps';

// Helper functions moved to module scope
const isNumeric = (value: any) => {
  // First check if value is already a number
  if (typeof value === 'number') return true;
  // Then check if it's a string that can be converted to a valid number
  return typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '';
};

const isDate = (value: any) => {
  if (!value) return false;
  // Convert to string if not already
  const strValue = String(value);
  return !isNaN(Date.parse(strValue));
};

const isCategorical = (values: any[]) => {
  // Filter out null/undefined values and convert remaining to strings
  const validValues = values.filter(v => v != null).map(String);
  const uniqueValues = new Set(validValues);
  return uniqueValues.size <= Math.min(10, validValues.length * 0.2); // 20% threshold
};

const DataManagement: React.FC = () => {
  const { datasets, addDataset } = useMLContext();
  const { user } = useAuth();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showConnector, setShowConnector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState<'basic' | 'profile' | false>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'versioning' | 'quality' | 'lineage' | 'preprocessing' | 'profile'>('overview');
  const navigate = useNavigate();
  const location = useLocation();

  // Define workflow steps for data management
  const dataWorkflowSteps = [
    {
      id: 'upload',
      name: 'Upload',
      status: datasets.length > 0 ? 'completed' : 'current',
      href: '/app/data'
    },
    {
      id: 'quality',
      name: 'Quality',
      status: datasets.length > 0 ? 'current' : 'upcoming',
      href: '/app/data'
    },
    {
      id: 'preprocessing',
      name: 'Preprocessing',
      status: datasets.length > 0 ? 'upcoming' : 'upcoming',
      href: '/app/data'
    },
    {
      id: 'features',
      name: 'Features',
      status: 'upcoming',
      href: '/app/feature-engineering'
    }
  ];

  // Check for analyze parameter in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const analyzeDatasetId = searchParams.get('analyze');
    
    if (analyzeDatasetId) {
      const dataset = datasets.find(d => d.id === analyzeDatasetId);
      if (dataset) {
        setSelectedDataset(dataset);
        setShowAnalysis('basic');
      }
    }
  }, [location.search, datasets]);

  const handlePreview = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowPreview(true);
    setShowAnalysis(false);
    setShowUploader(false);
    setShowConnector(false);
    setActiveTab('overview');
  };

  const handleAnalyze = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowPreview(false);
    setShowAnalysis('basic');
    setShowUploader(false);
    setShowConnector(false);
    setActiveTab('overview');
  };

  const handleConnect = (connection: { type: string; name: string; config: Record<string, string> }) => {
    console.log('New connection:', connection);
    // Here you would typically handle the connection in your backend
    setShowConnector(false);
    toast.success(`Connected to ${connection.name}`);
  };

  const handleDatasetSelect = (datasetId: string) => {
    if (!datasetId) {
      setSelectedDataset(null);
      return;
    }
    
    // Only proceed if user is authenticated
    if (!user) {
      navigate('/signin', { state: { from: location } });
      return;
    }
    
    const dataset = datasets.find(d => d.id === datasetId);
    if (dataset) {
      setSelectedDataset(dataset);
    }
  };

  const handleCreateVersion = async (description: string) => {
    // Simulate API call to create a new version
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('New version created successfully');
  };

  const handleRestoreVersion = async (versionId: string) => {
    // Simulate API call to restore a version
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Version restored successfully');
  };

  const handleCompareVersions = (versionId1: string, versionId2: string) => {
    console.log(`Comparing versions ${versionId1} and ${versionId2}`);
    // In a real app, this would show a detailed comparison view
  };

  const handlePreprocessingComplete = (updatedDataset: Dataset) => {
    // Add the preprocessed dataset
    addDataset(updatedDataset);
    toast.success('Preprocessed dataset added to your datasets');
    
    // Update workflow steps
    const updatedSteps = [...dataWorkflowSteps];
    updatedSteps[2].status = 'completed';
    updatedSteps[3].status = 'current';
    
    // Navigate to feature engineering
    setTimeout(() => {
      navigate('/app/feature-engineering');
    }, 1500);
  };

  const renderPreviewModal = () => {
    if (!showPreview || !selectedDataset?.previewData) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowPreview(false)} />
          <div className="inline-block w-full max-w-4xl overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle">
            <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {selectedDataset.name}
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {selectedDataset.previewData.columns.map((column, i) => (
                        <th
                          key={i}
                          className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedDataset.previewData.rows.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalysis = () => {
    if (!showAnalysis || !selectedDataset?.previewData) return null;

    return (
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Dataset Analysis: {selectedDataset.name}
          </h3>
          <button
            onClick={() => setShowAnalysis(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm font-medium text-gray-500">Total Rows</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{selectedDataset.rows.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm font-medium text-gray-500">Total Columns</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{selectedDataset.columns}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm font-medium text-gray-500">File Size</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{selectedDataset.fileSize}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-sm font-medium text-gray-500">File Type</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{selectedDataset.fileType.toUpperCase()}</p>
          </div>
        </div>

        <h4 className="text-sm font-medium text-gray-700">Column Types</h4>
        <div className="mt-3">
          {(() => {
            // Analyze column types
            const columnTypes = selectedDataset.previewData.columns.reduce((acc, col, idx) => {
              const sampleValues = selectedDataset.previewData!.rows.slice(0, 100).map(row => row[idx]);
              
              // Determine column type
              const numericCount = sampleValues.filter(isNumeric).length;
              const dateCount = sampleValues.filter(isDate).length;
              const nonEmpty = sampleValues.filter(v => v && v.trim() !== '').length;

              if (numericCount / nonEmpty > 0.8) {
                acc.numeric++;
              } else if (dateCount / nonEmpty > 0.8) {
                acc.datetime++;
              } else if (isCategorical(sampleValues)) {
                acc.categorical++;
              } else {
                acc.text++;
              }
              
              return acc;
            }, { numeric: 0, categorical: 0, datetime: 0, text: 0 });

            const total = Object.values(columnTypes).reduce((a, b) => a + b, 0);
            const percentages = {
              numeric: (columnTypes.numeric / total) * 100,
              categorical: (columnTypes.categorical / total) * 100,
              datetime: (columnTypes.datetime / total) * 100,
              text: (columnTypes.text / total) * 100
            };

            return (
              <>
                <div className="flex items-center h-4 overflow-hidden rounded-full">
                  {percentages.numeric > 0 && (
                    <div 
                      className="h-full bg-indigo-500" 
                      style={{ width: `${percentages.numeric}%` }}
                    />
                  )}
                  {percentages.categorical > 0 && (
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${percentages.categorical}%` }}
                    />
                  )}
                  {percentages.datetime > 0 && (
                    <div 
                      className="h-full bg-amber-500" 
                      style={{ width: `${percentages.datetime}%` }}
                    />
                  )}
                  {percentages.text > 0 && (
                    <div 
                      className="h-full bg-rose-500" 
                      style={{ width: `${percentages.text}%` }}
                    />
                  )}
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                  {percentages.numeric > 0 && (
                    <div className="flex items-center">
                      <div className="w-3 h-3 mr-1 bg-indigo-500 rounded"></div>
                      <span>Numeric ({percentages.numeric.toFixed(1)}%)</span>
                    </div>
                  )}
                  {percentages.categorical > 0 && (
                    <div className="flex items-center">
                      <div className="w-3 h-3 mr-1 bg-emerald-500 rounded"></div>
                      <span>Categorical ({percentages.categorical.toFixed(1)}%)</span>
                    </div>
                  )}
                  {percentages.datetime > 0 && (
                    <div className="flex items-center">
                      <div className="w-3 h-3 mr-1 bg-amber-500 rounded"></div>
                      <span>Date/Time ({percentages.datetime.toFixed(1)}%)</span>
                    </div>
                  )}
                  {percentages.text > 0 && (
                    <div className="flex items-center">
                      <div className="w-3 h-3 mr-1 bg-rose-500 rounded"></div>
                      <span>Text ({percentages.text.toFixed(1)}%)</span>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <h4 className="mb-4 text-sm font-medium text-gray-700">Column Details</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Column Name</th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Sample Values</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedDataset.previewData.columns.map((column, idx) => {
                          const sampleValues = selectedDataset.previewData!.rows
                            .slice(0, 100)
                            .map(row => row[idx]);
                          
                          const numericCount = sampleValues.filter(isNumeric).length;
                          const dateCount = sampleValues.filter(isDate).length;
                          const nonEmpty = sampleValues.filter(v => v && v.trim() !== '').length;
                          
                          let type = 'Text';
                          if (numericCount / nonEmpty > 0.8) type = 'Numeric';
                          else if (dateCount / nonEmpty > 0.8) type = 'Date/Time';
                          else if (isCategorical(sampleValues)) type = 'Categorical';

                          return (
                            <tr key={column}>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{column}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{type}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {Array.from(new Set(sampleValues.slice(0, 3))).join(', ')}...
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </Card>
    );
  };

  return (
    <div>
      <PageHeader
        title="Data Management"
        description="Upload, manage, and preprocess your datasets"
        icon={Database}
        actions={
          <div className="flex space-x-3">
            <Button
              onClick={() => {
                setShowUploader(!showUploader);
                setShowConnector(false);
                setShowPreview(false);
                setShowAnalysis(false);
              }}
              icon={<Upload className="w-4 h-4" />}
            >
              Upload Dataset
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowConnector(!showConnector);
                setShowUploader(false);
                setShowPreview(false);
                setShowAnalysis(false);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Connection
            </Button>
          </div>
        }
      />

      {/* Workflow Steps */}
      <div className="mb-6">
        <WorkflowSteps steps={dataWorkflowSteps} />
      </div>

      {showUploader && (
        <div className="mb-8">
          <DataUploader />
        </div>
      )}

      {showConnector && (
        <div className="mb-8">
          <DataConnector onConnect={handleConnect} />
        </div>
      )}

      {renderPreviewModal()}
      {showAnalysis === 'basic' && renderAnalysis()}

      {selectedDataset && (
        <div className="mb-8">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg mr-4">
                  <Database className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedDataset.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedDataset.rows?.toLocaleString()} rows • {selectedDataset.columns} columns • {selectedDataset.fileType.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDataset(null)}
                >
                  Close
                </Button>
              </div>
            </div>
            
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('versioning')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'versioning'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <GitBranch className="w-4 h-4 mr-1" />
                    Versioning
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('quality')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'quality'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Check className="w-4 h-4 mr-1" />
                    Quality Checks
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('lineage')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'lineage'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <GitMerge className="w-4 h-4 mr-1" />
                    Lineage
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <BarChart2 className="w-4 h-4 mr-1" />
                    Data Profile
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('preprocessing')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'preprocessing'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Wand2 className="w-4 h-4 mr-1" />
                    Preprocessing
                  </div>
                </button>
              </nav>
            </div>
            
            {activeTab === 'overview' && renderAnalysis()}
            
            {activeTab === 'versioning' && (
              <DataVersioning 
                dataset={selectedDataset}
                onCreateVersion={handleCreateVersion}
                onRestoreVersion={handleRestoreVersion}
                onCompareVersions={handleCompareVersions}
              />
            )}
            
            {activeTab === 'quality' && (
              <DataQualityChecks 
                dataset={selectedDataset}
              />
            )}
            
            {activeTab === 'lineage' && (
              <DataLineage 
                dataset={selectedDataset}
                width={800}
                height={500}
              />
            )}
            
            {activeTab === 'profile' && (
              <DataProfiler 
                dataset={selectedDataset}
              />
            )}
            
            {activeTab === 'preprocessing' && (
              <DataPreprocessing 
                dataset={selectedDataset}
                onPreprocessingComplete={handlePreprocessingComplete}
              />
            )}
          </Card>
        </div>
      )}

      {datasets.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {datasets.map((dataset) => (
            <DatasetCard
              key={dataset.id}
              dataset={dataset}
              onPreview={handlePreview}
              onAnalyze={handleAnalyze}
            />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
            <Database className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No datasets available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload your first dataset or connect to an enterprise data source
          </p>
          <div className="flex mt-4 space-x-3">
            <Button
              onClick={() => {
                setShowUploader(true);
                setShowConnector(false);
                setShowPreview(false);
                setShowAnalysis(false);
              }}
              icon={<Upload className="w-4 h-4" />}
            >
              Upload Dataset
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowConnector(true);
                setShowUploader(false);
                setShowPreview(false);
                setShowAnalysis(false);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Connection
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DataManagement;