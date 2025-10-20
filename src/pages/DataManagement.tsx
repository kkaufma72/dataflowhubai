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

  // Auto-show quality dashboard for newly uploaded datasets
  useEffect(() => {
    const checkNewDatasets = () => {
      const lastViewedId = localStorage.getItem('lastViewedDatasetId');
      const newestDataset = datasets[0]; // Assuming newest is first
      
      if (newestDataset && newestDataset.id !== lastViewedId) {
        // Auto-open quality dashboard for new dataset
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
      const { columns, data } = generateSyntheticDataset({ 
        name: `${generatorType}-sample`, 
        type: generatorType, 
        rowCount 
      });
      
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
      toast.error('Failed to generate sample data');
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

      {/* Action Buttons */}
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
          Generate Sample Data
        </Button>
        <div className="ml-auto">
          {showChat && (
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{showChat ? 'Hide' : 'Show'} Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Dataset Grid or Empty State */}
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

      {/* Preview Modal - FIXED to support both preview_data and previewData */}
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
              {(selectedDataset.preview_data || (selectedDataset as any).previewData) ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {(selectedDataset.preview_data?.columns || (selectedDataset as any).previewData?.columns)?.map((col: string, idx: number) => (
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
                      {(selectedDataset.preview_data?.rows || (selectedDataset as any).previewData?.rows)?.slice(0, 20).map((row: any[], rowIdx: number) => (
                        <tr key={rowIdx}>
                          {row.map((cell: any, cellIdx: number) => (
                            <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Showing first 20 rows of {selectedDataset.row_count?.toLocaleString() || selectedDataset.rows?.toLocaleString() || 0} total rows
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No preview data available</p>
              )}
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
              <DataProfiler dataset={selectedDataset} />
            </div>
          </div>
        </div>
      )}

      {/* Quality Check Modal */}
      {showQuality && selectedDataset && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Data Quality: {selectedDataset.name}
              </h3>
              <button
                onClick={() => setShowQuality(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <DataQualityDashboard dataset={selectedDataset} />
            </div>
          </div>
        </div>
      )}

      {/* Sample Data Generator Modal */}
      {showGeneratorModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Generate Sample Data
              </h3>
              <button
                onClick={() => setShowGeneratorModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dataset Type
                </label>
                <select
                  value={generatorType}
                  onChange={(e) => setGeneratorType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="marketing">Marketing Campaign Data</option>
                  <option value="sales">Sales Transaction Data</option>
                  <option value="customer">Customer Behavior Data</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Rows
                </label>
                <input
                  type="number"
                  value={rowCount}
                  onChange={(e) => setRowCount(parseInt(e.target.value) || 1000)}
                  min="100"
                  max="100000"
                  step="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Recommended: 1,000 - 10,000 rows
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowGeneratorModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateSyntheticData}
                  disabled={isGenerating}
                  icon={isGenerating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Uploader Modal */}
      {showUploader && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Upload Dataset
              </h3>
              <button
                onClick={() => setShowUploader(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <DataUploader />
            </div>
          </div>
        </div>
      )}

      {/* Data Connector Modal */}
      {showConnector && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Connect Data Source
              </h3>
              <button
                onClick={() => setShowConnector(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <DataConnector />
            </div>
          </div>
        </div>
      )}

      {/* Persistent Chat Sidebar */}
      {showChat && chatDataset && (
        <PersistentChatSidebar
          dataset={chatDataset}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};

export default DataManagement;