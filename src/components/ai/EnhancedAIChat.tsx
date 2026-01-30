import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, Database, Sparkles, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import { useMLContext } from '../../context/MLContext';
import { useAuth } from '../auth/AuthProvider';
import { 
  getContextualSystemPrompt, 
  getContextualDataExample,
} from '../../lib/contextualPrompts';
import { supabase } from '../../lib/supabase';
import { getApiUrl } from '../../lib/api';
import { getAuthToken } from '../../lib/supabaseHelpers';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const EnhancedAIChat: React.FC = () => {
  const { datasets } = useMLContext();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [userContext, setUserContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user context from profile
  useEffect(() => {
    const loadUserContext = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('use_case, profession, industry, objectives')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setUserContext({
            useCase: data.use_case,
            profession: data.profession,
            industry: data.industry,
            objectives: data.objectives || [],
          });
        }
      } catch (error) {
        console.error('Error loading user context:', error);
      }
    };

    loadUserContext();
  }, [user]);

  // Welcome message removed - no introduction shown

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sample questions based on whether dataset is selected
  const sampleQuestions = selectedDataset
    ? [
        'Show me summary statistics for this dataset',
        'What are the column names and their data types?',
        'Find correlations between numerical columns',
        'Detect any missing values or outliers',
        'Suggest the best visualizations for this data',
        'What machine learning models would work best?',
      ]
    : [
        'What datasets are available?',
        'How many rows and columns does each dataset have?',
        'Compare my datasets',
        'Which dataset should I use for prediction?',
        'Show me all dataset summaries',
      ];

  const getDatasetContext = () => {
    if (!selectedDataset && datasets.length === 0) {
      return 'No datasets available. User needs to upload data first.';
    }

    if (selectedDataset) {
      const dataset = datasets.find(d => d.id === selectedDataset);
      if (dataset) {
        return `Current dataset: ${dataset.name}
Rows: ${dataset.rows}
Columns: ${dataset.columns}
File type: ${dataset.fileType}
Uploaded: ${new Date(dataset.dateUploaded).toLocaleDateString()}

Column details: ${dataset.preview_data?.columns?.join(', ') || 'Not available'}`;
      }
    }

    return `Available datasets (${datasets.length}):
${datasets.map(d => `- ${d.name} (${d.rows} rows, ${d.columns} columns)`).join('\n')}`;
  };

  const handleSend = async (messageText?: string) => {
    if (loading) return; // prevent overlapping sends

    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    const pendingMessages = [...messages, userMessage];
    
    // Build contextual system prompt based on user profile
    let systemPrompt = '';
    
    if (userContext) {
      systemPrompt = getContextualSystemPrompt(userContext);
      
      // Add data-specific example if relevant
      const dataExample = getContextualDataExample(userContext);
      systemPrompt += `\n\n${dataExample}`;
    } else {
      // Fallback to generic prompt
      systemPrompt = `You are an expert AI assistant for DataFlowHub AI, an enterprise AutoML platform. 
Help users understand and work with their datasets, build ML models, and extract insights.`;
    }
    
    // Add dataset context
    const datasetContext = getDatasetContext();
    systemPrompt += `\n\nCurrent data context:\n${datasetContext}`;
    
    // Add system context about datasets
    const systemContext: Message = {
      role: 'system',
      content: systemPrompt
    };

    setMessages(pendingMessages);
    setInput('');
    setLoading(true);

    try {
      const token = await getAuthToken();

      // Backend expects a Supabase session JWT (3 dot-separated parts), not the anon key.
      if (!token || token.split('.').length !== 3) {
        throw new Error('Please sign in to use the AI assistant');
      }

      const url = getApiUrl('/api/ai/chat');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [systemContext, ...pendingMessages],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

        const detail = (errorData as any)?.detail;
        const rawError = (errorData as any)?.error;
        const detailText =
          typeof detail === 'string'
            ? detail
            : detail != null
              ? JSON.stringify(detail)
              : '';
        const errorText =
          typeof rawError === 'string'
            ? rawError
            : rawError != null
              ? JSON.stringify(rawError)
              : '';

        throw new Error(detailText || errorText || `API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract content from response
      let content = '';
      if (data.choices && data.choices[0] && data.choices[0].message) {
        content = data.choices[0].message.content;
      } else if (typeof data === 'string') {
        content = data;
      } else {
        console.error('Unexpected response format:', data);
        content = 'Sorry, I received an unexpected response format. Please try again.';
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: content,
      };
      
      // Avoid duplicate assistant messages when the response matches the latest assistant reply
      const lastAssistant = [...pendingMessages].reverse().find(m => m.role === 'assistant');
      if (!lastAssistant || lastAssistant.content.trim() !== assistantMessage.content.trim()) {
        setMessages([...pendingMessages, assistantMessage]);
      } else {
        setMessages(pendingMessages);
      }
    } catch (error: any) {
      console.error('AI Chat Error:', error);
      // Properly extract error message from various error types
      let errorMessage = 'Sorry, there was an error processing your request. Please try again in a moment.';
      
      if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.detail) {
        errorMessage = error.detail;
      } else if (error.error) {
        errorMessage = error.error;
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    handleSend(question);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white">
      {/* Header with Dataset Selector */}
      <div className="border-b border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Data Assistant</h2>
              <p className="text-xs text-gray-500">Ask questions about your datasets</p>
            </div>
          </div>
        </div>

        {/* Dataset Selector */}
        {datasets.length > 0 && (
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-gray-400" />
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="">All Datasets ({datasets.length})</option>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name} ({dataset.rows} rows, {dataset.columns} cols)
                </option>
              ))}
            </select>
          </div>
        )}

        {datasets.length === 0 && (
          <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-800">No datasets available. Upload data to get started!</p>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-8 py-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-10 h-10 text-indigo-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-center max-w-md space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">
                What would you like to know?
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Ask questions about your data, get insights, or explore datasets using natural language
              </p>
            </div>

            {/* Sample Questions */}
            <div className="w-full max-w-2xl space-y-4">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Try asking:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sampleQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-left px-4 py-3.5 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md transition-all duration-200 text-sm text-gray-700 hover:text-indigo-700 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-200"></div>
                    <div className="relative flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 mt-0.5 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                      <span className="leading-snug">{question}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-md'
                    : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                }`}>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-white border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Loader className="w-4 h-4 animate-spin text-primary-600" />
                    <span className="text-sm text-gray-600">Analyzing your data...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4 shadow-lg">
        {/* Quick Actions (when chat has started) */}
        {messages.length > 0 && sampleQuestions.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {sampleQuestions.slice(0, 3).map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickQuestion(question)}
                className="group px-3 py-1.5 text-xs bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 border border-gray-200 hover:border-indigo-300 rounded-full transition-all duration-200 font-medium flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                {question}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={selectedDataset ? "Ask about this dataset..." : "Ask about your data..."}
            disabled={loading}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-600 text-white rounded-xl hover:from-primary-700 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <p className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send • Shift + Enter for new line
        </p>
      </div>
    </div>
  );
};

export default EnhancedAIChat;
