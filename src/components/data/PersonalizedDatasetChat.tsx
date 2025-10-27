import React, { useState, useEffect, useRef } from 'react';
import { Dataset } from '../../types';
import { MessageSquare, Send, Sparkles, X, User, Bot, Loader2 } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { useAuth } from '../auth/AuthProvider';
import { 
  buildPersonalizedSystemPrompt, 
  getSuggestedQuestions, 
  formatAIResponse,
  UserProfile,
  DatasetChatContext
} from '../../utils/personalizedPrompts';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PersonalizedDatasetChatProps {
  dataset: Dataset;
  onClose?: () => void;
  isModal?: boolean;
}

const PersonalizedDatasetChat: React.FC<PersonalizedDatasetChatProps> = ({ 
  dataset, 
  onClose,
  isModal = false 
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load user profile from Supabase auth metadata
  useEffect(() => {
    if (user) {
      setUserProfile({
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        email: user.email,
        company: user.user_metadata?.company,
        job_title: user.user_metadata?.job_title,
        use_case: user.user_metadata?.use_case || 'general',
        linkedin_url: user.user_metadata?.linkedin_url,
      });
    }
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show welcome message on first load
  useEffect(() => {
    if (messages.length === 0 && userProfile.full_name) {
      const firstName = userProfile.full_name.split(' ')[0];
      const welcomeMessage: Message = {
        role: 'assistant',
        content: `Hi ${firstName}! 👋 I'm your AI assistant, personalized for ${formatUseCase(userProfile.use_case)}. I can help you analyze "${dataset.name}". What would you like to know?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [userProfile, dataset.name]);

  const formatUseCase = (useCase?: string) => {
    if (!useCase || useCase === 'general') return 'data analysis';
    return useCase.replace(/-/g, ' ');
  };

  const handleSendMessage = async (messageText?: string) => {
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
      // Build personalized context
      const context: DatasetChatContext = {
        dataset,
        userProfile,
        conversationHistory: messages
      };

      // Call secure Edge Function instead of direct OpenAI API
      const { secureAIChat } = await import('../../lib/secureAI');
      
      const response = await secureAIChat({
        question: text,
        dataset,
        userProfile,
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
      });

      const aiResponse = response.text || 'No response generated';
      
      // Format response based on user profile
      const formattedResponse = formatAIResponse(aiResponse, userProfile);

      // Add AI message
      const assistantMessage: Message = {
        role: 'assistant',
        content: formattedResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Error calling OpenAI:', error);
      toast.error('Failed to get AI response. Please try again.');
      
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: `I'm having trouble connecting right now. ${error.message || 'Please try again in a moment.'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = getSuggestedQuestions(dataset, userProfile);

  const ChatContent = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Dataset Assistant</h3>
            <p className="text-sm text-gray-600">
              {userProfile.job_title && `Personalized for ${userProfile.job_title}`}
              {!userProfile.job_title && `Analyzing: ${dataset.name}`}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[80%] ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-indigo-600' 
                  : 'bg-gradient-to-br from-purple-500 to-indigo-600'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message bubble */}
              <div className={`rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-900 shadow-sm border border-gray-200'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-indigo-200' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && suggestedQuestions.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
          <p className="text-xs font-medium text-gray-500 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.slice(0, 3).map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(question)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask about ${dataset.name}...`}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            icon={<Send className="w-4 h-4" />}
            className="px-4"
          >
            {!isLoading && 'Send'}
          </Button>
        </div>
        
        {/* Context indicator */}
        {userProfile.use_case && (
          <p className="text-xs text-gray-500 mt-2 flex items-center">
            <Sparkles className="w-3 h-3 mr-1" />
            Personalized for: {formatUseCase(userProfile.use_case)}
            {userProfile.company && ` at ${userProfile.company}`}
          </p>
        )}
      </div>
    </>
  );

  // Modal version
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col">
          <ChatContent />
        </div>
      </div>
    );
  }

  // Card version (for embedding)
  return (
    <Card className="h-[600px] flex flex-col p-0 overflow-hidden">
      <ChatContent />
    </Card>
  );
};

export default PersonalizedDatasetChat;

