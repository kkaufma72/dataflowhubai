import React, { useState, useEffect } from 'react';
import { Trophy, Zap, Star, TrendingUp, Award, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

interface CleaningTask {
  id: string;
  type: 'missing_values' | 'outliers' | 'duplicates' | 'formatting' | 'typos';
  description: string;
  impact: string;
  xpReward: number;
  completed: boolean;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  xp: number;
  tasksCompleted: number;
  badge?: string;
}

export const DataCleaningGame: React.FC<{ datasetId: string }> = ({ datasetId }) => {
  const { user } = useAuth();
  const [userXP, setUserXP] = useState(0);
  const [userRank, setUserRank] = useState(0);
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    loadUserProgress();
    generateTasks();
  }, [datasetId]);

  const loadUserProgress = () => {
    const stored = localStorage.getItem(`cleaning_game_${user?.id}`);
    if (stored) {
      const data = JSON.parse(stored);
      setUserXP(data.xp || 0);
      setUserRank(data.rank || 999);
    }
  };

  const generateTasks = () => {
    // Mock tasks (in production, analyze actual dataset)
    setTasks([
      {
        id: 'missing-age',
        type: 'missing_values',
        description: 'Fill missing values in "age" column (15% missing)',
        impact: 'Quality Score: +8 points',
        xpReward: 25,
        completed: false
      },
      {
        id: 'outliers-income',
        type: 'outliers',
        description: 'Handle outliers in "income" (23 extreme values)',
        impact: 'Model Accuracy: +2-5%',
        xpReward: 15,
        completed: false
      },
      {
        id: 'duplicates',
        type: 'duplicates',
        description: 'Remove duplicate rows (47 found)',
        impact: 'Dataset Size: -0.5%',
        xpReward: 10,
        completed: false
      },
      {
        id: 'date-format',
        type: 'formatting',
        description: 'Standardize date formats (3 formats detected)',
        impact: 'Consistency: +12 points',
        xpReward: 20,
        completed: false
      },
      {
        id: 'country-typos',
        type: 'typos',
        description: 'Fix typos in "country" column (12 variations)',
        impact: 'Data Quality: +5 points',
        xpReward: 5,
        completed: false
      }
    ]);
  };

  const completeTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Award XP
    const newXP = userXP + task.xpReward;
    setUserXP(newXP);

    // Mark complete
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, completed: true } : t
    ));

    // Save progress
    localStorage.setItem(`cleaning_game_${user?.id}`, JSON.stringify({
      xp: newXP,
      rank: userRank,
      completedTasks: tasks.filter(t => t.completed).length + 1
    }));

    // Show celebration
    toast.success(`+${task.xpReward} XP! Great job! 🎉`);
  };

  const progress = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const availableXP = tasks.filter(t => !t.completed).reduce((sum, t) => sum + t.xpReward, 0);

  // Mock leaderboard
  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, userId: '1', name: 'Sarah Chen', xp: 1284, tasksCompleted: 87, badge: '🥇' },
    { rank: 2, userId: '2', name: 'Mike Rodriguez', xp: 892, tasksCompleted: 64, badge: '🥈' },
    { rank: 3, userId: '3', name: user?.email || 'You', xp: userXP, tasksCompleted: progress, badge: '🥉' },
    { rank: 4, userId: '4', name: 'Alex Johnson', xp: 634, tasksCompleted: 45 }
  ];

  return (
    <div className="bg-white rounded-xl border-2 border-indigo-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Data Quality Quest</h3>
              <p className="text-sm text-indigo-100">Clean data, earn XP, climb ranks!</p>
            </div>
          </div>
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Your Progress: {progress}/{total} tasks</span>
            <span className="font-bold">{userXP} XP</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="bg-white h-3 rounded-full transition-all"
              style={{ width: `${(progress / total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-indigo-100">
            {availableXP} XP available • Your Rank: #{userRank}
          </p>
        </div>
      </div>

      {/* Tasks or Leaderboard */}
      {showLeaderboard ? (
        <div className="p-6">
          <h4 className="font-bold text-gray-900 mb-4">🏆 Leaderboard</h4>
          <div className="space-y-2">
            {leaderboard.map(entry => (
              <div
                key={entry.userId}
                className={`
                  flex items-center justify-between p-3 rounded-lg
                  ${entry.userId === user?.id ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-gray-50'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{entry.badge || `#${entry.rank}`}</span>
                  <div>
                    <p className="font-medium text-gray-900">{entry.name}</p>
                    <p className="text-xs text-gray-600">{entry.tasksCompleted} tasks completed</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-indigo-600">{entry.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-3">
          {tasks.map(task => (
            <div
              key={task.id}
              className={`
                border-2 rounded-lg p-4 transition-all
                ${task.completed 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-white hover:border-indigo-200'
                }
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {task.description}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{task.impact}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`
                    px-2 py-1 rounded text-xs font-bold
                    ${task.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}
                  `}>
                    +{task.xpReward} XP
                  </span>
                  {task.completed && (
                    <span className="text-green-600">✓</span>
                  )}
                </div>
              </div>

              {!task.completed && (
                <button
                  onClick={() => completeTask(task.id)}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors w-full"
                >
                  <Zap className="w-4 h-4 inline mr-1" />
                  Fix & Earn {task.xpReward} XP
                </button>
              )}
            </div>
          ))}

          {progress === total && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 text-center">
              <p className="text-4xl mb-2">🎉</p>
              <p className="font-bold text-green-900 mb-1">Quest Complete!</p>
              <p className="text-sm text-green-700">
                You earned {tasks.reduce((sum, t) => sum + t.xpReward, 0)} XP total!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataCleaningGame;
