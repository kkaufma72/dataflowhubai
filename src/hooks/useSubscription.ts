// Subscription Hook - Check user's subscription tier and feature access

import { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { supabase } from '../lib/supabase';

export type SubscriptionTier = 'free' | 'professional' | 'team';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'none';
  isLoading: boolean;
  features: {
    canTrainModels: boolean;
    canDeploy: boolean;
    canMonitor: boolean;
    canEvaluate: boolean;
    unlimitedDatasets: boolean;
    unlimitedAIQuestions: boolean;
    voiceInput: boolean;
    advancedAnalytics: boolean;
    teamCollaboration: boolean;
  };
}

export const useSubscription = (): SubscriptionStatus => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    tier: 'free',
    status: 'none',
    isLoading: true,
    features: {
      canTrainModels: false,
      canDeploy: false,
      canMonitor: false,
      canEvaluate: false,
      unlimitedDatasets: false,
      unlimitedAIQuestions: false,
      voiceInput: false,
      advancedAnalytics: false,
      teamCollaboration: false
    }
  });

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setSubscription({
          tier: 'free',
          status: 'none',
          isLoading: false,
          features: getFreeFeatures()
        });
        return;
      }

      try {
        // Check if user has active subscription
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          // User has active subscription
          const tier = data.tier as SubscriptionTier;
          setSubscription({
            tier,
            status: data.status,
            isLoading: false,
            features: getFeaturesByTier(tier)
          });
        } else {
          // No active subscription - default to Pro for beta (don't block!)
          // TODO: Change to 'free' after setting up Stripe subscriptions
          setSubscription({
            tier: 'professional',
            status: 'active',
            isLoading: false,
            features: getFeaturesByTier('professional')
          });
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        // Default to Pro tier on error (for beta - don't block users!)
        // Change to 'free' after you setup subscriptions table
        setSubscription({
          tier: 'professional',
          status: 'active',
          isLoading: false,
          features: getFeaturesByTier('professional')
        });
      }
    };

    fetchSubscription();
  }, [user]);

  return subscription;
};

// Feature access by tier
const getFreeFeatures = () => ({
  canTrainModels: false,      // 🔒 Premium only
  canDeploy: false,           // 🔒 Premium only
  canMonitor: false,          // 🔒 Premium only
  canEvaluate: false,         // 🔒 Premium only
  unlimitedDatasets: false,   // Limited to 3
  unlimitedAIQuestions: false, // Limited to 20/month
  voiceInput: true,           // ✅ Available to all
  advancedAnalytics: false,   // 🔒 Premium only
  teamCollaboration: false    // 🔒 Team tier only
});

const getFeaturesByTier = (tier: SubscriptionTier) => {
  if (tier === 'professional' || tier === 'team') {
    return {
      canTrainModels: true,      // ✅ Unlocked
      canDeploy: true,           // ✅ Unlocked
      canMonitor: true,          // ✅ Unlocked
      canEvaluate: true,         // ✅ Unlocked
      unlimitedDatasets: true,
      unlimitedAIQuestions: true,
      voiceInput: true,
      advancedAnalytics: true,
      teamCollaboration: tier === 'team'
    };
  }

  return getFreeFeatures();
};
