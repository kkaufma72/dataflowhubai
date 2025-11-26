/**
 * User Activation Tracking System
 * 
 * Tracks key milestones in the user journey:
 * 1. Signed up
 * 2. Uploaded first dataset
 * 3. Asked first AI question
 * 4. Trained first model
 * 5. Invited team member
 * 
 * Purpose: Identify activation rate and trigger upgrade prompts
 */

import { supabase } from './supabase';

export interface ActivationMilestone {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  reward?: string;
}

export interface UserActivation {
  userId: string;
  milestones: Record<string, boolean>;
  activationScore: number; // 0-100
  isActivated: boolean; // >= 3 milestones
  upgradeEligible: boolean;
  createdAt: string;
  lastActivity: string;
}

// Define activation milestones
export const ACTIVATION_MILESTONES: Omit<ActivationMilestone, 'completed' | 'completedAt'>[] = [
  {
    id: 'signup_complete',
    label: 'Create Account',
    description: 'Sign up for DataFlowHub',
    reward: '🎉 Welcome aboard!'
  },
  {
    id: 'first_dataset',
    label: 'Upload First Dataset',
    description: 'Upload or import your first dataset',
    reward: '📊 Data loaded!'
  },
  {
    id: 'first_ai_question',
    label: 'Ask AI a Question',
    description: 'Chat with AI about your data',
    reward: '🤖 AI activated!'
  },
  {
    id: 'first_insight',
    label: 'Generate Insight',
    description: 'Get your first data insight or chart',
    reward: '💡 Insight unlocked!'
  },
  {
    id: 'first_model',
    label: 'Train a Model',
    description: 'Train your first ML model',
    reward: '🧠 Model trained!'
  },
  {
    id: 'share_or_export',
    label: 'Share or Export',
    description: 'Export a chart or share a report',
    reward: '📤 Shared!'
  }
];

// Storage key for local tracking
const ACTIVATION_KEY = 'dfh_activation';

/**
 * Get current user's activation status
 */
export function getActivationStatus(): UserActivation | null {
  try {
    const stored = localStorage.getItem(ACTIVATION_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Initialize activation tracking for a new user
 */
export function initializeActivation(userId: string): UserActivation {
  const activation: UserActivation = {
    userId,
    milestones: {
      signup_complete: true, // They just signed up
    },
    activationScore: 17, // 1/6 milestones
    isActivated: false,
    upgradeEligible: false,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };

  localStorage.setItem(ACTIVATION_KEY, JSON.stringify(activation));
  
  // Track in analytics
  trackActivationEvent('signup_complete');
  
  return activation;
}

/**
 * Mark a milestone as complete
 */
export async function completeMilestone(milestoneId: string): Promise<ActivationMilestone | null> {
  const activation = getActivationStatus();
  if (!activation) return null;

  // Don't re-complete
  if (activation.milestones[milestoneId]) return null;

  // Mark complete
  activation.milestones[milestoneId] = true;
  activation.lastActivity = new Date().toISOString();

  // Calculate score
  const completedCount = Object.values(activation.milestones).filter(Boolean).length;
  activation.activationScore = Math.round((completedCount / ACTIVATION_MILESTONES.length) * 100);
  activation.isActivated = completedCount >= 3;
  activation.upgradeEligible = completedCount >= 4;

  // Save locally
  localStorage.setItem(ACTIVATION_KEY, JSON.stringify(activation));

  // Save to Supabase (async, don't block)
  saveActivationToSupabase(activation).catch(console.error);

  // Track in analytics
  trackActivationEvent(milestoneId);

  // Return the milestone info
  const milestone = ACTIVATION_MILESTONES.find(m => m.id === milestoneId);
  if (milestone) {
    return {
      ...milestone,
      completed: true,
      completedAt: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Save activation status to Supabase
 */
async function saveActivationToSupabase(activation: UserActivation): Promise<void> {
  try {
    await supabase
      .from('user_profiles')
      .update({
        activation_milestones: activation.milestones,
        activation_score: activation.activationScore,
        is_activated: activation.isActivated,
        last_activity: activation.lastActivity,
      })
      .eq('user_id', activation.userId);
  } catch (error) {
    console.error('Failed to save activation to Supabase:', error);
  }
}

/**
 * Track activation event in analytics
 */
function trackActivationEvent(milestoneId: string) {
  // Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'activation_milestone', {
      milestone_id: milestoneId,
      milestone_name: ACTIVATION_MILESTONES.find(m => m.id === milestoneId)?.label,
    });
  }

  // Facebook Pixel - Track key conversions
  if (typeof window !== 'undefined' && (window as any).fbq) {
    if (milestoneId === 'first_model') {
      (window as any).fbq('track', 'StartTrial');
    }
  }

  console.log('[Activation]', milestoneId);
}

/**
 * Get milestones with completion status
 */
export function getMilestonesWithStatus(): ActivationMilestone[] {
  const activation = getActivationStatus();
  const completedMilestones = activation?.milestones || {};

  return ACTIVATION_MILESTONES.map(milestone => ({
    ...milestone,
    completed: !!completedMilestones[milestone.id],
  }));
}

/**
 * Check if user should see upgrade prompt
 */
export function shouldShowUpgradePrompt(): boolean {
  const activation = getActivationStatus();
  if (!activation) return false;

  // Show upgrade after they've experienced value
  return activation.upgradeEligible && !localStorage.getItem('dfh_upgrade_dismissed');
}

/**
 * Get next recommended action
 */
export function getNextAction(): ActivationMilestone | null {
  const milestones = getMilestonesWithStatus();
  return milestones.find(m => !m.completed) || null;
}

/**
 * Calculate days since signup
 */
export function getDaysSinceSignup(): number {
  const activation = getActivationStatus();
  if (!activation) return 0;

  const signupDate = new Date(activation.createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
}

