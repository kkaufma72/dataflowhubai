// Dashboard - Koyfin-Inspired Design
// Terminal-style with real-time data, multiple widgets, and sophisticated layout

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMLContext } from '../context/MLContext';
import { useAuth } from '../components/auth/AuthProvider';
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  Database,
  Brain,
  Zap,
  Clock,
  BarChart3,
  ArrowUpRight,
  Circle,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

// Lazy load onboarding
const MagicMomentWelcome = lazy(() => import('../components/onboarding/MagicMomentWelcome'));

const DashboardKoyfin: React.FC = () => {
  const { datasets, models, isLoading } = useMLContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMagicMoment, setShowMagicMoment] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Magic Moment check
  useEffect(() => {
    const hasSeenMagicMoment = localStorage.getItem('hasSeenMagicMoment');
    const hasSkipped = localStorage.getItem('hasSkippedMagicMoment');
    
    if (!hasSeenMagicMoment && !hasSkipped && datasets.length === 0 && !isLoading && user) {
      setTimeout(() => setShowMagicMoment(true), 1000);
    }
  }, [datasets.length, isLoading, user]);

  const handleMagicMomentClose = () => {
    setShowMagicMoment(false);
    localStorage.setItem('hasSeenMagicMoment', 'true');
  };

  // Calculate real-time metrics
  const metrics = useMemo(() => {
    const totalDatasets = datasets.length;
    const totalModels = models.length;
    const totalRows = datasets.reduce((sum, d) => sum + (d.rows || 0), 0);
    const avgHealthScore = datasets.length > 0 
      ? datasets.reduce((sum, d) => sum + 90, 0) / datasets.length // Simplified
      : 0;

    const trainedModels = models.filter(m => m.status === 'trained' || m.status === 'deployed').length;
    const deployedModels = models.filter(m => m.status === 'deployed').length;

    // Mock changes for demo (would be real from analytics)
    const datasetChange = '+12%';
    const modelChange = '+5%';
    const healthChange = '+2.3%';

    return {
      totalDatasets,
      totalModels,
      totalRows,
      avgHealthScore,
      trainedModels,
      deployedModels,
      datasetChange,
      modelChange,
      healthChange,
      isUp: {
        datasets: true,
        models: true,
        health: true
      }
    };
  }, [datasets, models]);

  // Recent activity
  const recentActivity = useMemo(() => {
    const activities: any[] = [];
    
    // Add recent datasets
    datasets.slice(0, 3).forEach(d => {
      activities.push({
        type: 'dataset',
        name: d.name,
        timestamp: d.dateUploaded || new Date().toISOString(),
        icon: Database,
        color: 'text-blue-500'
      });
    });

    // Add recent models
    models.slice(0, 2).forEach(m => {
      activities.push({
        type: 'model',
        name: m.name,
        timestamp: m.createdAt,
        icon: Brain,
        color: 'text-primary'
      });
    });

    // Sort by timestamp
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [datasets, models]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Koyfin-Style Header Bar */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left - User info */}
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm font-medium text-gray-100">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-gray-400">
                  {user?.user_metadata?.company || user?.email}
                </div>
              </div>
              <div className="h-4 w-px bg-gray-800" />
              <div className="text-xs text-gray-400">
                {user?.user_metadata?.use_case?.replace(/-/g, ' ') || 'General'}
              </div>
            </div>

            {/* Right - Live clock + status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
                <span className="text-xs text-gray-400">Live</span>
              </div>
              <div className="text-xs font-mono text-gray-400">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="p-6 space-y-4">
        {/* Top Row - Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Datasets */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Datasets</span>
              <Database className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-100 font-mono">
                  {metrics.totalDatasets}
                </div>
                <div className={`text-xs flex items-center gap-1 mt-1 ${
                  metrics.isUp.datasets ? 'text-green-500' : 'text-red-500'
                }`}>
                  {metrics.isUp.datasets ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{metrics.datasetChange}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{metrics.totalRows.toLocaleString()}</div>
                <div className="text-xs text-gray-600">total rows</div>
              </div>
            </div>
          </div>

          {/* Metric 2: Models */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Models</span>
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-100 font-mono">
                  {metrics.totalModels}
                </div>
                <div className={`text-xs flex items-center gap-1 mt-1 ${
                  metrics.isUp.models ? 'text-green-500' : 'text-red-500'
                }`}>
                  {metrics.isUp.models ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{metrics.modelChange}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{metrics.deployedModels}</div>
                <div className="text-xs text-gray-600">deployed</div>
              </div>
            </div>
          </div>

          {/* Metric 3: Health Score */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Health</span>
              <Activity className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-100 font-mono">
                  {metrics.avgHealthScore.toFixed(0)}
                </div>
                <div className={`text-xs flex items-center gap-1 mt-1 ${
                  metrics.isUp.health ? 'text-green-500' : 'text-red-500'
                }`}>
                  {metrics.isUp.health ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{metrics.healthChange}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Quality</div>
                <div className="text-xs text-gray-600">score</div>
              </div>
            </div>
          </div>

          {/* Metric 4: Activity */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Activity</span>
              <Zap className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-100 font-mono">
                  {metrics.trainedModels}
                </div>
                <div className="text-xs flex items-center gap-1 mt-1 text-green-500">
                  <TrendingUp className="w-3 h-3" />
                  <span>Active</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Today</div>
                <div className="text-xs text-gray-600">models</div>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row - Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Datasets - Terminal Style List */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg">
            <div className="border-b border-gray-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-100">Recent Datasets</h3>
                <button
                  onClick={() => navigate('/app/data')}
                  className="text-xs text-primary hover:text-primary-400 transition-colors flex items-center gap-1"
                >
                  View all
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="p-4">
              {datasets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No datasets yet</p>
                  <button
                    onClick={() => navigate('/app/data')}
                    className="mt-4 text-xs text-primary hover:text-primary-400"
                  >
                    Upload your first dataset →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {datasets.slice(0, 5).map((dataset, idx) => (
                    <button
                      key={dataset.id}
                      onClick={() => navigate('/app/insights')}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-all group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center">
                          <Database className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium text-gray-100 group-hover:text-white transition-colors">
                            {dataset.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {(dataset.rows || 0).toLocaleString()} rows • {dataset.columns || 0} cols
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-0.5 bg-green-500/10 text-green-400 text-Solution font-mono rounded">
                          92
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed - Terminal Style */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg">
            <div className="border-b border-gray-800 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-100">Live Activity</h3>
            </div>
            <div className="p-4 space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity, idx) => {
                  const Icon = activity.icon;
                  const timeAgo = getTimeAgo(activity.timestamp);
                  
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`mt-0.5 ${activity.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300 truncate">
                          {activity.name}
                        </p>
                        <p className="text-Solution text-gray-600 font-mono">
                          {timeAgo}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Third Row - Quick Actions Terminal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quick Action 1 */}
          <button
            onClick={() => navigate('/app/data')}
            className="group bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-primary/50 hover:bg-gray-800/50 transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Database className="w-5 h-5 text-primary-400" />
              </div>
              <div className="text-left flex-1">
                <div className="text-sm font-semibold text-gray-100">Upload Data</div>
                <div className="text-xs text-gray-500">Add new dataset</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-Solution text-gray-600">
              <span>CSV, Excel, JSON</span>
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* Quick Action 2 */}
          <button
            onClick={() => navigate('/app/insights')}
            className="group bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-primary/50 hover:bg-gray-800/50 transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="w-5 h-5 text-primary-400" />
              </div>
              <div className="text-left flex-1">
                <div className="text-sm font-semibold text-gray-100">View Insights</div>
                <div className="text-xs text-gray-500">Analytics dashboard</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Charts & stats</span>
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* Quick Action 3 */}
          <button
            onClick={() => navigate('/app/train')}
            className="group bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-pink-500/50 hover:bg-gray-800/50 transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                <Brain className="w-5 h-5 text-pink-400" />
              </div>
              <div className="text-left flex-1">
                <div className="text-sm font-semibold text-gray-100">Train Model</div>
                <div className="text-xs text-gray-500">Build ML model</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>One-click ML</span>
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* Quick Action 4 */}
          <button
            onClick={() => {
              if (datasets.length > 0) {
                // Open AI chat for first dataset
                navigate('/app/data');
                toast.success('Click "Ask AI" on any dataset');
              } else {
                toast('Upload a dataset first!', { icon: '👋' });
              }
            }}
            className="group bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-green-500/50 hover:bg-gray-800/50 transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <Sparkles className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-left flex-1">
                <div className="text-sm font-semibold text-gray-100">Ask AI</div>
                <div className="text-xs text-gray-500">Get insights</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-Solution text-gray-600">
              <span>Natural language</span>
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </div>

        {/* Bottom Row - Status Board */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg">
          <div className="border-b border-gray-800 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-100">System Status</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs text-gray-500 mb-1">Data Quality</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${metrics.avgHealthScore}%` }} />
                  </div>
                  <span className="text-xs font-mono text-gray-400">{metrics.avgHealthScore.toFixed(0)}%</span>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">AI Availability</div>
                <div className="flex items-center gap-2">
                  <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                  <span className="text-Solution font-mono text-green-400">Operational</span>
                </div>
              </div>

              <div>
                <div className="text-Solution text-gray-500 mb-1">Model Training</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400">
                    {models.filter(m => m.status === 'training').length} active
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Last Updated</div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-gray-600" />
                  <span className="text-xs font-mono text-gray-400">
                    {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Magic Moment Welcome */}
      {showMagicMoment && user && (
        <Suspense fallback={null}>
          <MagicMomentWelcome
            userProfile={{
              full_name: user.user_metadata?.full_name,
              email: user.email,
              company: user.user_metadata?.company,
              job_title: user.user_metadata?.job_title,
              use_case: user.user_metadata?.use_case,
              linkedin_url: user.user_metadata?.linkedin_url
            }}
            onClose={handleMagicMomentClose}
            onSampleLoaded={() => localStorage.setItem('hasSeenMagicMoment', 'true')}
          />
        </Suspense>
      )}

    </div>
  );
};

// Helper function
const getTimeAgo = (timestamp: string) => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export default DashboardKoyfin;

