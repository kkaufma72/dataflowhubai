import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';

interface OnboardingStep {
  title: string;
  description: string;
  image?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface WelcomeOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      title: 'Welcome to DataFlowHub AI! 🎉',
      description: 'Build, train, and deploy machine learning models without writing code. Let\'s get you started with a quick tour.',
    },
    {
      title: 'Upload Your Data',
      description: 'Start by uploading your datasets. We support CSV, Excel, and JSON formats. Our AI will automatically analyze your data and suggest the best approach.',
    },
    {
      title: 'Train Models with AutoML',
      description: 'Our AutoML engine automatically selects the best algorithms, tunes hyperparameters, and trains multiple models for you to compare.',
    },
    {
      title: 'Deploy to Production',
      description: 'Deploy your models as REST APIs with one click. Monitor performance, track predictions, and manage versions all in one place.',
    },
    {
      title: 'Get AI Assistance',
      description: 'Use our AI Chat Assistant to ask questions about your data, create visualizations, or train models using natural language. Press ⌘+K anytime to access it.',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Step {currentStep + 1} of {steps.length}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onSkip}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {steps[currentStep].title}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {steps[currentStep].description}
            </p>

            {steps[currentStep].image && (
              <div className="mt-6 rounded-lg overflow-hidden bg-gray-100 aspect-video flex items-center justify-center">
                <p className="text-gray-400">Feature illustration placeholder</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div>
              {currentStep > 0 && (
                <Button onClick={handlePrevious} variant="outline" size="md">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 w-2 rounded-full transition-all ${
                    idx === currentStep
                      ? 'bg-indigo-600 w-8'
                      : idx < currentStep
                      ? 'bg-indigo-400'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <div>
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} variant="primary" size="md">
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={onComplete} variant="primary" size="md">
                  <Check className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              )}
            </div>
          </div>

          {/* Skip option */}
          <div className="mt-6 text-center">
            <button
              onClick={onSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip tutorial
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WelcomeOnboarding;
