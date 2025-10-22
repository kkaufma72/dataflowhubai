import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import {
  Play,
  Upload,
  Zap,
  BarChart,
  Rocket,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const DemoPage: React.FC = () => {
  const navigate = useNavigate();
  const { enterDemoMode, demoProgress, completeDemoStep } = useDemo();
  const [currentStep, setCurrentStep] = useState(0);

  const demoSteps = [
    {
      id: 'view-data',
      title: 'Explore Sample Data',
      description: 'View pre-loaded datasets and understand your data',
      icon: <Upload className="h-6 w-6" />,
      action: () => {
        completeDemoStep('view-data');
        navigate('/demo/dashboard');
      },
    },
    {
      id: 'train-model',
      title: 'Train Your First Model',
      description: 'Use AutoML to train a model in one click',
      icon: <Zap className="h-6 w-6" />,
      action: () => {
        completeDemoStep('train-model');
        navigate('/demo/train');
      },
    },
    {
      id: 'evaluate',
      title: 'Evaluate Performance',
      description: 'See how well your model performs',
      icon: <BarChart className="h-6 w-6" />,
      action: () => {
        completeDemoStep('evaluate');
        navigate('/demo/evaluate');
      },
    },
    {
      id: 'deploy',
      title: 'Deploy to Production',
      description: 'Make your model accessible via API',
      icon: <Rocket className="h-6 w-6" />,
      action: () => {
        completeDemoStep('deploy');
        navigate('/demo/deploy');
      },
    },
    {
      id: 'complete',
      title: 'Sign Up to Continue',
      description: 'Create an account to save your work',
      icon: <CheckCircle className="h-6 w-6" />,
      action: () => {
        navigate('/signin?source=demo');
      },
    },
  ];

  const handleStartDemo = () => {
    enterDemoMode();
    setCurrentStep(0);
    navigate('/demo/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">DataFlowHub AI Demo</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Progress: {Math.round(demoProgress)}%
              </span>
              <a
                href="/signin"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Sign In
              </a>
              <a
                href="/pricing"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                View Plans
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full mb-6">
            <Play className="h-4 w-4" />
            <span className="text-sm font-medium">Interactive Demo - No Signup Required</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Try DataFlowHub AI
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              in 5 Minutes
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Experience the full ML workflow from data to deployment. No account needed to start.
          </p>

          <button
            onClick={handleStartDemo}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl"
          >
            <Play className="h-5 w-5" />
            Start Interactive Demo
            <ArrowRight className="h-5 w-5" />
          </button>

          <p className="text-sm text-gray-500 mt-4">
            5-minute guided experience • Pre-loaded data • Real ML algorithms
          </p>
        </div>
      </section>

      {/* Demo Steps */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What You'll Experience
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoSteps.slice(0, -1).map((step, index) => (
              <div
                key={step.id}
                className="relative bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-indigo-300 transition-all hover:shadow-lg"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>

                <div className="p-3 bg-indigo-100 rounded-lg w-fit mb-4 text-indigo-600">
                  {step.icon}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Everything You Need for ML
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center text-white text-2xl">
                📊
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Data Management</h3>
              <p className="text-sm text-gray-600">
                Upload, explore, and prepare your datasets with built-in quality checks
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center text-white text-2xl">
                🤖
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AutoML Training</h3>
              <p className="text-sm text-gray-600">
                Train models with multiple algorithms and automatic hyperparameter tuning
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl mx-auto mb-4 flex items-center justify-center text-white text-2xl">
                🚀
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">One-Click Deploy</h3>
              <p className="text-sm text-gray-600">
                Deploy models to production with auto-generated REST APIs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Build Real Models?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Sign up to save your work and unlock unlimited features
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleStartDemo}
              className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              Try Demo First
            </button>
            <a
              href="/signin"
              className="px-8 py-4 bg-indigo-800 text-white rounded-lg font-semibold hover:bg-indigo-900 transition border-2 border-white/20"
            >
              Create Free Account
            </a>
          </div>
          <p className="text-indigo-200 mt-4 text-sm">
            No credit card required • Free plan available
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-300">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm">
            © 2025 DataFlowHub AI. All rights reserved.
          </p>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <a href="/terms" className="hover:text-white">Terms</a>
            <a href="/docs" className="hover:text-white">Documentation</a>
            <a href="mailto:support@dataflowhubai.com" className="hover:text-white">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DemoPage;
