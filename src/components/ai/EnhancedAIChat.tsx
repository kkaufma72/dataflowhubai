import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, Database, Check, X, RefreshCw, Lightbulb,
  ChevronDown
} from 'lucide-react';
import { useMLContext } from '../../context/MLContext';
import OpenAI from 'openai';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const EnhancedAIChat: React.FC = () => {
  const { datasets, models } = useMLContext();
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Hi! I'm your AI data assistant. I have access to all your datasets and can help you analyze them, create visualizations, train models, or answer any questions. What would you like to explore?",
    timestamp: new Date(),
    suggestions: [
      "Show me an overview of all my datasets",
      "Compare trends across datasets",
      "Train a prediction model",
      "Create a visualization"
    ]
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>(
    datasets.map(d => d.id)
  );
  const [showDatasetPanel, setShowDatasetPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Update selected datasets when datasets change
    setSelectedDatasets(datasets.map(d => d.id));
  }, [datasets]);

  const buildContextPrompt = () => {
    const activeDatasets = datasets.filter(d => selectedDatasets.includes(d.id));
    
    const datasetInfo = activeDatasets.map(dataset => `
Dataset: ${dataset.name}
Rows: ${dataset.row_count || 'Unknown'}
Columns: ${JSON.stringify(dataset.preview_data?.columns || [])}
Sample Data: ${JSON.stringify(dataset.preview_data?.rows?.slice(0, 3) || [])}
---
    `).join('\n');

    const modelsInfo = models.length > 0 ? `
Available Models:
${models.map(m => `- ${m.name} (${m.algorithm}, Status: ${m.status})`).join('\n')}
    ` : 'No models trained yet.';

    return `You are an AI assistant for DataFlowHub, an AutoML platform. You have access to the following data:

${datasetInfo}

${modelsInfo}

You can help users:
1. Analyze data across multiple datasets
2. Create visualizations
3. Train machine learning models
4. Answer questions about their data
5. Generate insights and recommendations

Provide clear, actionable responses. When appropriate, suggest specific actions the user can take.`;
  };

  const handleSendMessage = async (text = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

      if (!apiKey) {
        toast.error('OpenAI API key not configured');
        setIsLoading(false);
        return;
      }

      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });

      const contextPrompt = buildContextPrompt();

      const chatMessages = [
        {
          role: "system" as const,
          content: contextPrompt
        },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: "user" as const,
          content: text
        }
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content || 'No response received';

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        suggestions: generateSmartSuggestions(response, text)
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error('Failed to get response');
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSmartSuggestions = (response: string, query: string): string[] => {
    const suggestions: string[] = [];
    
    if (response.toLowerCase().includes('visualization') || response.toLowerCase().includes('chart')) {
      suggestions.push('Create this visualization for me');
    }
    
    if (response.toLowerCase().includes('model') || response.toLowerCase().includes('train')) {
      suggestions.push('Start training this model');
    }
    
    if (response.toLowerCase().includes('data') || response.toLowerCase().includes('dataset')) {
      suggestions.push('Show me more details about this data');
    }
    
    suggestions.push('Explain this in more detail');
    
    return suggestions;
  };

  const toggleDataset = (datasetId: string) => {
    setSelectedDatasets(prev => 
      prev.includes(datasetId) 
        ? prev.filter(id => id !== datasetId)
        : [...prev, datasetId]
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Assistant</h2>
              <p className="text-sm text-gray-500">
                {selectedDatasets.length} of {datasets.length} datasets active
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowDatasetPanel(!showDatasetPanel)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors flex items-center space-x-2"
          >
            <Database className="w-4 h-4" />
            <span>Datasets</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showDatasetPanel ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dataset Selection Panel */}
      {showDatasetPanel && (
        <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Select Active Datasets</h3>
            <button
              onClick={() => setShowDatasetPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {datasets.map(dataset => (
              <button
                key={dataset.id}
                onClick={() => toggleDataset(dataset.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedDatasets.includes(dataset.id)
                    ? 'bg-white border-indigo-500 shadow-sm'
                    : 'bg-white border-gray-200 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">{dataset.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {dataset.row_count || 0} rows
                    </div>
                  </div>
                  {selectedDatasets.includes(dataset.id) && (
                    <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((message, idx) => (
          <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
              {message.role === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">AI Assistant</span>
                </div>
              )}
              
              <div className={`rounded-2xl p-4 ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>

                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                      <Lightbulb className="w-3 h-3" />
                      <span>Try asking:</span>
                    </div>
                    {message.suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(suggestion)}
                        className="block w-full text-left px-3 py-2 bg-white hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors border border-gray-200"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-400 mt-1 px-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-3xl mr-12">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">AI Assistant</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span className="text-sm text-gray-600">Analyzing your data...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask anything about your data..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={1}
            />
          </div>
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send • Shift + Enter for new line
        </div>
      </div>
    </div>
  );
};

export default EnhancedAIChat;