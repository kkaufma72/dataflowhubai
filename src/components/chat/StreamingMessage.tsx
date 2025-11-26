// Streaming Message Component with Typewriter Effect
import React, { useState, useEffect } from 'react';
import { Copy, ThumbsUp, ThumbsDown, RotateCw, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface StreamingMessageProps {
  content: string;
  onComplete?: () => void;
  speed?: number; // characters per second
  insights?: string[];
  charts?: any[];
  actions?: any[];
  showActions?: boolean;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  content,
  onComplete,
  speed = 50, // Default: 50 characters per second (natural reading speed)
  insights,
  charts,
  actions,
  showActions = true
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (!content) return;

    let currentIndex = 0;
    const charsPerInterval = Math.max(1, Math.floor(speed / 20)); // Update 20 times per second
    
    const interval = setInterval(() => {
      if (currentIndex < content.length) {
        // Add characters in chunks for smoother animation
        const nextChunk = content.slice(currentIndex, currentIndex + charsPerInterval);
        setDisplayedContent(prev => prev + nextChunk);
        currentIndex += charsPerInterval;
      } else {
        setIsComplete(true);
        setShowFeedback(true);
        if (onComplete) onComplete();
        clearInterval(interval);
      }
    }, 50); // Update every 50ms

    return () => clearInterval(interval);
  }, [content, speed, onComplete]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.rate = 1.1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
      toast.success('🔊 Reading aloud...');
    } else {
      toast.error('Text-to-speech not supported');
    }
  };

  const handleThumbsUp = () => {
    toast.success('👍 Thanks for your feedback!');
    // TODO: Send feedback to analytics
  };

  const handleThumbsDown = () => {
    toast('We\'ll improve! Click regenerate to try again.', { icon: '💬' });
    // TODO: Send feedback to analytics
  };

  return (
    <div className="group">
      <div className="bg-white text-gray-900 border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        {/* Main content with typewriter effect */}
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {displayedContent}
          {!isComplete && (
            <span className="inline-block w-0.5 h-4 bg-primary-600 ml-0.5 animate-pulse" />
          )}
        </div>

        {/* Insights (show after main content) */}
        {isComplete && insights && insights.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 animate-fadeIn">
            <p className="text-xs font-semibold text-primary-600 mb-2">💡 Key Insights:</p>
            <ul className="space-y-1">
              {insights.map((insight, i) => (
                <li 
                  key={i} 
                  className="text-xs text-gray-700 animate-slideInLeft"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  • {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Charts (show after insights) */}
        {isComplete && charts && charts.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 animate-fadeIn" style={{ animationDelay: '200ms' }}>
            <p className="text-xs font-semibold text-primary-600 mb-2">📊 Generated Charts:</p>
            {charts.map((chart, i) => (
              <div 
                key={i} 
                className="mt-2 p-2 bg-gray-50 rounded animate-slideInUp"
                style={{ animationDelay: `${i * 100 + 300}ms` }}
              >
                <p className="text-xs text-gray-600">{chart.title || `Chart ${i + 1}`}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actions (show after all content) */}
        {isComplete && actions && actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 animate-fadeIn" style={{ animationDelay: '400ms' }}>
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={() => toast.success(`Executing: ${action.label}`)}
                className="text-xs px-3 py-1.5 bg-primary/10 text-primary-700 rounded-full hover:bg-primary-200 transition transform hover:scale-105"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive feedback buttons (show on hover when complete) */}
      {showActions && isComplete && showFeedback && (
        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
            title="Copy message"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSpeak}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
            title="Read aloud"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleThumbsUp}
            className="p-1.5 rounded-lg hover:bg-green-100 text-gray-500 hover:text-green-600 transition"
            title="Good response"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleThumbsDown}
            className="p-1.5 rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-600 transition"
            title="Poor response"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default StreamingMessage;

