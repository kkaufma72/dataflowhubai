import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Database,
  Cpu,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Dataset, MLModel } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import StepperNavigation from '../components/ml-studio/StepperNavigation';
import DataSelectionStep from '../components/ml-studio/DataSelectionStep';
import TrainingStep from '../components/ml-studio/TrainingStep';
import MonitoringStep from '../components/ml-studio/MonitoringStep';
import { useMLContext } from '../context/MLContext';
import { useAuth } from '../components/auth/AuthProvider';

const formatRelativeTime = (iso?: string | null) => {
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

const STEPS = [
  {
    id: 1,
    title: 'Select Data',
    description: 'Choose your dataset',
    eta: '~1 min',
  },
  {
    id: 2,
    title: 'Features & Train',
    description: 'Prepare & train',
    eta: '~2 min',
  },
  {
    id: 3,
    title: 'Deploy & Monitor',
    description: 'Go live',
    eta: '~2 min',
  },
];

const MLStudio: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { datasets, models } = useMLContext();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [trainedModel, setTrainedModel] = useState<MLModel | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const resumeBannerTimerRef = useRef<number | null>(null);
  const [trainingGuardrails, setTrainingGuardrails] = useState<{
    targetColumn: string;
    selectedFeatures: string[];
  }>({ targetColumn: '', selectedFeatures: [] });

  const [autoPickRequest, setAutoPickRequest] = useState(0);

  const [quickAction, setQuickAction] = useState<null | 'drift' | 'exportFeatures'>(null);

  const requestedStep = useMemo(() => {
    const raw = searchParams.get('step');
    const asNum = raw ? Number(raw) : 1;
    if (!Number.isFinite(asNum)) return 1;
    return Math.min(3, Math.max(1, Math.trunc(asNum)));
  }, [searchParams]);

  const hasExplicitStepParam = useMemo(() => searchParams.has('step'), [searchParams]);

  const requestedDatasetId = useMemo(() => {
    return searchParams.get('datasetId') || searchParams.get('dataset') || null;
  }, [searchParams]);

  const mostRecentDataset = useMemo(() => {
    if (!datasets || datasets.length === 0) return null;
    const sorted = [...datasets].sort((a, b) => {
      const aT = new Date(a.dateUploaded || 0).getTime();
      const bT = new Date(b.dateUploaded || 0).getTime();
      return bT - aT;
    });
    return sorted[0] || null;
  }, [datasets]);

  const activeModel = useMemo(() => {
    if (!models || models.length === 0) return null;
    const deployed = models.filter((m) => m.status === 'deployed');
    const pool = deployed.length ? deployed : models.filter((m) => m.status === 'trained');
    const sorted = [...pool].sort((a, b) => {
      const aT = new Date(a.deployedAt || a.createdAt || 0).getTime();
      const bT = new Date(b.deployedAt || b.createdAt || 0).getTime();
      return bT - aT;
    });
    return sorted[0] || null;
  }, [models]);

  const workspaceAlertStatus = useMemo(() => {
    const hasFailures = models.some((m) => m.status === 'failed');
    const hasTraining = models.some((m) => m.status === 'training');
    if (hasFailures) return { label: 'Attention', tone: 'danger' as const };
    if (hasTraining) return { label: 'Watching', tone: 'warn' as const };
    return { label: 'Healthy', tone: 'ok' as const };
  }, [models]);

  const lastDeployText = useMemo(
    () => formatRelativeTime(activeModel?.deployedAt || null),
    [activeModel?.deployedAt]
  );

  const resumeKey = useMemo(
    () => `dfh:mlstudio:lastStep:${user?.id || 'anon'}`,
    [user?.id]
  );

  useEffect(() => {
    if (!requestedDatasetId) {
      // Smart default: preselect most recent dataset without advancing.
      if (!selectedDataset && mostRecentDataset) {
        setSelectedDataset(mostRecentDataset);
      }

      // Smart default: resume last step per user (unless an explicit ?step= is provided).
      if (!hasExplicitStepParam) {
        const raw = localStorage.getItem(resumeKey);
        const step = raw ? Number(raw) : NaN;
        const clamped = [1, 2, 3].includes(step) ? step : 1;

        // Guardrails: only resume when prerequisites exist.
        const canGo2 = Boolean(selectedDataset || mostRecentDataset);
        const modelForResume = trainedModel || activeModel;
        const canGo3 = Boolean(modelForResume);

        const nextStep =
          clamped === 3 ? (canGo3 ? 3 : canGo2 ? 2 : 1) : clamped === 2 ? (canGo2 ? 2 : 1) : 1;

        if (nextStep !== currentStep) {
          setCurrentStep(nextStep);
          if (nextStep > 1) {
            setShowResumeBanner(true);
            if (resumeBannerTimerRef.current) {
              window.clearTimeout(resumeBannerTimerRef.current);
              resumeBannerTimerRef.current = null;
            }
            resumeBannerTimerRef.current = window.setTimeout(() => {
              setShowResumeBanner(false);
              resumeBannerTimerRef.current = null;
            }, 5200);
          }
        }
      }

      // Respect explicit ?step=... only when the required state exists.
      if (requestedStep === 1) {
        setCurrentStep(1);
      } else if (requestedStep === 2) {
        setCurrentStep(selectedDataset ? 2 : 1);
      } else if (requestedStep === 3) {
        setCurrentStep(trainedModel ? 3 : selectedDataset ? 2 : 1);
      }
      return;
    }

    if (!datasets || datasets.length === 0) return;
    const match = datasets.find((d) => d.id === requestedDatasetId) || null;
    if (!match) return;

    setSelectedDataset(match);
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(1);
      return next;
    });

    // If a model is already trained in-session, allow step 3; otherwise stop at step 2.
    if (requestedStep >= 3) {
      setCurrentStep(trainedModel ? 3 : 2);
    } else if (requestedStep >= 2) {
      setCurrentStep(2);
    } else {
      setCurrentStep(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedDatasetId, datasets, requestedStep]);

  useEffect(() => {
    // Keep a stable active model to allow resuming step 3 across refresh.
    if (!trainedModel && activeModel) {
      setTrainedModel(activeModel);
    }
  }, [activeModel, trainedModel]);

  useEffect(() => {
    localStorage.setItem(resumeKey, String(currentStep));
  }, [currentStep, resumeKey]);

  useEffect(() => {
    return () => {
      if (resumeBannerTimerRef.current) {
        window.clearTimeout(resumeBannerTimerRef.current);
        resumeBannerTimerRef.current = null;
      }
    };
  }, []);

  const handleDatasetSelected = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setCompletedSteps((prev) => new Set(prev).add(1));
    setCurrentStep(2);
  };

  const handleModelTrained = (model: MLModel) => {
    setTrainedModel(model);
    setCompletedSteps((prev) => new Set(prev).add(2));
    setCurrentStep(3);
  };

  const handleStepClick = (stepId: number) => {
    // Only allow navigation to completed steps or current step
    if (completedSteps.has(stepId) || stepId === currentStep) {
      setCurrentStep(stepId);
    }
  };

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const guardrailsForStep = useMemo(() => {
    const datasetSelected = Boolean(selectedDataset);
    const datasetsAvailable = datasets.length > 0;

    const targetDetected = Boolean(trainingGuardrails.targetColumn);
    const hasFeatures = trainingGuardrails.selectedFeatures.length > 0;

    const modelReady = Boolean(trainedModel);
    const deployHealthy = (trainedModel?.status === 'deployed' && Boolean(trainedModel.deployedAt)) || false;

    if (currentStep === 1) {
      return [
        {
          ok: datasetsAvailable,
          label: datasetsAvailable ? `${datasets.length} datasets available` : 'No datasets available',
          fixLabel: datasetsAvailable ? undefined : 'Fix',
          onFix: datasetsAvailable ? undefined : () => navigate('/app/data'),
        },
        {
          ok: datasetSelected,
          label: datasetSelected ? 'Dataset selected' : 'Dataset not selected',
          fixLabel: datasetSelected ? undefined : 'Fix',
          onFix: datasetSelected ? undefined : () => scrollToId('ml-dataset-grid'),
        },
      ];
    }

    if (currentStep === 2) {
      return [
        {
          ok: datasetSelected,
          label: datasetSelected ? 'Data schema locked' : 'Dataset missing',
          fixLabel: datasetSelected ? undefined : 'Fix',
          onFix: datasetSelected ? undefined : () => setCurrentStep(1),
        },
        {
          ok: targetDetected && hasFeatures,
          label: !targetDetected
            ? 'Target column missing'
            : !hasFeatures
              ? 'No features selected'
              : 'Ready to train',
          fixLabel: targetDetected && hasFeatures ? undefined : 'Fix',
          onFix:
            targetDetected && hasFeatures
              ? undefined
              : () => {
                  setAutoPickRequest((v) => v + 1);
                  // Keep the user in-context (still scroll to where the fix applied).
                  if (!targetDetected) {
                    scrollToId('ml-target-column');
                  } else {
                    scrollToId('ml-feature-selection');
                  }
                },
        },
      ];
    }

    return [
      {
        ok: modelReady,
        label: modelReady ? 'Model available' : 'No model yet',
        fixLabel: modelReady ? undefined : 'Fix',
        onFix: modelReady ? undefined : () => setCurrentStep(2),
      },
      {
        ok: deployHealthy,
        label: deployHealthy ? `Last deploy healthy (${lastDeployText})` : `Last deploy: ${lastDeployText}`,
        fixLabel: deployHealthy ? undefined : 'Fix',
        onFix: deployHealthy ? undefined : () => scrollToId('ml-deployment'),
      },
    ];
  }, [currentStep, datasets.length, lastDeployText, navigate, selectedDataset, trainingGuardrails.selectedFeatures.length, trainingGuardrails.targetColumn, trainedModel]);

  const downloadJson = (fileName: string, data: unknown) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleQuickAction = (action: 'drift' | 'exportFeatures') => {
    if (action === 'exportFeatures') {
      if (!selectedDataset) {
        toast.error('Select a dataset first');
        setCurrentStep(1);
        return;
      }
      const payload = {
        datasetId: selectedDataset.id,
        datasetName: selectedDataset.name,
        selectedFeatures: trainingGuardrails.selectedFeatures,
        targetColumn: trainingGuardrails.targetColumn,
        exportedAt: new Date().toISOString(),
      };
      downloadJson(`feature-view-${selectedDataset.id}.json`, payload);
      toast.success('Exported feature view');
      setQuickAction('exportFeatures');
      return;
    }

    // drift
    const modelForStep3 = trainedModel || activeModel;
    if (!modelForStep3) {
      toast.error('Train a model first');
      setCurrentStep(2);
      return;
    }

    if (!trainedModel) setTrainedModel(modelForStep3);
    setQuickAction('drift');
    setShowAdvanced(false);
    setCurrentStep(3);
  };

  const handleBackToData = () => {
    setCurrentStep(1);
  };

  const handleBackToTraining = () => {
    setCurrentStep(2);
  };

  const legacyFeatureEngineeringHref = selectedDataset
    ? `/app/feature-engineering?dataset=${encodeURIComponent(selectedDataset.id)}`
    : '/app/feature-engineering';

  const SnapshotChip = ({
    icon: Icon,
    label,
    value,
    tone,
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    tone?: 'ok' | 'warn' | 'danger' | 'neutral';
  }) => {
    const toneClass =
      tone === 'ok'
        ? 'border-green-500/30 bg-green-500/10 text-green-200'
        : tone === 'warn'
          ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200'
          : tone === 'danger'
            ? 'border-red-500/30 bg-red-500/10 text-red-200'
            : 'border-gray-800 bg-gray-900/40 text-gray-200';

    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-full border ${toneClass}`}>
        <Icon className="w-4 h-4" />
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-semibold text-white">{value}</span>
      </div>
    );
  };

  const ValidationPill = ({
    ok,
    label,
    fixLabel,
    onFix,
  }: {
    ok: boolean;
    label: string;
    fixLabel?: string;
    onFix?: () => void;
  }) => {
    const base = ok
      ? 'border-green-500/30 bg-green-500/10 text-green-200'
      : 'border-red-500/30 bg-red-500/10 text-red-200';
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${base}`}>
        {ok ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        <span className="text-xs font-medium">{label}</span>
        {!ok && fixLabel && onFix && (
          <button
            type="button"
            onClick={onFix}
            className="text-xs underline underline-offset-2 text-white/80 hover:text-white"
          >
            {fixLabel}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <PageHeader
        title="ML Workspace"
        description="One-click intelligence: select data, train, and monitor in three steps"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Anchored progress bar */}
        <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 border-b border-gray-800 bg-gray-950/80 backdrop-blur">
          <div className="py-2 flex items-center gap-3">
            <div className="flex-1 grid grid-cols-3 gap-2" aria-label="ML Workspace progress">
              {[1, 2, 3].map((s) => {
                const active = currentStep === s;
                const done = completedSteps.has(s);
                return (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full ${
                      done ? 'bg-green-500/70' : active ? 'bg-indigo-500/70' : 'bg-gray-800'
                    }`}
                  />
                );
              })}
            </div>
            <div className="text-[11px] text-gray-400 whitespace-nowrap">Step {currentStep} of 3</div>
          </div>
        </div>

        {/* Workspace snapshot */}
        <div className="mt-6 mb-8 flex flex-wrap items-center gap-2">
          <SnapshotChip icon={Database} label="Datasets" value={String(datasets.length)} />
          <SnapshotChip
            icon={Cpu}
            label="Active model"
            value={activeModel?.name?.trim() ? activeModel.name : '—'}
          />
          <SnapshotChip icon={Clock} label="Last deploy" value={lastDeployText} />
          <SnapshotChip
            icon={workspaceAlertStatus.tone === 'ok' ? ShieldCheck : AlertTriangle}
            label="Alerts"
            value={workspaceAlertStatus.label}
            tone={workspaceAlertStatus.tone === 'ok' ? 'ok' : workspaceAlertStatus.tone === 'warn' ? 'warn' : 'danger'}
          />
        </div>

        {/* Resume banner */}
        {showResumeBanner && (
          <div className="mb-8 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-indigo-100">Resume where you left off — step {currentStep}.</p>
            <button
              type="button"
              onClick={() => setShowResumeBanner(false)}
              className="text-sm text-indigo-200 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stepper Navigation */}
        <div className="mb-16">
          <StepperNavigation
            steps={STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Step Content */}
        <div className="animate-fadeIn">
          {/* Inline guardrails */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {guardrailsForStep.slice(0, 2).map((g) => (
              <ValidationPill
                key={g.label}
                ok={g.ok}
                label={g.label}
                fixLabel={g.fixLabel}
                onFix={g.onFix}
              />
            ))}
          </div>

          {currentStep === 1 && (
            <DataSelectionStep
              onNext={handleDatasetSelected}
              selectedDataset={selectedDataset}
            />
          )}

          {currentStep === 2 && selectedDataset && (
            <TrainingStep
              dataset={selectedDataset}
              onNext={handleModelTrained}
              onBack={handleBackToData}
              autoPickRequest={autoPickRequest}
              onGuardrailsChange={(next) =>
                setTrainingGuardrails({
                  targetColumn: next.targetColumn,
                  selectedFeatures: next.selectedFeatures,
                })
              }
            />
          )}

          {currentStep === 3 && trainedModel && (
            <MonitoringStep
              model={trainedModel}
              onBack={handleBackToTraining}
              prefillTemplate={quickAction === 'drift' ? 'drift' : null}
            />
          )}
        </div>

        {/* Advanced (progressive disclosure) */}
        <div className="max-w-5xl mx-auto mt-14">
          <div className="border border-gray-800 rounded-xl bg-gray-900/40">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full px-6 py-4 flex items-center justify-between text-left"
              aria-expanded={showAdvanced}
            >
              <div>
                <p className="text-sm font-semibold text-white">Advanced</p>
                <p className="text-xs text-gray-500 mt-1">
                  Extra tools and legacy pages (optional)
                </p>
              </div>
              {showAdvanced ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showAdvanced && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-800">
                {/* Quick actions strip */}
                <div className="mb-5 rounded-xl border border-gray-800 bg-gray-950/30 p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-white">Quick actions</p>
                      <p className="text-xs text-gray-500 mt-1">Power moves without leaving the workspace.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickAction('drift')}
                        className="px-3 py-2 rounded-lg border border-gray-800 bg-gray-900/40 hover:bg-gray-900 transition text-sm text-white"
                      >
                        Enable drift monitor template
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAction('exportFeatures')}
                        className="px-3 py-2 rounded-lg border border-gray-800 bg-gray-900/40 hover:bg-gray-900 transition text-sm text-white"
                      >
                        Export feature view
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/app/evaluate')}
                    className="px-4 py-3 rounded-lg border border-gray-800 bg-gray-950/40 hover:bg-gray-900 transition text-left"
                  >
                    <p className="text-sm font-medium text-white">Model Evaluation</p>
                    <p className="text-xs text-gray-500 mt-1">Compare metrics and validation</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/app/experiments')}
                    className="px-4 py-3 rounded-lg border border-gray-800 bg-gray-950/40 hover:bg-gray-900 transition text-left"
                  >
                    <p className="text-sm font-medium text-white">Experiment Tracking</p>
                    <p className="text-xs text-gray-500 mt-1">Runs, params, and history</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/app/async-ml')}
                    className="px-4 py-3 rounded-lg border border-gray-800 bg-gray-950/40 hover:bg-gray-900 transition text-left"
                  >
                    <p className="text-sm font-medium text-white">Async ML Operations</p>
                    <p className="text-xs text-gray-500 mt-1">Background jobs and queues</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/app/marketplace')}
                    className="px-4 py-3 rounded-lg border border-gray-800 bg-gray-950/40 hover:bg-gray-900 transition text-left"
                  >
                    <p className="text-sm font-medium text-white">Model Marketplace</p>
                    <p className="text-xs text-gray-500 mt-1">Browse pre-trained models</p>
                  </button>

                  <a
                    href={legacyFeatureEngineeringHref}
                    className="px-4 py-3 rounded-lg border border-gray-800 bg-gray-950/40 hover:bg-gray-900 transition text-left flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">Legacy Feature Engineering</p>
                      <p className="text-xs text-gray-500 mt-1">Full feature UI (legacy page)</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500 mt-0.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => navigate('/app/monitoring')}
                    className="px-4 py-3 rounded-lg border border-gray-800 bg-gray-950/40 hover:bg-gray-900 transition text-left flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">Advanced Monitoring</p>
                      <p className="text-xs text-gray-500 mt-1">Full monitoring dashboard</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500 mt-0.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLStudio;
