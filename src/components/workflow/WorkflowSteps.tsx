import React from 'react';
import { Check, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export type StepStatus = 'completed' | 'current' | 'upcoming' | 'error';

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  status: StepStatus;
  href: string;
}

interface WorkflowStepsProps {
  steps: WorkflowStep[];
  orientation?: 'horizontal' | 'vertical';
}

const WorkflowSteps: React.FC<WorkflowStepsProps> = ({
  steps,
  orientation = 'horizontal'
}) => {
  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return <Check className="w-5 h-5 text-white" />;
      case 'current':
        return <Clock className="w-5 h-5 text-white" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-white" />;
      default:
        return <span className="w-2.5 h-2.5 bg-gray-200 rounded-full" />;
    }
  };

  const getStepIconBackground = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'current':
        return 'bg-indigo-600';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-white border-2 border-gray-300';
    }
  };

  const getStepTextColor = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'current':
        return 'text-indigo-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  if (orientation === 'horizontal') {
    return (
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} ${stepIdx !== 0 ? 'pl-8 sm:pl-20' : ''}`}>
              {stepIdx !== steps.length - 1 && (
                <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200">
                  <div 
                    className="h-0.5 bg-green-500" 
                    style={{ width: step.status === 'completed' ? '100%' : '0%' }}
                  />
                </div>
              )}
              
              <Link
                to={step.href}
                className={`relative flex flex-col items-center group ${
                  step.status === 'upcoming' ? 'pointer-events-none' : ''
                }`}
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-full">
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full ${getStepIconBackground(step.status)}`}>
                    {getStepIcon(step.status)}
                  </span>
                </span>
                <span className={`mt-2 text-xs font-medium ${getStepTextColor(step.status)}`}>
                  {step.name}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="Progress">
      <ol className="overflow-hidden">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pb-8' : ''}`}>
            {stepIdx !== steps.length - 1 && (
              <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-200" aria-hidden="true" />
            )}
            
            <div className="relative flex items-start group">
              <span className="flex items-center h-9">
                <span className={`flex items-center justify-center w-8 h-8 rounded-full ${getStepIconBackground(step.status)}`}>
                  {getStepIcon(step.status)}
                </span>
              </span>
              
              <span className="ml-4 min-w-0 flex flex-col">
                <Link
                  to={step.href}
                  className={`text-sm font-medium ${getStepTextColor(step.status)} ${
                    step.status === 'upcoming' ? 'pointer-events-none' : ''
                  }`}
                >
                  {step.name}
                </Link>
                {step.description && (
                  <span className="text-xs text-gray-500">{step.description}</span>
                )}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default WorkflowSteps;