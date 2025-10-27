import React, { useMemo } from 'react';
import { Dataset } from '../../types';
import { calculateDatasetHealth, getHealthBadgeProps } from '../../utils/datasetHealthScore';
import Card from '../common/Card';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

interface DatasetHealthCardProps {
  dataset: Dataset;
  showDetails?: boolean;
}

const DatasetHealthCard: React.FC<DatasetHealthCardProps> = ({ 
  dataset, 
  showDetails = true 
}) => {
  const healthResult = useMemo(() => calculateDatasetHealth(dataset), [dataset]);
  const badgeProps = getHealthBadgeProps(healthResult.score);

  const getCheckIcon = (passed: boolean, score: number) => {
    if (passed) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    } else if (score > 15) {
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <Card className="p-6">
      {/* Header with Score */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Dataset Health</h3>
          <p className="text-sm text-gray-500">Quality assessment for {dataset.name}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div 
              className="text-4xl font-bold"
              style={{ color: healthResult.color }}
            >
              {healthResult.score}
            </div>
            <div className="text-sm text-gray-500">out of 100</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div 
              className="text-6xl font-bold"
              style={{ color: healthResult.color }}
            >
              {healthResult.grade}
            </div>
            <div className="text-xs mt-1">
              {badgeProps.emoji} {badgeProps.label}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${healthResult.score}%`,
              backgroundColor: healthResult.color 
            }}
          />
        </div>
      </div>

      {showDetails && (
        <>
          {/* Detailed Checks */}
          <div className="space-y-3 mb-6">
            {/* Completeness */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {getCheckIcon(
                healthResult.checks.completeness.passed,
                healthResult.checks.completeness.score
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">Completeness</span>
                  <span className="text-sm text-gray-600">
                    {healthResult.checks.completeness.score}/25
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {healthResult.checks.completeness.message}
                </p>
                {healthResult.checks.completeness.details && (
                  <p className="text-xs text-gray-500 mt-1">
                    {healthResult.checks.completeness.details}
                  </p>
                )}
              </div>
            </div>

            {/* Consistency */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {getCheckIcon(
                healthResult.checks.consistency.passed,
                healthResult.checks.consistency.score
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">Consistency</span>
                  <span className="text-sm text-gray-600">
                    {healthResult.checks.consistency.score}/25
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {healthResult.checks.consistency.message}
                </p>
                {healthResult.checks.consistency.details && (
                  <p className="text-xs text-gray-500 mt-1">
                    {healthResult.checks.consistency.details}
                  </p>
                )}
              </div>
            </div>

            {/* Validity */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {getCheckIcon(
                healthResult.checks.validity.passed,
                healthResult.checks.validity.score
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">Validity</span>
                  <span className="text-sm text-gray-600">
                    {healthResult.checks.validity.score}/25
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {healthResult.checks.validity.message}
                </p>
                {healthResult.checks.validity.details && (
                  <p className="text-xs text-gray-500 mt-1">
                    {healthResult.checks.validity.details}
                  </p>
                )}
              </div>
            </div>

            {/* Uniqueness */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {getCheckIcon(
                healthResult.checks.uniqueness.passed,
                healthResult.checks.uniqueness.score
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">Uniqueness</span>
                  <span className="text-sm text-gray-600">
                    {healthResult.checks.uniqueness.score}/25
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {healthResult.checks.uniqueness.message}
                </p>
                {healthResult.checks.uniqueness.details && (
                  <p className="text-xs text-gray-500 mt-1">
                    {healthResult.checks.uniqueness.details}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {healthResult.suggestions.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Recommended Actions
                  </h4>
                  <ul className="space-y-1">
                    {healthResult.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-sm text-blue-800">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default DatasetHealthCard;

