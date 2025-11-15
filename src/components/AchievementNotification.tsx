import React, { useEffect, useState } from 'react';
import { useAchievements } from '../hooks/useAchievements';
import { Award, X } from 'lucide-react';

export const AchievementNotification: React.FC = () => {
  const { newlyUnlocked, dismissNewAchievement } = useAchievements();
  const [displayedAchievements, setDisplayedAchievements] = useState<typeof newlyUnlocked>([]);

  useEffect(() => {
    if (newlyUnlocked.length > 0) {
      setDisplayedAchievements(newlyUnlocked);
    }
  }, [newlyUnlocked]);

  const handleDismiss = (id: string) => {
    dismissNewAchievement(id);
    setDisplayedAchievements(prev => prev.filter(a => a.id !== id));
  };

  if (displayedAchievements.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm">
      {displayedAchievements.map((achievement) => (
        <div
          key={achievement.id}
          className="bg-gradient-to-r from-primary-600 to-primary-600 rounded-lg shadow-2xl p-4 text-white animate-slideInRight"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">{achievement.icon}</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4" />
                <span className="text-sm font-medium">Achievement Unlocked!</span>
              </div>
              <h3 className="font-bold text-lg mb-1">{achievement.title}</h3>
              <p className="text-sm text-primary/10 mb-2">{achievement.description}</p>
              {achievement.reward && (
                <div className="inline-block px-2 py-1 bg-white/20 rounded text-xs font-medium">
                  {achievement.reward}
                </div>
              )}
            </div>

            <button
              onClick={() => handleDismiss(achievement.id)}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress bar animation */}
          <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full animate-progressBar"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Add these animations to your global CSS (src/index.css)
/*
@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes progressBar {
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
}

.animate-slideInRight {
  animation: slideInRight 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.animate-progressBar {
  animation: progressBar 5s linear forwards;
}
*/
