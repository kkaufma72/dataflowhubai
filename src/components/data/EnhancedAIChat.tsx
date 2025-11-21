// Enhanced AI Chat with Streaming, Agents, and Auto-Actions
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Dataset } from '../../types';
import { Send, Sparkles, X, User, Bot, Loader2, Mic, MicOff } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { useAuth } from '../auth/AuthProvider';
import { UserProfile } from '../../utils/personalizedPrompts';
import { runAgentOrchestrator } from '../../lib/aiAgents';
import { secureAIChat } from '../../lib/secureAI';
import { getMarketingQuickActions } from '../../lib/agents/marketingAgentSimple';
import { saveConversation, loadConversation } from '../../lib/conversationMemory';
import { getContextualSystemPrompt, getContextualWelcomeMessage } from '../../lib/contextualPrompts';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

// Local implementation to prevent bundling issues - NO external dependencies
const isMarketingUser = (userProfile: UserProfile): boolean => {
  try {
    const marketingUseCases = [
      'marketing-analytics',
      'customer-insights',
      'sales-forecasting',
      'business-analytics',
      'real-estate',
      'retail'
    ];
    return marketingUseCases.includes(userProfile?.use_case || '');
  } catch (error) {
    console.error('isMarketingUser error:', error);
    return false;
  }
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  charts?: any[];
  insights?: string[];
  actions?: any[];
}

interface EnhancedAIChatProps {
  dataset: Dataset;
  onClose?: () => void;
  isModal?: boolean;
}

const generatePromptSuggestions = (dataset: Dataset): string[] => {
  const columns = dataset.preview_data?.columns?.map(col => col.toLowerCase()) ?? [];
  const hasColumn = (keywords: string[]) => columns.some(col => keywords.some(keyword => col.includes(keyword)));

  const suggestions: string[] = [];

  if (hasColumn(['date', 'time', 'month', 'year']) && hasColumn(['revenue', 'sales', 'amount', 'total'])) {
    suggestions.push('Show monthly revenue trends and highlight any seasonality.');
  }

  if (hasColumn(['customer', 'segment', 'account'])) {
    suggestions.push('Which customer segments are growing the fastest?');
  }

  if (hasColumn(['region', 'country', 'state'])) {
    suggestions.push('Compare performance by region and identify outliers.');
  }

  if (hasColumn(['category', 'product', 'sku'])) {
    suggestions.push('What are the top categories and which ones are underperforming?');
  }

  if (hasColumn(['cost', 'margin', 'profit'])) {
    suggestions.push('How are margins trending and where are we losing profitability?');
  }

  if (suggestions.length < 3) {
    suggestions.push(`Give me a quick summary of ${dataset.name}.`);
  }

  suggestions.push('What anomalies or data quality issues should I look into?');

  return Array.from(new Set(suggestions)).slice(0, 4);
};

