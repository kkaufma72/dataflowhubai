import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, Database, Sparkles, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import { useMLContext } from '../../context/MLContext';
import { useAuth } from '../auth/AuthProvider';
import { useUser } from '../../context/UserContext';
import { 
  getContextualSystemPrompt, 
  getContextualDataExample, 
  getContextualWelcomeMessage 
} from '../../lib/contextualPrompts';
import { supabase } from '../../lib/supabase';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Context-specific prompts based on use case
const getUseCasePrompt = (useCase: string): string => {
  const prompts: Record<string, string> = {
    'business-analytics': 'Focus on helping users analyze business KPIs, revenue trends, and operational metrics. Provide insights on how to improve business performance and identify opportunities.',
    'customer-insights': 'Help users understand customer behavior, segmentation, churn analysis, and lifetime value. Focus on actionable insights for customer acquisition and retention.',
    'predictive-maintenance': 'Assist with predicting equipment failures, maintenance scheduling, and anomaly detection. Focus on reducing downtime and optimizing maintenance costs.',
    'fraud-detection': 'Help identify fraudulent patterns, suspicious transactions, and security threats. Provide guidance on anomaly detection and risk scoring.',
    'recommendation-systems': 'Assist with building recommendation engines, collaborative filtering, and personalization algorithms. Focus on improving user engagement and conversion.',
    'healthcare': 'Help with medical data analysis, patient outcomes prediction, and clinical decision support. Always emphasize privacy and ethical considerations.',
    'finance': 'Assist with financial forecasting, risk assessment, and portfolio optimization. Focus on time series analysis and volatility modeling.',
    'marketing': 'Help optimize marketing campaigns, customer acquisition costs, and conversion funnels. Focus on ROI and attribution analysis.',
    'supply-chain': 'Assist with demand forecasting, inventory optimization, and logistics planning. Focus on reducing costs and improving efficiency.',
    'general': 'Provide general data science guidance, covering various ML algorithms, feature engineering, and model evaluation.',
  };
  
  return prompts[useCase] || prompts['general'];
};

const EnhancedAIChat: React.FC = () => {
  const { datasets } = useMLContext();
  const { user } = useAuth();
  const { userProfile } = useUser();
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

  // Show welcome message with context
  useEffect(() => {
    if (userContext && messages.length === 0) {
      const welcomeMessage = getContextualWelcomeMessage(userContext);
      setMessages([{
        role: 'assistant',
        content: welcomeMessage
      }]);
    }
  }, [userContext]);

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
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    
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

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [systemContext, ...messages, userMessage],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices[0].message.content,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please check your API key and try again.',
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