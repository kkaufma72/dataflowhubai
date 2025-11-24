import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader2, Clock } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  description: string;
  estimatedTime: string;
  complete: boolean;
  inProgress: boolean;
}

interface ModelTrainingProgressProps {
  status?: 'idle' | 'preprocessing' | 'feature_engineering' | 'training' | 'tuning' | 'validating' | 'complete' | 'error';
  onComplete?: () => void;
  className?: string;
}

export const ModelTrainingProgress: React.FC<ModelTrainingProgressProps> = ({
  status = 'idle',
  onComplete,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const steps: Step[] = [
    {
      id: 'preprocessing',
      label: 'Preprocessing data',
      description: 'Cleaning and validating dataset',
      estimatedTime: '5s',
      complete: status !== 'idle' && status !== 'preprocessing',
      inProgress: status === 'preprocessing'
    },
    {
      id: 'feature_engineering',
      label: 'Feature engineering',
      description: 'Extracting and selecting features',
      estimatedTime: '10s',
      complete: ['training', 'tuning', 'validating', 'complete'].includes(status),
      inProgress: status === 'feature_engineering'
    },
    {
      id: 'training',
      label: 'Testing 50+ algorithms',
      description: 'Random Forest, XGBoost, Neural Networks...',
      estimatedTime: '20s',
      complete: ['tuning', 'validating', 'complete'].includes(status),
      inProgress: status === 'training'
    },
    {
      id: 'tuning',
      label: 'Hyperparameter tuning',
      description: 'Optimizing model parameters',
      estimatedTime: '15s',
      complete: ['validating', 'complete'].includes(status),
      inProgress: status === 'tuning'
    },
    {
      id: 'validating',
      label: 'Validating results',
      description: 'Cross-validation and metrics',
      estimatedTime: '5s',
      complete: status === 'complete',
      inProgress: status === 'validating'
    }
  ];

  // Timer for elapsed time
  useEffect(() => {
    if (status !== 'idle' && status !== 'complete' && status !== 'error') {
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status]);

  // Call onComplete when training finishes
  useEffect(() => {
    if (status === 'complete' && onComplete) {
      onComplete();
    }
  }, [status, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const totalSteps = steps.length;
  const completedSteps = steps.filter(s => s.complete).length;
  const progress = Math.round((completedSteps / totalSteps) * 100);

  if (status === 'idle') return null;

  return (
    <div className={`bg-white rounded-xl border-2 border-indigo-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Training Model</h3>
          <p className="text-sm text-gray-600">
            {status === 'complete' 
              ? `✓ Complete in ${formatTime(elapsedTime)}`
              : `Step ${completedSteps + 1} of ${totalSteps}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span className="font-mono">{formatTime(elapsedTime)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">Overall Progress</span>
          <span className="font-bold text-indigo-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-500 relative"
            style={{ width: `${progress}%` }}
          >
            {status !== 'complete' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={`
              flex items-start gap-3 p-3 rounded-lg transition-all
              ${step.complete 
                ? 'bg-green-50 border border-green-200' 
                : step.inProgress 
                  ? 'bg-indigo-50 border border-indigo-200'
                  : 'bg-gray-50 border border-gray-200'
              }
            `}
          >
            {/* Status Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {step.complete ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : step.inProgress ? (
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
              )}
            </div>

            {/* Step Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className={`
                  text-sm font-medium
                  ${step.complete ? 'text-green-900' : step.inProgress ? 'text-indigo-900' : 'text-gray-700'}
                `}>
                  {step.label}
                </p>
                <span className={`
                  text-xs font-mono
                  ${step.complete ? 'text-green-600' : step.inProgress ? 'text-indigo-600' : 'text-gray-500'}
                `}>
                  ~{step.estimatedTime}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {step.description}
              </p>
              
              {/* In Progress Animation */}
              {step.inProgress && (
                <div className="mt-2">
                  <div className="w-full bg-indigo-200 rounded-full h-1 overflow-hidden">
                    <div className="bg-indigo-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              )}
              
              {/* Complete Badge */}
              {step.complete && (
                <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-green-600">
                  ✓ Done
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Success Message */}
      {status === 'complete' && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-green-900">Training Complete!</p>
              <p className="text-sm text-green-700">
                Model is ready to deploy. Check results below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {status === 'error' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-900">
            ⚠️ Training failed. Please try again or contact support.
          </p>
        </div>
      )}
    </div>
  );
};

export default ModelTrainingProgress;
