import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle, Play, Pause, BarChart2 } from 'lucide-react';
import { MLModel } from '../../types';
import Button from '../common/Button';

interface ABTest {
  id: string;
  name: string;
  modelA: MLModel;
  modelB: MLModel;
  trafficSplit: number; // 0-1 (0.5 = 50/50)
  status: 'running' | 'paused' | 'completed';
  startedAt: string;
  metrics: {
    modelA: {
      predictions: number;
      accuracy: number;
      avgLatency: number;
      errors: number;
    };
    modelB: {
      predictions: number;
      accuracy: number;
      avgLatency: number;
      errors: number;
    };
  };
  statisticalSignificance: number; // 0-1 (p-value)
  winner?: 'A' | 'B' | 'tie';
}

interface ABTestingDashboardProps {
  tests: ABTest[];
  onCreateTest?: () => void;
  onPromoteWinner?: (testId: string, winner: 'A' | 'B') => void;
  className?: string;
}

export const ABTestingDashboard: React.FC<ABTestingDashboardProps> = ({
  tests,
  onCreateTest,
  onPromoteWinner,
  className = ''
}) => {
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(tests[0] || null);

  const calculateWinner = (test: ABTest): 'A' | 'B' | 'tie' => {
    const { modelA, modelB } = test.metrics;
    const accuracyDiff = Math.abs(modelA.accuracy - modelB.accuracy);
    
    if (test.statisticalSignificance < 0.05 && accuracyDiff > 0.01) {
      return modelA.accuracy > modelB.accuracy ? 'A' : 'B';
    }
    return 'tie';
  };

  const getConfidence = (pValue: number): string => {
    if (pValue < 0.01) return '99%+ confidence';
    if (pValue < 0.05) return '95%+ confidence';
    if (pValue < 0.1) return '90%+ confidence';
    return 'Not significant yet';
  };

  if (tests.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
        <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">No A/B tests running</h3>
        <p className="text-gray-600 mb-6">
          Create an A/B test to compare two models in production
        </p>
        <Button onClick={onCreateTest}>
          Start A/B Test
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Active Tests List */}
      <div className="grid md:grid-cols-3 gap-4">
        {tests.map(test => {
          const winner = calculateWinner(test);
          const isSelected = selectedTest?.id === test.id;

          return (
            <button
              key={test.id}
              onClick={() => setSelectedTest(test)}
              className={`
                text-left p-4 rounded-xl border-2 transition-all
                ${isSelected
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-indigo-200'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-gray-900">{test.name}</h4>
                {test.status === 'running' && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {test.metrics.modelA.predictions + test.metrics.modelB.predictions} predictions
              </p>
              {winner !== 'tie' && (
                <p className="text-xs font-bold text-green-600">
                  Model {winner} winning • {getConfidence(test.statisticalSignificance)}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Test Details */}
      {selectedTest && (
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          {/* Test Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedTest.name}</h3>
                <p className="text-sm text-gray-600">
                  Started {new Date(selectedTest.startedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                {selectedTest.status === 'running' && (
                  <Button variant="secondary" size="sm">
                    <Pause className="w-4 h-4 mr-1" />
                    Pause Test
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Model Comparison */}
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Model A */}
            <ModelTestCard
              label="Model A"
              modelName={selectedTest.modelA.name}
              metrics={selectedTest.metrics.modelA}
              trafficShare={selectedTest.trafficSplit}
              isWinner={calculateWinner(selectedTest) === 'A'}
            />

            {/* Model B */}
            <ModelTestCard
              label="Model B"
              modelName={selectedTest.modelB.name}
              metrics={selectedTest.metrics.modelB}
              trafficShare={1 - selectedTest.trafficSplit}
              isWinner={calculateWinner(selectedTest) === 'B'}
            />
          </div>

          {/* Statistical Significance */}
          <div className="px-6 pb-6">
            <div className={`
              border-2 rounded-lg p-4
              ${selectedTest.statisticalSignificance < 0.05
                ? 'border-green-200 bg-green-50'
                : 'border-amber-200 bg-amber-50'
              }
            `}>
              <div className="flex items-start gap-3">
                {selectedTest.statisticalSignificance < 0.05 ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`font-bold ${
                    selectedTest.statisticalSignificance < 0.05 ? 'text-green-900' : 'text-amber-900'
                  }`}>
                    {getConfidence(selectedTest.statisticalSignificance)}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {selectedTest.statisticalSignificance < 0.05
                      ? `Model ${calculateWinner(selectedTest)} is statistically better. Ready to promote to 100% traffic.`
                      : `Need more data to determine winner. Continue testing to reach statistical significance.`
                    }
                  </p>
                </div>
              </div>

              {selectedTest.statisticalSignificance < 0.05 && calculateWinner(selectedTest) !== 'tie' && (
                <Button
                  onClick={() => onPromoteWinner?.(selectedTest.id, calculateWinner(selectedTest) as 'A' | 'B')}
                  className="w-full mt-4"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Promote Model {calculateWinner(selectedTest)} to 100% Traffic
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Model Test Card
const ModelTestCard: React.FC<{
  label: string;
  modelName: string;
  metrics: any;
  trafficShare: number;
  isWinner: boolean;
}> = ({ label, modelName, metrics, trafficShare, isWinner }) => {
  return (
    <div className={`
      border-2 rounded-lg p-4
      ${isWinner ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}
    `}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase">{label}</p>
          <h4 className="font-bold text-gray-900">{modelName}</h4>
        </div>
        {isWinner && (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🏆</span>
          </div>
        )}
      </div>

      {/* Traffic Split */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Traffic Share</span>
          <span className="font-bold text-gray-900">{(trafficShare * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full"
            style={{ width: `${trafficShare * 100}%` }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        <MetricRow
          label="Accuracy"
          value={`${(metrics.accuracy * 100).toFixed(1)}%`}
          isHighlight={isWinner}
        />
        <MetricRow
          label="Predictions"
          value={metrics.predictions.toLocaleString()}
        />
        <MetricRow
          label="Avg Latency"
          value={`${metrics.avgLatency}ms`}
          isLower={isWinner}
        />
        <MetricRow
          label="Errors"
          value={metrics.errors.toString()}
          isLower={!isWinner}
        />
      </div>
    </div>
  );
};

const MetricRow: React.FC<{
  label: string;
  value: string;
  isHighlight?: boolean;
  isLower?: boolean;
}> = ({ label, value, isHighlight, isLower }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-bold ${isHighlight ? 'text-green-600' : 'text-gray-900'}`}>
          {value}
        </span>
        {isHighlight && <TrendingUp className="w-4 h-4 text-green-600" />}
        {isLower && <TrendingDown className="w-4 h-4 text-red-600" />}
      </div>
    </div>
  );
};

export default ABTestingDashboard;
