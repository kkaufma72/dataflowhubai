/**
 * Strategic Upgrade Prompt
 * 
 * Shows upgrade prompts at key moments:
 * 1. After completing activation milestones
 * 2. When hitting usage limits
 * 3. After X days of usage
 * 4. After experiencing "aha moment"
 */

import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Zap, 
  ArrowRight, 
  X, 
  Sparkles,
  Clock,
  TrendingUp,
  Gift,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getActivationStatus, getDaysSinceSignup } from '../../lib/activationTracking';

type PromptTrigger = 
  | 'milestone_complete'
  | 'usage_limit'
  | 'time_based'
  | 'aha_moment'
  | 'feature_gate';

interface StrategicUpgradePromptProps {
  trigger: PromptTrigger;
  featureName?: string;
  onClose: () => void;
  onUpgrade?: () => void;
}

const TRIGGER_CONTENT: Record<PromptTrigger, {
  title: string;
  subtitle: string;
  benefits: string[];
  cta: string;
  urgency?: string;
}> = {
  milestone_complete: {
    title: "You're on a roll! 🚀",
    subtitle: "Unlock even more power with Pro",
    benefits: [
      'Unlimited AI questions',
      'Rich model narratives',
      'Smart recommendations',
      'Priority support'
    ],
    cta: 'Upgrade to Pro',
    urgency: '20% off for early adopters'
  },
  usage_limit: {
    title: "You've hit your limit",
    subtitle: "Upgrade to continue your momentum",
    benefits: [
      'Unlimited datasets',
      'Unlimited AI questions',
      'No daily limits',
      'Advanced features'
    ],
    cta: 'Remove Limits',
    urgency: 'Don\'t lose your progress'
  },
  time_based: {
    title: "You've been with us 7 days!",
    subtitle: "Ready to go Pro?",
    benefits: [
      'Everything in Free, plus:',
      'Rich model explanations',
      'Knowledge base',
      'Semantic search'
    ],
    cta: 'Claim 20% Off',
    urgency: 'Offer expires in 48 hours'
  },
  aha_moment: {
    title: "You just trained your first model! 🎉",
    subtitle: "Imagine what you could do with Pro",
    benefits: [
      'Detailed model narratives',
      'Performance recommendations',
      'Model deployment',
      'Real-time monitoring'
    ],
    cta: 'Unlock Full Potential',
  },
  feature_gate: {
    title: "This is a Pro feature",
    subtitle: "Upgrade to access advanced capabilities",
    benefits: [
      'All Pro features',
      'Priority support',
      '14-day money back guarantee',
      'Cancel anytime'
    ],
    cta: 'Upgrade Now',
  }
};

export const StrategicUpgradePrompt: React.FC<StrategicUpgradePromptProps> = ({
  trigger,
  featureName,
  onClose,
  onUpgrade
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const content = TRIGGER_CONTENT[trigger];

  const handleUpgrade = () => {
    // Track conversion attempt
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'upgrade_clicked', {
        trigger,
        feature: featureName
      });
    }

    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/pricing');
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    
    // Don't show again for a while
    localStorage.setItem(`dfh_upgrade_dismissed_${trigger}`, Date.now().toString());
    
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-popIn">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 px-6 py-8 text-white text-center">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Floating elements */}
          <div className="absolute top-4 left-4">
            <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
          </div>

          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center">
            <Crown className="w-8 h-8 text-amber-300" />
          </div>

          <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
          <p className="text-indigo-200">{content.subtitle}</p>

          {content.urgency && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-400 text-amber-900 rounded-full text-sm font-semibold">
              <Clock className="w-4 h-4" />
              {content.urgency}
            </div>
          )}
        </div>

        {/* Benefits */}
        <div className="px-6 py-6">
          <div className="space-y-3 mb-6">
            {content.benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Pricing preview */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Pro Plan</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">$49</span>
                <span className="text-gray-500">/month</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Billed monthly. Cancel anytime. 14-day money-back guarantee.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handleUpgrade}
            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            {content.cta}
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleClose}
            className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to determine when to show upgrade prompt
 */
export function useUpgradePrompt() {
  const [shouldShow, setShouldShow] = useState(false);
  const [trigger, setTrigger] = useState<PromptTrigger>('feature_gate');

  useEffect(() => {
    const checkTriggers = () => {
      const activation = getActivationStatus();
      const daysSinceSignup = getDaysSinceSignup();

      // Check if recently dismissed
      const recentlyDismissed = (type: string) => {
        const dismissed = localStorage.getItem(`dfh_upgrade_dismissed_${type}`);
        if (!dismissed) return false;
        const dismissedTime = parseInt(dismissed);
        const hoursSince = (Date.now() - dismissedTime) / (1000 * 60 * 60);
        return hoursSince < 24; // Don't show again for 24 hours
      };

      // Time-based trigger (7 days)
      if (daysSinceSignup >= 7 && !recentlyDismissed('time_based')) {
        setTrigger('time_based');
        setShouldShow(true);
        return;
      }

      // Activation milestone trigger
      if (activation?.upgradeEligible && !recentlyDismissed('milestone_complete')) {
        setTrigger('milestone_complete');
        setShouldShow(true);
        return;
      }
    };

    // Check on mount and periodically
    checkTriggers();
    const interval = setInterval(checkTriggers, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return { shouldShow, trigger, setShouldShow };
}

export default StrategicUpgradePrompt;

