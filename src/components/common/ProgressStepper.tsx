// Progress Stepper Component
// Shows contextual progress markers across long flows

import React from 'react';
import { Check } from 'lucide-react';

export interface Step {
  id: string;
  label: string;
  description?: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowSkip?: boolean;
}

const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  allowSkip = false
}) => {
  const isStepComplete = (index: number) => index < currentStep;
  const isStepCurrent = (index: number) => index === currentStep;
  const isStepClickable = (index: number) => {
    return allowSkip || index < currentStep;
  };

  return (
    <div className="w-full">
      {/* Desktop: Horizontal Stepper */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div className="flex flex-col items-center flex-1">
                <button
                  onClick={() => isStepClickable(index) && onStepClick?.(index)}
                  disabled={!isStepClickable(index)}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold mb-2 transition
                    ${
                      isStepComplete(index)
                        ? 'bg-green-500 text-white'
                        : isStepCurrent(index)
                        ? 'bg-blue-600 text-white ring-4 ring-blue-600/30'
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }
                    ${isStepClickable(index) ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}
                  `}
                >
                  {isStepComplete(index) ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                <div className="text-center">
                  <p
                    className={`text-sm font-medium ${
                      isStepCurrent(index)
                        ? 'text-gray-100'
                        : isStepComplete(index)
                        ? 'text-gray-300'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  )}
                </div>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 mb-8">
                  <div
                    className={`h-1 rounded-full transition ${
                      isStepComplete(index + 1)
                        ? 'bg-green-500'
                        : isStepCurrent(index + 1)
                        ? 'bg-gradient-to-r from-green-500 to-gray-700'
                        : 'bg-gray-700'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Mobile: Vertical Stepper */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-3">
            {/* Step Number/Check */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => isStepClickable(index) && onStepClick?.(index)}
                disabled={!isStepClickable(index)}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition
                  ${
                    isStepComplete(index)
                      ? 'bg-green-500 text-white'
                      : isStepCurrent(index)
                      ? 'bg-blue-600 text-white ring-4 ring-blue-600/30'
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }
                  ${isStepClickable(index) ? 'cursor-pointer' : 'cursor-not-allowed'}
                `}
              >
                {isStepComplete(index) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`w-1 h-12 rounded-full mt-2 ${
                    isStepComplete(index + 1)
                      ? 'bg-green-500'
                      : isStepCurrent(index + 1)
                      ? 'bg-gradient-to-b from-green-500 to-gray-700'
                      : 'bg-gray-700'
                  }`}
                />
              )}
            </div>

            {/* Step Label */}
            <div className="flex-1 pt-1">
              <p
                className={`text-sm font-medium ${
                  isStepCurrent(index)
                    ? 'text-gray-100'
                    : isStepComplete(index)
                    ? 'text-gray-300'
                    : 'text-gray-500'
                }`}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>Progress</span>
          <span>
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressStepper;
