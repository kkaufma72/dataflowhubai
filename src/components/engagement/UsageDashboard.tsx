import React from 'react';
import { Database, HardDrive, Activity, BarChart3, TrendingUp } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import Card from '../common/Card';
import Button from '../common/Button';
import { useNavigate } from 'react-router-dom';

const UsageDashboard: React.FC = () => {
  const { subscription, usage, loading, getUsagePercentage, getRemainingLimit } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!subscription) {
    return null;
  }

  const usageItems = [
    {
      icon: <Database className="w-5 h-5" />,
      label: 'Datasets',
      current: usage.datasets,
      limit: subscription.limits.datasets,
      percentage: getUsagePercentage('datasets'),
      color: 'blue',
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Models',
      current: usage.models,
      limit: subscription.limits.models,
      percentage: getUsagePercentage('models'),
      color: 'purple',
    },
    {
      icon: <HardDrive className="w-5 h-5" />,
      label: 'Storage',
      current: Math.round(usage.storage),
      limit: subscription.limits.storage,
      percentage: getUsagePercentage('storage'),
      color: 'green',
      unit: 'MB',
    },
    {
      icon: <Activity className="w-5 h-5" />,
      label: 'API Calls',
      current: usage.apiCalls,
      limit: subscription.limits.apiCalls,
      percentage: getUsagePercentage('apiCalls'),
      color: 'yellow',
      unit: 'this month',
    },
  ];

  const getColorClasses = (color: string, percentage: number) => {
    const baseColors: Record<string, { text: string; bg: string; progress: string }> = {
      blue: { text: 'text-blue-600', bg: 'bg-blue-50', progress: 'bg-blue-500' },
      purple: { text: 'text-purple-600', bg: 'bg-purple-50', progress: 'bg-purple-500' },
      green: { text: 'text-green-600', bg: 'bg-green-50', progress: 'bg-green-500' },
      yellow: { text: 'text-yellow-600', bg: 'bg-yellow-50', progress: 'bg-yellow-500' },
    };

    if (percentage >= 90) {
      return { text: 'text-red-600', bg: 'bg-red-50', progress: 'bg-red-500' };
    } else if (percentage >= 75) {
      return { text: 'text-orange-600', bg: 'bg-orange-50', progress: 'bg-orange-500' };
    }

    return baseColors[color] || baseColors.blue;
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Usage Overview</h3>
            <p className="text-sm text-gray-600 mt-1">
              Current plan: <span className="font-medium capitalize">{subscription.tier}</span>
            </p>
          </div>
          <Button
            onClick={() => navigate('/app/settings?tab=billing')}
            variant="outline"
            size="sm"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Upgrade
          </Button>
        </div>

        <div className="space-y-4">
          {usageItems.map((item, idx) => {
            const colors = getColorClasses(item.color, item.percentage);
            const isUnlimited = item.limit === -1;

            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`${colors.bg} p-2 rounded-lg mr-3`}>
                      <div className={colors.text}>{item.icon}</div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-600">
                        {isUnlimited ? (
                          <>
                            {item.current} {item.unit || 'used'}
                          </>
                        ) : (
                          <>
                            {item.current} of {item.limit} {item.unit || 'used'}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  {!isUnlimited && (
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${colors.text}`}>
                        {Math.round(item.percentage)}%
                      </p>
                      {item.percentage >= 75 && (
                        <p className="text-xs text-gray-500">
                          {getRemainingLimit(item.label.toLowerCase() as any)} left
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {!isUnlimited && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${colors.progress} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                )}

                {!isUnlimited && item.percentage >= 90 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xs text-red-800">
                      ⚠️ You're approaching your {item.label.toLowerCase()} limit. 
                      <button
                        onClick={() => navigate('/app/settings?tab=billing')}
                        className="ml-1 underline font-medium hover:text-red-900"
                      >
                        Upgrade now
                      </button>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {subscription.tier === 'free' && (
          <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
            <p className="text-sm text-gray-800 mb-2">
              <span className="font-semibold">Upgrade to unlock more:</span>
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Unlimited datasets and models</li>
              <li>• Advanced AutoML capabilities</li>
              <li>• Priority support and SLA guarantees</li>
            </ul>
            <Button
              onClick={() => navigate('/app/settings?tab=billing')}
              variant="primary"
              size="sm"
              className="mt-3 w-full"
            >
              Upgrade Plan
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default UsageDashboard;
