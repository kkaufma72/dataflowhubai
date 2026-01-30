// Dashboard - Koyfin-Inspired Design
// Terminal-style with real-time data, multiple widgets, and sophisticated layout

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAIChat } from '../components/ai/GlobalAIAssistant';
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
  Lightbulb,
  BookOpen,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import KnowledgeInsightsBadge from '../components/common/KnowledgeInsightsBadge';
import { ContainerScroll } from '../components/ui/container-scroll-animation';
import { SplineScene } from '../components/ui/splite';
import { Spotlight } from '../components/ui/spotlight';

const formatRelativeTime = (iso?: string | Date | number) => {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffMs = Date.now() - then;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
};

// Lazy load onboarding
const MagicMomentWelcome = lazy(() => import('../components/onboarding/MagicMomentWelcome'));
const OnboardingQuestionnaire = lazy(() => import('../components/onboarding/OnboardingQuestionnaire'));
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

type SectionHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description, children, className = '' }) => (
  <div className={`flex items-center justify-between gap-3 ${className}`}>
    <div>
      <h3 className="text-lg font-bold gradient-text-blue">{title}</h3>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
    {children}
  </div>
);

const DashboardKoyfin: React.FC = () => {
  const { datasets, models, isLoading } = useMLContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openChat } = useAIChat();
  const [showMagicMoment, setShowMagicMoment] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptTrigger] = useState<'milestone_complete' | 'time_based'>('time_based');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPredictionModel, setSelectedPredictionModel] = useState<string>('marketing-campaigns');
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [ChartComp, setChartComp] = useState<any>(null);
  const [chartsError, setChartsError] = useState<string | null>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [showChartDetails, setShowChartDetails] = useState(false);
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [activeOneClickStep, setActiveOneClickStep] = useState(1);
  const oneClickSteps = [
    {
      id: 1,
      title: 'Prep & Profile',
      description: 'Select dataset, profile quality, and auto-clean columns.',
      cta: { label: 'Open Data', action: () => navigate('/app/data') },
    },
    {
      id: 2,
      title: 'Train & Tune',
      description: 'Auto-generate features, pick a starter model, run quick tuning.',
      cta: { label: 'Train', action: () => navigate('/app/train') },
    },
    {
      id: 3,
      title: 'Deploy & Monitor',
      description: 'Ship the best run, set live monitors, wire alerts.',
      cta: { label: 'Deploy', action: () => navigate('/app/deploy') },
    },
  ];

  const selectedDataset = useMemo(() => {
    if (!datasets || datasets.length === 0) return null;
    const explicit = datasets.find((d) => d.id === selectedDatasetId);
    return explicit || datasets[0] || null;
  }, [datasets, selectedDatasetId]);

  const selectedDatasetLabel = selectedDataset?.name?.trim() || 'Untitled dataset';
  const lastDatasetRun = selectedDataset?.dateUploaded || (selectedDataset as any)?.createdAt;
  const lastDatasetRunText = lastDatasetRun ? formatRelativeTime(lastDatasetRun) : '—';

  // Load charts on mount
  useEffect(() => {
    loadCharts()
      .then((comps) => {
        setChartComp(comps);
        setChartsLoaded(true);
        setChartsError(null);
      })
      .catch((error) => {
        console.error('Failed to load charts:', error);
        setChartsLoaded(false);
        setChartsError('Charts failed to load.');
      });
  }, []);

  useEffect(() => {
    // Ensure a stable default selected dataset.
    if (datasets.length > 0 && !selectedDatasetId) {
      setSelectedDatasetId(datasets[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDatasetId, datasets.length]);

  const retryCharts = () => {
    setChartsLoaded(false);
    setChartsError(null);
    loadCharts()
      .then((comps) => {
        setChartComp(comps);
        setChartsLoaded(true);
        setChartsError(null);
      })
      .catch(() => {
        setChartsLoaded(false);
        setChartsError('Charts failed to load.');
      });
  };

  // Seeded dataset-aware time series for the Predictions chart.
  const datasetAwarePredictionModel = useMemo(() => {
    const baseModel = predictionModels.find((m) => m.id === selectedPredictionModel) || predictionModels[0];
    if (!baseModel) return null;
    if (!selectedDataset) return baseModel;

    const seed = (selectedDataset.id || selectedDatasetLabel)
      .split('')
      .reduce((acc: number, ch: string) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
    let s = seed || 1;
    const rand = () => {
      // LCG
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    };

    const rows = Number(selectedDataset.rows || 0);
    const cols = Number(selectedDataset.columns || 0);
    const scale = Math.min(1.8, Math.max(0.85, (rows ? rows / 12000 : 1) * (cols ? cols / 30 : 1)));

    const makeSeries = (len: number, base: number, trendPer: number, seasonPer: number, noiseAmp: number) => {
      return Array.from({ length: len }, (_, i) => {
        const trend = i * trendPer * scale;
        const seasonal = Math.sin(i / Math.max(4, seasonPer)) * (noiseAmp * 1.2);
        const noise = (rand() - 0.5) * noiseAmp;
        const v = base + trend + seasonal + noise;
        return typeof baseModel.historicalData[0] === 'number'
          ? Math.round(v)
          : parseFloat(v.toFixed(2));
      });
    };

    const base = typeof baseModel.historicalData[0] === 'number'
      ? (baseModel.historicalData[0] as number)
      : (baseModel.historicalData[0] as number);

    const tunedBase = typeof base === 'number' ? base + (rand() - 0.5) * 12 : base;
    const hist = makeSeries(30, tunedBase as number, 0.9, 6, typeof tunedBase === 'number' ? 10 : 1);
    const fore = makeSeries(14, (tunedBase as number) + 18, 1.1, 6, typeof tunedBase === 'number' ? 8 : 1);

    return {
      ...baseModel,
      historicalData: hist,
      forecastData: fore,
    };
  }, [selectedPredictionModel, selectedDataset, selectedDatasetLabel]);

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

  // Progressive disclosure: keep advanced details collapsed while onboarding is active
  useEffect(() => {
    if (showOnboarding) {
      setShowChartDetails(false);
      setShowModelDetails(false);
    }
  }, [showOnboarding]);

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
        id: d.id,
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
        id: m.id,
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
      <div className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-blue-600 text-white px-3 py-2 rounded">
        <a href="#orbit-section">Skip to orbit</a>
      </div>
      <div className="sr-only focus:not-sr-only focus:absolute focus:top-12 focus:left-2 focus:z-50 bg-blue-600 text-white px-3 py-2 rounded">
        <a href="#charts-section">Skip to charts</a>
      </div>
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

      {/* One-Click Intelligence Workspace */}
      <section className="relative mb-10" id="orbit-section">
        <div className="glass-card overflow-hidden border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_45%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.16),transparent_40%)]" />
          </div>

          <div className="relative px-6 py-6 space-y-8">
            <SectionHeader
              title="One-Click Intelligence"
              description="Three steps, one workspace. Prep → Train → Deploy with guided actions."
              className="items-start"
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 via-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </SectionHeader>

            {/* Stepper */}
            <div className="flex flex-col gap-4">
              {oneClickSteps.map((step) => {
                const isActive = activeOneClickStep === step.id;
                const isComplete = activeOneClickStep > step.id;
                return (
                  <div
                    key={step.id}
                    className={`rounded-2xl border ${isActive ? 'border-blue-500/40 bg-white/5' : 'border-white/10 bg-black/30'} p-4 md:p-5 transition`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center font-semibold ${
                          isComplete
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                            : isActive
                            ? 'bg-blue-500/20 text-blue-200 border border-blue-400/40'
                            : 'bg-white/5 text-gray-300 border border-white/10'
                        }`}
                      >
                        {isComplete ? <Check className="w-4 h-4" /> : step.id}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{step.title}</p>
                            <p className="text-xs text-gray-400">{step.description}</p>
                          </div>
                          <button
                            onClick={() => {
                              setActiveOneClickStep(step.id);
                              step.cta.action();
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-purple-700 transition"
                          >
                            {step.cta.label}
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Inline helper for the active step */}
                        {isActive && (
                          <div className="mt-2 grid gap-3 md:grid-cols-3">
                            {step.id === 1 && (
                              <>
                                <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs text-gray-300">
                                  <strong className="text-white block mb-1">Pick a dataset</strong>
                                  {datasets.length ? selectedDatasetLabel : 'Import your first dataset to begin.'}
                                </div>
                                <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs text-gray-300">
                                  <strong className="text-white block mb-1">Profile & clean</strong>
                                  Auto-detect anomalies and missing values.
                                </div>
                                <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs text-gray-300">
                                  <strong className="text-white block mb-1">Trust</strong>
                                  Last run {lastDatasetRunText}
                                </div>
                              </>
                            )}
                            {step.id === 2 && (
                              <>
                                <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs text-gray-300">
                                  <strong className="text-white block mb-1">Starter model</strong>
                                  Auto-pick baseline based on target type.
                                </div>
                                <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs text-gray-300">
                                  <strong className="text-white block mb-1">Tuning</strong>
                                  Quick search over 5–10 configs; advanced hidden.
                                </div>
                                <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs text-gray-300">
                                  <strong className="text-white block mb-1">Health</strong>
                                  {metrics.avgHealthScore.toFixed(0)} quality score
                                </div>
                              </>
                            )}
                            {step.id === 3 && (
                              <>
                                <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs text-gray-300">
                                  <strong className="text-white block mb-1">Deploy</strong>
                                  Push best run to an endpoint with one click.
                                </div>
                                <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs text-gray-300">
                                  <strong className="text-white block mb-1">Monitor</strong>
                                  Set drift & latency monitors with defaults.
                                </div>
                                <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs text-gray-300">
                                  <strong className="text-white block mb-1">Alerts</strong>
                                  Wire Slack/email alerts from templates.
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Advanced accordion */}
            <details className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              <summary className="text-sm text-blue-300 cursor-pointer">Advanced (feature engineering, async ops, experiment details)</summary>
              <div className="mt-3 grid gap-3 md:grid-cols-3 text-xs text-gray-300">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <strong className="text-white block mb-1">Feature Engineering</strong>
                  Manual transforms, target leakage guardrails, export feature views.
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <strong className="text-white block mb-1">Async Operations</strong>
                  Long-running jobs, retries, lineage view.
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <strong className="text-white block mb-1">Experiment Tracking</strong>
                  Compare runs, pin champion, download metrics.
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Interactive Robot Chatbot (Spline) */}
      <section className="relative mb-10">
        <div className="glass-card border border-white/10 bg-black/80 overflow-hidden">
          <Spotlight className="-top-40 left-10" size={420} />
          <div className="grid lg:grid-cols-2 gap-0 items-stretch relative z-10">
            <div className="p-8 md:p-10 lg:p-12 flex flex-col justify-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 w-fit">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Assistant
              </div>
              <h2 className="text-3xl md:text-4xl font-bold gradient-text-blue">Orbital Robot Copilot</h2>
              <p className="text-gray-300 leading-relaxed max-w-xl">
                Chat with an interactive 3D bot that mirrors your ML pipeline. Ask about datasets, training status, or next best actions while the orbit spins in sync.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => openChat()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-purple-700 transition"
                >
                  Start Chat
                </button>
                <button
                  onClick={() => navigate('/app/data')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold border border-white/10 hover:bg-white/20 transition"
                >
                  Get Started
                </button>
              </div>
            </div>
            <div className="relative h-[460px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
              <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.25),transparent_45%),radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.2),transparent_40%)]" />
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="hidden">
      {/* Main Dashboard Grid with Scroll Animation */}
      <ContainerScroll
        titleComponent={
          <div className="mb-8">
            <h2 className="text-5xl md:text-7xl font-bold gradient-text-blue mb-4">
              Your ML Command Center
            </h2>
            <p className="text-gray-400 text-lg md:text-xl">
              Real-time insights at your fingertips
            </p>
          </div>
        }
      >
        <div className="max-w-7xl mx-auto space-y-6 p-6">
          {/* Top Row - Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Metric 1: Datasets */}
            <div className="stat-card-orbital hover-glow-blue group">
              <div className="orbital-ring absolute inset-[-5%] rounded-full border border-blue-500/30" />
              <div className="orbital-ring absolute inset-[-10%] rounded-full border-2 border-blue-500/40" style={{ animationDuration: '25s' }} />
              <div className="orbital-ring absolute inset-[-15%] rounded-full border border-blue-500/20" style={{ animationDuration: '30s' }} />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Datasets</span>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Database className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-end justify-between relative z-10">
                <div>
                  <div className="text-4xl font-bold gradient-text-blue mb-2">
                    {metrics.totalDatasets}
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${metrics.isUp.datasets ? 'text-emerald-400' : 'text-red-400'}`}>
                    {metrics.isUp.datasets ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{metrics.datasetChange}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">{metrics.totalRows.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">total rows</div>
                </div>
              </div>
            </div>

          {/* Metric 2: Models */}
          <div className="stat-card-orbital hover-glow-purple group">
            <div className="orbital-ring-slow absolute inset-[-5%] rounded-full border border-purple-500/30" />
            <div className="orbital-ring-slow absolute inset-[-10%] rounded-full border-2 border-purple-500/40" style={{ animationDuration: '35s' }} />
            <div className="orbital-ring-slow absolute inset-[-15%] rounded-full border border-purple-500/20" style={{ animationDuration: '40s' }} />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Models</span>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 pulse-slow">
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex items-end justify-between relative z-10">
              <div>
                <div className="text-4xl font-bold gradient-text-purple mb-2">
                  {metrics.totalModels}
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${metrics.isUp.models ? 'text-emerald-400' : 'text-red-400'}`}>
                  {metrics.isUp.models ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{metrics.modelChange}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-white">{metrics.deployedModels}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">deployed</div>
              </div>
            </div>
          </div>

          {/* Metric 3: Health Score */}
          <div className="stat-card-orbital hover-glow-blue group">
            <div className="orbital-ring absolute inset-[-5%] rounded-full border border-emerald-500/30" style={{ animationDirection: 'reverse' }} />
            <div className="orbital-ring absolute inset-[-10%] rounded-full border-2 border-emerald-500/40" style={{ animationDirection: 'reverse', animationDuration: '25s' }} />
            <div className="orbital-ring absolute inset-[-15%] rounded-full border border-emerald-500/20" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Avg Health</span>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex items-end justify-between relative z-10">
              <div>
                <div className="text-4xl font-bold gradient-text-teal mb-2">
                  {metrics.avgHealthScore.toFixed(0)}
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${metrics.isUp.health ? 'text-emerald-400' : 'text-red-400'}`}>
                  {metrics.isUp.health ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{metrics.healthChange}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-white">Quality</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">score</div>
              </div>
            </div>
          </div>

          {/* Metric 4: Activity */}
          <div className="stat-card-orbital hover-glow-purple group">
            <div className="orbital-ring-slow absolute inset-[-5%] rounded-full border border-orange-500/30" style={{ animationDirection: 'reverse' }} />
            <div className="orbital-ring-slow absolute inset-[-10%] rounded-full border-2 border-orange-500/40" style={{ animationDirection: 'reverse', animationDuration: '35s' }} />
            <div className="orbital-ring-slow absolute inset-[-15%] rounded-full border border-orange-500/20" style={{ animationDirection: 'reverse', animationDuration: '40s' }} />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Activity</span>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30 pulse-slow">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex items-end justify-between relative z-10">
              <div>
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 mb-2">
                  {metrics.trainedModels}
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>Active</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-white">Today</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">models</div>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Models Section - Compact Version for Dashboard */}
        <div className="glass-card hover-lift" id="charts-section">
          <div className="px-6 py-4 border-b border-white/10">
            <SectionHeader
              title="Predictions"
              description="Monitor trends and forecasts"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowChartDetails((prev) => !prev)}
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                  aria-label="Toggle chart details"
                >
                  {showChartDetails ? 'Hide details' : 'Show details'}
                </button>
                <select
                  value={selectedPredictionModel}
                  onChange={(e) => setSelectedPredictionModel(e.target.value)}
                  aria-label="Select prediction chart"
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
            </SectionHeader>
            <p className="text-xs text-gray-500 mt-1">Using: {datasets.length === 0 ? '—' : selectedDatasetLabel}</p>
          </div>
          <div className="p-4">
            {(() => {
              const model = datasetAwarePredictionModel;
              if (!model) return null;

              if (datasets.length === 0) {
                return (
                  <div className="text-sm text-gray-300 bg-white/5 border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                    <span>No datasets yet. Import one to activate the orbit.</span>
                    <button
                      onClick={() => navigate('/app/data')}
                      className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition"
                      aria-label="Import dataset to enable predictions"
                    >
                      Import dataset
                    </button>
                  </div>
                );
              }

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
                    {chartsError ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-3 border border-white/10 rounded-lg bg-black/40 p-4">
                        <p className="text-sm font-semibold">Charts couldn’t load. Showing summary.</p>
                        <div className="grid grid-cols-3 gap-3 w-full text-center">
                          <div>
                            <p className="text-xs text-gray-500">Current</p>
                            <p className="text-lg font-bold text-white">{lastHistorical}{model.unit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Forecast</p>
                            <p className="text-lg font-bold" style={{ color: model.color }}>{lastForecast}{model.unit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Change</p>
                            <p className={`text-lg font-bold ${parseFloat(change) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {parseFloat(change) >= 0 ? '+' : ''}{change}%
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={retryCharts}
                          className="text-xs text-blue-400 hover:text-blue-300 underline"
                          aria-label="Retry loading charts"
                        >
                          Retry
                        </button>
                      </div>
                    ) : chartsLoaded && ChartComp ? (
                      <ChartComp.Line
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          interaction: { mode: 'index' as const, intersect: false },
                          plugins: {
                            legend: {
                              display: showChartDetails,
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
                                label: function (context: any) {
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
                                callback: function (value: any) {
                                  return value + model.unit;
                                }
                              }
                            },
                            x: {
                              grid: { display: false },
                              ticks: {
                                color: 'rgba(255, 255, 255, 0.5)',
                                font: { size: 9 },
                                maxRotation: 0,
                                autoSkip: true,
                                maxTicksLimit: 7,
                              }
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                        <p className="text-sm">Loading charts…</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Loader className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                          Loading chart
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </ContainerScroll>

      {/* Below the scroll section - Regular layout */}
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        {/* Second Row - Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Recent Datasets - Terminal Style List */}
          <div className="lg:col-span-2 saas-card">
            <div className="saas-card-header">
              <SectionHeader
                title="Recent Datasets"
                description="Latest ingests and profiles"
              >
                <button
                  onClick={() => navigate('/app/data')}
                  className="saas-btn-ghost saas-btn-sm flex items-center gap-1"
                >
                  View all
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </SectionHeader>
            </div>
            <div className="saas-card-body">
              {datasets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="saas-body-small text-gray-300">No datasets yet. Import one to activate the orbit.</p>
                  <button
                    onClick={() => navigate('/app/data')}
                    className="saas-btn-primary saas-btn-sm mt-4"
                  >
                    Import dataset →
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

          {/* Models List with progressive disclosure */}
          <div className="saas-card">
            <div className="saas-card-header">
              <SectionHeader
                title="Models"
                description="Monitor trained and deployed models"
              >
                <button
                  onClick={() => setShowModelDetails((prev) => !prev)}
                  className="saas-caption text-blue-400 hover:text-blue-300 underline"
                  aria-label="Toggle model list details"
                >
                  {showModelDetails ? 'Hide details' : 'Show details'}
                </button>
              </SectionHeader>
              <p className="saas-caption text-gray-500 mt-1">Trained: {metrics.trainedModels} • Deployed: {metrics.deployedModels}</p>
            </div>
            <div className="saas-card-body">
              {models.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Brain className="w-10 h-10 mx-auto mb-3 opacity-70" />
                  <p className="saas-body-small text-gray-300 mb-3">No trained models yet. Train one in ML Studio.</p>
                  <button
                    onClick={() => navigate('/app/train')}
                    className="saas-btn-primary saas-btn-sm"
                  >
                    Train model →
                  </button>
                </div>
              ) : showModelDetails ? (
                <div className="space-y-2">
                  {models.slice(0, 4).map((model) => {
                    const status = model.status || 'pending';
                    const deployed = status === 'deployed';
                    return (
                      <div
                        key={model.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="saas-icon-purple w-10 h-10">
                            <Brain className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="saas-body font-semibold text-white truncate max-w-[160px]">{model.name || 'Untitled model'}</p>
                            <p className="saas-caption text-gray-500 truncate max-w-[160px]">{model.createdAt ? getTimeAgo(model.createdAt) : '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${deployed ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/10 text-blue-200 border border-blue-500/30'}`}>
                            {deployed ? 'Deployed' : status}
                          </span>
                          <button
                            onClick={() => navigate(`/app/modelops?model=${model.id || ''}`)}
                            className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-6">Details hidden. Show details to view models.</p>
              )}
            </div>
          </div>

          {/* Activity Feed - Terminal Style */}
          <div className="saas-card">
            <div className="saas-card-header">
              <SectionHeader
                title="Live Activity"
                description="Recent dataset and model events"
              />
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
                  const isModel = activity.type === 'model' && typeof activity.id === 'string' && activity.id.length > 0;
                  
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

                      {isModel && (
                        <button
                          onClick={() => navigate(`/app/modelops?model=${activity.id}`)}
                          className="ml-2 shrink-0 px-2 py-1 text-[10px] font-semibold rounded bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          title="Open this model in ModelOps"
                        >
                          ModelOps
                        </button>
                      )}
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
                <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="saas-caption text-gray-300 mb-3">No datasets yet. Import one to activate the orbit.</p>
                <button
                  onClick={() => navigate('/app/data')}
                  className="saas-btn-primary saas-btn-sm"
                >
                  Import dataset →
                </button>
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

      </div>

      {/* Strategic Upgrade Prompt */}
      {showUpgradePrompt && (
        <Suspense fallback={null}>
          <StrategicUpgradePrompt
            trigger={upgradePromptTrigger}
            onClose={() => setShowUpgradePrompt(false)}
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
