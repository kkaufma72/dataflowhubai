import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Brain,
  Database,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import LandingNav from '../components/LandingNav';
import Footer from '../components/Footer';
import InteractiveLiveDemo from '../components/landing/InteractiveLiveDemo';

const numberFormat = new Intl.NumberFormat('en-US');
const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact' });

type MetricCard = {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle: string;
  palette: 'blue' | 'purple' | 'teal' | 'orange';
};

const paletteStyles: Record<MetricCard['palette'], { outer: string; inner: string; ring?: string }> = {
  blue: {
    outer: 'from-blue-500 to-cyan-500',
    inner: 'from-blue-500/30 to-cyan-400/20',
    ring: 'border-blue-500/40',
  },
  purple: {
    outer: 'from-purple-500 to-pink-500',
    inner: 'from-purple-500/30 to-pink-400/20',
    ring: 'border-purple-500/40',
  },
  teal: {
    outer: 'from-emerald-500 to-teal-500',
    inner: 'from-emerald-500/30 to-teal-400/20',
    ring: 'border-emerald-500/40',
  },
  orange: {
    outer: 'from-orange-500 to-amber-500',
    inner: 'from-orange-500/30 to-amber-400/20',
    ring: 'border-orange-500/40',
  },
};

const LandingDashboardsPage: React.FC = () => {
  const [metrics, setMetrics] = useState({
    datasets: 12_000,
    datasetChange: 4.8,
    models: 530,
    modelChange: 2.2,
    health: 99.4,
    healthChange: 1.3,
    rows: 128_400_000,
    throughput: 542,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        datasetChange: Number((prev.datasetChange + (Math.random() - 0.5) * 0.6).toFixed(1)),
        modelChange: Number((prev.modelChange + (Math.random() - 0.5) * 0.5).toFixed(1)),
        healthChange: Number((prev.healthChange + (Math.random() - 0.5) * 0.3).toFixed(1)),
      }));
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  const cards = useMemo<MetricCard[]>(() => [
    {
      title: 'Datasets',
      value: `${compactNumber.format(metrics.datasets)}+`,
      change: metrics.datasetChange,
      changeLabel: 'QoQ',
      icon: Database,
      subtitle: `${numberFormat.format(metrics.rows)} rows synced`,
      palette: 'blue',
    },
    {
      title: 'Models',
      value: `${compactNumber.format(metrics.models)}+`,
      change: metrics.modelChange,
      changeLabel: 'MoM',
      icon: Brain,
      subtitle: 'Deployed & in-flight',
      palette: 'purple',
    },
    {
      title: 'Health',
      value: `${metrics.health.toFixed(1)}%`,
      change: metrics.healthChange,
      changeLabel: 'Quality delta',
      icon: Activity,
      subtitle: 'Quality score',
      palette: 'teal',
    },
    {
      title: 'Throughput',
      value: numberFormat.format(metrics.throughput),
      change: metrics.modelChange,
      changeLabel: 'Active today',
      icon: Zap,
      subtitle: 'Model runs in last 24h',
      palette: 'orange',
    },
  ], [metrics]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-950 text-white">
      <LandingNav />

      <section className="relative px-6 pt-16 pb-12 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[900px] h-[900px] rounded-full border border-cyan-500/15 blur-sm" />
          <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[650px] h-[650px] rounded-full border border-purple-500/15" style={{ animation: 'spin 28s linear infinite' }} />
          <div className="absolute left-1/2 top-40 -translate-x-1/2 w-[420px] h-[420px] rounded-full border border-blue-500/10" style={{ animation: 'spin 18s linear infinite reverse' }} />
        </div>

        <div className="max-w-6xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm text-gray-100">
                <Sparkles className="w-4 h-4 text-cyan-300" />
                Live dashboards
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight">Pipeline dashboards, decluttered</h1>
              <p className="text-lg text-gray-200">
                The hero stays focused on copy; the live metrics live here. Track datasets, models, health, and throughput with orbital rings and gentle motion.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm font-semibold hover:bg-white/15 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to landing
                </Link>
                <Link
                  to="/product-tour"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-purple-700 transition"
                >
                  Interactive tour
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 max-w-md w-full">
              <div className="text-sm text-gray-200 font-semibold mb-2">Why separate?</div>
              <p className="text-sm text-gray-300">
                The orbit stays high on the landing for clarity. All four dashboards now sit here so the robot and hero copy can stay lightweight.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {cards.map((card) => {
              const Icon = card.icon;
              const isUp = card.change >= 0;
              const palette = paletteStyles[card.palette];

              return (
                <div key={card.title} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-5 shadow-xl">
                  <div className={`absolute inset-[-10%] rounded-full border ${palette.ring ?? 'border-white/10'} opacity-30`} />
                  <div
                    className={`absolute inset-[-16%] rounded-full border-2 ${palette.ring ?? 'border-white/5'} opacity-30`}
                    style={{ animationDuration: '28s' }}
                  />
                  <div className="relative flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.title}</span>
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${palette.outer} flex items-center justify-center shadow-lg shadow-black/40`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200">
                      {card.value}
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-semibold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>
                        {card.change.toFixed(1)}% {card.changeLabel}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{card.subtitle}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive demo block moved from landing */}
      <section className="relative px-6 pb-16 bg-gradient-to-b from-slate-950 via-black to-slate-950">
        <div className="max-w-6xl mx-auto mt-4">
          <InteractiveLiveDemo />
        </div>
      </section>

      {/* Try it live (links to dedicated FRED demo page) */}
      <section className="py-16 px-6 bg-gradient-to-b from-indigo-50/50 to-white text-gray-900" id="try-it-live">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl border border-indigo-100 bg-white shadow-xl p-8 md:p-12 flex flex-col gap-6 items-start">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
              <Database className="w-4 h-4" />
              Try it live — no signup required
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="text-3xl font-bold text-gray-900">See FRED data answered by AI</h2>
              <p className="text-lg text-gray-600 max-w-2xl">
                Jump into a dedicated demo experience: import one FRED dataset and ask three questions, all without creating an account.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/demo/fred"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-purple-700 transition"
              >
                Open the FRED demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/product-tour"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white border border-gray-200 text-gray-900 text-sm font-semibold hover:bg-gray-50 transition"
              >
                Watch interactive tour
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingDashboardsPage;
