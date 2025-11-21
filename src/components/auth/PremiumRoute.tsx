// Premium Route Component - Protect premium features
// Redirects free users to pricing page

import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';
import UpgradePrompt from '../common/UpgradePrompt';

interface PremiumRouteProps {
  children: ReactNode;
  requiredFeature?: 'canDeploy' | 'canMonitor' | 'advancedAnalytics';
}

const PremiumRoute = ({ children, requiredFeature }: PremiumRouteProps) => {
  const subscription = useSubscription();
  const navigate = useNavigate();

  // Show loading state while checking subscription
  if (subscription.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-indigo-600 mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  // Check if user has required feature access
  const hasAccess = requiredFeature 
    ? subscription.features[requiredFeature]
    : subscription.tier === 'professional' || subscription.tier === 'team';

  const featureMap: Record<NonNullable<PremiumRouteProps['requiredFeature']>, 'deploy' | 'monitoring' | 'train_models'> = {
    canDeploy: 'deploy',
    canMonitor: 'monitoring',
    advancedAnalytics: 'train_models'
  };

  // If free tier, show upgrade prompt modal rather than bouncing to landing
  if (!hasAccess) {
    const feature = requiredFeature ? featureMap[requiredFeature] : 'deploy';
    return (
      <>
        <div className="min-h-[70vh] bg-slate-50" aria-hidden="true" />
        <UpgradePrompt
          feature={feature}
          onClose={() => navigate('/app')}
        />
      </>
    );
  }

  // User has access, render the protected content
  return <>{children}</>;
};

export default PremiumRoute;
