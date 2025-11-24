import React, { useState } from 'react';
import { HelpCircle, TrendingUp, TrendingDown, Lightbulb, FileText, Share2 } from 'lucide-react';
import Button from '../common/Button';

interface FeatureImpact {
  feature: string;
  value: any;
  impact: number; // -1 to 1 (negative impact to positive impact)
  percentage: number; // Contribution percentage
}

interface Counterfactual {
  feature: string;
  currentValue: any;
  suggestedValue: any;
  impactChange: number;
  newPrediction: any;
}

interface ExplainabilityDashboardProps {
  prediction: any;
  featureImpacts: FeatureImpact[];
  counterfactuals?: Counterfactual[];
  confidence: number;
  className?: string;
}

export const ExplainabilityDashboard: React.FC<ExplainabilityDashboardProps> = ({
  prediction,
  featureImpacts,
  counterfactuals = [],
  confidence,
  className = ''
}) => {
  const [showCounterfactuals, setShowCounterfactuals] = useState(false);

  const sortedImpacts = [...featureImpacts].sort((a, b) => 
    Math.abs(b.impact) - Math.abs(a.impact)
  );

  const maxImpact = Math.max(...featureImpacts.map(f => Math.abs(f.impact)));

  const exportExplanation = () => {
    const report = `
Prediction Explanation Report
Generated: ${new Date().toLocaleString()}

Prediction: ${JSON.stringify(prediction)}
Confidence: ${(confidence * 100).toFixed(1)}%

Feature Contributions:
${sortedImpacts.map((f, idx) => 
  `${idx + 1}. ${f.feature}: ${f.value} (${f.impact > 0 ? '+' : ''}${(f.impact * 100).toFixed(1)}% impact)`
).join('\n')}

${counterfactuals.length > 0 ? `
Counterfactual Analysis:
${counterfactuals.map((cf, idx) => 
  `${idx + 1}. If ${cf.feature} was ${cf.suggestedValue} instead of ${cf.currentValue}:
     Prediction would change to: ${cf.newPrediction} (${cf.impactChange > 0 ? '+' : ''}${cf.impactChange.toFixed(1)}%)`
).join('\n')}
` : ''}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `explanation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-white rounded-xl border-2 border-gray-200 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Prediction Explanation</h3>
              <p className="text-sm text-indigo-100">
                Why this prediction? • Confidence: {(confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <Button onClick={exportExplanation} variant="secondary" size="sm">
            <FileText className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Prediction Result */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-600 mb-1">Prediction</p>
        <p className="text-3xl font-bold text-gray-900">{JSON.stringify(prediction)}</p>
      </div>

      {/* Feature Impact */}
      <div className="p-6">
        <h4 className="font-bold text-gray-900 mb-4">Feature Contributions</h4>
        <div className="space-y-3">
          {sortedImpacts.map((feature, idx) => {
            const impactPercent = (Math.abs(feature.impact) / maxImpact) * 100;
            const isPositive = feature.impact > 0;

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{feature.feature}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{feature.value}</span>
                    <span className={`font-bold ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
                      {isPositive ? '+' : ''}{(feature.impact * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${isPositive ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${impactPercent}%` }}
                    />
                  </div>
                  {idx === 0 && (
                    <span className="text-xs font-bold text-indigo-600">HIGHEST</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Counterfactual Analysis */}
      {counterfactuals.length > 0 && (
        <div className="px-6 pb-6">
          <button
            onClick={() => setShowCounterfactuals(!showCounterfactuals)}
            className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 mb-3"
          >
            <Lightbulb className="w-4 h-4" />
            {showCounterfactuals ? 'Hide' : 'Show'} What-If Analysis
          </button>

          {showCounterfactuals && (
            <div className="space-y-3">
              {counterfactuals.map((cf, idx) => (
                <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-900 mb-2">
                    <strong>If {cf.feature}</strong> was <strong>{cf.suggestedValue}</strong> instead of {cf.currentValue}:
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">
                      Prediction → <strong>{cf.newPrediction}</strong>
                    </p>
                    <span className={`font-bold ${cf.impactChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {cf.impactChange > 0 ? '+' : ''}{cf.impactChange.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-6 pb-6 border-t border-gray-200 pt-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h5 className="font-bold text-indigo-900 mb-2">💡 What Can You Do?</h5>
          <ul className="space-y-1 text-sm text-indigo-800">
            {sortedImpacts[0] && (
              <li>• Focus on improving <strong>{sortedImpacts[0].feature}</strong> (biggest impact)</li>
            )}
            {counterfactuals[0] && (
              <li>• Changing <strong>{counterfactuals[0].feature}</strong> would have largest effect</li>
            )}
            <li>• Use these insights to take action or adjust your strategy</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExplainabilityDashboard;
