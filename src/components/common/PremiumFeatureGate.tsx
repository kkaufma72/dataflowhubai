// Premium Feature Gate - Wrapper for premium-only features

import React from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import UpgradePrompt from './UpgradePrompt';

interface PremiumFeatureGateProps {
  feature: 'train_models' | 'evaluate' | 'deploy' | 'monitoring';
  children: React.ReactNode;
}

const PremiumFeatureGate: React.FC<PremiumFeatureGateProps> = ({ feature, children }) => {
  const subscription = useSubscription();

  // Check if user has access to this feature
  const hasAccess = () => {
    switch (feature) {
      case 'train_models':
        return subscription.features.canTrainModels;
      case 'evaluate':
        return subscription.features.canEvaluate;
      case 'deploy':
        return subscription.features.canDeploy;
      case 'monitoring':
        return subscription.features.canMonitor;
      default:
        return false;
    }
  };

  if (subscription.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess()) {
    return <UpgradePrompt feature={feature} isModal={false} />;
  }

  return <>{children}</>;
};

export default PremiumFeatureGate;

