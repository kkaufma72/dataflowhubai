/**
 * Knowledge-Based Recommendations
 * 
 * Uses dataset knowledge to provide smart recommendations
 * for model training, data cleaning, feature engineering, etc.
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Target,
  Zap,
  ChevronRight,
  Loader
} from 'lucide-react';
import { Dataset } from '../../types';
import { useDatasetKnowledge } from '../../hooks/useDatasetKnowledge';

interface Recommendation {
  id: string;
  type: 'model' | 'cleaning' | 'feature' | 'warning' | 'insight';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
}

interface KnowledgeRecommendationsProps {
  dataset: Dataset;
  context?: 'training' | 'cleaning' | 'exploration' | 'general';
  maxRecommendations?: number;
  onApplyRecommendation?: (rec: Recommendation) => void;
  className?: string;
}

const KnowledgeRecommendations: React.FC<KnowledgeRecommendationsProps> = ({
  dataset,
  context = 'general',
  maxRecommendations = 5,
  onApplyRecommendation,
  className = ''
}) => {
  const { knowledge, isLoading } = useDatasetKnowledge(dataset);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    if (!knowledge || isLoading) return;

    const recs: Recommendation[] = [];
    const dictColumns = knowledge.dataDictionary?.columns || [];

    // Known issues as warnings
    knowledge.knownIssues?.slice(0, 2).forEach((issue, i) => {
      recs.push({
        id: `issue-${i}`,
        type: 'warning',
        priority: 'high',
        title: 'Known Data Issue',
        description: issue,
        action: 'Review'
      });
    });

    // Column-based recommendations
    dictColumns.forEach(col => {
      if (col.dataType === 'date' || col.dataType === 'datetime') {
        recs.push({
          id: `feature-date-${col.name}`,
          type: 'feature',
          priority: 'medium',
          title: `Extract features from ${col.name}`,
          description: `Create day, month, year features from ${col.businessMeaning || col.name}`,
          action: 'Apply'
        });
      }

      if (col.isPII) {
        recs.push({
          id: `pii-${col.name}`,
          type: 'warning',
          priority: 'high',
          title: `PII Detected: ${col.name}`,
          description: 'Consider masking or removing this column.',
          action: 'Review'
        });
      }
    });

    // Model recommendations based on business context
    if (knowledge.businessContext && context === 'training') {
      const ctx = knowledge.businessContext.toLowerCase();
      
      if (ctx.includes('predict') || ctx.includes('forecast')) {
        recs.push({
          id: 'model-regression',
          type: 'model',
          priority: 'high',
          title: 'Recommended: Regression Model',
          description: 'Based on your prediction goals, regression would work well.',
          action: 'Select'
        });
      }
      
      if (ctx.includes('classify') || ctx.includes('category')) {
        recs.push({
          id: 'model-classification',
          type: 'model',
          priority: 'high',
          title: 'Recommended: Classification Model',
          description: 'Based on your categorization goals, classification is ideal.',
          action: 'Select'
        });
      }
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    setRecommendations(recs.slice(0, maxRecommendations));
  }, [knowledge, isLoading, context, maxRecommendations]);

  const getIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'model': return <Target className="w-4 h-4 text-blue-500" />;
      case 'cleaning': return <Zap className="w-4 h-4 text-purple-500" />;
      case 'feature': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'insight': return <Sparkles className="w-4 h-4 text-indigo-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className={`p-4 border rounded-lg bg-gray-50 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <Loader className="w-4 h-4 animate-spin" />
          <span className="text-sm">Analyzing knowledge base...</span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={`p-4 border rounded-lg bg-gray-50 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">No specific recommendations</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-600" />
        <span className="font-medium text-gray-800">Smart Recommendations</span>
      </div>

      <div className="divide-y divide-gray-100">
        {recommendations.map((rec) => (
          <div key={rec.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50">
            <div className="mt-0.5">{getIcon(rec.type)}</div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm text-gray-800">{rec.title}</span>
              <p className="text-sm text-gray-600 line-clamp-2">{rec.description}</p>
            </div>
            {rec.action && onApplyRecommendation && (
              <button
                onClick={() => onApplyRecommendation(rec)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md"
              >
                {rec.action}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KnowledgeRecommendations;

