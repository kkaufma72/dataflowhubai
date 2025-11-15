// Enhanced RAG Chat - AI chat with knowledge retrieval capabilities
// Integrates with existing chat system and adds RAG-powered responses

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Book, Database, Lightbulb, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Dataset } from '../../types';
import { UserProfile } from '../../utils/personalizedPrompts';
// import { useAuth } from '../auth/AuthProvider'; // Uncomment if needed
import { runEnhancedAgentOrchestrator, EnhancedAgentResponse } from '../../lib/agents/enhancedOrchestrator';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  ragResults?: {
    answer: string;
    sources: Array<{
      title: string;
      type: string;
      created_at: string;
    }>;
    confidence: number;
    suggested_actions: string[];
  };
  knowledgeSources?: number;
  type?: string;
}

interface EnhancedRAGChatProps {
  dataset: Dataset;
  userProfile: UserProfile;
  className?: string;
  onAnalysisComplete?: (analysis: any) => void;
}

export const EnhancedRAGChat: React.FC<EnhancedRAGChatProps> = ({
  dataset,
  userProfile,
  className = '',
  onAnalysisComplete
}) => {
  // const { user } = useAuth(); // Uncomment if needed
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSources, setShowSources] = useState<{ [messageId: string]: boolean }>({});
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load suggested questions on component mount
  useEffect(() => {
    const loadSuggestedQuestions = async () => {
      try {
        // This would typically come from the enhanced orchestrator
        const suggestions = [
          "What insights can you find in this dataset?",
          "Show me the key statistics and patterns",
          "What similar analyses have I done before?",
          "How can I improve the data quality?",
          "What's the best model approach for this data?"
        ];
        setSuggestedQuestions(suggestions);
      } catch (error) {
        console.error('Failed to load suggested questions:', error);
      }
    };

    loadSuggestedQuestions();
  }, [dataset, userProfile]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm your AI assistant for ${dataset.name}. I can help you analyze your data, answer questions, and find relevant information from your knowledge base. What would you like to explore?`,
      timestamp: new Date(),
      type: 'welcome'
    };
    setMessages([welcomeMessage]);
  }, [dataset.name]);

  const handleSend = async (message?: string) => {
    const messageText = message || input.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use enhanced orchestrator with RAG capabilities
      const response: EnhancedAgentResponse = await runEnhancedAgentOrchestrator(
        messageText,
        dataset,
        userProfile,
        messages.map(m => ({ role: m.role, content: m.content }))
      );

      // Create assistant message with RAG results
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content || 'I apologize, but I couldn\'t generate a response. Please try again.',
        timestamp: new Date(),
        ragResults: response.rag_results,
        knowledgeSources: response.knowledge_sources,
        type: response.type
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Call analysis complete callback if provided
      if (onAnalysisComplete) {
        onAnalysisComplete({
          question: messageText,
          answer: response.content,
          ragSources: response.rag_results?.sources || [],
          confidence: response.rag_results?.confidence || 0
        });
      }

    } catch (error) {
      console.error('Enhanced RAG chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error while processing your request. Please try again or contact support if the issue persists.',
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSources = (messageId: string) => {
    setShowSources(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'dataset': return Database;
      case 'analysis': return Lightbulb;
      case 'documentation': return Book;
      default: return Search;
    }
  };

  const getSourceColor = (type: string) => {
    switch (type) {
      case 'dataset': return 'text-blue-600 bg-blue-50';
      case 'analysis': return 'text-green-600 bg-green-50';
      case 'documentation': return 'text-primary-600 bg-primary/5';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Bot className="h-6 w-6 text-blue-600 mr-2" />
          <div>
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-600">Enhanced with knowledge retrieval</p>
          </div>
        </div>
        {dataset && (
          <div className="text-sm text-gray-500">
            Dataset: {dataset.name}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center mb-1">
                {message.role === 'assistant' && <Bot className="h-4 w-4 mr-1" />}
                {message.role === 'user' && <User className="h-4 w-4 mr-1" />}
                <span className="text-xs opacity-75">
                  {formatTime(message.timestamp)}
                </span>
                {message.knowledgeSources && message.knowledgeSources > 0 && (
                  <span className="ml-2 text-xs bg-white bg-opacity-20 rounded-full px-2 py-0.5">
                    {message.knowledgeSources} sources
                  </span>
                )}
              </div>

              {/* Message Content */}
              <div className="whitespace-pre-wrap">{message.content}</div>

              {/* RAG Sources */}
              {message.ragResults && message.ragResults.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => toggleSources(message.id)}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-800"
                  >
                    <Search className="h-3 w-3 mr-1" />
                    {message.ragResults.sources.length} knowledge source{message.ragResults.sources.length !== 1 ? 's' : ''}
                    {showSources[message.id] ? (
                      <ChevronUp className="h-3 w-3 ml-1" />
                    ) : (
                      <ChevronDown className="h-3 w-3 ml-1" />
                    )}
                  </button>

                  {showSources[message.id] && (
                    <div className="mt-2 space-y-2">
                      {message.ragResults.sources.map((source, index) => {
                        const SourceIcon = getSourceIcon(source.type);
                        return (
                          <div
                            key={index}
                            className={`flex items-center text-xs p-2 rounded ${getSourceColor(source.type)}`}
                          >
                            <SourceIcon className="h-3 w-3 mr-1" />
                            <span className="flex-1 truncate">{source.title}</span>
                            <span className="text-xs opacity-75 ml-2">
                              {new Date(source.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        );
                      })}
                      <div className="text-xs text-gray-500 mt-1">
                        Confidence: {((message.ragResults.confidence || 0) * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Suggested Actions */}
              {message.ragResults && message.ragResults.suggested_actions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Suggested actions:</div>
                  <div className="space-y-1">
                    {message.ragResults.suggested_actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleSend(action)}
                        className="block text-left text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        • {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center">
                <Bot className="h-4 w-4 mr-2 text-gray-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="ml-2 text-sm text-gray-600">Searching knowledge base...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && suggestedQuestions.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Suggested questions:</div>
          <div className="space-y-2">
            {suggestedQuestions.slice(0, 3).map((question, index) => (
              <button
                key={index}
                onClick={() => handleSend(question)}
                className="block w-full text-left p-2 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your data or search your knowledge base..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2 flex items-center">
          <Lightbulb className="h-3 w-3 mr-1" />
          Enhanced with knowledge retrieval from your datasets and analyses
        </div>
      </div>
    </div>
  );
};

export default EnhancedRAGChat;
