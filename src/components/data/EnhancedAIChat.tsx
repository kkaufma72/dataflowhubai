// Enhanced AI Chat with Streaming, Agents, Auto-Actions, and Model Narratives
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Dataset, MLModel } from '../../types';
import { Send, Sparkles, X, User, Bot, Loader2, Mic, MicOff, Brain, Target, Crown, Lock } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { useAuth } from '../auth/AuthProvider';
import { UserProfile } from '../../utils/personalizedPrompts';
import { runAgentOrchestrator, generateRichModelResponse, generatePredictionExplanation } from '../../lib/aiAgents';
import { secureAIChat } from '../../lib/secureAI';
import { getMarketingQuickActions } from '../../lib/agents/marketingAgentSimple';
import { saveConversation, loadConversation } from '../../lib/conversationMemory';
import { getContextualSystemPrompt, getContextualWelcomeMessage } from '../../lib/contextualPrompts';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { StreamingMessage } from '../chat/StreamingMessage';
import { EnhancedLoadingIndicator } from '../chat/EnhancedLoadingIndicator';
import { useMLContext } from '../../context/MLContext';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { UpgradePrompt, UsageLimitWarning } from '../common/UpgradePrompt';
import '../../styles/chat-animations.css';

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
  isStreaming?: boolean;
  streamComplete?: boolean;
  modelMetrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
  };
}

interface EnhancedAIChatProps {
  dataset: Dataset;
  onClose?: () => void;
  isModal?: boolean;
}

// Check if dataset is from FRED
const isFREDDataset = (dataset: Dataset): boolean => {
  return dataset.source === 'FRED' || 
         dataset.metadata?.source === 'FRED' ||
         dataset.tags?.includes('fred') ||
         dataset.tags?.includes('economic');
};

// Get FRED-specific context for the AI
const getFREDContext = (dataset: Dataset): string => {
  const metadata = dataset.metadata || {};
  const seriesInfo = metadata.series || {};
  
  let context = `\n\n## FRED Economic Dataset Information\n`;
  context += `- **Series ID**: ${seriesInfo.id || metadata.series_id || 'Unknown'}\n`;
  context += `- **Title**: ${seriesInfo.title || dataset.name}\n`;
  
  if (seriesInfo.units || metadata.units) {
    context += `- **Units**: ${seriesInfo.units || metadata.units}\n`;
  }
  if (seriesInfo.frequency || metadata.frequency) {
    context += `- **Frequency**: ${seriesInfo.frequency || metadata.frequency}\n`;
  }
  if (seriesInfo.seasonal_adjustment || metadata.seasonal_adjustment) {
    context += `- **Seasonal Adjustment**: ${seriesInfo.seasonal_adjustment || metadata.seasonal_adjustment}\n`;
  }
  if (seriesInfo.notes || metadata.notes) {
    context += `- **Notes**: ${(seriesInfo.notes || metadata.notes).substring(0, 500)}...\n`;
  }
  if (metadata.observation_start) {
    context += `- **Date Range**: ${metadata.observation_start} to ${metadata.observation_end || 'present'}\n`;
  }
  
  context += `\n### Economic Data Analysis Guidelines:\n`;
  context += `- This is official Federal Reserve economic data from FRED (Federal Reserve Economic Data)\n`;
  context += `- When analyzing trends, consider economic cycles, recessions (shaded in FRED charts), and policy changes\n`;
  context += `- Key economic indicators to reference: GDP, inflation (CPI), unemployment rate, interest rates (Fed Funds)\n`;
  context += `- Consider seasonal patterns and year-over-year comparisons for accurate analysis\n`;
  context += `- Be specific about time periods when discussing changes or trends\n`;
  
  return context;
};

