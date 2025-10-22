import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';

interface SubscriptionTier {
  tier: string;
  status: string;
  limits: {
    datasets: number;
    storage: number; // in MB
    apiCalls: number; // per month
    models: number;
  };
}

const TIER_LIMITS: Record<string, SubscriptionTier['limits']> = {
  free: {
    datasets: 3,
    storage: 100,
    apiCalls: 100,
    models: 5,
  },
  starter: {
    datasets: 10,
    storage: 5000,
    apiCalls: 1000,
    models: 20,
  },
  professional: {
    datasets: -1, // unlimited
    storage: 50000,
    apiCalls: 10000,
    models: -1, // unlimited
  },
  team: {
    datasets: -1,
    storage: 500000,
    apiCalls: 100000,
    models: -1,
  },
};

interface UsageData {
  datasets: number;
  storage: number;
  apiCalls: number;
  models: number;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionTier | null>(null);
  const [usage, setUsage] = useState<UsageData>({
    datasets: 0,
    storage: 0,
    apiCalls: 0,
    models: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscriptionAndUsage();
    }
  }, [user]);

  const fetchSubscriptionAndUsage = async () => {
    try {
      setLoading(true);

      // Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('tier, status')
        .eq('user_id', user?.id)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      const tier = subData?.tier || 'free';
      const status = subData?.status || 'inactive';

      setSubscription({
        tier,
        status,
        limits: TIER_LIMITS[tier] || TIER_LIMITS.free,
      });

      // Fetch usage data
      const currentPeriodStart = new Date();
      currentPeriodStart.setDate(1); // First day of current month
      currentPeriodStart.setHours(0, 0, 0, 0);

      // Count datasets
      const { count: datasetsCount } = await supabase
        .from('datasets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Count models
      const { count: modelsCount } = await supabase
        .from('models')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Get usage metrics for current period
      const { data: metrics } = await supabase
        .from('usage_metrics')
        .select('metric_type, metric_value')
        .eq('user_id', user?.id)
        .gte('period_start', currentPeriodStart.toISOString());

      const storageMetric = metrics?.find((m) => m.metric_type === 'storage_used');
      const apiCallsMetric = metrics?.find((m) => m.metric_type === 'api_calls');

      setUsage({
        datasets: datasetsCount || 0,
        storage: storageMetric?.metric_value || 0,
        apiCalls: apiCallsMetric?.metric_value || 0,
        models: modelsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching subscription and usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLimit = (resource: keyof UsageData): boolean => {
    if (!subscription) return false;

    const limit = subscription.limits[resource];
    const currentUsage = usage[resource];

    // -1 means unlimited
    if (limit === -1) return true;

    return currentUsage < limit;
  };

  const getRemainingLimit = (resource: keyof UsageData): number => {
    if (!subscription) return 0;

    const limit = subscription.limits[resource];
    const currentUsage = usage[resource];

    // -1 means unlimited
    if (limit === -1) return Infinity;

    return Math.max(0, limit - currentUsage);
  };

  const getUsagePercentage = (resource: keyof UsageData): number => {
    if (!subscription) return 0;

    const limit = subscription.limits[resource];
    const currentUsage = usage[resource];

    // -1 means unlimited
    if (limit === -1) return 0;

    return Math.min(100, (currentUsage / limit) * 100);
  };

  const incrementUsage = async (
    metricType: 'datasets_uploaded' | 'models_trained' | 'api_calls' | 'storage_used',
    value: number
  ) => {
    if (!user) return;

    try {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      await supabase.from('usage_metrics').upsert({
        user_id: user.id,
        metric_type: metricType,
        metric_value: value,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      });

      // Refresh usage
      await fetchSubscriptionAndUsage();
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  };

  return {
    subscription,
    usage,
    loading,
    checkLimit,
    getRemainingLimit,
    getUsagePercentage,
    incrementUsage,
    refreshSubscription: fetchSubscriptionAndUsage,
  };
};
