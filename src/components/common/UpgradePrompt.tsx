// Upgrade Prompt - Shown when free users try premium features

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap, TrendingUp, X, CreditCard } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import { useStripeCheckout } from '../../hooks/useStripeCheckout';
import toast from 'react-hot-toast';

interface UpgradePromptProps {
  feature: string;
  onClose?: () => void;
  isModal?: boolean;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ feature, onClose, isModal = true }) => {
  const navigate = useNavigate();
  const { startCheckout, loading } = useStripeCheckout();

  const featureDescriptions: Record<string, { title: string; description: string; benefits: string[] }> = {
    train_models: {
      title: '🤖 ML Model Training',
      description: 'Build and train machine learning models with one click',
      benefits: [
        'Auto-select best algorithms',
        'Hyperparameter optimization',
        'Cross-validation built-in',
        'Deploy models to production',
        'Track model performance'
      ]
    },
    evaluate: {
      title: '📊 Model Evaluation',
      description: 'Test and compare model performance',
      benefits: [
        'Accuracy metrics',
        'Confusion matrices',
        'Feature importance',
        'Performance charts',
        'A/B model comparison'
      ]
    },
    deploy: {
      title: '🚀 Model Deployment',
      description: 'Deploy models to production with API endpoints',
      benefits: [
        'One-click deployment',
        'Auto-scaling',
        'API access',
        'Real-time predictions',
        'Version control'
      ]
    },
    monitoring: {
      title: '📈 Model Monitoring',
      description: 'Track model performance in production',
      benefits: [
        'Real-time metrics',
        'Drift detection',
        'Performance alerts',
        'Usage analytics',
        'Health monitoring'
      ]
    }
  };

  const featureInfo = featureDescriptions[feature] || {
    title: 'Premium Feature',
    description: 'This feature is available on Pro and Team plans',
    benefits: ['Unlock with upgrade']
  };

  const UpgradeContent = () => (
    <div className="relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-600 rounded-2xl mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-primary-600 mb-2">
          {featureInfo.title}
        </h2>
        <p className="text-gray-600">
          {featureInfo.description}
        </p>
      </div>

      {/* Feature Benefits */}
      <Card className="mb-6 bg-gradient-to-br from-primary/5 to-primary/5 border-primary/20">
        <h3 className="font-semibold text-gray-900 mb-4">What you'll get:</h3>
        <ul className="space-y-3">
          {featureInfo.benefits.map((benefit, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-gray-700">{benefit}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Pricing Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Current Plan</p>
          <p className="text-2xl font-bold text-primary-600">Free</p>
          <p className="text-xs text-gray-500 mt-2">
            3 datasets • 20 AI questions/month
          </p>
        </div>
        <div className="p-4 bg-gradient-to-br from-primary-600 to-primary-600 rounded-lg shadow-md">
          <p className="text-sm text-white/80 mb-1">Upgrade to</p>
          <p className="text-2xl font-bold text-white">Pro</p>
          <p className="text-xs text-white/80 mt-2">
            Unlimited everything
          </p>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-900 mb-1">
              Why upgrade now?
            </p>
            <p className="text-sm text-yellow-800">
              Pro users get unlimited datasets, unlimited AI questions, ML model training, 
              and all advanced features for just <span className="font-bold">$49/month</span>.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={() => {
            toast.loading('Redirecting to checkout...', { id: 'checkout' });
            startCheckout({ tier: 'professional', billing: 'monthly' });
          }}
          variant="primary"
          className="w-full bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 text-lg py-4"
          icon={loading ? undefined : <CreditCard className="w-5 h-5" />}
          disabled={loading}
        >
          {loading ? 'Redirecting to Stripe...' : 'Start 14-Day Free Trial'}
        </Button>
        
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/pricing')}
            variant="outline"
            className="flex-1"
            icon={<TrendingUp className="w-4 h-4" />}
          >
            See All Plans
          </Button>
          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Maybe Later
            </Button>
          )}
        </div>
      </div>

      {/* Satisfaction Guarantee */}
      <div className="mt-4 text-center">
        <p className="text-sm font-semibold text-gray-900 mb-1">
          💳 $49/month • Start free trial now
        </p>
        <p className="text-xs text-gray-500">
          ✨ 14-day free trial • Cancel anytime • No questions asked
        </p>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
          <UpgradeContent />
        </div>
      </div>
    );
  }

  return (
    <Card className="max-w-lg mx-auto p-8">
      <UpgradeContent />
    </Card>
  );
};

export default UpgradePrompt;

