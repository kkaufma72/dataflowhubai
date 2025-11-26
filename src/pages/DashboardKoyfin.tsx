// Dashboard - Koyfin-Inspired Design
// Terminal-style with real-time data, multiple widgets, and sophisticated layout

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMLContext } from '../context/MLContext';
import { useAuth } from '../components/auth/AuthProvider';
import { supabase } from '../lib/supabase';
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
  Sparkles,
  Loader,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import toast from 'react-hot-toast';
import KnowledgeInsightsBadge from '../components/common/KnowledgeInsightsBadge';
import { useKnowledge } from '../context/KnowledgeContext';

// Lazy load onboarding
const MagicMomentWelcome = lazy(() => import('../components/onboarding/MagicMomentWelcome'));
const OnboardingQuestionnaire = lazy(() => import('../components/onboarding/OnboardingQuestionnaire'));
const OnboardingChecklist = lazy(() => import('../components/onboarding/OnboardingChecklist'));
const StrategicUpgradePrompt = lazy(() => import('../components/onboarding/StrategicUpgradePrompt'));

// Prediction models configuration (same as DatasetInsights)
const predictionModels = [
  {
    id: 'marketing-campaigns',
    name: 'Marketing Campaign ROI',
    metric: 'Campaign ROI',
    unit: '%',
    color: 'rgb(59, 130, 246)', // Blue
    historicalData: Array.from({ length: 30 }, (_, i) => {
      const base = 145;
      const trend = i * 0.8;
      const seasonal = Math.sin(i / 7) * 12;
      const noise = (Math.random() - 0.5) * 8;
      return Math.max(100, Math.round(base + trend + seasonal + noise));
    }),
    forecastData: Array.from({ length: 14 }, (_, i) => {
      const base = 170;
      const trend = i * 0.9;
      const seasonal = Math.sin((30 + i) / 7) * 12;
      const noise = (Math.random() - 0.5) * 6;
      return Math.round(base + trend + seasonal + noise);
    })
  },
  {
    id: 'sales-forecast',
    name: 'Sales Revenue',
    metric: 'Revenue',
    unit: 'K',
    color: 'rgb(16, 185, 129)', // Emerald
    historicalData: Array.from({ length: 30 }, (_, i) => {
      const base = 280;
      const trend = i * 1.2;
      const seasonal = Math.sin(i / 5) * 25;
      const noise = (Math.random() - 0.5) * 15;
      return Math.max(200, Math.round(base + trend + seasonal + noise));
    }),
    forecastData: Array.from({ length: 14 }, (_, i) => {
      const base = 320;
      const trend = i * 1.4;
      const seasonal = Math.sin((30 + i) / 5) * 25;
      const noise = (Math.random() - 0.5) * 12;
      return Math.round(base + trend + seasonal + noise);
    })
  },
  {
    id: 'customer-churn',
    name: 'Customer Churn',
    metric: 'Churn Rate',
    unit: '%',
    color: 'rgb(249, 115, 22)', // Orange
    historicalData: Array.from({ length: 30 }, (_, i) => {
      const base = 8.5;
      const trend = -i * 0.08;
      const seasonal = Math.sin(i / 6) * 1.5;
      const noise = (Math.random() - 0.5) * 0.8;
      return Math.max(3, parseFloat((base + trend + seasonal + noise).toFixed(2)));
    }),
    forecastData: Array.from({ length: 14 }, (_, i) => {
      const base = 6.2;
      const trend = -i * 0.06;
      const seasonal = Math.sin((30 + i) / 6) * 1.5;
      const noise = (Math.random() - 0.5) * 0.6;
      return parseFloat((base + trend + seasonal + noise).toFixed(2));
    })
  }
];

