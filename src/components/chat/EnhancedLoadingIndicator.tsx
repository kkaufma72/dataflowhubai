// Enhanced Loading Indicator with Multiple States
import React, { useState, useEffect } from 'react';
import { Bot, Brain, LineChart, Sparkles, Search, Zap } from 'lucide-react';

interface EnhancedLoadingIndicatorProps {
  messages?: string[];
  duration?: number; // Total expected duration in ms
}

const DEFAULT_LOADING_MESSAGES = [
  { icon: Search, text: 'Analyzing your data...', duration: 1500 },
  { icon: Brain, text: 'AI team thinking...', duration: 2000 },
  { icon: LineChart, text: 'Finding patterns...', duration: 1800 },
  { icon: Sparkles, text: 'Generating insights...', duration: 2200 },
  { icon: Zap, text: 'Crafting response...', duration: 1500 }
];

export const EnhancedLoadingIndicator: React.FC<EnhancedLoadingIndicatorProps> = ({
  messages,
  duration
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const loadingMessages = messages?.map((text, i) => ({
    icon: DEFAULT_LOADING_MESSAGES[i % DEFAULT_LOADING_MESSAGES.length].icon,
    text,
    duration: 1500
  })) || DEFAULT_LOADING_MESSAGES;

  useEffect(() => {
    // Cycle through loading messages
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 2000);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev; // Cap at 95% until actual completion
        return prev + Math.random() * 3;
      });
    }, 200);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [loadingMessages.length]);

  const CurrentIcon = loadingMessages[currentMessageIndex].icon;

  return (
    <div className="flex justify-start">
      <div className="flex items-start space-x-2 animate-fadeIn">
        {/* Avatar with pulse animation */}
        <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary via-primary-600 to-blue-600 shadow-sm animate-pulse-soft">
          <Bot className="w-5 h-5 text-white" />
        </div>
        
        {/* Loading content */}
        <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200 min-w-[280px]">
          <div className="space-y-3">
            {/* Dynamic status message */}
            <div className="flex items-center space-x-2">
              <CurrentIcon className="w-4 h-4 text-primary-600 animate-spin-slow" />
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-medium">
                  {loadingMessages[currentMessageIndex].text}
                </p>
              </div>
            </div>

            {/* Animated dots */}
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-1 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Subtle AI activity indicators */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>🤖 6 AI agents active</span>
              <span className="animate-pulse">●</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoadingIndicator;

