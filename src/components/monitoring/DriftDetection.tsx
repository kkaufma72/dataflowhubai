import React from 'react';
import { Card } from '../common/Card';
import { AlertTriangle, RefreshCw, ArrowRight, Check, X } from 'lucide-react';
import Button from '../common/Button';
import { Bar } from 'react-chartjs-2';

interface DriftData {
  featureName: string;
  driftScore: number;
  status: 'normal' | 'warning' | 'critical';
}

interface DriftDetectionProps {
  driftData: DriftData[];
  onRetrainRequest: () => void;
  isRetraining: boolean;
  retrainingProgress: number;
}

const DriftDetection: React.FC<DriftDetectionProps> = ({
  driftData,
  onRetrainRequest,
  isRetraining,
  retrainingProgress
}) => {
  const hasCriticalDrift = driftData.some(d => d.status === 'critical');
  const hasWarningDrift = driftData.some(d => d.status === 'warning');
  
  const getDriftChartData = () => {
    return {
      labels: driftData.map(d => d.featureName),
      datasets: [
        {
          label: 'Drift Score',
          data: driftData.map(d => d.driftScore),
          backgroundColor: driftData.map(d => 
            d.status === 'critical' 
              ? 'rgba(239, 68, 68, 0.7)' 
              : d.status === 'warning' 
              ? 'rgba(245, 158, 11, 0.7)' 
              : 'rgba(16, 185, 129, 0.7)'
          ),
          borderWidth: 1,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const status = value > 0.7 
              ? 'Critical' 
              : value > 0.4 
              ? 'Warning' 
              : 'Normal';
            return [`Drift Score: ${value.toFixed(2)}`, `Status: ${status}`];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          callback: function(value: any) {
            return value.toFixed(1);
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Feature Drift Analysis</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
              <span className="text-xs text-gray-500">Normal</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-amber-500 rounded-full mr-1"></span>
              <span className="text-xs text-gray-500">Warning</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
              <span className="text-xs text-gray-500">Critical</span>
            </div>
          </div>
        </div>
        <div className="h-64">
          <Bar data={getDriftChartData()} options={chartOptions} />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Drift Details</h3>
          <div className="space-y-4">
            {driftData.map((feature) => (
              <div key={feature.featureName} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{feature.featureName}</p>
                  <p className="text-xs text-gray-500">
                    Drift Score: {feature.driftScore.toFixed(2)}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  feature.status === 'critical'
                    ? 'bg-red-100 text-red-800'
                    : feature.status === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {feature.status.charAt(0).toUpperCase() + feature.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Drift Impact Analysis</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                hasCriticalDrift 
                  ? 'bg-red-100' 
                  : hasWarningDrift 
                  ? 'bg-amber-100' 
                  : 'bg-green-100'
              }`}>
                {hasCriticalDrift ? (
                  <X className="w-5 h-5 text-red-600" />
                ) : hasWarningDrift ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                ) : (
                  <Check className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div className="ml-3">
                <h4 className={`text-sm font-medium ${
                  hasCriticalDrift 
                    ? 'text-red-800' 
                    : hasWarningDrift 
                    ? 'text-amber-800' 
                    : 'text-green-800'
                }`}>
                  {hasCriticalDrift 
                    ? 'Critical Drift Detected' 
                    : hasWarningDrift 
                    ? 'Potential Drift Detected' 
                    : 'No Significant Drift'}
                </h4>
                <p className={`mt-1 text-sm ${
                  hasCriticalDrift 
                    ? 'text-red-700' 
                    : hasWarningDrift 
                    ? 'text-amber-700' 
                    : 'text-green-700'
                }`}>
                  {hasCriticalDrift 
                    ? 'Model performance is significantly impacted. Immediate retraining recommended.' 
                    : hasWarningDrift 
                    ? 'Model performance may be affected. Consider retraining soon.' 
                    : 'Model is performing as expected with current data distribution.'}
                </p>
              </div>
            </div>

            {(hasCriticalDrift || hasWarningDrift) && (
              <div className="mt-4">
                {isRetraining ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Retraining progress</span>
                      <span className="text-sm font-medium text-gray-700">{Math.round(retrainingProgress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${retrainingProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={onRetrainRequest}
                    icon={<RefreshCw className="w-4 h-4" />}
                  >
                    Retrain Model
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4">Drift Detection Methodology</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Statistical Tests</h4>
            <p className="mt-1 text-sm text-gray-600">
              We use a combination of statistical tests to detect drift in your data:
            </p>
            <ul className="mt-2 ml-6 list-disc text-sm text-gray-600 space-y-1">
              <li>Kolmogorov-Smirnov test for numerical features</li>
              <li>Chi-square test for categorical features</li>
              <li>Population Stability Index (PSI) for overall distribution shift</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900">Thresholds</h4>
            <p className="mt-1 text-sm text-gray-600">
              Drift severity is determined by these thresholds:
            </p>
            <ul className="mt-2 ml-6 list-disc text-sm text-gray-600 space-y-1">
              <li><span className="font-medium text-green-600">Normal:</span> Drift score &lt; 0.4</li>
              <li><span className="font-medium text-amber-600">Warning:</span> Drift score between 0.4 and 0.7</li>
              <li><span className="font-medium text-red-600">Critical:</span> Drift score &gt; 0.7</li>
            </ul>
          </div>
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Learn More
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DriftDetection;