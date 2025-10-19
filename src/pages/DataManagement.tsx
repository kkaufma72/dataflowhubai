import React, { useState } from 'react';
import { useMLContext } from '../context/MLContext';
import Card from '../components/common/Card';
import DataUploader from '../components/data/DataUploader';
import DataConnector from '../components/data/DataConnector';
import DatasetCard from '../components/data/DatasetCard';
import DataProfiler from '../components/data/DataProfiler';
import { Dataset } from '../types';
import { Database, Upload, X, Sparkles } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../components/auth/AuthProvider';
import toast from 'react-hot-toast';
import PageHeader from '../components/common/PageHeader';
import { generateSyntheticDataset } from '../lib/syntheticDataGenerator';
import { supabase } from '../lib/supabase';
import OpenAI from 'openai';

const DataManagement: React.FC = () => {
  const { datasets, currentProject } = useMLContext();
  const { user } = useAuth();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showConnector, setShowConnector] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [generatorType, setGeneratorType] = useState<'marketing' | 'sales' | 'customer'>('marketing');
  const [rowCount, setRowCount] = useState(1000);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChatbotQuery = async (question: string, dataset: Dataset) => {
    try {
      setIsLoadingResponse(true);
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        toast.error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
        return;
      }

      // Add user message to chat
      const userMessage = { role: 'user' as const, content: question };
      setChatMessages(prev => [...prev, userMessage]);

      // Use OpenAI SDK directly
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });

      const datasetInfo = JSON.stringify(dataset, null, 2);
      
      // Build conversation history
      const messages = [
        {
          role: "system" as const,
          content: `You are a helpful chatbot that understands datasets. Here is the dataset information:\n${datasetInfo}`
        },
        ...chatMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: "user" as const,
          content: question
        }
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || 'No response received';
      
      // Add assistant response to chat
      const assistantMessage = { role: 'assistant' as const, content: response };
      setChatMessages(prev => [...prev, assistantMessage]);
      
    } catch (error: any) {
      console.error('Chatbot error:', error);
      toast.error(`Failed: ${error.message}`);
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const openChatbot = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setChatMessages([]); // Clear previous conversation
    setShowChatbot(true);
  };

  const sendChatMessage = () => {
    if (!currentQuestion.trim() || !selectedDataset) return;
    
    handleChatbotQuery(currentQuestion, selectedDataset);
    setCurrentQuestion('');
  };

  const handlePreview = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowPreview(true);
  };

  const handleAnalyze = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowAnalysis(true);
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
      
      // Insert into database
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
          className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-pink-100"
        >
          Generate Sample Data
        </Button>
      </div>

      {/* Generator Modal */}
      {showGeneratorModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                Generate Sample Dataset
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Datasets</h2>
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
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                onPreview={() => handlePreview(dataset)}
                onAnalyze={() => handleAnalyze(dataset)}
              />
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
            <div className="p-6 border-t">
              <Button
                onClick={() => openChatbot(selectedDataset)}
              >
                Ask Chatbot About Dataset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chatbot Modal */}
      {showChatbot && selectedDataset && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                  Chat About: {selectedDataset.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">Ask questions about your dataset</p>
              </div>
              <button
                onClick={() => setShowChatbot(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Start a conversation about your dataset!</p>
                  <p className="text-sm text-gray-400 mt-2">Try asking: "What insights can you provide?" or "Summarize the key metrics"</p>
                </div>
              ) : (
                chatMessages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
              {isLoadingResponse && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-900 border border-gray-200 rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask a question about this dataset..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoadingResponse}
                />
                <Button
                  onClick={sendChatMessage}
                  disabled={isLoadingResponse || !currentQuestion.trim()}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Send
                </Button>
              </div>
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
    </div>
  );
};

export default DataManagement;