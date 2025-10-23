import React from 'react';
import { useUsageStats } from '../hooks/useUsageStats';
import { useAchievements } from '../hooks/useAchievements';
import { useSubscription } from '../hooks/useSubscription';
import {
  Database,
  Cpu,
  Zap,
  TrendingUp,
  Award,
  Crown,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle,
  Lock,
} from 'lucide-react';

const UsageDashboard: React.FC = () => {
  const { stats, loading: statsLoading } = useUsageStats();
  const { achievements, unlockedCount, totalCount, completionPercentage } = useAchievements();
  const { subscription } = useSubscription();

  const userLevel = parseInt(localStorage.getItem('userLevel') || '1');
  const userXP = parseInt(localStorage.getItem('userXP') || '0');
  const xpToNextLevel = ((userLevel) * 1000) - userXP;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (statsLoading || !stats) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const planTier = subscription?.tier || 'free';

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Usage & Progress</h1>
          <a
            href="/pricing"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Crown className="h-4 w-4" />
            Upgrade Plan
          </a>
        </div>
        <p className="text-gray-600">
          Track your usage, progress, and achievements
        </p>
      </div>

      {/* Level & XP */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Level {userLevel}</h2>
            <p className="text-indigo-200">
              {userXP.toLocaleString()} XP • {xpToNextLevel.toLocaleString()} to next level
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-indigo-200">Plan</div>
            <div className="text-xl font-semibold capitalize">{planTier}</div>
          </div>
        </div>
        <div className="w-full bg-indigo-800 rounded-full h-3">
          <div
            className="bg-white rounded-full h-3 transition-all duration-500"
            style={{ width: `${((userXP % 1000) / 1000) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Usage Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Storage */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            {stats.storagePercentage >= 80 && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageColor(stats.storagePercentage)}`}>
                {stats.storagePercentage >= 90 ? (
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                ) : null}
                {Math.round(stats.storagePercentage)}%
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Storage Used</h3>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {formatBytes(stats.storageUsed)}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className={`${getProgressBarColor(stats.storagePercentage)} rounded-full h-2 transition-all duration-500`}
              style={{ width: `${Math.min(stats.storagePercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            of {formatBytes(stats.storageLimit)} available
          </p>
        </div>

        {/* Datasets */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            {stats.datasetsPercentage >= 80 && stats.datasetsLimit !== Infinity && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageColor(stats.datasetsPercentage)}`}>
                {stats.datasetsPercentage >= 90 ? (
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                ) : null}
                {Math.round(stats.datasetsPercentage)}%
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Datasets</h3>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {stats.datasetsCount}
          </p>
          {stats.datasetsLimit !== Infinity ? (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`${getProgressBarColor(stats.datasetsPercentage)} rounded-full h-2 transition-all duration-500`}
                  style={{ width: `${Math.min(stats.datasetsPercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                of {stats.datasetsLimit} allowed
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-500">Unlimited</p>
          )}
        </div>

        {/* Models */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Cpu className="h-6 w-6 text-purple-600" />
            </div>
            <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-medium">
              {stats.modelsDeployed} deployed
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Models Trained</h3>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {stats.modelsCreated}
          </p>
          <p className="text-xs text-gray-500">
            All-time count
          </p>
        </div>

        {/* API Calls */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            {stats.apiCallsPercentage >= 80 && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageColor(stats.apiCallsPercentage)}`}>
                {stats.apiCallsPercentage >= 90 ? (
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                ) : null}
                {Math.round(stats.apiCallsPercentage)}%
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">API Calls</h3>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {stats.apiCallsThisMonth.toLocaleString()}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className={`${getProgressBarColor(stats.apiCallsPercentage)} rounded-full h-2 transition-all duration-500`}
              style={{ width: `${Math.min(stats.apiCallsPercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            of {stats.apiCallsLimit.toLocaleString()} this month
          </p>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-indigo-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
              <p className="text-sm text-gray-600">
                {unlockedCount} of {totalCount} unlocked ({Math.round(completionPercentage)}%)
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">{unlockedCount}</div>
            <div className="text-xs text-gray-500">unlocked</div>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div
            className="bg-indigo-600 rounded-full h-3 transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                achievement.unlocked
                  ? 'bg-indigo-50 border-indigo-200'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {achievement.title}
                    </h3>
                    {achievement.unlocked ? (
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {achievement.description}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {achievement.progress} / {achievement.requirement}
                    </span>
                    {achievement.reward && (
                      <span className="text-indigo-600 font-medium">
                        {achievement.reward}
                      </span>
                    )}
                  </div>
                  {!achievement.unlocked && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-indigo-600 rounded-full h-1.5 transition-all duration-500"
                        style={{
                          width: `${Math.min((achievement.progress / achievement.requirement) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Account Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-1">Account Age</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.accountAge} {stats.accountAge === 1 ? 'day' : 'days'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Current Streak</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-gray-900">{stats.streak}</div>
              {stats.streak > 0 && <span className="text-2xl">🔥</span>}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Last Active</div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.lastActive ? new Date(stats.lastActive).toLocaleDateString() : 'Today'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageDashboard;
