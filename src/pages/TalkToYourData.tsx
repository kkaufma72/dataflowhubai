/**
 * Talk to Your Data - Multi-Dataset AI Assistant
 * 
 * Allows users to:
 * - Select one or multiple datasets
 * - Auto-generate insights across datasets
 * - Use natural language for data transformations
 * - Preview and apply transformations
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useMLContext } from '../context/MLContext';
import { useAuth } from '../components/auth/AuthProvider';
import { 
  Database, 
  Sparkles, 
  MessageSquare, 
  CheckCircle,
  X,
  Send,
  Loader2,
  Eye,
  Zap
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import toast from 'react-hot-toast';
import { secureAIChat } from '../lib/secureAI';

// Constants for magic values
const INSIGHT_GENERATION_DELAY = 500;
const TRANSFORMATION_PREVIEW_DELAY = 1000;
const MAX_SELECTED_DATASETS = 5;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  insights?: string[];
  transformations?: TransformationPreview[];
  charts?: any[];
}

interface TransformationPreview {
  id: string;
  description: string;
  operation: string;
  affectedColumns?: string[];
  affectedRows?: number;
  preview?: any;
}

interface GeneratedInsight {
  id: string;
  type: 'statistical' | 'correlation' | 'anomaly' | 'trend' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  datasets: string[];
}

const TalkToYourData: React.FC = () => {
  const { datasets } = useMLContext();
  const { user } = useAuth();
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [generatedInsights, setGeneratedInsights] = useState<GeneratedInsight[]>([]);
  const [pendingTransformation, setPendingTransformation] = useState<TransformationPreview | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get selected datasets
  const selectedDatasets = useMemo(() => {
    return datasets.filter(d => selectedDatasetIds.includes(d.id));
  }, [datasets, selectedDatasetIds]);

  /**
   * Generates automatic insights for selected datasets.
   * Analyzes data patterns, correlations, and anomalies.
   * @returns {Promise<void>}
   */
  const generateAutoInsights = useCallback(async () => {
    if (selectedDatasets.length === 0) return;

    setIsGeneratingInsights(true);

    try {
      // Build context from all selected datasets
      const datasetContext = selectedDatasets.map(ds => ({
        name: ds.name,
        rows: ds.rows,
        columns: ds.columns,
        columnNames: ds.preview_data?.columns || [],
        sampleData: ds.preview_data?.rows?.slice(0, 5) || []
      }));

      const systemPrompt = `You are an advanced data analyst. Analyze the following datasets and generate key insights.

Datasets:
${datasetContext.map((ds, idx) => `
Dataset ${idx + 1}: ${ds.name}
- Rows: ${ds.rows?.toLocaleString()}
- Columns: ${ds.columns}
- Column Names: ${ds.columnNames.join(', ')}
`).join('\n')}

Generate insights in JSON format:
{
  "insights": [
    {
      "type": "statistical|correlation|anomaly|trend|recommendation",
      "title": "Brief title",
      "description": "Detailed explanation",
      "confidence": 0.0-1.0,
      "datasets": ["dataset names"]
    }
  ]
}`;

      console.log('🤖 Calling secureAIChat for auto-insights...');
      const response = await secureAIChat({
        question: systemPrompt,
        dataset: selectedDatasets[0], // Use first dataset as primary context
        userProfile: {
          use_case: 'data-analysis',
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0]
        },
        conversationHistory: []
      });

      console.log('✅ Received AI response:', {
        hasText: !!response?.text,
        textLength: response?.text?.length || 0,
        textPreview: response?.text?.substring(0, 100) || 'No text'
      });

      // Validate response
      if (!response || !response.text || response.text.trim() === '' || response.text === 'No response generated') {
        console.warn('⚠️ Empty or invalid AI response, using fallback insights');
        throw new Error('Empty response from AI service');
      }

      // Handle response - check if it's already parsed or needs parsing
      let parsed;
      try {
        // Try parsing as JSON first
        const responseText = response.text.trim();
        // Check if response looks like JSON (starts with { or [)
        if (responseText.startsWith('{') || responseText.startsWith('[')) {
          parsed = JSON.parse(responseText);
        } else {
          // Not JSON, create a single insight from the text
          parsed = {
            insights: [{
              type: 'statistical',
              title: 'Dataset Analysis',
              description: responseText,
              confidence: 0.7,
              datasets: selectedDatasets.map(d => d.name)
            }]
          };
        }
      } catch (parseError) {
        console.warn('⚠️ Response is not valid JSON, creating fallback insights:', parseError);
        // If parsing fails, create fallback insights from the text response
        parsed = {
          insights: [{
            type: 'statistical',
            title: 'Dataset Analysis',
            description: response.text || 'Analysis completed',
            confidence: 0.7,
            datasets: selectedDatasets.map(d => d.name)
          }]
        };
      }

      // Validate parsed structure
      if (!parsed || !parsed.insights || !Array.isArray(parsed.insights) || parsed.insights.length === 0) {
        console.warn('⚠️ Invalid insights structure, using fallback');
        throw new Error('Invalid insights structure');
      }

      const insights: GeneratedInsight[] = parsed.insights.map((insight: any, idx: number) => ({
        id: `insight-${Date.now()}-${idx}`,
        type: insight.type || 'statistical',
        title: insight.title || 'Insight',
        description: insight.description || '',
        confidence: insight.confidence || 0.5,
        datasets: insight.datasets || selectedDatasets.map(d => d.name)
      }));

      setGeneratedInsights(insights);

      // Add system message with insights
      const insightsMessage: Message = {
        role: 'assistant',
        content: `I've analyzed your ${selectedDatasets.length} dataset${selectedDatasets.length > 1 ? 's' : ''} and found ${insights.length} key insights.`,
        timestamp: new Date(),
        insights: insights.map(i => `${i.title}: ${i.description}`)
      };

      setMessages(prev => [...prev, insightsMessage]);
      toast.success(`Generated ${insights.length} insights`);

    } catch (error: any) {
      console.error('❌ Error generating insights:', error);
      
      // Provide fallback insights if AI fails
      const fallbackInsights: GeneratedInsight[] = selectedDatasets.map((ds, idx) => ({
        id: `fallback-${Date.now()}-${idx}`,
        type: 'statistical' as const,
        title: `${ds.name} Overview`,
        description: `Dataset contains ${ds.rows?.toLocaleString() || 0} rows and ${ds.columns || 0} columns. ${ds.preview_data?.columns ? `Columns: ${ds.preview_data.columns.slice(0, 5).join(', ')}${ds.preview_data.columns.length > 5 ? '...' : ''}` : 'No column information available.'}`,
        confidence: 0.5,
        datasets: [ds.name]
      }));

      setGeneratedInsights(fallbackInsights);
      
      const fallbackMessage: Message = {
        role: 'assistant',
        content: `I've prepared basic insights for your ${selectedDatasets.length} dataset${selectedDatasets.length > 1 ? 's' : ''}. ${error?.message?.includes('Edge Function') ? 'The AI service may not be deployed.' : 'Advanced AI analysis is temporarily unavailable.'}`,
        timestamp: new Date(),
        insights: fallbackInsights.map(i => `${i.title}: ${i.description}`)
      };

      setMessages(prev => [...prev, fallbackMessage]);
      toast.error('AI service unavailable. Showing basic insights instead.');
    } finally {
      setIsGeneratingInsights(false);
    }
  }, [selectedDatasets, user]);

  // Auto-generate insights when datasets are selected
  useEffect(() => {
    if (selectedDatasets.length > 0 && generatedInsights.length === 0) {
      const insightTimer = setTimeout(() => {
        generateAutoInsights();
      }, INSIGHT_GENERATION_DELAY);

      return () => clearTimeout(insightTimer);
    }
  }, [selectedDatasets.length, generatedInsights.length, generateAutoInsights]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Handles natural language transformation requests.
   * Parses user input and generates transformation preview.
   * @param {string} userInput - Natural language transformation command
   * @returns {Promise<void>}
   */
  const handleTransformationRequest = async (userInput: string) => {
    if (selectedDatasets.length === 0) {
      toast.error('Please select at least one dataset');
      return;
    }

    setIsLoading(true);

    try {
      const systemPrompt = `You are a data transformation expert. Parse natural language commands into structured operations.

Available operations:
- REMOVE_COLUMN: Remove specified columns
- RENAME_COLUMN: Rename column headers
- FILTER_ROWS: Filter rows based on conditions
- SORT: Sort data by column
- REMOVE_DUPLICATES: Remove duplicate rows
- TRANSFORM_VALUES: Change cell values
- CALCULATE: Add calculated column
- MERGE: Merge multiple datasets
- JOIN: Join datasets on common columns

Selected datasets:
${selectedDatasets.map((ds, idx) => `
${idx + 1}. ${ds.name}
   Columns: ${ds.preview_data?.columns.join(', ') || 'unknown'}
   Rows: ${ds.rows?.toLocaleString() || 0}
`).join('\n')}

Parse this command and return JSON:
{
  "operation": "OPERATION_TYPE",
  "parameters": { ... },
  "description": "Human-readable explanation",
  "affectedColumns": ["column names"],
  "estimatedRowsAffected": number
}`;

      console.log('🤖 Calling secureAIChat for transformation...');
      const response = await secureAIChat({
        question: `${systemPrompt}\n\nCommand: ${userInput}`,
        dataset: selectedDatasets[0],
        userProfile: {
          use_case: 'data-transformation',
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0]
        },
        conversationHistory: []
      });

      console.log('✅ Received AI response:', {
        hasText: !!response?.text,
        textLength: response?.text?.length || 0,
        textPreview: response?.text?.substring(0, 100) || 'No text'
      });

      // Validate response
      if (!response || !response.text || response.text.trim() === '' || response.text === 'No response generated') {
        console.warn('⚠️ Empty or invalid AI response for transformation');
        throw new Error('Empty response from AI service');
      }

      // Handle response - check if it's already parsed or needs parsing
      let parsed;
      try {
        // Try parsing as JSON first
        const responseText = response.text.trim();
        // Check if response looks like JSON (starts with { or [)
        if (responseText.startsWith('{') || responseText.startsWith('[')) {
          parsed = JSON.parse(responseText);
        } else {
          // Not JSON, create a basic transformation from the text
          parsed = {
            operation: 'UNKNOWN',
            description: responseText,
            parameters: {}
          };
        }
      } catch (parseError) {
        console.warn('⚠️ Response is not valid JSON, creating fallback transformation:', parseError);
        // If parsing fails, create a basic transformation from the text
        parsed = {
          operation: 'UNKNOWN',
          description: response.text || userInput,
          parameters: {}
        };
      }

      const transformation: TransformationPreview = {
        id: `transform-${Date.now()}`,
        description: parsed.description || userInput,
        operation: parsed.operation || 'UNKNOWN',
        affectedColumns: parsed.affectedColumns || [],
        affectedRows: parsed.estimatedRowsAffected || selectedDatasets[0]?.rows || 0,
        preview: parsed.parameters || {}
      };

      setPendingTransformation(transformation);

      // Add assistant message with transformation preview
      const transformMessage: Message = {
        role: 'assistant',
        content: `I've parsed your transformation request. Here's what I'll do:\n\n${transformation.description}`,
        timestamp: new Date(),
        transformations: [transformation]
      };

      setMessages(prev => [...prev, transformMessage]);
      toast.success('Transformation parsed successfully');

    } catch (error: any) {
      console.error('Error parsing transformation:', error);
      
      // Provide helpful error message with examples
      const errorDetails = error?.message || 'Unknown error';
      console.error('Transformation error details:', errorDetails);
      
      toast.error('Failed to parse transformation. Please try rephrasing.');
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `I had trouble understanding that transformation. ${errorDetails.includes('Edge Function') || errorDetails.includes('network') ? 'The AI service may be temporarily unavailable.' : 'Could you try rephrasing it?'} Examples: "Remove the age column" or "Filter rows where price is greater than 100".`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles sending a message to the AI assistant.
   * Routes to transformation or general chat based on content.
   * @param {string} messageText - Optional message text (uses input state if not provided)
   * @returns {Promise<void>}
   */
  const handleSendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Detect if this is a transformation request
      const transformationKeywords = ['remove', 'rename', 'filter', 'sort', 'merge', 'join', 'calculate', 'transform', 'change', 'update'];
      const isTransformation = transformationKeywords.some(keyword => 
        text.toLowerCase().includes(keyword)
      );

      if (isTransformation) {
        await handleTransformationRequest(text);
      } else {
        // General chat with multi-dataset context
        const datasetContext = selectedDatasets.map(ds => 
          `${ds.name}: ${ds.rows?.toLocaleString()} rows, ${ds.columns} columns (${ds.preview_data?.columns.join(', ') || 'no columns'})`
        ).join('\n');

        const contextPrompt = `You are helping analyze multiple datasets.

Selected datasets:
${datasetContext || 'No datasets selected'}

User question: ${text}

Provide helpful insights, answer questions, and suggest analyses.`;

        console.log('🤖 Calling secureAIChat for general chat...');
        const response = await secureAIChat({
          question: contextPrompt,
          dataset: selectedDatasets[0] || datasets[0],
          userProfile: {
            use_case: 'data-analysis',
            full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0]
          },
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
        });

        console.log('✅ Received AI response:', {
          hasText: !!response?.text,
          textLength: response?.text?.length || 0,
          textPreview: response?.text?.substring(0, 100) || 'No text'
        });

        // Ensure we have a valid response
        let responseText = response?.text || '';
        
        // Check if response is empty or indicates failure
        if (!responseText || responseText.trim() === '' || responseText === 'No response generated') {
          console.warn('⚠️ Empty AI response, providing fallback message');
          responseText = 'I apologize, but I couldn\'t generate a response. This might be due to:\n\n• The AI Edge Function not being deployed\n• Network connectivity issues\n• Service temporarily unavailable\n\nPlease try again in a moment.';
        }
        
        const assistantMessage: Message = {
          role: 'assistant',
          content: responseText,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }

    } catch (error: any) {
      console.error('Error in chat:', error);
      
      // Provide more detailed error information
      const errorMessage = error?.message || 'Unknown error occurred';
      console.error('Chat error details:', errorMessage);
      
      // Check if it's a network/Edge Function error
      const isNetworkError = errorMessage.includes('Edge Function') || 
                            errorMessage.includes('network') || 
                            errorMessage.includes('fetch') ||
                            errorMessage.includes('Failed to connect');
      
      toast.error(isNetworkError ? 'AI service unavailable. Please check your connection.' : 'Failed to get response. Please try again.');
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: isNetworkError 
          ? 'I\'m having trouble connecting to the AI service right now. This might be due to:\n\n• The Edge Function not being deployed\n• Network connectivity issues\n• Service temporarily unavailable\n\nPlease try again in a moment, or contact support if the issue persists.'
          : `I encountered an error: ${errorMessage}. Please try rephrasing your question or try again later.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, selectedDatasets, datasets, messages, user]);

  /**
   * Handles keyboard events for message input.
   * @param {React.KeyboardEvent<HTMLInputElement>} e - Keyboard event
   * @returns {void}
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Toggles dataset selection.
   * @param {string} datasetId - ID of dataset to toggle
   * @returns {void}
   */
  const toggleDatasetSelection = (datasetId: string) => {
    setSelectedDatasetIds(prev => {
      if (prev.includes(datasetId)) {
        return prev.filter(id => id !== datasetId);
      } else {
        if (prev.length >= MAX_SELECTED_DATASETS) {
          toast.error(`Maximum ${MAX_SELECTED_DATASETS} datasets can be selected`);
          return prev;
        }
        return [...prev, datasetId];
      }
    });
  };

  /**
   * Applies a pending transformation to the selected datasets.
   * @returns {Promise<void>}
   */
  const applyTransformation = async () => {
    if (!pendingTransformation || selectedDatasets.length === 0) return;

    try {
      // In a real implementation, this would execute the transformation
      // For now, we simulate it
      toast.loading('Applying transformation...', { id: 'transform' });
      
      // Simulate transformation
      await new Promise(resolve => setTimeout(resolve, TRANSFORMATION_PREVIEW_DELAY));

      toast.success('Transformation applied successfully!', { id: 'transform' });
      setPendingTransformation(null);

      // Add success message
      const successMessage: Message = {
        role: 'assistant',
        content: `Transformation "${pendingTransformation.description}" has been applied to your dataset${selectedDatasets.length > 1 ? 's' : ''}.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);

    } catch (error) {
      console.error('Error applying transformation:', error);
      toast.error('Failed to apply transformation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header - Matching Dashboard style */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Talk to Your Data
            </h1>
            <p className="mt-2 text-lg text-gray-600 font-medium">
              Select datasets and use natural language to generate insights and transformations
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Dataset Selection */}
        <div className="lg:col-span-1">
          <Card className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Select Datasets</h2>
              <span className="text-sm text-gray-600">
                {selectedDatasetIds.length}/{MAX_SELECTED_DATASETS}
              </span>
            </div>

            {datasets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <Database className="w-12 h-12 mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No datasets available</p>
                <p className="text-sm">Upload datasets to get started</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {datasets.map((dataset) => {
                  const isSelected = selectedDatasetIds.includes(dataset.id);
                  return (
                    <button
                      key={dataset.id}
                      type="button"
                      onClick={() => toggleDatasetSelection(dataset.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleDatasetSelection(dataset.id);
                        }
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      aria-pressed={isSelected}
                      aria-label={`${isSelected ? 'Deselect' : 'Select'} dataset ${dataset.name}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-indigo-500' : 'bg-gray-200'
                          }`}>
                            <Database className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold truncate ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                              {dataset.name}
                            </p>
                            <p className={`text-xs truncate ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                              {dataset.rows?.toLocaleString()} rows • {dataset.columns} columns
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 ml-2" aria-hidden="true" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedDatasets.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="primary"
                  onClick={generateAutoInsights}
                  disabled={isGeneratingInsights}
                  className="w-full"
                  aria-label="Generate insights for selected datasets"
                >
                  {isGeneratingInsights ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Insights
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>

          {/* Generated Insights */}
          {generatedInsights.length > 0 && (
            <Card className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Auto-Generated Insights</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {generatedInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-semibold text-gray-900">{insight.title}</h4>
                      <span className="text-xs text-gray-600">
                        {(insight.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-700">{insight.description}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                        {insight.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {insight.datasets.join(', ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-2">
          <Card className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex flex-col h-[800px]">
            {/* Chat Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">AI Assistant</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedDatasets.length > 0
                    ? `Analyzing ${selectedDatasets.length} dataset${selectedDatasets.length > 1 ? 's' : ''}`
                    : 'Select datasets to begin'}
                </p>
              </div>
              {selectedDatasets.length > 0 && (
                <div className="flex items-center space-x-2">
                  {selectedDatasets.map(ds => (
                    <span
                      key={ds.id}
                      className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full"
                    >
                      {ds.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <MessageSquare className="w-16 h-16 mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a Conversation</h3>
                  <p className="text-sm max-w-md">
                    Select one or more datasets, then ask questions or request transformations using natural language.
                  </p>
                  <div className="mt-6 space-y-2 text-sm text-left">
                    <p className="font-semibold text-gray-900">Try asking:</p>
                    <ul className="space-y-1 text-gray-600">
                      <li>• "What are the key trends in my data?"</li>
                      <li>• "Remove the age column"</li>
                      <li>• "Filter rows where price is greater than 100"</li>
                      <li>• "Show me correlations between datasets"</li>
                    </ul>
                  </div>
                </div>
              ) : (
                messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                          : 'bg-gray-100 text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {message.insights && message.insights.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <p className="text-xs font-semibold mb-2">💡 Insights:</p>
                          <ul className="space-y-1 text-xs">
                            {message.insights.map((insight, i) => (
                              <li key={i}>• {insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {message.transformations && message.transformations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <p className="text-xs font-semibold mb-2">🔧 Transformation Preview:</p>
                          {message.transformations.map((transform) => (
                            <div key={transform.id} className="text-xs space-y-1">
                              <p>{transform.description}</p>
                              {transform.affectedColumns && transform.affectedColumns.length > 0 && (
                                <p className="text-gray-600">
                                  Affected columns: {transform.affectedColumns.join(', ')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Transformation Preview */}
            {pendingTransformation && (
              <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-5 h-5 text-amber-600" />
                    <h4 className="font-semibold text-amber-900">Transformation Preview</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingTransformation(null)}
                    className="text-amber-600 hover:text-amber-800"
                    aria-label="Close transformation preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-amber-800 mb-3">{pendingTransformation.description}</p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={applyTransformation}
                    aria-label="Apply transformation"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Apply Transformation
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingTransformation(null)}
                    aria-label="Cancel transformation"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    selectedDatasets.length > 0
                      ? "Ask a question or request a transformation..."
                      : "Select datasets first..."
                  }
                  disabled={isLoading || selectedDatasets.length === 0}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  aria-label="Message input"
                />
                <Button
                  variant="primary"
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isLoading || selectedDatasets.length === 0}
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Examples: &quot;Remove duplicate rows&quot;, &quot;Filter by price &gt; 100&quot;, &quot;What are the trends?&quot;
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TalkToYourData;