const EnhancedAIChat: React.FC<EnhancedAIChatProps> = ({ 
  dataset, 
  onClose,
  isModal = false 
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [userContext, setUserContext] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognition = useRef<any>(null);
  const datasetPromptSuggestions = useMemo(() => generatePromptSuggestions(dataset), [dataset]);

  // Load user profile from database
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      try {
        // Load from user_profiles table
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('use_case, profession, industry, objectives')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setUserContext(profileData);
        }

        // Also set basic user profile
        setUserProfile({
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          email: user.email,
          company: user.user_metadata?.company,
          job_title: user.user_metadata?.job_title,
          use_case: profileData?.use_case || user.user_metadata?.use_case || 'general',
          linkedin_url: user.user_metadata?.linkedin_url,
        });
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Fallback to user metadata
        setUserProfile({
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          email: user.email,
          company: user.user_metadata?.company,
          job_title: user.user_metadata?.job_title,
          use_case: user.user_metadata?.use_case || 'general',
          linkedin_url: user.user_metadata?.linkedin_url,
        });
      }
    };

    loadUserProfile();
  }, [user]);

  // Optional: Only scroll on new messages if user is near bottom
  useEffect(() => {
    const scrollContainer = messagesEndRef.current?.parentElement;
    if (scrollContainer) {
      const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  // Load conversation history for this dataset
  useEffect(() => {
    const loadHistory = async () => {
      if (user && dataset.id && messages.length === 0) {
        try {
          const history = await loadConversation(user.id, dataset.id);
          
          if (history && history.length > 0) {
            const loadedMessages: Message[] = history.map((h: any) => ({
              role: h.role,
              content: h.content,
              timestamp: new Date(h.timestamp),
              charts: h.charts,
              insights: h.insights,
              actions: h.actions
            }));
            
            setMessages(loadedMessages);
            console.log(`💾 Loaded ${history.length} previous messages for ${dataset.name}`);
          }
        } catch (error) {
          console.error('Error loading conversation history:', error);
        }
      }
    };

    loadHistory();
  }, [user, dataset.id]);

  // Auto-save conversation whenever messages change
  useEffect(() => {
    const saveHistory = async () => {
      if (user && dataset.id && messages.length > 1) {
        try {
          await saveConversation(
            user.id,
            dataset.id,
            dataset.name,
            messages.map(m => ({
              role: m.role,
              content: m.content,
              timestamp: m.timestamp.toISOString(),
              charts: m.charts,
              insights: m.insights,
              actions: m.actions
            }))
          );
          console.log('💾 Conversation auto-saved');
        } catch (error) {
          console.error('Error saving conversation:', error);
        }
      }
    };

    // Debounce saves (wait 2 seconds after last message)
    const timeoutId = setTimeout(saveHistory, 2000);
    return () => clearTimeout(timeoutId);
  }, [messages, user, dataset.id, dataset.name]);

  // Initialize Web Speech API for voice input
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Auto-send after voice input
        setTimeout(() => handleSendMessage(transcript), 500);
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Voice input failed. Please try again.');
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Show personalized welcome message
  useEffect(() => {
    if (messages.length === 0 && userProfile.full_name) {
      let welcomeContent: string;
      
      // Use contextual welcome if user has completed onboarding
      if (userContext && userContext.profession) {
        welcomeContent = getContextualWelcomeMessage(userContext);
      } else {
        // Fallback to simple welcome
        const firstName = userProfile.full_name.split(' ')[0];
        const useCase = formatUseCase(userProfile.use_case);
        welcomeContent = `Hi ${firstName}! 👋 I'm your AI team of data experts, personalized for ${useCase}.\n\nI can analyze "${dataset.name}" and:\n• Find patterns and insights\n• Create perfect visualizations\n• Suggest actions\n• Clean your data\n• Train ML models\n\nWhat would you like to know?`;
      }
      
      const welcomeMessage: Message = {
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [userProfile, userContext, dataset.name, messages.length]);

  const formatUseCase = (useCase?: string) => {
    if (!useCase || useCase === 'general') return 'data analysis';
    return useCase.replace(/-/g, ' ');
  };

  const toggleVoiceInput = () => {
    if (!recognition.current) {
      toast.error('Voice input not supported in this browser');
      return;
    }

    if (isListening) {
      recognition.current.stop();
      setIsListening(false);
    } else {
      recognition.current.start();
      setIsListening(true);
      toast.success('🎤 Listening... Speak now!');
    }
  };

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
      // Use AI agent orchestrator
      const response = await runAgentOrchestrator(
        text,
        dataset,
        userProfile,
        messages
      );

      // Add AI message with potential charts/insights/actions
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        charts: response.charts,
        insights: response.insights,
        actions: response.actions
      };
      
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Error calling AI agents:', error);
      toast.error('Failed to get AI response. Please try again.');
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `I'm having trouble right now. ${error.message || 'Please try again in a moment.'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, dataset, userProfile, messages]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Quick action buttons (context-aware based on user profile)
  // Memoized to prevent re-creation on every render (which causes input focus loss)
  const quickActions = useMemo(() => {
    return isMarketingUser(userProfile) 
      ? getMarketingQuickActions(userProfile).map(qa => ({
          label: qa.label,
          action: () => handleSendMessage(qa.prompt)
        }))
      : [
          {
            label: "📊 Create Dashboard",
            action: () => handleSendMessage("Create a dashboard with the 4 most important charts for this data")
          },
          {
            label: "🧹 Clean Data",
            action: () => handleSendMessage("Analyze data quality and clean any issues automatically")
          },
          {
            label: "🔍 Find Insights",
            action: () => handleSendMessage("Find the 3 most important insights I should know about this data")
          },
          {
            label: "🤖 Suggest Model",
            action: () => handleSendMessage("What ML model should I train with this data and why?")
          }
        ];
  }, [userProfile, handleSendMessage]);

  const ChatContent = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary to-primary-600">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {isMarketingUser(userProfile) ? '🎯 AI Marketing Team' : '🤖 AI Data Team'}
            </h3>
            <p className="text-sm text-white/80">
              {isMarketingUser(userProfile) 
                ? 'Strategy, copywriting & analytics experts'
                : '6 specialist agents working for you'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[85%] ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center shadow-sm ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-primary to-primary-600' 
                  : 'bg-gradient-to-br from-primary via-primary-600 to-blue-600'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div>
                <div className={`rounded-xl px-4 py-3 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  
                  {/* Insights */}
                  {message.insights && message.insights.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-primary-600 mb-2">💡 Key Insights:</p>
                      <ul className="space-y-1">
                        {message.insights.map((insight, i) => (
                          <li key={i} className="text-xs text-gray-700">• {insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Charts */}
                  {message.charts && message.charts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-primary-600 mb-2">📊 Generated Charts:</p>
                      {message.charts.map((chart, i) => (
                        <div key={i} className="mt-2 p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-600">{chart.title || `Chart ${i + 1}`}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.actions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => toast.success(`Executing: ${action.label}`)}
                          className="text-xs px-3 py-1.5 bg-primary/10 text-primary-700 rounded-full hover:bg-indigo-200 transition"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <p className={`text-xs mt-1 px-1 ${
                  message.role === 'user' ? 'text-gray-400 text-right' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator with agent status */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary via-primary-600 to-blue-600 shadow-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200 max-w-xs">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
                  <div>
                    <p className="text-sm text-gray-900 font-medium">AI Team Working...</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Analyzing data, finding insights, creating charts
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions (show if conversation is new) */}
      {messages.length <= 2 && !isLoading && quickActions.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-primary/5">
          <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
            <Sparkles className="w-3 h-3 mr-1 text-primary" />
            {isMarketingUser(userProfile) ? '🎯 Marketing Actions:' : '⚡ Quick Actions:'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.slice(0, 6).map((qa, idx) => (
              <button
                key={idx}
                onClick={qa.action}
                className="text-xs px-3 py-2 bg-gradient-to-r from-white to-primary/5 text-primary-700 rounded-lg hover:from-primary/5 hover:to-primary/10 transition-all border border-primary/20 font-medium shadow-sm hover:shadow"
              >
                {qa.label}
              </button>
            ))}
          </div>
          {quickActions.length > 6 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              + {quickActions.length - 6} more actions available
            </p>
          )}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          {/* Voice input button */}
          <button
            onClick={toggleVoiceInput}
            className={`p-2 rounded-lg transition-all ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={isListening ? "Stop listening" : "Voice input"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening..." : `Ask about ${dataset.name}...`}
            disabled={isLoading || isListening}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
          />
          
          <Button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading || isListening}
            icon={<Send className="w-4 h-4" />}
            className="px-4"
          >
            {!isLoading && 'Send'}
          </Button>
        </div>
        
        {/* Context indicator */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <Sparkles className="w-3 h-3 mr-1 text-primary" />
            <span>
              {userProfile.use_case && `${formatUseCase(userProfile.use_case)}`}
              {userProfile.company && ` at ${userProfile.company}`}
              {userProfile.job_title && ` • ${userProfile.job_title}`}
            </span>
          </div>
          <span className="text-gray-400">
            {dataset.rows || 0} rows • {dataset.columns || 0} columns
          </span>
        </div>

        {datasetPromptSuggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {datasetPromptSuggestions.map((suggestion, index) => (
              <button
                key={`${suggestion}-${index}`}
                type="button"
                onClick={() => {
                  setInput(suggestion);
                  inputRef.current?.focus();
                }}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700 hover:border-primary hover:text-primary transition"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  // Modal version
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col">
          <ChatContent />
        </div>
      </div>
    );
  }

  // Card version (for embedding)
  return (
    <Card className="h-[700px] flex flex-col p-0 overflow-hidden shadow-xl">
      <ChatContent />
    </Card>
  );
};

export default EnhancedAIChat;
