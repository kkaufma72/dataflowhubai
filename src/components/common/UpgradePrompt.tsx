/**
 * Upgrade Prompt Component
 * 
 * Shows when users try to access Pro/Team features.
 * Features blurred preview and compelling upgrade CTA.
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  Crown, 
  Zap, 
  Lock, 
  ArrowRight, 
  Check,
  X,
  Brain,
  BarChart3,
  Target,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  feature: string;
  featureDescription?: string;
  tier?: 'starter' | 'pro' | 'team';
  variant?: 'inline' | 'modal' | 'banner' | 'overlay';
  onClose?: () => void;
  children?: React.ReactNode; // Content to blur
}

const FEATURE_INFO: Record<string, { title: string; description: string; icon: React.ElementType; benefits: string[] }> = {
  rich_narratives: {
    title: 'Rich Model Narratives',
    description: 'Get comprehensive AI-powered explanations of your model results with actionable insights.',
    icon: Brain,
    benefits: [
      'Full model summary from start to finish',
      'Detailed reasoning behind predictions',
      'Actionable recommendations',
      'Performance analysis in plain English'
    ]
  },
  knowledge_base: {
    title: 'Knowledge Base',
    description: 'Add business context to your data so AI understands your domain.',
    icon: Sparkles,
    benefits: [
      'Custom business context for each dataset',
      'Data dictionary with meanings',
      'Stories and notes',
      'Smarter AI responses'
    ]
  },
  semantic_search: {
    title: 'Semantic Search',
    description: 'Find relevant insights across all your data using natural language.',
    icon: Target,
    benefits: [
      'Search by meaning, not keywords',
      'Cross-dataset intelligence',
      'Previous insights recalled',
      'Context-aware responses'
    ]
  },
  smart_recommendations: {
    title: 'Smart Recommendations',
    description: 'Get AI-powered suggestions for model training and data preparation.',
    icon: Zap,
    benefits: [
      'Model selection guidance',
      'Feature engineering tips',
      'Data quality recommendations',
      'Performance optimization'
    ]
  },
  deploy_models: {
    title: 'Model Deployment',
    description: 'Deploy your trained models to production with one click.',
    icon: BarChart3,
    benefits: [
      'One-click deployment',
      'API endpoints',
      'Auto-scaling',
      'Version management'
    ]
  },
  collaboration: {
    title: 'Team Collaboration',
    description: 'Work together with your team on datasets and models.',
    icon: Users,
    benefits: [
      'Shared workspaces',
      'Role-based access',
      'Activity feeds',
      'Comments & annotations'
    ]
  }
};

const TIER_INFO = {
  starter: { name: 'Starter', price: '$29', color: 'from-blue-500 to-cyan-500' },
  pro: { name: 'Pro', price: '$49', color: 'from-indigo-500 to-purple-500' },
  team: { name: 'Team', price: '$99', color: 'from-purple-500 to-pink-500' }
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  featureDescription,
  tier = 'pro',
  variant = 'inline',
  onClose,
  children
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  const featureInfo = FEATURE_INFO[feature] || {
    title: feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: featureDescription || 'Unlock this advanced feature to supercharge your workflow.',
    icon: Sparkles,
    benefits: ['Advanced capabilities', 'Priority support', 'Unlimited usage']
  };
  
  const tierInfo = TIER_INFO[tier];
  const Icon = featureInfo.icon;

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  // Overlay variant - shows blurred content with upgrade overlay
  if (variant === 'overlay' && children) {
    return (
      <div className="relative">
        {/* Blurred content */}
        <div className="blur-sm opacity-50 pointer-events-none select-none">
          {children}
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/80 to-gray-100/80 backdrop-blur-sm rounded-xl">
          <div className="text-center max-w-sm p-6">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${tierInfo.color} flex items-center justify-center shadow-lg`}>
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{featureInfo.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{featureInfo.description}</p>
            <button
              onClick={handleUpgrade}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r ${tierInfo.color} hover:opacity-90 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2`}
            >
              <Crown className="w-5 h-5" />
              Upgrade to {tierInfo.name}
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-gray-500 mt-3">Starting at {tierInfo.price}/month</p>
          </div>
        </div>
      </div>
    );
  }

  // Banner variant - horizontal banner
  if (variant === 'banner') {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${tierInfo.color} p-4 text-white shadow-lg`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold">{featureInfo.title}</h4>
              <p className="text-sm text-white/80">{featureInfo.description}</p>
            </div>
          </div>
          <button
            onClick={handleUpgrade}
            className="flex-shrink-0 px-5 py-2.5 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-all flex items-center gap-2 shadow-md"
          >
            Upgrade
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {onClose && (
          <button onClick={onClose} className="absolute top-2 right-2 text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
        {/* Decorative elements */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
      </div>
    );
  }

  // Modal variant - full modal
  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-popIn"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Header */}
          <div className={`relative p-6 bg-gradient-to-br ${tierInfo.color} text-white`}>
            {onClose && (
              <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
              <Icon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Unlock {featureInfo.title}</h2>
            <p className="text-white/90">{featureInfo.description}</p>
          </div>

          {/* Benefits */}
          <div className="p-6">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">What you'll get:</h4>
            <ul className="space-y-3 mb-6">
              {featureInfo.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${tierInfo.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={handleUpgrade}
              className={`w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r ${tierInfo.color} hover:opacity-90 transition-all transform ${isHovered ? 'scale-105' : 'scale-100'} shadow-lg flex items-center justify-center gap-2`}
            >
              <Crown className="w-5 h-5" />
              Upgrade to {tierInfo.name} - {tierInfo.price}/mo
            </button>
            
            <p className="text-center text-xs text-gray-500 mt-4">
              Cancel anytime • 14-day money-back guarantee
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Inline variant (default) - compact card
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tierInfo.color} flex items-center justify-center shadow-md flex-shrink-0`}>
          <Lock className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">{featureInfo.title}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${tierInfo.color} text-white font-medium`}>
              {tierInfo.name}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">{featureInfo.description}</p>
          <button
            onClick={handleUpgrade}
            className={`px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r ${tierInfo.color} hover:opacity-90 transition-all text-sm flex items-center gap-2`}
          >
            Unlock Feature
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Usage limit warning component
export const UsageLimitWarning: React.FC<{
  feature: string;
  used: number;
  limit: number;
  onUpgrade?: () => void;
}> = ({ feature, used, limit, onUpgrade }) => {
  const percentage = Math.min(100, (used / limit) * 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  if (!isNearLimit) return null;

  return (
    <div className={`rounded-lg p-3 ${isAtLimit ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${isAtLimit ? 'text-red-700' : 'text-amber-700'}`}>
          {isAtLimit ? `${feature} limit reached` : `${feature} usage: ${used}/${limit}`}
        </span>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className={`text-xs font-medium px-2 py-1 rounded ${isAtLimit ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
          >
            Upgrade
          </button>
        )}
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ${isAtLimit ? 'bg-red-500' : 'bg-amber-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default UpgradePrompt;