// Generate FRED-specific prompt suggestions
const generateFREDPromptSuggestions = (dataset: Dataset): string[] => {
  const metadata = dataset.metadata || {};
  const seriesId = metadata.series?.id || metadata.series_id || '';
  const seriesTitle = metadata.series?.title || dataset.name;
  
  const suggestions: string[] = [];
  
  // Common economic indicators with specific questions
  const economicQuestions: Record<string, string[]> = {
    'GDP': [
      'What is the current GDP growth rate and how does it compare to historical averages?',
      'Identify recession periods and their impact on GDP',
      'What factors are driving current GDP trends?'
    ],
    'CPI': [
      'What is the current inflation rate and is it above the Fed target of 2%?',
      'Which periods showed the highest inflation and what caused them?',
      'How has inflation trended over the past year?'
    ],
    'UNRATE': [
      'What is the current unemployment rate compared to natural rate of unemployment?',
      'How does this compare to pre-pandemic levels?',
      'What trends do you see in the labor market?'
    ],
    'FEDFUNDS': [
      'What is the current federal funds rate and recent Fed policy direction?',
      'How have interest rate changes correlated with economic conditions?',
      'What does the rate trajectory suggest about Fed policy?'
    ],
    'DGS10': [
      'What is the current 10-year Treasury yield indicating about market expectations?',
      'Is there an inverted yield curve (compare to 2-year)?',
      'What does this suggest about future economic conditions?'
    ],
    'HOUST': [
      'What are current housing starts indicating about the real estate market?',
      'How does this compare to pre-2008 levels?',
      'What seasonal patterns exist in housing starts?'
    ],
    'RETAIL': [
      'What are the trends in retail sales and consumer spending?',
      'How has e-commerce affected retail patterns?',
      'What seasonal adjustments should be considered?'
    ]
  };
  
  // Check if series ID matches known indicators
  for (const [key, questions] of Object.entries(economicQuestions)) {
    if (seriesId.toUpperCase().includes(key) || seriesTitle.toUpperCase().includes(key)) {
      suggestions.push(...questions.slice(0, 2));
      break;
    }
  }
  
  // Generic FRED questions if no specific match
  if (suggestions.length === 0) {
    suggestions.push(`What are the key trends in ${seriesTitle}?`);
    suggestions.push('How has this indicator performed during recessions?');
    suggestions.push('What seasonal patterns exist in this data?');
  }
  
  // Always add these
  suggestions.push('Calculate the year-over-year percent change');
  suggestions.push('What economic factors influence this indicator?');
  
  return suggestions.slice(0, 4);
};

const generatePromptSuggestions = (dataset: Dataset): string[] => {
  // Check if this is a FRED dataset
  if (isFREDDataset(dataset)) {
    return generateFREDPromptSuggestions(dataset);
  }
  
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

// Detect if question is about models/predictions
const isModelQuestion = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  const modelKeywords = [
    'model', 'predict', 'prediction', 'forecast', 'accuracy', 'precision', 'recall',
    'f1', 'performance', 'training', 'trained', 'results', 'evaluation', 'evaluate',
    'explain the model', 'how did the model', 'why did the model', 'model summary',
    'classification', 'regression', 'cluster', 'what did the model learn',
    'conclusion', 'findings', 'outcome', 'summarize the model'
  ];
  return modelKeywords.some(kw => lowerText.includes(kw));
};

