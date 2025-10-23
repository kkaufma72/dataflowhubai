import { useState, useEffect } from 'react';
import { UsageStats, PLAN_LIMITS } from '../types/usage';
import { useUser } from '../context/UserContext';
import { useSubscription } from './useSubscription';
import { useMLContext } from '../context/MLContext';

export const useUsageStats = () => {
  const { user } = useUser();
  const { subscription } = useSubscription();
  const { datasets, models } = useMLContext();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    calculateUsage();
  }, [user, subscription, datasets, models]);

  const calculateUsage = async () => {
    try {
      // Determine plan tier
      const tier = subscription?.tier || 'free';
      const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.free;

      // Calculate storage used (sum of all dataset sizes)
      const storageUsed = datasets.reduce((total, dataset) => {
        // Estimate size based on rows and columns
        const estimatedSize = (dataset.totalRows || 0) * (dataset.columns?.length || 0) * 100; // rough estimate
        return total + estimatedSize;
      }, 0);

      const storagePercentage = limits.storage > 0 ? (storageUsed / limits.storage) * 100 : 0;

      // Calculate datasets usage
      const datasetsCount = datasets.length;
      const datasetsLimit = limits.datasets === -1 ? Infinity : limits.datasets;
      const datasetsPercentage = datasetsLimit === Infinity ? 0 : (datasetsCount / datasetsLimit) * 100;

      // Calculate models
      const modelsCreated = models.length;
      const modelsDeployed = models.filter(m => m.status === 'deployed').length;

      // API calls and predictions (from localStorage for demo purposes)
      const apiCallsThisMonth = parseInt(localStorage.getItem('apiCallsThisMonth') || '0');
      const predictionsThisMonth = parseInt(localStorage.getItem('predictionsThisMonth') || '0');

      const apiCallsPercentage = (apiCallsThisMonth / limits.apiCalls) * 100;
      const predictionsPercentage = (predictionsThisMonth / limits.predictions) * 100;

      // Activity tracking
      const lastActiveStr = localStorage.getItem('lastActive');
      const lastActive = lastActiveStr ? new Date(lastActiveStr) : null;

      const accountCreatedStr = user.created_at;
      const accountAge = accountCreatedStr
        ? Math.floor((Date.now() - new Date(accountCreatedStr).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const streak = parseInt(localStorage.getItem('loginStreak') || '0');

      const usageStats: UsageStats = {
        storageUsed,
        storageLimit: limits.storage,
        storagePercentage,
        datasetsCount,
        datasetsLimit,
        datasetsPercentage,
        modelsCreated,
        modelsDeployed,
        apiCallsThisMonth,
        apiCallsLimit: limits.apiCalls,
        apiCallsPercentage,
        predictionsThisMonth,
        predictionsLimit: limits.predictions,
        predictionsPercentage,
        lastActive,
        accountAge,
        streak,
      };

      setStats(usageStats);
    } catch (error) {
      console.error('Error calculating usage:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    refetch: calculateUsage,
  };
};
