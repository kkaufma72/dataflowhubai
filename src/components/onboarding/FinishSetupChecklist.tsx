import React from 'react';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FinishSetupChecklistProps {
  hasConnectedData: boolean;
  hasProfiledData: boolean;
  hasTrainedModel: boolean;
  hasDeployedModel: boolean;
  onConnect?: () => void;
  onProfile?: () => void;
  onTrain?: () => void;
  onDeploy?: () => void;
}

const FinishSetupChecklist: React.FC<FinishSetupChecklistProps> = ({
  hasConnectedData,
  hasProfiledData,
  hasTrainedModel,
  hasDeployedModel,
  onConnect,
  onProfile,
  onTrain,
  onDeploy,
}) => {
  const steps = [
    {
      key: 'connect',
      title: 'Connect your data',
      description: 'Upload a file or load the sample workspace.',
      completed: hasConnectedData,
      action: onConnect,
      fallbackLink: '/app/data',
    },
    {
      key: 'profile',
      title: 'Profile & clean',
      description: 'Run the quality scan to understand schema + issues.',
      completed: hasProfiledData,
      action: onProfile,
      fallbackLink: '/app/data',
    },
    {
      key: 'train',
      title: 'Train a model',
      description: 'Pick a dataset and let AutoML find the best fit.',
      completed: hasTrainedModel,
      action: onTrain,
      fallbackLink: '/app/train',
    },
    {
      key: 'deploy',
      title: 'Deploy & monitor',
      description: 'Push to production and watch live metrics.',
      completed: hasDeployedModel,
      action: onDeploy,
      fallbackLink: '/app/deploy',
    },
  ];

  const completedCount = steps.filter((step) => step.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white shadow-sm">
      <div className="border-b border-indigo-50 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Finish setup</p>
          <h3 className="text-lg font-bold text-gray-900">You're {completedCount} / {steps.length} steps away from production</h3>
        </div>
        <div className="w-32">
          <div className="h-2 rounded-full bg-indigo-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-right text-xs font-semibold text-indigo-600 mt-1">{Math.round(progressPercent)}%</p>
        </div>
      </div>

      <div className="divide-y divide-indigo-50">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center gap-4 px-6 py-4">
            {step.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Step {index + 1}: {step.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
            </div>
            {!step.completed && (
              step.action ? (
                <button
                  onClick={step.action}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  to={step.fallbackLink}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Link>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinishSetupChecklist;
