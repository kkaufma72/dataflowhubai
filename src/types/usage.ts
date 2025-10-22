export interface UsageStats {
  // Storage
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes
  storagePercentage: number;

  // Datasets
  datasetsCount: number;
  datasetsLimit: number;
  datasetsPercentage: number;

  // Models
  modelsCreated: number;
  modelsDeployed: number;

  // API Usage
  apiCallsThisMonth: number;
  apiCallsLimit: number;
  apiCallsPercentage: number;

  // Predictions
  predictionsThisMonth: number;
  predictionsLimit: number;
  predictionsPercentage: number;

  // Activity
  lastActive: Date | null;
  accountAge: number; // in days
  streak: number; // consecutive days active
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'getting-started' | 'data' | 'models' | 'deployment' | 'social' | 'milestone';
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: Date;
  reward?: string;
}

export interface UserProgress {
  level: number;
  xp: number;
  xpToNextLevel: number;
  achievements: Achievement[];
  completedTasks: string[];
  onboardingStep: number;
  onboardingComplete: boolean;
}

export interface PlanLimits {
  tier: 'free' | 'professional' | 'team';
  storage: number; // bytes
  datasets: number;
  apiCalls: number; // per month
  predictions: number; // per month
  features: string[];
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    tier: 'free',
    storage: 100 * 1024 * 1024, // 100 MB
    datasets: 3,
    apiCalls: 1000,
    predictions: 10000,
    features: ['Basic visualizations', 'Community support', 'Public projects'],
  },
  professional: {
    tier: 'professional',
    storage: 10 * 1024 * 1024 * 1024, // 10 GB
    datasets: -1, // unlimited
    apiCalls: 100000,
    predictions: 1000000,
    features: [
      'Unlimited datasets',
      'Advanced AutoML',
      'Priority support',
      'API access',
      'Private projects',
      'Custom domains',
    ],
  },
  team: {
    tier: 'team',
    storage: 100 * 1024 * 1024 * 1024, // 100 GB
    datasets: -1, // unlimited
    apiCalls: 1000000,
    predictions: 10000000,
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Advanced security',
      'Dedicated support',
      'SSO integration',
      'Audit logs',
    ],
  },
};
