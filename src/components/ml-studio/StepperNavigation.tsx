import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
  eta?: string;
}

interface StepperNavigationProps {
  steps: Step[];
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick?: (stepId: number) => void;
}

const StepperNavigation: React.FC<StepperNavigationProps> = ({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}) => {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between w-full max-w-4xl mx-auto">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted || isCurrent;

          return (
            <li key={step.id} className="relative flex-1">
              {/* Connector line (skip for last step) */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-6 left-1/2 w-full h-1 transition-colors duration-300 ${
                    completedSteps.has(step.id)
                      ? 'bg-indigo-500'
                      : 'bg-gray-800'
                  }`}
                  aria-hidden="true"
                />
              )}

              {/* Step button */}
              <button
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={`relative flex flex-col items-center group ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                {/* Circle */}
                <span
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-full 
                    transition-all duration-300 z-10
                    ${
                      isCompleted
                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                        : isCurrent
                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white ring-4 ring-indigo-500/30 scale-110 shadow-lg shadow-indigo-500/40'
                        : 'bg-gray-900 text-gray-500 border-2 border-gray-700'
                    }
                    ${isClickable && 'group-hover:scale-105'}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </span>

                {/* Label */}
                <div className="mt-4 text-center">
                  <p
                    className={`text-sm font-semibold transition-colors ${
                      isCurrent
                        ? 'text-white'
                        : isCompleted
                        ? 'text-gray-300'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="mt-1.5 text-xs text-gray-400 max-w-[130px]">
                    {step.description}
                  </p>
                  {step.eta && (
                    <p className="mt-1 text-[11px] text-gray-500">ETA {step.eta}</p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default StepperNavigation;
