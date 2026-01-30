// Landing Page - Orbital Layout
// Focused on hero + live pipeline + 3D robot chat. Pricing/feature grids live on the dedicated pricing page.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import LandingNav from '../components/LandingNav';
import Footer from '../components/Footer';
import MLTrainingPipeline from '../components/ml-studio/MLTrainingPipeline';
import { ExitIntentPopup, useExitIntent } from '../components/landing/ExitIntentPopup';
import { Spotlight } from '../components/ui/spotlight';
import { SplineScene } from '../components/ui/splite';
import RobotAppQA from '../components/landing/RobotAppQA';
import { useAuth } from '../components/auth/AuthProvider';

const LandingPageLinear: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [pipelineStep, setPipelineStep] = useState(1);
  const [pipelineProgress, setPipelineProgress] = useState(35);
  const { showPopup, setShowPopup } = useExitIntent();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/app', { replace: true });
    }
  }, [user, loading, navigate]);

  // Animate pipeline progress through steps 1-5
  useEffect(() => {
    const interval = setInterval(() => {
      setPipelineProgress((prev) => {
        const next = prev + Math.random() * 18 + 6;
        if (next >= 100) {
          setPipelineStep((step) => (step >= 5 ? 1 : step + 1));
          return 10;
        }
        return next;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <LandingNav />

      <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.2),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.15),transparent_45%)]" />
      <div className="absolute -left-24 -top-24 w-72 h-72 rounded-full border border-white/5 animate-pulse opacity-30" />
      <div className="absolute -right-20 -bottom-28 w-80 h-80 rounded-full border border-white/5 animate-ping opacity-20" />

      {/* Hero copy at top */}
      <section className="relative pt-20 pb-16 px-6">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[900px] h-[900px] rounded-full border border-cyan-500/15 blur-sm" />
          <div
            className="absolute left-1/2 top-24 -translate-x-1/2 w-[650px] h-[650px] rounded-full border border-purple-500/15"
            style={{ animation: 'spin 28s linear infinite' }}
          />
          <div
            className="absolute left-1/2 top-40 -translate-x-1/2 w-[420px] h-[420px] rounded-full border border-blue-500/10"
            style={{ animation: 'spin 18s linear infinite reverse' }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm text-gray-100">
                <Sparkles className="w-4 h-4 text-cyan-300" />
                Powered by Autonomous ML
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Build ML models in minutes</span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">See every step live</span>
              </h1>

              <p className="text-lg text-gray-200 max-w-3xl">
                An orbital-grade platform that visualizes your pipeline end-to-end. From raw data to deployed models—guided, explainable, and fast.
              </p>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <Link
                  to="/product-tour"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-5 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-purple-700 transition"
                >
                  <Sparkles className="w-5 h-5" />
                  See interactive demo
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/signin"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white/10 text-white text-lg font-semibold border border-white/15 hover:bg-white/15 transition"
                >
                  Start free trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> 10K+ datasets
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" /> 500+ models
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" /> 95% faster
                </span>
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
                    <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse" />
                    Dashboards now live
                  </div>
                  <Link
                    to="/dashboards"
                    className="inline-flex items-center gap-2 text-xs text-white px-3 py-1 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 transition"
                  >
                    Open dashboards
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <p className="text-sm text-gray-200/90">
                  Explore live datasets, models, health, and throughput metrics on a dedicated page without crowding the hero.
                </p>
              </div>
            </div>

            <div className="lg:col-span-1 relative">
              <div className="relative max-w-full rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-950/60 to-black/80 p-6 shadow-2xl shadow-blue-500/10">
                <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-blue-500/20 blur-3xl" />
                <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-purple-500/20 blur-3xl" />
                <div className="relative flex flex-col gap-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-gray-200 w-fit">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live preview
                  </div>
                  <p className="text-lg font-semibold text-white">Built-in orbit guidance</p>
                  <p className="text-sm text-gray-200/90">
                    Keep the orbit visible above. Want deeper numbers? Jump to the dashboards page to watch datasets, models, and health tick live.
                  </p>
                  <Link
                    to="/dashboards"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-purple-700 transition w-fit"
                  >
                    View dashboards
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ML pipeline below hero */}
      <section className="relative px-6 pb-8 bg-gradient-to-b from-slate-950 via-black to-slate-950">
        <div className="max-w-screen-xl mx-auto rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 md:p-7 lg:p-8 overflow-visible">
          <div className="grid lg:grid-cols-[360px,1fr] gap-6 lg:gap-10 items-start">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-cyan-200 uppercase tracking-[0.2em]">Live pipeline</p>
                  <h2 className="text-2xl md:text-3xl font-bold">
                    <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">See every stage in motion</span>
                  </h2>
                <p className="text-sm text-gray-200 leading-relaxed">
                  The orbital map shows every stage of your ML lifecycle. Hover or tap a node to pause rotation, reveal related steps, and see per-step energy.
                </p>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/15 bg-black/50 p-4 text-sm text-gray-100 shadow-inner">
                <div className="flex flex-wrap items-center gap-2 text-gray-200">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                    Step {pipelineStep} of 5
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-200">
                    {Math.round(pipelineProgress)}% complete
                  </span>
                </div>

                <div className="flex items-center gap-2 text-cyan-200 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse" />
                  Orbit Cheat Sheet
                </div>
                <ul className="space-y-2 text-gray-200/90 list-disc list-inside">
                  <li>Green pulse highlights related steps on expand.</li>
                  <li>Click any node to pause rotation and inspect.</li>
                  <li>Energy ring tracks progress per stage.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-100">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-gray-300 font-semibold mb-1">Dataset</div>
                  <div className="text-white">Revenue Forecasting</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-gray-300 font-semibold mb-1">Model</div>
                  <div className="text-white">Gradient Boosted Trees</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-2 lg:p-4 overflow-visible shadow-2xl shadow-blue-500/10">
              <MLTrainingPipeline
                datasetName="Revenue Forecasting"
                modelType="Gradient Boosted Trees"
                currentStep={pipelineStep}
                trainingProgress={pipelineProgress}
                heightClass="h-[620px] lg:h-[680px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Robot Chatbot (Spline) */}
      <section className="relative px-6 py-14 bg-gradient-to-b from-slate-900 to-black text-white overflow-hidden">
        <div className="max-w-6xl mx-auto glass-card border border-white/10 bg-black/70 overflow-hidden relative">
          <Spotlight className="-top-40 left-10" size={420} />
          <div className="grid lg:grid-cols-2 gap-0 items-stretch relative z-10">
            <div className="p-8 md:p-10 lg:p-12 flex flex-col justify-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 w-fit">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                Live 3D Copilot
              </div>
              <h2 className="text-3xl md:text-4xl font-bold gradient-text-blue">Interactive Robot Chat</h2>
              <p className="text-gray-300 leading-relaxed max-w-xl">
                A spatial, 3D chatbot you can embed into your product. Ask about pipeline status, datasets, or playbooks—while the bot animates in real time.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/demo/spatial-showcase"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-purple-700 transition"
                >
                  See 3D demo
                </Link>
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold border border-white/10 hover:bg-white/20 transition"
                >
                  Open in app
                </Link>
              </div>
              <div className="pt-4">
                <RobotAppQA />
              </div>
            </div>
            <div className="relative h-[420px] md:h-[500px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
              <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.25),transparent_45%),radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.2),transparent_40%)]" />
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {showPopup && <ExitIntentPopup onClose={() => setShowPopup(false)} />}
    </div>
  );
};

export default LandingPageLinear;
