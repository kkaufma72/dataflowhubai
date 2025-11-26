/**
 * Feature Access Hook
 * 
 * Controls access to Pro/Team features based on user subscription tier.
 * Implements soft gates with usage limits and upgrade prompts.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { supabase } from '../lib/supabase';

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'team' | 'enterprise';

export interface FeatureLimits {
  datasets: number;
  models: number;
  aiChatsPerDay: number;
  richNarrativesPerMonth: number;
  fredImportsPerMonth: number;
  knowledgeEntries: number;
}

export interface FeatureAccess {
  // Tier info
  tier: SubscriptionTier;
  isLoading: boolean;
  
  // Feature flags
  canUseRichNarratives: boolean;
  canUseKnowledgeBase: boolean;
  canUseSemanticSearch: boolean;
  canUseSmartRecommendations: boolean;
  canDeployModels: boolean;
  canUseMonitoring: boolean;
  canUseAPI: boolean;
  canCollaborate: boolean;
  
  // Limits
  limits: FeatureLimits;
  usage: Partial<FeatureLimits>;
  
  // Usage tracking
  trackUsage: (feature: keyof FeatureLimits) => Promise<boolean>;
  hasReachedLimit: (feature: keyof FeatureLimits) => boolean;
  getRemainingUsage: (feature: keyof FeatureLimits) => number;
  
  // Upgrade
  shouldShowUpgrade: (feature: string) => boolean;
}

// Feature limits by tier
const TIER_LIMITS: Record<SubscriptionTier, FeatureLimits> = {
  free: {
    datasets: 5,
    models: 2,
    aiChatsPerDay: 10,
    richNarrativesPerMonth: 3,
    fredImportsPerMonth: 5,
    knowledgeEntries: 0
  },
  starter: {
    datasets: 15,
    models: 5,
    aiChatsPerDay: 50,
    richNarrativesPerMonth: 20,
    fredImportsPerMonth: 25,
    knowledgeEntries: 10
  },
  pro: {
    datasets: 100,
    models: 50,
    aiChatsPerDay: 500,
    richNarrativesPerMonth: 999,
    fredImportsPerMonth: 999,
    knowledgeEntries: 999
  },
  team: {
    datasets: 999,
    models: 999,
    aiChatsPerDay: 999,
    richNarrativesPerMonth: 999,
    fredImportsPerMonth: 999,
    knowledgeEntries: 999
  },
  enterprise: {
    datasets: 999,
    models: 999,
    aiChatsPerDay: 999,
    richNarrativesPerMonth: 999,
    fredImportsPerMonth: 999,
    knowledgeEntries: 999
  }
};

// Features available by tier
const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  free: ['basic_ai_chat', 'data_upload', 'data_quality', 'auto_dictionary', 'basic_training'],
  starter: ['rich_narratives', 'knowledge_base', 'semantic_search', 'smart_recommendations', 'fred_unlimited'],
  pro: ['rich_narratives', 'knowledge_base', 'semantic_search', 'smart_recommendations', 'fred_unlimited', 'priority_support'],
  team: ['deploy_models', 'monitoring', 'api_access', 'collaboration', 'sso'],
  enterprise: ['deploy_models', 'monitoring', 'api_access', 'collaboration', 'sso', 'custom_integrations', 'dedicated_support']
};

// Local storage keys for usage tracking
const USAGE_KEY = 'dfh_feature_usage';
const USAGE_RESET_KEY = 'dfh_usage_reset_date';

export const useFeatureAccess = (): FeatureAccess => {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [usage, setUsage] = useState<Partial<FeatureLimits>>({});

  // Load user's subscription tier
  useEffect(() => {
    const loadTier = async () => {
      if (!user) {
        setTier('free');
        setIsLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_tier, subscription_status')
          .eq('user_id', user.id)
          .single();

        if (profile?.subscription_tier && profile?.subscription_status === 'active') {
          setTier(profile.subscription_tier as SubscriptionTier);
        } else {
          setTier('free');
        }
      } catch (error) {
        console.error('Error loading subscription tier:', error);
        setTier('free');
      } finally {
        setIsLoading(false);
      }
    };

    loadTier();
  }, [user]);

  // Load and manage usage from localStorage
  useEffect(() => {
    const loadUsage = () => {
      try {
        const stored = localStorage.getItem(USAGE_KEY);
        const resetDate = localStorage.getItem(USAGE_RESET_KEY);
        const now = new Date();
        
        // Check if we need to reset monthly/daily counters
        if (resetDate) {
          const lastReset = new Date(resetDate);
          const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceReset >= 1) {
            // Reset daily counters
            const current = stored ? JSON.parse(stored) : {};
            current.aiChatsPerDay = 0;
            localStorage.setItem(USAGE_KEY, JSON.stringify(current));
          }
          
          if (daysSinceReset >= 30) {
            // Reset monthly counters
            localStorage.setItem(USAGE_KEY, JSON.stringify({}));
            localStorage.setItem(USAGE_RESET_KEY, now.toISOString());
          }
        } else {
          localStorage.setItem(USAGE_RESET_KEY, now.toISOString());
        }
        
        if (stored) {
          setUsage(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading usage:', error);
      }
    };

    loadUsage();
  }, []);

  const limits = useMemo(() => TIER_LIMITS[tier], [tier]);

  // Check if a feature is available for the current tier
  const hasFeature = useCallback((feature: string): boolean => {
    const tierIndex = ['free', 'starter', 'pro', 'team', 'enterprise'].indexOf(tier);
    
    for (let i = tierIndex; i >= 0; i--) {
      const tierName = ['free', 'starter', 'pro', 'team', 'enterprise'][i] as SubscriptionTier;
      if (TIER_FEATURES[tierName].includes(feature)) {
        return true;
      }
    }
    
    // Check higher tiers (feature might be in a tier above current)
    for (let i = tierIndex + 1; i < 5; i++) {
      const tierName = ['free', 'starter', 'pro', 'team', 'enterprise'][i] as SubscriptionTier;
      if (TIER_FEATURES[tierName].includes(feature)) {
        return false; // Feature exists but in higher tier
      }
    }
    
    return true; // Feature not gated
  }, [tier]);

  // Track usage of a feature
  const trackUsage = useCallback(async (feature: keyof FeatureLimits): Promise<boolean> => {
    const currentUsage = usage[feature] || 0;
    const limit = limits[feature];
    
    if (currentUsage >= limit) {
      return false; // Limit reached
    }
    
    const newUsage = { ...usage, [feature]: currentUsage + 1 };
    setUsage(newUsage);
    localStorage.setItem(USAGE_KEY, JSON.stringify(newUsage));
    
    return true;
  }, [usage, limits]);

  // Check if limit is reached
  const hasReachedLimit = useCallback((feature: keyof FeatureLimits): boolean => {
    const currentUsage = usage[feature] || 0;
    const limit = limits[feature];
    return currentUsage >= limit;
  }, [usage, limits]);

  // Get remaining usage
  const getRemainingUsage = useCallback((feature: keyof FeatureLimits): number => {
    const currentUsage = usage[feature] || 0;
    const limit = limits[feature];
    return Math.max(0, limit - currentUsage);
  }, [usage, limits]);

  // Should show upgrade prompt
  const shouldShowUpgrade = useCallback((feature: string): boolean => {
    return !hasFeature(feature);
  }, [hasFeature]);

  // Computed feature flags
  const featureFlags = useMemo(() => ({
    canUseRichNarratives: hasFeature('rich_narratives') && !hasReachedLimit('richNarrativesPerMonth'),
    canUseKnowledgeBase: hasFeature('knowledge_base'),
    canUseSemanticSearch: hasFeature('semantic_search'),
    canUseSmartRecommendations: hasFeature('smart_recommendations'),
    canDeployModels: hasFeature('deploy_models'),
    canUseMonitoring: hasFeature('monitoring'),
    canUseAPI: hasFeature('api_access'),
    canCollaborate: hasFeature('collaboration')
  }), [hasFeature, hasReachedLimit]);

  return {
    tier,
    isLoading,
    ...featureFlags,
    limits,
    usage,
    trackUsage,
    hasReachedLimit,
    getRemainingUsage,
    shouldShowUpgrade
  };
};

export default useFeatureAccess;

