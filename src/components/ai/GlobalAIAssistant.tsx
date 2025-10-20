import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Minimize2, Maximize2, Sparkles, Trash2, Copy, Check, Bot, Zap } from 'lucide-react';
import { useMLContext } from '../../context/MLContext';
import OpenAI from 'openai';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const GlobalAIAssistant: React.FC = () => {
  const { datasets, models, currentProject } = useMLContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hide pulse animation after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // General suggested questions
  const suggestedQuestions = [
    "What datasets do I have?",
    "Show me my latest uploads",
    "How can I improve data quality?",
    "What models should I train?",
    "Help me get started with analysis"
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const buildContextPrompt = () => {
    const context = {
      currentProject: currentProject?.name || 'No project selected',
      datasetsCount: datasets.length,
      datasets: datasets.map(d => ({
        name: d.name,
        rows: d.row_count,
        columns: d.column_count,
        type: d.file_type
      })),
      modelsCount: models?.length || 0,
      currentPage: window.location.pathname
    };

    return `You are a helpful AI assistant for DataFlow Hub AI, a data management and ML platform.

Current Context:
- Project: ${context.currentProject}
- Datasets: ${context.datasetsCount} total
- Models: ${context.modelsCount} total
- Current Page: ${context.currentPage}

Available Datasets:
${context.datasets.map(d => `- ${d.name} (${d.rows} rows, ${d.columns} columns, ${d.type})`).join('\n')}

Help users with:
- Understanding their data
- Data quality insights
- ML model recommendations
- Navigation and feature explanations
- Best practices for data analysis

Be concise, friendly, and actionable. Use bullet points when appropriate.`;
  };

  const handleSendMessage = async (questionText?: string) => {
    const question = questionText || currentQuestion.trim();
    if (!question) return;

    const userMessage: Message = {
      role: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentQuestion('');
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

      if (!apiKey) {
        toast.error('OpenAI API key not configured');
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
          content: question
        }
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 500
      });

      const response = completion.choices[0]?.message?.content || 'No response received';

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success('Chat cleared');
  };

  const copyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 group ${
            showPulse ? 'animate-pulse' : ''
          }`}
          title="Open AI Assistant"
        >
          <div className="relative">
            <Sparkles className="w-6 h-6" />
            {showPulse && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </span>
            )}
          </div>
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Ask AI Assistant
          </div>
        </button>
      )}

      {/* Overlay */}
      {isOpen && (
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity ${
            isMinimized ? 'hidden' : ''
          }`}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      {isOpen && (
        <div 
          className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-50 flex flex-col transition-all duration-300 ${
            isMinimized 
              ? 'w-16' 
              : 'w-full sm:w-96 lg:w-[450px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            {!isMinimized && (
              <>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Assistant</h3>
                    <p className="text-xs text-indigo-100">
                      Always here to help
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {messages.length > 0 && (
                    <button
                      onClick={clearChat}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                      title="Clear chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    title={isMinimized ? "Maximize" : "Minimize"}
                  >
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
            {isMinimized && (
              <button
                onClick={() => setIsMinimized(false)}
                className="w-full p-3 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Open chat"
              >
                <Bot className="w-6 h-6 mx-auto" />
              </button>
            )}
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Hi! I'm your AI assistant
                    </h4>
                    <p className="text-sm text-gray-600 mb-6 px-4">
                      I can help you understand your data, answer questions, and guide you through the platform.
                    </p>
                    
                    {/* Context Info */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6 text-left">
                      <p className="text-xs font-medium text-indigo-900 mb-2">📊 Current Context:</p>
                      <ul className="text-xs text-indigo-800 space-y-1">
                        <li>• Project: {currentProject?.name || 'None selected'}</li>
                        <li>• Datasets: {datasets.length}</li>
                        <li>• Models: {models?.length || 0}</li>
                      </ul>
                    </div>
                    
                    {/* Suggested questions */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                        Try asking:
                      </p>
                      {suggestedQuestions.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(question)}
                          className="w-full text-left px-4 py-3 text-sm bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md transition-all text-gray-700 group"
                        >
                          <span className="group-hover:text-indigo-600">{question}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-4 py-3 relative group ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                          <span>
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {message.role === 'assistant' && (
                            <button
                              onClick={() => copyMessage(message.content, idx)}
                              className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title="Copy message"
                            >
                              {copiedIndex === idx ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <textarea
                      ref={inputRef}
                      value={currentQuestion}
                      onChange={(e) => setCurrentQuestion(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      rows={1}
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                      disabled={isLoading}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                      }}
                    />
                  </div>
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !currentQuestion.trim()}
                    className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                    title="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <Sparkles className="w-3 h-3" />
                    <span>Powered by AI</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default GlobalAIAssistant;