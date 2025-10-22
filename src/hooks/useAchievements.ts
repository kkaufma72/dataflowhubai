import { useState, useEffect } from 'react';
import { Achievement } from '../types/usage';
import { useML } from '../context/MLContext';
import { useUser } from '../context/UserContext';

const ACHIEVEMENTS: Omit<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>[] = [
  {
    id: 'first-dataset',
    title: 'Data Explorer',
    description: 'Upload your first dataset',
    icon: '📊',
    category: 'getting-started',
    requirement: 1,
    reward: '+50 XP',
  },
  {
    id: 'first-model',
    title: 'AI Apprentice',
    description: 'Train your first model',
    icon: '🤖',
    category: 'getting-started',
    requirement: 1,
    reward: '+100 XP',
  },
  {
    id: 'first-deployment',
    title: 'Production Ready',
    description: 'Deploy your first model',
    icon: '🚀',
    category: 'getting-started',
    requirement: 1,
    reward: '+150 XP',
  },
  {
    id: 'dataset-collector',
    title: 'Data Collector',
    description: 'Upload 5 datasets',
    icon: '📈',
    category: 'data',
    requirement: 5,
    reward: '+200 XP',
  },
  {
    id: 'dataset-master',
    title: 'Data Master',
    description: 'Upload 10 datasets',
    icon: '💾',
    category: 'data',
    requirement: 10,
    reward: '+500 XP',
  },
  {
    id: 'model-builder',
    title: 'Model Builder',
    description: 'Train 5 models',
    icon: '⚡',
    category: 'models',
    requirement: 5,
    reward: '+300 XP',
  },
  {
    id: 'model-expert',
    title: 'Model Expert',
    description: 'Train 10 models',
    icon: '🎯',
    category: 'models',
    requirement: 10,
    reward: '+600 XP',
  },
  {
    id: 'high-accuracy',
    title: 'Precision Pro',
    description: 'Achieve 95%+ accuracy on a model',
    icon: '🎖️',
    category: 'models',
    requirement: 95,
    reward: '+400 XP',
  },
  {
    id: 'deployment-pro',
    title: 'Deployment Pro',
    description: 'Deploy 3 models',
    icon: '🌐',
    category: 'deployment',
    requirement: 3,
    reward: '+250 XP',
  },
  {
    id: 'week-streak',
    title: 'Consistent Builder',
    description: 'Log in for 7 consecutive days',
    icon: '🔥',
    category: 'milestone',
    requirement: 7,
    reward: '+300 XP',
  },
  {
    id: 'month-streak',
    title: 'Dedicated Developer',
    description: 'Log in for 30 consecutive days',
    icon: '💪',
    category: 'milestone',
    requirement: 30,
    reward: '+1000 XP',
  },
  {
    id: 'early-adopter',
    title: 'Early Adopter',
    description: 'Be part of the first 1000 users',
    icon: '🌟',
    category: 'milestone',
    requirement: 1000,
    reward: '+500 XP',
  },
];

export const useAchievements = () => {
  const { datasets, models } = useML();
  const { user } = useUser();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

  useEffect(() => {
    if (!user) return;
    calculateAchievements();
  }, [datasets, models, user]);

  const calculateAchievements = () => {
    const storedAchievements = localStorage.getItem('achievements');
    const unlockedIds = storedAchievements ? JSON.parse(storedAchievements) : {};

    const streak = parseInt(localStorage.getItem('loginStreak') || '0');
    const deployedModels = models.filter(m => m.status === 'deployed').length;
    const highAccuracyModels = models.filter(m => {
      const accuracy = m.metrics?.accuracy;
      return accuracy && accuracy >= 0.95;
    }).length;

    const newAchievements: Achievement[] = ACHIEVEMENTS.map(template => {
      let progress = 0;

      // Calculate progress based on achievement type
      switch (template.id) {
        case 'first-dataset':
        case 'dataset-collector':
        case 'dataset-master':
          progress = datasets.length;
          break;
        case 'first-model':
        case 'model-builder':
        case 'model-expert':
          progress = models.length;
          break;
        case 'first-deployment':
        case 'deployment-pro':
          progress = deployedModels;
          break;
        case 'high-accuracy':
          progress = highAccuracyModels > 0 ? 95 : 0;
          break;
        case 'week-streak':
        case 'month-streak':
          progress = streak;
          break;
        case 'early-adopter':
          // This would need to come from a backend counter
          progress = 1; // Assume all current users are early adopters
          break;
        default:
          progress = 0;
      }

      const wasUnlocked = unlockedIds[template.id];
      const isNowUnlocked = progress >= template.requirement;

      // Track newly unlocked achievements
      if (!wasUnlocked && isNowUnlocked) {
        const newAchievement = {
          ...template,
          progress,
          unlocked: true,
          unlockedAt: new Date(),
        };

        // Save to localStorage
        unlockedIds[template.id] = new Date().toISOString();
        localStorage.setItem('achievements', JSON.stringify(unlockedIds));

        // Add to newly unlocked list
        setNewlyUnlocked(prev => [...prev, newAchievement]);

        // Award XP
        const xp = parseInt(template.reward?.replace(/[^\d]/g, '') || '0');
        awardXP(xp);

        return newAchievement;
      }

      return {
        ...template,
        progress,
        unlocked: isNowUnlocked,
        unlockedAt: wasUnlocked ? new Date(wasUnlocked) : undefined,
      };
    });

    setAchievements(newAchievements);
  };

  const awardXP = (amount: number) => {
    const currentXP = parseInt(localStorage.getItem('userXP') || '0');
    const newXP = currentXP + amount;
    localStorage.setItem('userXP', newXP.toString());

    // Calculate level (every 1000 XP = 1 level)
    const newLevel = Math.floor(newXP / 1000) + 1;
    localStorage.setItem('userLevel', newLevel.toString());
  };

  const dismissNewAchievement = (id: string) => {
    setNewlyUnlocked(prev => prev.filter(a => a.id !== id));
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = (unlockedCount / totalCount) * 100;

  return {
    achievements,
    newlyUnlocked,
    dismissNewAchievement,
    unlockedCount,
    totalCount,
    completionPercentage,
  };
};
