// Premium Route Component - Protect premium features
// Redirects free users to pricing page

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';

interface PremiumRouteProps {
  children: ReactNode;
  requiredFeature?: 'canDeploy' | 'canMonitor' | 'advancedAnalytics';
}

const PremiumRoute = ({ children, requiredFeature }: PremiumRouteProps) => {
  const subscription = useSubscription();

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

  // If free tier, redirect to pricing
  if (!hasAccess) {
    return <Navigate to="/pricing" replace />;
  }

  // User has access, render the protected content
  return <>{children}</>;
};

export default PremiumRoute;
