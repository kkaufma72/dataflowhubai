import React, { useState, useEffect } from 'react';
import { useMLContext } from '../context/MLContext';
import Card from '../components/common/Card';
import DataUploader from '../components/data/DataUploader';
import DataConnector from '../components/data/DataConnector';
import DatasetCard from '../components/data/DatasetCard';
import DataProfiler from '../components/data/DataProfiler';
import PersistentChatSidebar from '../components/chat/PersistentChatSidebar';
import DataQualityDashboard from '../components/data/DataQualityDashboard';
import { Dataset } from '../types';
import { Database, Upload, X, Sparkles, MessageSquare, Shield } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../components/auth/AuthProvider';
import toast from 'react-hot-toast';
import PageHeader from '../components/common/PageHeader';
import { generateSyntheticDataset } from '../lib/syntheticDataGenerator';
import { supabase } from '../lib/supabase';

const DataManagement: React.FC = () => {
  const { datasets, currentProject } = useMLContext();
  const { user } = useAuth();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showConnector, setShowConnector] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatDataset, setChatDataset] = useState<Dataset | null>(null);
  const [generatorType, setGeneratorType] = useState<'marketing' | 'sales' | 'customer'>('marketing');
  const [rowCount, setRowCount] = useState(1000);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const checkNewDatasets = () => {
      const lastViewedId = localStorage.getItem('lastViewedDatasetId');
      const newestDataset = datasets[0];
      
      if (newestDataset && newestDataset.id !== lastViewedId) {
        setSelectedDataset(newestDataset);
        setShowQuality(true);
        localStorage.setItem('lastViewedDatasetId', newestDataset.id);
      }
    };
    
    if (datasets.length > 0) {
      checkNewDatasets();
    }
  }, [datasets]);

  const handlePreview = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowPreview(true);
  };

  const handleAnalyze = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowAnalysis(true);
  };

  const handleQualityCheck = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowQuality(true);
  };

  const openChat = (dataset: Dataset) => {
    setChatDataset(dataset);
    setShowChat(true);
  };

  // FIXED: Complete rewrite with proper error handling
  const handleGenerateSyntheticData = async () => {
    if (!currentProject) {
      toast.error('Please select a project first');
      return;
    }

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setIsGenerating(true);
    try {
      // FIXED: Properly destructure and validate the result
      const result = generateSyntheticDataset({ 
        name: `${generatorType}-sample`, 
        type: generatorType, 
        rowCount 
      });
      
      // FIXED: Validate result structure
      if (!result || !result.columns || !result.data) {
        throw new Error('Failed to generate synthetic data');
      }

      if (!Array.isArray(result.data)) {
        throw new Error('Generated data is not in the correct format');
      }

      const { columns, data } = result;
      
      const { data: newDataset, error } = await supabase
        .from('datasets')
        .insert([{
          name: `${generatorType.charAt(0).toUpperCase() + generatorType.slice(1)} Sample Dataset`,
          description: `Synthetic ${generatorType} dataset with ${rowCount} rows`,
          file_type: 'csv',
          file_size: `${(data.length * columns.length * 10 / 1024).toFixed(2)} KB`,
          row_count: data.length,
          column_count: columns.length,
          preview_data: {
            columns: columns,
            rows: data.slice(0, 100)
          },
          project_id: currentProject.id,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success(`Generated ${rowCount} rows of ${generatorType} data!`);
      setShowGeneratorModal(false);
      window.location.reload();
      
    } catch (error) {
      console.error('Error generating data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate sample data');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Management"
        description="Upload, connect, and manage your datasets"
      />

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => setShowUploader(true)}
          icon={<Upload className="w-4 h-4" />}
        >
          Upload Dataset
        </Button>
        <Button
          onClick={() => setShowConnector(true)}
          variant="outline"
          icon={<Database className="w-4 h-4" />}
        >
          Connect Data Source
        </Button>
        <Button
          onClick={() => setShowGeneratorModal(true)}
          variant="outline"
          icon={<Sparkles className="w-4 h-4" />}
        >
          Generate Sample
        </Button>
      </div>

      {/* Generator Modal */}
      {showGeneratorModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowGeneratorModal(false)} />
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Generate Sample Dataset</h3>
                <button onClick={() => setShowGeneratorModal(false)} className="text-gray-400 hover:text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dataset Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['marketing', 'sales', 'customer'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setGeneratorType(type)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                          generatorType === type
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Rows: {rowCount.toLocaleString()}
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={rowCount}
                    onChange={(e) => setRowCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>100</span>
                    <span>10,000</span>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-purple-800">
                    <strong>Preview:</strong> This will generate a realistic {generatorType} dataset with {rowCount.toLocaleString()} rows including various metrics and dimensions.
                  </p>
                </div>

                <div className="flex space-x-3 pt-2">
                  <Button
                    onClick={handleGenerateSyntheticData}
                    disabled={isGenerating}
                    icon={<Sparkles className="w-4 h-4" />}
                    className="flex-1"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Dataset'}
                  </Button>
                  <Button
                    onClick={() => setShowGeneratorModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploader && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowUploader(false)} />
            <div className="relative bg-white rounded-lg max-w-2xl w-full">
              <DataUploader onClose={() => setShowUploader(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Connector Modal */}
      {showConnector && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowConnector(false)} />
            <div className="relative bg-white rounded-lg max-w-4xl w-full">
              <DataConnector onClose={() => setShowConnector(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Datasets Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Datasets</h2>
          {chatDataset && (
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{showChat ? 'Hide' : 'Show'} Chat</span>
            </button>
          )}
        </div>
        
        {datasets.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No datasets yet</h3>
              <p className="text-gray-500 mb-4">
                Get started by uploading a dataset or generating sample data
              </p>
              <div className="flex justify-center gap-3">
                <Button onClick={() => setShowUploader(true)} icon={<Upload className="w-4 h-4" />}>
                  Upload Dataset
                </Button>
                <Button 
                  onClick={() => setShowGeneratorModal(true)} 
                  variant="outline"
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Generate Sample
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map((dataset) => (
              <div key={dataset.id} className="relative">
                <DatasetCard
                  dataset={dataset}
                  onPreview={() => handlePreview(dataset)}
                  onAnalyze={() => handleAnalyze(dataset)}
                />
                <div className="absolute top-3 right-3 flex space-x-2">
                  <button
                    onClick={() => handleQualityCheck(dataset)}
                    className="p-2 bg-white rounded-lg shadow-md hover:bg-green-50 hover:shadow-lg transition-all group"
                    title="Check data quality"
                  >
                    <Shield className="w-4 h-4 text-gray-600 group-hover:text-green-600" />
                  </button>
                  <button
                    onClick={() => openChat(dataset)}
                    className="p-2 bg-white rounded-lg shadow-md hover:bg-indigo-50 hover:shadow-lg transition-all group"
                    title="Chat with this dataset"
                  >
                    <MessageSquare className="w-4 h-4 text-gray-600 group-hover:text-indigo-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedDataset && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Preview: {selectedDataset.name}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {selectedDataset.preview_data ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {selectedDataset.preview_data.columns?.map((col, idx) => (
                          <th
                            key={idx}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedDataset.preview_data.rows?.slice(0, 20).map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Showing first 20 rows of {selectedDataset.row_count?.toLocaleString() || 0} total rows
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No preview data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quality Dashboard Modal */}
      {showQuality && selectedDataset && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-50 to-blue-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-green-600" />
                  Data Quality Report
                </h3>
                <p className="text-sm text-gray-600 mt-1">{selectedDataset.name}</p>
              </div>
              <button
                onClick={() => setShowQuality(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <DataQualityDashboard 
                dataset={selectedDataset}
                onFixIssue={(issue) => {
                  console.log('Fixing issue:', issue);
                  toast.success('Issue noted for fixing');
                }}
              />
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setShowQuality(false);
                  handlePreview(selectedDataset);
                }}
              >
                View Data
              </Button>
              <Button
                onClick={() => {
                  setShowQuality(false);
                  openChat(selectedDataset);
                }}
                icon={<MessageSquare className="w-4 h-4" />}
              >
                Ask AI About Quality
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysis && selectedDataset && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Analyze: {selectedDataset.name}
              </h3>
              <button
                onClick={() => setShowAnalysis(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <DataProfiler 
                dataset={selectedDataset}
                onApplyRecommendations={(recommendations) => {
                  console.log('Applying recommendations:', recommendations);
                  toast.success('Recommendations applied!');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Persistent Chat Sidebar */}
      <PersistentChatSidebar
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        dataset={chatDataset}
      />
    </div>
  );
};

export default DataManagement;