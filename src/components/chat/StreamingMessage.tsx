// Streaming Message Component with Enhanced Markdown Rendering
import React, { useState, useEffect, useMemo } from 'react';
import { Copy, ThumbsUp, ThumbsDown, Volume2, TrendingUp, Target, Lightbulb, CheckCircle2, AlertTriangle, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

interface StreamingMessageProps {
  content: string;
  onComplete?: () => void;
  speed?: number; // characters per second
  insights?: string[];
  charts?: any[];
  actions?: any[];
  showActions?: boolean;
  modelMetrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
  };
}

// Enhanced markdown renderer
const renderMarkdown = (text: string): JSX.Element[] => {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  let listType: 'bullet' | 'number' | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      elements.push(
        <ul key={`list-${elements.length}`} className={`my-3 space-y-2 ${listType === 'number' ? 'list-decimal' : 'list-none'} pl-0`}>
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-gray-700">
              {listType === 'bullet' ? (
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mt-2 flex-shrink-0 shadow-sm" />
              ) : (
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm">{i + 1}</span>
              )}
              <span className="flex-1" dangerouslySetInnerHTML={{ __html: formatInlineText(item) }} />
            </li>
          ))}
        </ul>
      );
      listItems = [];
      listType = null;
    }
  };

  const formatInlineText = (text: string): string => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em class="italic text-gray-800">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-slate-100 text-indigo-700 rounded font-mono text-xs">$1</code>');
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Main headers (##)
    if (line.startsWith('## ')) {
      flushList();
      const title = line.replace(/^## /, '').replace(/[📊🔬💡📈⚠️✅🎯📖🧠🔮🔍]/g, '').trim();
      const emoji = line.match(/[📊🔬💡📈⚠️✅🎯📖🧠🔮🔍]/)?.[0] || '✨';
      elements.push(
        <div key={`h2-${i}`} className="flex items-center gap-3 mt-6 mb-4 pb-3 border-b-2 border-gradient-to-r from-indigo-200 to-purple-200">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-lg">{emoji}</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>
      );
      continue;
    }
    
    // Subheaders (###)
    if (line.startsWith('### ')) {
      flushList();
      const title = line.replace(/^### /, '').replace(/[📊🔬💡📈⚠️✅🎯📖🧠🔮🔍🟢🔴🟡]/g, '').trim();
      const emoji = line.match(/[📊🔬💡📈⚠️✅🎯📖🧠🔮🔍🟢🔴🟡]/)?.[0] || '→';
      elements.push(
        <div key={`h3-${i}`} className="flex items-center gap-2 mt-5 mb-3">
          <span className="text-base">{emoji}</span>
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        </div>
      );
      continue;
    }
    
    // Bullet points
    if (line.startsWith('-') || line.startsWith('•')) {
      if (listType !== 'bullet') {
        flushList();
        listType = 'bullet';
      }
      listItems.push(line.replace(/^[-•]\s*/, '').trim());
      continue;
    }
    
    // Numbered lists
    if (/^\d+\./.test(line)) {
      if (listType !== 'number') {
        flushList();
        listType = 'number';
      }
      listItems.push(line.replace(/^\d+\.\s*/, '').trim());
      continue;
    }
    
    // Regular paragraphs
    if (line) {
      flushList();
      elements.push(
        <p 
          key={`p-${i}`} 
          className="text-gray-700 leading-relaxed my-2"
          dangerouslySetInnerHTML={{ __html: formatInlineText(line) }}
        />
      );
    }
  }
  
  flushList();
  return elements;
};

// Compact metric badge
const MetricBadge: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${color} transition-transform hover:scale-105`}>
    <Target className="w-4 h-4 opacity-70" />
    <div>
      <div className="text-xs font-medium opacity-70">{label}</div>
      <div className="text-sm font-bold">{(value * 100).toFixed(1)}%</div>
    </div>
  </div>
);

export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  content,
  onComplete,
  speed = 80, // Faster default for better UX
  insights,
  charts,
  actions,
  showActions = true,
  modelMetrics
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (!content) return;

    let currentIndex = 0;
    const charsPerInterval = Math.max(2, Math.floor(speed / 15)); // Faster streaming
    
    const interval = setInterval(() => {
      if (currentIndex < content.length) {
        const nextChunk = content.slice(currentIndex, currentIndex + charsPerInterval);
        setDisplayedContent(prev => prev + nextChunk);
        currentIndex += charsPerInterval;
      } else {
        setIsComplete(true);
        setShowFeedback(true);
        if (onComplete) onComplete();
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [content, speed, onComplete]);

  const renderedContent = useMemo(() => {
    return renderMarkdown(displayedContent);
  }, [displayedContent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(content.replace(/[#*`]/g, ''));
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
  };

  const handleThumbsDown = () => {
    toast('We\'ll improve! Click regenerate to try again.', { icon: '💬' });
  };

  return (
    <div className="group">
      <div className="bg-white text-gray-900 border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Model Metrics Header */}
        {modelMetrics && isComplete && Object.keys(modelMetrics).length > 0 && (
          <div className="px-4 py-3 bg-gradient-to-r from-slate-50 via-indigo-50 to-purple-50 border-b border-gray-100 animate-fadeIn">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Model Performance</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {modelMetrics.accuracy !== undefined && (
                <MetricBadge 
                  label="Accuracy" 
                  value={modelMetrics.accuracy} 
                  color={modelMetrics.accuracy >= 0.85 ? 'bg-emerald-100 text-emerald-800' : modelMetrics.accuracy >= 0.7 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}
                />
              )}
              {modelMetrics.precision !== undefined && (
                <MetricBadge label="Precision" value={modelMetrics.precision} color="bg-blue-100 text-blue-800" />
              )}
              {modelMetrics.recall !== undefined && (
                <MetricBadge label="Recall" value={modelMetrics.recall} color="bg-purple-100 text-purple-800" />
              )}
              {modelMetrics.f1Score !== undefined && (
                <MetricBadge label="F1 Score" value={modelMetrics.f1Score} color="bg-indigo-100 text-indigo-800" />
              )}
            </div>
          </div>
        )}

        {/* Main content with enhanced markdown rendering */}
        <div className="px-5 py-4">
          <div className="prose prose-sm max-w-none">
            {renderedContent}
            {!isComplete && (
              <span className="inline-block w-0.5 h-5 bg-gradient-to-b from-indigo-500 to-purple-500 ml-1 animate-pulse rounded-full" />
            )}
          </div>
        </div>

        {/* Insights Panel */}
        {isComplete && insights && insights.length > 0 && (
          <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 animate-fadeIn">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-sm font-semibold text-amber-800">Key Insights</span>
            </div>
            <ul className="space-y-2">
              {insights.map((insight, i) => (
                <li 
                  key={i} 
                  className="flex items-start gap-2 text-sm text-amber-900 animate-slideInLeft"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Charts Panel */}
        {isComplete && charts && charts.length > 0 && (
          <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 animate-fadeIn" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-blue-800">Visualizations</span>
            </div>
            <div className="grid gap-2">
              {charts.map((chart, i) => (
                <div 
                  key={i} 
                  className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm animate-slideInUp"
                  style={{ animationDelay: `${i * 100 + 300}ms` }}
                >
                  <p className="text-sm font-medium text-blue-900">{chart.title || `Chart ${i + 1}`}</p>
                  {chart.description && (
                    <p className="text-xs text-blue-700 mt-1">{chart.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isComplete && actions && actions.length > 0 && (
          <div className="mx-4 mb-4 flex flex-wrap gap-2 animate-fadeIn" style={{ animationDelay: '400ms' }}>
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={() => toast.success(`Executing: ${action.label}`)}
                className="text-sm px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-md hover:shadow-lg font-medium"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Feedback Bar */}
      {showActions && isComplete && showFeedback && (
        <div className="flex items-center justify-between mt-3 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-xs text-gray-400">Was this helpful?</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all hover:scale-110"
              title="Copy response"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleSpeak}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all hover:scale-110"
              title="Read aloud"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button
              onClick={handleThumbsUp}
              className="p-2 rounded-lg hover:bg-emerald-100 text-gray-400 hover:text-emerald-600 transition-all hover:scale-110"
              title="Helpful"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              onClick={handleThumbsDown}
              className="p-2 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all hover:scale-110"
              title="Not helpful"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamingMessage;

