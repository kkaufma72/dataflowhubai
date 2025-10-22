import React from 'react';
import { TrendingUp, Zap, Crown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import Card from '../common/Card';

interface UpgradePromptProps {
  feature: string;
  currentTier: string;
  requiredTier: string;
  onClose?: () => void;
  variant?: 'modal' | 'banner' | 'inline';
}

const TIER_BENEFITS: Record<string, string[]> = {
  starter: [
    'Up to 10 datasets',
    'Advanced visualizations',
    'Email support',
    '5 GB storage',
    'API access',
  ],
  professional: [
    'Unlimited datasets',
    'Advanced AutoML',
    'Priority support',
    '50 GB storage',
    'Advanced API access',
    'Custom integrations',
  ],
  team: [
    'Everything in Professional',
    'Team collaboration',
    'Dedicated support',
    '500 GB storage',
    'Advanced security',
    'SLA guarantees',
  ],
};

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  currentTier,
  requiredTier,
  onClose,
  variant = 'inline',
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/app/settings?tab=billing');
    if (onClose) onClose();
  };

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-lg shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Crown className="w-6 h-6 mr-3" />
            <div>
              <p className="font-semibold">Upgrade to {requiredTier} to unlock {feature}</p>
              <p className="text-sm text-indigo-100 mt-1">
                Get access to advanced features and unlimited resources
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={handleUpgrade} variant="primary" className="bg-white text-indigo-600 hover:bg-gray-100">
              Upgrade Now
            </Button>
            {onClose && (
              <button onClick={onClose} className="text-white hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-2xl w-full">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Upgrade to {requiredTier}</h2>
                  <p className="text-sm text-gray-600 mt-1">Unlock premium features and grow your business</p>
                </div>
              </div>
              {onClose && (
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <Zap className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800 font-medium">Feature Limit Reached</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    You've reached the limit for <strong>{feature}</strong> on the {currentTier} plan.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What you'll get:</h3>
              <ul className="space-y-2">
                {TIER_BENEFITS[requiredTier]?.map((benefit, idx) => (
                  <li key={idx} className="flex items-start text-gray-700">
                    <TrendingUp className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex space-x-3">
              <Button onClick={handleUpgrade} variant="primary" className="flex-1">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to {requiredTier}
              </Button>
              {onClose && (
                <Button onClick={onClose} variant="outline">
                  Maybe Later
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Inline variant
  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="p-6">
        <div className="flex items-start">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Upgrade to unlock {feature}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              You've reached the limit for {feature} on the {currentTier} plan. Upgrade to {requiredTier} to continue.
            </p>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Included in {requiredTier}:</p>
              <ul className="grid grid-cols-2 gap-2">
                {TIER_BENEFITS[requiredTier]?.slice(0, 4).map((benefit, idx) => (
                  <li key={idx} className="flex items-start text-sm text-gray-600">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1 flex-shrink-0 mt-0.5" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <Button onClick={handleUpgrade} variant="primary" size="sm">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default UpgradePrompt;
