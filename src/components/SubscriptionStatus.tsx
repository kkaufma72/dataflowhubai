import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useCustomerPortal } from '../hooks/useCustomerPortal';
import { CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export const SubscriptionStatus: React.FC = () => {
  const { subscription, loading, hasActiveSubscription, isTrialing, isPastDue } = useSubscription();
  const { openPortal, loading: portalLoading } = useCustomerPortal();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-6 w-6 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-800">No Active Subscription</h2>
        </div>
        <p className="text-gray-600 mb-4">
          You are currently on the free plan. Upgrade to unlock premium features.
        </p>
        <a
          href="/pricing"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Pricing Plans
        </a>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = () => {
    if (isTrialing) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          <Clock className="h-4 w-4" />
          Trialing
        </span>
      );
    }
    if (isPastDue) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
          <AlertCircle className="h-4 w-4" />
          Past Due
        </span>
      );
    }
    if (hasActiveSubscription) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          <CheckCircle className="h-4 w-4" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
        {subscription.status}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Subscription</h2>
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Plan</p>
          <p className="text-lg font-semibold text-gray-800 capitalize">
            {subscription.tier} - {subscription.billing_period}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Current Period</p>
            <p className="text-sm text-gray-800">
              {formatDate(subscription.current_period_start)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Renews On</p>
            <p className="text-sm text-gray-800">
              {formatDate(subscription.current_period_end)}
            </p>
          </div>
        </div>

        {subscription.cancel_at_period_end && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Subscription Ending
                </p>
                <p className="text-sm text-yellow-700">
                  Your subscription will end on {formatDate(subscription.current_period_end)}
                </p>
              </div>
            </div>
          </div>
        )}

        {isPastDue && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Payment Failed
                </p>
                <p className="text-sm text-red-700">
                  Please update your payment method to continue your subscription.
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={openPortal}
          disabled={portalLoading}
          className="w-full bg-gray-100 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {portalLoading ? 'Loading...' : 'Manage Subscription'}
        </button>
      </div>
    </div>
  );
};
