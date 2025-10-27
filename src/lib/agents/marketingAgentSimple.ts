// Marketing Intelligence Agent - Production-Safe Version
// No LangChain dependencies to avoid bundling issues

import { Dataset } from '../../types';
import { UserProfile } from '../../utils/personalizedPrompts';

// Marketing use cases
export const isMarketingUser = (userProfile: UserProfile): boolean => {
  const marketingUseCases = [
    'marketing-analytics',
    'customer-insights',
    'sales-forecasting',
    'business-analytics',
    'real-estate',
    'retail'
  ];
  
  return marketingUseCases.includes(userProfile.use_case || '');
};

// Build marketing system prompt
export const buildMarketingSystemPrompt = (userProfile: UserProfile, dataset: Dataset) => {
  return `You are a marketing strategist and expert copywriter with deep knowledge of:

**Marketing Frameworks:**
- AIDA (Attention, Interest, Desire, Action)
- PAS (Problem, Agitate, Solve)
- FAB (Features, Advantages, Benefits)
- StoryBrand (7-part framework)
- Value Proposition Canvas
- Jobs-to-be-Done (JTBD)

**Your Expertise:**
• Strategic campaign planning
• Customer segmentation and personas
• Conversion copywriting
• Content marketing
• Email marketing and automation
• Social media strategy
• A/B testing and optimization
• ROI analysis and budget optimization

**Current Context:**
- User: ${userProfile.job_title || 'Marketing professional'} at ${userProfile.company || 'their company'}
- Industry: ${userProfile.use_case}
- Dataset: ${dataset.name} (${dataset.rows || 0} customers/records)
- Your Goal: Help them grow their business through data-driven marketing

**Communication Style:**
- Be actionable (specific tactics, not theory)
- Be data-driven (use numbers from their data)
- Be creative (unique angles and ideas)
- Be clear (explain frameworks simply)
- Be encouraging (celebrate wins, support through challenges)

Use their customer data to provide insights they can act on TODAY.`;
};

// Marketing quick actions
export const getMarketingQuickActions = (userProfile: UserProfile) => {
  return [
    {
      label: "🎯 Create Customer Personas",
      prompt: "Analyze my customer data and create 3 detailed buyer personas with demographics, pain points, goals, and messaging angles"
    },
    {
      label: "📧 Generate Email Campaign",
      prompt: "Create a 5-email drip campaign for customer onboarding with subject lines, preview text, body copy, and CTAs"
    },
    {
      label: "📱 Social Media Calendar",
      prompt: "Generate a 30-day social media content calendar for LinkedIn and Twitter with specific post copy"
    },
    {
      label: "💰 Analyze Campaign ROI",
      prompt: "Analyze my marketing campaign performance, calculate ROI for each channel, and suggest budget optimizations"
    },
    {
      label: "✍️ Write Ad Copy (AIDA)",
      prompt: "Write 3 variations of Google/Facebook ad copy using the AIDA framework, optimized for my industry"
    },
    {
      label: "📊 Campaign Strategy",
      prompt: "Create a complete 30-day marketing campaign strategy with goals, channels, content plan, and success metrics"
    }
  ];
};