// Dynamic import for Chart.js
let ChartComponents: any = null;
const loadCharts = async () => {
  if (!ChartComponents) {
    const [{ Line }, { Chart: ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler }] = await Promise.all([
      import('react-chartjs-2'),
      import('chart.js')
    ]);
    
    ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);
    ChartComponents = { Line };
    return ChartComponents;
  }
  return ChartComponents;
};

const DashboardKoyfin: React.FC = () => {
  const { datasets, models, isLoading } = useMLContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMagicMoment, setShowMagicMoment] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptTrigger, setUpgradePromptTrigger] = useState<'milestone_complete' | 'time_based'>('time_based');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPredictionModel, setSelectedPredictionModel] = useState<string>('marketing-campaigns');
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [ChartComp, setChartComp] = useState<any>(null);

  // Load charts on mount
  useEffect(() => {
    loadCharts()
      .then((comps) => {
        setChartComp(comps);
        setChartsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load charts:', error);
        setChartsLoaded(false);
      });
  }, []);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if user needs onboarding questionnaire
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('onboarding_completed, onboarding_skipped')
          .eq('user_id', user.id)
          .single();

        // Show questionnaire if not completed and not skipped
        if (data && !data.onboarding_completed) {
          setTimeout(() => setShowOnboarding(true), 500);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboarding();
  }, [user]);

  // Magic Moment check (only after onboarding)
  useEffect(() => {
    const hasSeenMagicMoment = localStorage.getItem('hasSeenMagicMoment');
    const hasSkipped = localStorage.getItem('hasSkippedMagicMoment');
    
    if (!hasSeenMagicMoment && !hasSkipped && datasets.length === 0 && !isLoading && user && !showOnboarding) {
      setTimeout(() => setShowMagicMoment(true), 1000);
    }
  }, [datasets.length, isLoading, user, showOnboarding]);

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
      ? datasets.reduce((sum) => sum + 90, 0) / datasets.length // Simplified
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
    <div className="min-h-screen bg-gray-950">
      {/* Modern SaaS Header Bar */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <span className="text-gray-500 hover:text-blue-400 cursor-pointer transition-colors">Home</span>
            <span className="text-gray-600">/</span>
            <span className="text-white font-medium">Dashboard</span>
          </div>

          <div className="flex items-center justify-between">
            {/* Left - User info */}
            <div className="flex items-center gap-6">
              <div>
                <h1 className="saas-h3">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </h1>
                <p className="saas-body-small text-gray-400">
                  {user?.user_metadata?.company || user?.email}
                </p>
              </div>
              <div className="h-6 w-px bg-gray-800" />
              <span className="saas-label text-gray-400">
                {user?.user_metadata?.use_case?.replace(/-/g, ' ') || 'General'}
              </span>
            </div>

            {/* Right - Live clock + status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Circle className="w-2 h-2 fill-green-400 text-green-400 animate-pulse" />
                <span className="saas-caption">Live</span>
              </div>
              <div className="saas-caption font-mono">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Top Row - Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Metric 1: Datasets */}
          <div className="saas-stat-card">
            <div className="flex items-center justify-between mb-4">
              <span className="saas-stat-label">Datasets</span>
              <div className="saas-icon-blue">
                <Database className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="saas-stat-value">
                  {metrics.totalDatasets}
                </div>
                <div className={`saas-stat-change-${metrics.isUp.datasets ? 'positive' : 'negative'} mt-2`}>
                  {metrics.isUp.datasets ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{metrics.datasetChange}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-400">{metrics.totalRows.toLocaleString()}</div>
                <div className="saas-caption">total rows</div>
              </div>
            </div>
          </div>

          {/* Metric 2: Models */}
          <div className="saas-stat-card">
            <div className="flex items-center justify-between mb-4">
              <span className="saas-stat-label">Models</span>
              <div className="saas-icon-purple">
                <Brain className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="saas-stat-value">
                  {metrics.totalModels}
                </div>
                <div className={`saas-stat-change-${metrics.isUp.models ? 'positive' : 'negative'} mt-2`}>
                  {metrics.isUp.models ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{metrics.modelChange}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-400">{metrics.deployedModels}</div>
                <div className="saas-caption">deployed</div>
              </div>
            </div>
          </div>

          {/* Metric 3: Health Score */}
          <div className="saas-stat-card">
            <div className="flex items-center justify-between mb-4">
              <span className="saas-stat-label">Avg Health</span>
              <div className="saas-icon-green">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="saas-stat-value">
                  {metrics.avgHealthScore.toFixed(0)}
                </div>
                <div className={`saas-stat-change-${metrics.isUp.health ? 'positive' : 'negative'} mt-2`}>
                  {metrics.isUp.health ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{metrics.healthChange}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-400">Quality</div>
                <div className="saas-caption">score</div>
              </div>
            </div>
          </div>

          {/* Metric 4: Activity */}
          <div className="saas-stat-card">
            <div className="flex items-center justify-between mb-4">
              <span className="saas-stat-label">Activity</span>
              <div className="saas-icon-orange">
                <Zap className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="saas-stat-value">
                  {metrics.trainedModels}
                </div>
                <div className="saas-stat-change-positive mt-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Active</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-400">Today</div>
                <div className="saas-caption">models</div>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Models Section - Compact Version for Dashboard */}
        <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-white">Model Predictions</h3>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedPredictionModel}
                  onChange={(e) => setSelectedPredictionModel(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                >
                  {predictionModels.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => navigate('/app/insights')}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View Full Report →
                </button>
              </div>
            </div>
          </div>
          <div className="p-4">
            {(() => {
              const model = predictionModels.find(m => m.id === selectedPredictionModel);
              if (!model) return null;

              const labels = Array.from({ length: 44 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - 30 + i);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              });

              const chartData = {
                labels,
                datasets: [
                  {
                    label: 'Historical',
                    data: [...model.historicalData, ...Array(14).fill(null)],
                    borderColor: model.color,
                    backgroundColor: `${model.color.replace('rgb', 'rgba').replace(')', ', 0.1)')}`,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                    borderWidth: 2,
                  },
                  {
                    label: 'Forecast',
                    data: [...Array(30).fill(null), ...model.forecastData],
                    borderColor: model.color,
                    backgroundColor: `${model.color.replace('rgb', 'rgba').replace(')', ', 0.05)')}`,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                    borderWidth: 2,
                    borderDash: [5, 5],
                  }
                ]
              };

              const lastHistorical = model.historicalData[model.historicalData.length - 1];
              const lastForecast = model.forecastData[model.forecastData.length - 1];
              const change = ((lastForecast - lastHistorical) / lastHistorical * 100).toFixed(1);

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 pb-3 border-b border-gray-800">
                    <div className="text-center">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Current</div>
                      <div className="text-xl font-bold text-white">{lastHistorical}{model.unit}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Forecast</div>
                      <div className="text-xl font-bold" style={{ color: model.color }}>{lastForecast}{model.unit}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Change</div>
                      <div className={`text-xl font-bold ${parseFloat(change) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {parseFloat(change) >= 0 ? '+' : ''}{change}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-64">
                    {chartsLoaded && ChartComp ? (
                      <ChartComp.Line 
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          interaction: { mode: 'index' as const, intersect: false },
                          plugins: {
                            legend: {
                              display: true,
                              position: 'top' as const,
                              align: 'end' as const,
                              labels: {
                                color: 'rgba(255, 255, 255, 0.7)',
                                font: { size: 10 },
                                padding: 8,
                                usePointStyle: true,
                                boxWidth: 6,
                                boxHeight: 6,
                              }
                            },
                            tooltip: {
                              backgroundColor: 'rgba(22, 27, 34, 0.95)',
                              titleColor: '#fff',
                              bodyColor: '#fff',
                              borderColor: model.color,
                              borderWidth: 1,
                              padding: 10,
                              displayColors: true,
                              callbacks: {
                                label: function(context: any) {
                                  const value = context.parsed.y;
                                  if (value !== null) {
                                    return `${context.dataset.label}: ${value}${model.unit}`;
                                  }
                                  return '';
                                }
                              }
                            }
                          },
                          scales: {
                            y: {
                              grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
                              ticks: {
                                color: 'rgba(255, 255, 255, 0.5)',
                                font: { size: 9 },
                                callback: function(value: any) {
                                  return value + model.unit;
                                }
                              }
                            },
                            x: {
                              grid: { display: false },
                              ticks: {
                                color: 'rgba(255, 255, 255, 0.5)',
                                font: { size: 9 },
                                maxRotation: 45,
                                minRotation: 45
                              }
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Loader className="w-6 h-6 animate-spin text-cyan-400" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Second Row - Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Datasets - Terminal Style List */}
          <div className="lg:col-span-2 saas-card">
            <div className="saas-card-header">
              <div className="flex items-center justify-between">
                <h3 className="saas-h4">Recent Datasets</h3>
                <button
                  onClick={() => navigate('/app/data')}
                  className="saas-btn-ghost saas-btn-sm flex items-center gap-1"
                >
                  View all
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="saas-card-body">
              {datasets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="saas-body-small">No datasets yet</p>
                  <button
                    onClick={() => navigate('/app/data')}
                    className="saas-btn-primary saas-btn-sm mt-4"
                  >
                    Upload your first dataset →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {datasets.slice(0, 5).map((dataset) => (
                    <button
                      key={dataset.id}
                      onClick={() => navigate('/app/insights')}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-all group border border-transparent hover:border-gray-700"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="saas-icon-blue w-10 h-10">
                          <Database className="w-5 h-5" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="saas-body font-semibold text-white flex items-center gap-2">
                            {dataset.name}
                            <KnowledgeInsightsBadge dataset={dataset} variant="inline" />
                          </div>
                          <div className="saas-caption font-mono">
                            {(dataset.rows || 0).toLocaleString()} rows • {dataset.columns || 0} cols
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="saas-badge-success">
                          92
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed - Terminal Style */}
          <div className="saas-card">
            <div className="saas-card-header">
              <h3 className="saas-h4">Live Activity</h3>
            </div>
            <div className="saas-card-body space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="saas-caption">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity, idx) => {
                  const Icon = activity.icon;
                  const timeAgo = getTimeAgo(activity.timestamp);
                  
                  return (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-800/30 transition-colors">
                      <div className={`mt-0.5 ${activity.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="saas-body truncate text-gray-300">
                          {activity.name}
                        </p>
                        <p className="saas-caption font-mono text-gray-500">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Quick Action 1 */}
          <button
            onClick={() => navigate('/app/data')}
            className="group saas-card-hover text-left"
          >
            <div className="saas-card-body">
              <div className="flex items-center gap-3 mb-3">
                <div className="saas-icon-blue group-hover:scale-110 transition-transform">
                  <Database className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="saas-body font-semibold text-white">Upload Data</div>
                  <div className="saas-caption">Add new dataset</div>
                </div>
              </div>
              <div className="flex items-center justify-between saas-caption">
                <span>CSV, Excel, JSON</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </button>

          {/* Quick Action 2 */}
          <button
            onClick={() => navigate('/app/insights')}
            className="group saas-card-hover text-left"
          >
            <div className="saas-card-body">
              <div className="flex items-center gap-3 mb-3">
                <div className="saas-icon-purple group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="saas-body font-semibold text-white">View Insights</div>
                  <div className="saas-caption">Analytics dashboard</div>
                </div>
              </div>
              <div className="flex items-center justify-between saas-caption">
                <span>Charts & stats</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </button>

          {/* Quick Action 3 */}
          <button
            onClick={() => navigate('/app/train')}
            className="group saas-card-hover text-left"
          >
            <div className="saas-card-body">
              <div className="flex items-center gap-3 mb-3">
                <div className="saas-icon-pink group-hover:scale-110 transition-transform">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="saas-body font-semibold text-white">Train Model</div>
                  <div className="saas-caption">Build ML model</div>
                </div>
              </div>
              <div className="flex items-center justify-between saas-caption">
                <span>One-click ML</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
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
            className="group saas-card-hover text-left"
          >
            <div className="saas-card-body">
              <div className="flex items-center gap-3 mb-3">
                <div className="saas-icon-green group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="saas-body font-semibold text-white">Ask AI</div>
                  <div className="saas-caption">Get insights</div>
                </div>
              </div>
              <div className="flex items-center justify-between saas-caption">
                <span>Natural language</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </button>
        </div>

        {/* Knowledge Insights Row */}
        <div className="saas-card">
          <div className="saas-card-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <h3 className="saas-h4">Knowledge Base Insights</h3>
              </div>
              <button
                onClick={() => navigate('/app/insights?tab=knowledge')}
                className="saas-btn-ghost saas-btn-sm flex items-center gap-1"
              >
                Manage Knowledge
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="saas-card-body">
            {datasets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="saas-caption">Upload datasets to build your knowledge base</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {datasets.slice(0, 3).map((dataset) => (
                  <div 
                    key={dataset.id} 
                    className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-400" />
                        <span className="saas-body font-medium text-white truncate max-w-[150px]">
                          {dataset.name}
                        </span>
                      </div>
                      <KnowledgeInsightsBadge dataset={dataset} variant="inline" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Lightbulb className="w-3 h-3 text-yellow-400" />
                        <span className="text-gray-400">Add business context for better AI</span>
                      </div>
                      <button
                        onClick={() => navigate('/app/insights?tab=knowledge')}
                        className="w-full mt-2 px-3 py-1.5 text-xs bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        Add Knowledge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row - System Status Board */}
        <div className="saas-card">
          <div className="saas-card-header">
            <h3 className="saas-h4">System Status</h3>
          </div>
          <div className="saas-card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="saas-label mb-2">Data Quality</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400" style={{ width: `${metrics.avgHealthScore}%` }} />
                  </div>
                  <span className="saas-caption font-mono text-gray-400">{metrics.avgHealthScore.toFixed(0)}%</span>
                </div>
              </div>

              <div>
                <div className="saas-label mb-2">AI Availability</div>
                <div className="flex items-center gap-2">
                  <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                  <span className="saas-caption font-mono text-green-400">Operational</span>
                </div>
              </div>

              <div>
                <div className="saas-label mb-2">Model Training</div>
                <div className="flex items-center gap-2">
                  <span className="saas-caption font-mono text-gray-400">
                    {models.filter(m => m.status === 'training').length} active
                  </span>
                </div>
              </div>

              <div>
                <div className="saas-label mb-2">Last Updated</div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="saas-caption font-mono text-gray-400">
                    {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Questionnaire */}
      {showOnboarding && user && (
        <Suspense fallback={null}>
          <OnboardingQuestionnaire
            onComplete={() => setShowOnboarding(false)}
            onSkip={() => setShowOnboarding(false)}
          />
        </Suspense>
      )}

      {/* Magic Moment Welcome */}
      {showMagicMoment && user && !showOnboarding && (
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

      {/* Strategic Upgrade Prompt */}
      {showUpgradePrompt && (
        <Suspense fallback={null}>
          <StrategicUpgradePrompt
            trigger={upgradePromptTrigger}
            onClose={() => setShowUpgradePrompt(false)}
          />
        </Suspense>
      )}

      {/* Floating Onboarding Checklist */}
      <div className="fixed bottom-4 right-4 z-30 w-72">
        <Suspense fallback={null}>
          <OnboardingChecklist variant="sidebar" />
        </Suspense>
      </div>

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