const EnhancedAIChat: React.FC<EnhancedAIChatProps> = React.memo(({
  dataset,
  onClose,
  isModal = false
}) => {
  const { user } = useAuth();
  const { models } = useMLContext();
  const { 
    tier,
    canUseRichNarratives, 
    trackUsage, 
    getRemainingUsage,
    hasReachedLimit,
    shouldShowUpgrade 
  } = useFeatureAccess();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [userContext, setUserContext] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognition = useRef<any>(null);
  const hasShownWelcomeRef = useRef(false);
  const datasetPromptSuggestions = useMemo(() => generatePromptSuggestions(dataset), [dataset]);
  const welcomeStorageKey = useMemo(
    () => (user ? `dfh-welcome-${user.id}-${dataset.id}` : `dfh-welcome-${dataset.id}`),
    [user?.id, dataset.id]
  );

  // Get models trained on this dataset
  const relatedModels = useMemo(() => {
    return models.filter(m => m.datasetId === dataset.id || m.dataset_id === dataset.id);
  }, [models, dataset.id]);

  // Remaining rich narrative usage
  const remainingNarratives = getRemainingUsage('richNarrativesPerMonth');

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

  // Load conversation history for this dataset on mount (runs ONCE)
  useEffect(() => {
    const loadHistory = async () => {
      if (!user || !dataset.id || messages.length > 0) {
        return;
      }
      
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
          hasShownWelcomeRef.current = true;
          localStorage.setItem(welcomeStorageKey, 'true');
          console.log(`💾 Loaded ${history.length} previous messages for ${dataset.name}`);
        }
      } catch (error) {
        console.error('Error loading conversation history:', error);
      }
    };

    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

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

  // Show personalized welcome message (only if no history loaded)
  useEffect(() => {
    // Check if already shown or if messages already exist
    if (hasShownWelcomeRef.current || messages.length > 0 || !userProfile.full_name) {
      return;
    }
    
    // Check localStorage
    const hasShownBefore = localStorage.getItem(welcomeStorageKey) === 'true';
    if (hasShownBefore) {
      hasShownWelcomeRef.current = true;
      return;
    }
    
    // Add small delay to ensure history loading finishes first
    const timer = setTimeout(() => {
      // Double-check messages haven't been loaded
      if (messages.length > 0) {
        return;
      }
      
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
      
      // Set the ref and localStorage BEFORE updating state
      hasShownWelcomeRef.current = true;
      localStorage.setItem(welcomeStorageKey, 'true');
      setMessages([welcomeMessage]);
    }, 100);
    
    return () => clearTimeout(timer);
    // Only run when userProfile or userContext changes, NOT when messages change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile.full_name, userContext, dataset.name, welcomeStorageKey]);

  const formatUseCase = (useCase?: string) => {
    if (!useCase) return 'data analysis';
    const normalized = useCase.replace(/-/g, ' ');
    if (normalized === 'general') return 'data analysis';
    return normalized;
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
    // Get input value from ref to avoid dependency on input state
    const text = messageText || inputRef.current?.value?.trim() || '';
    if (!text || isLoading) return;

    // Add user message with animation
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let responseText = '';
      let responseCharts: any[] = [];
      let responseInsights: string[] = [];
      let responseActions: any[] = [];
      let responseModelMetrics: Message['modelMetrics'] = undefined;

      // Check if this is a model-related question and we have models
      if (isModelQuestion(text) && relatedModels.length > 0) {
        // Use the most recent trained model, or the best performing one
        const targetModel = relatedModels.find(m => m.status === 'trained' || m.status === 'deployed') 
          || relatedModels[0];
        
        if (targetModel) {
          // Check if user can use rich narratives (Pro feature)
          if (canUseRichNarratives) {
            // Track usage
            const canProceed = await trackUsage('richNarrativesPerMonth');
            
            if (canProceed) {
              // Generate rich model narrative
              responseText = await generateRichModelResponse(targetModel, dataset, text);
              responseInsights = [
                `Model: ${targetModel.name}`,
                `Algorithm: ${targetModel.type || targetModel.algorithm || 'Unknown'}`,
                `Status: ${targetModel.status || 'Unknown'}`,
                `📊 ${remainingNarratives - 1} rich analyses remaining this month`
              ];
              
              // Extract model metrics for visual display
              const metrics = targetModel.metrics || {};
              responseModelMetrics = {
                accuracy: metrics.accuracy,
                precision: metrics.precision,
                recall: metrics.recall,
                f1Score: metrics.f1Score || metrics.f1
              };
            } else {
              // Usage limit reached
              responseText = `## 📊 Monthly Limit Reached\n\nYou've used all your rich model narratives for this month.\n\n### Quick Summary\n- **Model**: ${targetModel.name}\n- **Accuracy**: ${((targetModel.metrics?.accuracy || 0) * 100).toFixed(1)}%\n- **Status**: ${targetModel.status}\n\n---\n\n**💎 Upgrade to Pro** for unlimited rich model analyses with detailed insights, recommendations, and explanations.\n\nYour limit resets next month, or upgrade now for immediate access!`;
            }
          } else {
            // Pro feature - show preview with upgrade prompt
            const accuracy = (targetModel.metrics?.accuracy || 0) * 100;
            responseText = `## 📊 Model Overview\n\n**${targetModel.name}** achieved **${accuracy.toFixed(1)}% accuracy**.\n\n---\n\n### 💎 Unlock Full Analysis\n\nUpgrade to **Pro** to get:\n- Complete model summary from start to finish\n- Detailed reasoning behind predictions\n- Performance analysis in plain English\n- Actionable recommendations\n- Feature importance insights\n\n*This is a preview. The full rich narrative feature is available with Pro.*`;
            
            responseInsights = [
              '🔒 Rich narratives are a Pro feature',
              `Model: ${targetModel.name}`,
              `Accuracy: ${accuracy.toFixed(1)}%`
            ];
          }
        } else {
          // No trained model yet, explain what's needed
          responseText = `## 🔬 No Trained Model Yet\n\nI don't see a trained model for this dataset yet. To get detailed model insights:\n\n1. **Go to Model Training** → Select this dataset\n2. **Configure your model** → Choose algorithm, target, and features\n3. **Train the model** → Wait for training to complete\n4. **Come back here** → I'll give you a comprehensive analysis!\n\n### What I Can Tell You Now\n\nBased on your data, here are some observations:\n- **Rows**: ${dataset.rows || dataset.row_count || 0} observations\n- **Columns**: ${dataset.columns || dataset.column_count || 0} features\n\nWould you like me to analyze the data first to help you choose the right model?`;
        }
      } else {
        // Use standard AI agent orchestrator for non-model questions
        const response = await runAgentOrchestrator(
          text,
          dataset,
          userProfile,
          messages
        );
        responseText = response.text;
        responseCharts = response.charts || [];
        responseInsights = response.insights || [];
        responseActions = response.actions || [];
      }

      // Add AI message with streaming enabled
      const assistantMessage: Message = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        charts: responseCharts.length > 0 ? responseCharts : undefined,
        insights: responseInsights.length > 0 ? responseInsights : undefined,
        actions: responseActions.length > 0 ? responseActions : undefined,
        modelMetrics: responseModelMetrics,
        isStreaming: true,
        streamComplete: false
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // Play subtle notification sound (optional)
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTWH0fPTgjMGHm7A7+OZTA0PV6vn77BdGAg+ldb0y3MlBSp+zPDblzwKFlyx6OylUhILTKXh8bllHAU7j9X0z3opBSl9zPDemEAMFV2y6OynVRQMUKjj8bllHAU7j9X0z3opBSl9zPDemEAMFV2y6OynVRQMUKjj8bllHAU7j9X0z3opBSl9zPDemEAM'); 
        audio.volume = 0.2;
        audio.play().catch(() => {}); // Ignore errors if autoplay blocked
      } catch (e) {}

    } catch (error: any) {
      console.error('Error calling AI agents:', error);
      toast.error('Failed to get AI response. Please try again.');
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `I'm having trouble right now. ${error.message || 'Please try again in a moment.'}`,
        timestamp: new Date(),
        isStreaming: false,
        streamComplete: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, dataset, userProfile, messages, relatedModels, canUseRichNarratives, trackUsage, remainingNarratives]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Quick action buttons (context-aware based on user profile and available models)
  // Memoized to prevent re-creation on every render (which causes input focus loss)
  const quickActions = useMemo(() => {
    // If we have trained models, show model-focused actions
    const trainedModels = relatedModels.filter(m => m.status === 'trained' || m.status === 'deployed');

    if (trainedModels.length > 0) {
      return [
        {
          label: "📊 Full Model Summary",
          prompt: "Give me a complete summary of the model from start to finish - the data, methodology, findings, and conclusions"
        },
        {
          label: "🎯 Why These Results?",
          prompt: "Explain why the model came to these conclusions. What patterns did it find and what drives the predictions?"
        },
        {
          label: "⚡ Key Performance",
          prompt: "Analyze the model's accuracy, precision, recall and explain what these metrics mean for my use case"
        },
        {
          label: "💡 Recommendations",
          prompt: "Based on the model results, what actions should I take? What are the business implications?"
        }
      ];
    }

    // Marketing user actions
    if (isMarketingUser(userProfile)) {
      return getMarketingQuickActions(userProfile).map(qa => ({
        label: qa.label,
        prompt: qa.prompt
      }));
    }

    // Default data analysis actions
    return [
      {
        label: "📊 Create Dashboard",
        prompt: "Create a dashboard with the 4 most important charts for this data"
      },
      {
        label: "🧹 Clean Data",
        prompt: "Analyze data quality and clean any issues automatically"
      },
      {
        label: "🔍 Find Insights",
        prompt: "Find the 3 most important insights I should know about this data"
      },
      {
        label: "🤖 Suggest Model",
        prompt: "What ML model should I train with this data and why?"
      }
    ];
  }, [userProfile, relatedModels]);

  // Memoize callback for StreamingMessage onComplete
  const handleStreamComplete = useCallback((messageIndex: number) => {
    setMessages(prev => prev.map((m, i) =>
      i === messageIndex ? { ...m, streamComplete: true } : m
    ));
  }, []);

  const chatContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary to-primary-600">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              {isMarketingUser(userProfile) ? '🎯 AI Marketing Team' : '🤖 AI Data Team'}
              {tier === 'pro' || tier === 'team' || tier === 'enterprise' ? (
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-400 text-amber-900 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  {tier.toUpperCase()}
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-medium bg-white/20 text-white rounded-full">
                  FREE
                </span>
              )}
            </h3>
            <p className="text-sm text-white/80">
              {isMarketingUser(userProfile) 
                ? 'Strategy, copywriting & analytics experts'
                : tier === 'free' 
                  ? `${remainingNarratives} rich analyses left • Upgrade for more`
                  : '6 specialist agents working for you'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tier === 'free' && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-3 py-1.5 bg-amber-400 text-amber-900 text-sm font-semibold rounded-lg hover:bg-amber-300 transition-colors flex items-center gap-1"
            >
              <Crown className="w-4 h-4" />
              Upgrade
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradePrompt
          feature="rich_narratives"
          tier="pro"
          variant="modal"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-popIn`}
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
              <div className="flex-1">
                {message.role === 'user' ? (
                  // User message - simple display
                  <>
                    <div className="rounded-xl px-4 py-3 shadow-sm bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                    <p className="text-xs mt-1 px-1 text-gray-400 text-right">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </>
                ) : (
                  // Assistant message - with streaming effect
                  <>
                    <StreamingMessage
                      content={message.content}
                      insights={message.insights}
                      charts={message.charts}
                      actions={message.actions}
                      modelMetrics={message.modelMetrics}
                      speed={80} // Faster streaming for better UX
                      onComplete={() => handleStreamComplete(idx)}
                    />
                    <p className="text-xs mt-1 px-1 text-gray-400">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Enhanced Loading indicator */}
        {isLoading && <EnhancedLoadingIndicator />}

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
                onClick={() => handleSendMessage(qa.prompt)}
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
            onKeyDown={handleKeyPress}
            placeholder={isListening ? "Listening..." : `Ask about ${dataset.name}...`}
            disabled={isLoading || isListening}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
            autoComplete="off"
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
          {chatContent}
        </div>
      </div>
    );
  }

  // Card version (for embedding)
  return (
    <Card className="h-[700px] flex flex-col p-0 overflow-hidden shadow-xl">
      {chatContent}
    </Card>
  );
});

EnhancedAIChat.displayName = 'EnhancedAIChat';

export default EnhancedAIChat;
