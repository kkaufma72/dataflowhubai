import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, Info, CheckCircle, X, Zap, ChevronRight } from 'lucide-react';
import Button from '../common/Button';

export interface CopilotSuggestion {
  id: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  suggestions: string[];
  autoFix?: () => void | Promise<void>;
  learnMore?: string;
  category: 'data_quality' | 'feature_engineering' | 'model_selection' | 'deployment' | 'performance';
}

interface AICopilotProps {
  context: {
    dataset?: any;
    selectedFeatures?: string[];
    modelConfig?: any;
    modelMetrics?: any;
  };
  onSuggestionApply?: (suggestionId: string) => void;
  className?: string;
}

export const AICopilot: React.FC<AICopilotProps> = ({
  context,
  onSuggestionApply,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Analyze context and generate suggestions
    const newSuggestions = analyzeContext(context);
    setSuggestions(newSuggestions);
  }, [context]);

  const activeSuggestions = suggestions.filter(s => !dismissed.has(s.id));

  if (activeSuggestions.length === 0) return null;

  const handleApply = async (suggestion: CopilotSuggestion) => {
    if (suggestion.autoFix) {
      try {
        await suggestion.autoFix();
        if (onSuggestionApply) {
          onSuggestionApply(suggestion.id);
        }
        setDismissed(prev => new Set([...prev, suggestion.id]));
      } catch (error) {
        console.error('Auto-fix failed:', error);
      }
    }
  };

  const handleDismiss = (suggestionId: string) => {
    setDismissed(prev => new Set([...prev, suggestionId]));
  };

  const getSeverityConfig = (severity: CopilotSuggestion['severity']) => {
    const configs = {
      error: {
        icon: AlertTriangle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-900',
        iconColor: 'text-red-600',
        badgeColor: 'bg-red-600'
      },
      warning: {
        icon: AlertTriangle,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-900',
        iconColor: 'text-amber-600',
        badgeColor: 'bg-amber-600'
      },
      info: {
        icon: Info,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-900',
        iconColor: 'text-blue-600',
        badgeColor: 'bg-blue-600'
      },
      success: {
        icon: CheckCircle,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-900',
        iconColor: 'text-green-600',
        badgeColor: 'bg-green-600'
      }
    };
    return configs[severity];
  };

  return (
    <div className={`fixed bottom-24 right-4 w-96 z-40 ${className}`}>
      {isMinimized ? (
        // Minimized Badge
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:scale-105 transition-transform"
        >
          <Sparkles className="w-4 h-4" />
          <span className="font-bold">{activeSuggestions.length} AI Suggestions</span>
        </button>
      ) : (
        // Full Panel
        <div className="bg-white rounded-xl shadow-2xl border-2 border-indigo-200 overflow-hidden max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-white" />
              <div>
                <h3 className="font-bold text-white">AI Copilot</h3>
                <p className="text-xs text-indigo-100">{activeSuggestions.length} suggestions</p>
              </div>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Suggestions List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeSuggestions.map(suggestion => {
              const config = getSeverityConfig(suggestion.severity);
              const Icon = config.icon;

              return (
                <div
                  key={suggestion.id}
                  className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2">
                      <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                      <div>
                        <h4 className={`font-bold ${config.textColor} text-sm`}>
                          {suggestion.title}
                        </h4>
                        <p className={`text-xs ${config.textColor} opacity-80 mt-1`}>
                          {suggestion.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDismiss(suggestion.id)}
                      className={`${config.iconColor} opacity-60 hover:opacity-100 transition-opacity`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Suggestions */}
                  {suggestion.suggestions.length > 0 && (
                    <ul className="space-y-1 mb-3 ml-7">
                      {suggestion.suggestions.map((item, idx) => (
                        <li key={idx} className={`text-xs ${config.textColor} flex items-start gap-2`}>
                          <span className="text-indigo-600 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 ml-7">
                    {suggestion.autoFix && (
                      <button
                        onClick={() => handleApply(suggestion)}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" />
                        Auto-Fix
                      </button>
                    )}
                    {suggestion.learnMore && (
                      <button
                        onClick={() => window.open(suggestion.learnMore, '_blank')}
                        className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                      >
                        Learn More
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// AI Analysis Engine
const analyzeContext = (context: any): CopilotSuggestion[] => {
  const suggestions: CopilotSuggestion[] = [];

  // Check 1: Class Imbalance
  if (context.dataset?.classDistribution) {
    const maxClass = Math.max(...Object.values(context.dataset.classDistribution) as number[]);
    const totalSamples = Object.values(context.dataset.classDistribution as Record<string, number>).reduce((a, b) => a + b, 0);
    const imbalance = maxClass / totalSamples;

    if (imbalance > 0.8) {
      suggestions.push({
        id: 'class-imbalance',
        severity: 'warning',
        title: 'Class imbalance detected',
        description: `${(imbalance * 100).toFixed(1)}% of data is one class. This may cause biased predictions.`,
        suggestions: [
          'Apply SMOTE oversampling (balances minority class)',
          'Use class weights in model training',
          'Try stratified cross-validation'
        ],
        autoFix: () => console.log('Applying SMOTE...'),
        category: 'data_quality'
      });
    }
  }

  // Check 2: Data Leakage
  if (context.selectedFeatures) {
    const leakageKeywords = ['id', 'key', 'index', 'uuid', 'target', 'label'];
    const potentialLeaks = context.selectedFeatures.filter((feature: string) =>
      leakageKeywords.some(keyword => feature.toLowerCase().includes(keyword))
    );

    if (potentialLeaks.length > 0) {
      suggestions.push({
        id: 'data-leakage',
        severity: 'error',
        title: 'Potential data leakage detected',
        description: `Features like "${potentialLeaks.join(', ')}" may leak target information.`,
        suggestions: [
          'Drop identifier columns (ID, UUID)',
          'Review feature correlation with target',
          'Use feature importance analysis'
        ],
        autoFix: () => console.log('Dropping leakage features...'),
        category: 'feature_engineering'
      });
    }
  }

  // Check 3: Small Dataset
  if (context.dataset?.rowCount < 1000) {
    suggestions.push({
      id: 'small-dataset',
      severity: 'warning',
      title: 'Small dataset',
      description: `Only ${context.dataset.rowCount} rows. Models typically need 1,000+ for good performance.`,
      suggestions: [
        'Collect more data if possible',
        'Use simpler models (avoid deep neural networks)',
        'Try data augmentation techniques',
        'Use cross-validation to maximize training data'
      ],
      category: 'data_quality'
    });
  }

  // Check 4: High Cardinality Features
  if (context.selectedFeatures) {
    // Mock detection - in real implementation, check actual data
    const highCardinalityFeatures = ['country', 'city', 'product_name'];
    const detected = context.selectedFeatures.filter((f: string) =>
      highCardinalityFeatures.some(hc => f.toLowerCase().includes(hc))
    );

    if (detected.length > 0) {
      suggestions.push({
        id: 'high-cardinality',
        severity: 'info',
        title: 'High cardinality features detected',
        description: `Features like "${detected.join(', ')}" may have too many unique values.`,
        suggestions: [
          'Group rare categories into "Other"',
          'Use target encoding',
          'Try feature hashing',
          'Consider dropping if >100 unique values'
        ],
        autoFix: () => console.log('Applying target encoding...'),
        category: 'feature_engineering'
      });
    }
  }

  // Check 5: Model Performance
  if (context.modelMetrics) {
    const { accuracy, precision, recall } = context.modelMetrics;

    // Precision-Recall imbalance
    if (precision && recall && Math.abs(precision - recall) > 0.15) {
      const higher = precision > recall ? 'Precision' : 'Recall';
      const lower = precision > recall ? 'recall' : 'precision';

      suggestions.push({
        id: 'precision-recall-imbalance',
        severity: 'warning',
        title: `${higher} significantly higher than ${lower}`,
        description: `${higher}: ${(precision * 100).toFixed(1)}% vs ${lower}: ${(recall * 100).toFixed(1)}%`,
        suggestions: [
          precision > recall
            ? 'Increase recall: Adjust decision threshold or use class weights'
            : 'Increase precision: Add regularization or use ensemble methods',
          'Check for class imbalance',
          'Review confusion matrix for insights'
        ],
        category: 'performance'
      });
    }

    // Low accuracy
    if (accuracy && accuracy < 0.7) {
      suggestions.push({
        id: 'low-accuracy',
        severity: 'warning',
        title: 'Model accuracy below 70%',
        description: `Current accuracy: ${(accuracy * 100).toFixed(1)}%. Consider improvements.`,
        suggestions: [
          'Add more relevant features',
          'Try different algorithms (ensemble methods)',
          'Increase training data',
          'Check for data quality issues'
        ],
        category: 'performance'
      });
    }
  }

  return suggestions;
};

export default AICopilot;
