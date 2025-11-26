/**
 * Knowledge Insights Badge
 * 
 * A compact component showing knowledge status and quick insights.
 * Can be embedded in dataset cards, headers, etc.
 */

import React, { useState } from 'react';
import { 
  Brain, 
  BookOpen, 
  AlertTriangle, 
  Lightbulb, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { Dataset } from '../../types';
import { useDatasetKnowledge } from '../../hooks/useDatasetKnowledge';

interface KnowledgeInsightsBadgeProps {
  dataset: Dataset;
  variant?: 'compact' | 'detailed' | 'inline';
  showExpandable?: boolean;
  className?: string;
}

const KnowledgeInsightsBadge: React.FC<KnowledgeInsightsBadgeProps> = ({
  dataset,
  variant = 'compact',
  showExpandable = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    knowledge,
    isLoading,
    hasKnownIssues,
    knownIssuesCount,
    storiesCount,
    hasBusinessContext,
    insightsCount,
    recentInsights,
    recentStories
  } = useDatasetKnowledge(dataset);

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-lg h-6 w-20 ${className}`} />
    );
  }

  // Calculate knowledge score
  const knowledgeScore = [
    hasBusinessContext,
    storiesCount > 0,
    insightsCount > 0,
    knowledge?.dataDictionary?.columns?.some(c => c.businessMeaning)
  ].filter(Boolean).length;

  const getScoreColor = () => {
    if (knowledgeScore >= 3) return 'text-green-600 bg-green-50 border-green-200';
    if (knowledgeScore >= 2) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-500 bg-gray-50 border-gray-200';
  };

  const getScoreLabel = () => {
    if (knowledgeScore >= 3) return 'Rich Context';
    if (knowledgeScore >= 2) return 'Some Context';
    return 'Add Context';
  };

  // Inline variant - just a small indicator
  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1 text-xs ${className}`}>
        <Brain className={`w-3 h-3 ${knowledgeScore >= 2 ? 'text-green-500' : 'text-gray-400'}`} />
        {knowledgeScore >= 2 && <span className="text-green-600">{insightsCount}</span>}
        {hasKnownIssues && <AlertTriangle className="w-3 h-3 text-amber-500" />}
      </span>
    );
  }

  // Compact variant - badge style
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor()}`}>
          <Brain className="w-3 h-3" />
          {getScoreLabel()}
        </span>
        {hasKnownIssues && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            {knownIssuesCount} issue{knownIssuesCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  }

  // Detailed variant - expandable card
  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => showExpandable && setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 flex items-center justify-between ${getScoreColor()} ${showExpandable ? 'cursor-pointer hover:opacity-90' : ''}`}
      >
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5" />
          <div className="text-left">
            <span className="font-medium">{getScoreLabel()}</span>
            <span className="text-xs opacity-75 ml-2">
              {insightsCount} insights • {storiesCount} notes
            </span>
          </div>
        </div>
        {showExpandable && (
          isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="bg-white p-4 space-y-4">
          {/* Business Context */}
          {hasBusinessContext && (
            <div className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700 line-clamp-2">
                {knowledge?.businessContext}
              </p>
            </div>
          )}

          {/* Known Issues */}
          {hasKnownIssues && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-amber-700">Known Issues:</span>
                <ul className="mt-1 text-gray-600">
                  {knowledge?.knownIssues?.slice(0, 2).map((issue, i) => (
                    <li key={i} className="truncate">• {issue}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Recent Insights */}
          {recentInsights.length > 0 && (
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-gray-700">Recent Insight:</span>
                <p className="text-gray-600 line-clamp-2 mt-1">
                  {recentInsights[0]?.answer}
                </p>
              </div>
            </div>
          )}

          {/* Recent Notes */}
          {recentStories.length > 0 && (
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-gray-700">Latest Note:</span>
                <p className="text-gray-600 line-clamp-2 mt-1">
                  {recentStories[0]?.title}: {recentStories[0]?.content}
                </p>
              </div>
            </div>
          )}

          {/* No context yet */}
          {knowledgeScore === 0 && (
            <div className="text-center py-4">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Add context to help AI understand this data better
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KnowledgeInsightsBadge;

