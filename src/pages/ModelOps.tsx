import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../components/auth/AuthProvider';
import { PageHeader } from '../components/ui/PageHeader';
import Card from '../components/common/Card';

type DriftAnalyzeResponse = {
  model_id: string;
  created_at: string;
  drift_report: Record<string, unknown>;
};

type AutopilotRunResponse = {
  model_id: string;
  drift_report: Record<string, unknown>;
  incident?: Incident | null;
  rca?: IncidentRCA | null;
  actions?: Array<Record<string, unknown>>;
  postmortem?: Record<string, unknown>;
};

type AutopilotPostmortem = {
  incident_id?: string | null;
  model_id?: string;
  retrained_model_id?: string | null;
  summary?: string;
  root_cause?: {
    top_feature?: string;
    narrative?: string;
  };
  remediation?: string[];
  rollout?: {
    strategy?: string;
    canary_percent?: number;
    endpoint?: string;
  };
  generated_at?: string;
};

type CanaryStatus = 'idle' | 'monitoring' | 'promoted';
type CanaryMetrics = {
  errorRate: number;
  latencyP95Ms: number;
  driftScore: number;
};

type Incident = {
  incident_id: string;
  model_id: string;
  status: string;
  severity: string;
  title: string;
  summary?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  metadata?: Record<string, unknown>;
};

type IncidentRCA = {
  incident_id: string;
  feature?: string | null;
  lineage_found: boolean;
  transformation_step: Record<string, unknown>;
  dataset: Record<string, unknown>;
  dataset_version: Record<string, unknown>;
  filters: Array<Record<string, unknown>>;
  upstream_columns: Array<Record<string, unknown>>;
  warnings: string[];
};

// Defaults intentionally match the lineage RCA demo (`income_bucket`) and
// are tuned to reliably open an incident in ModelOps.
const sampleReferenceStats = {
  income_bucket: { mean: 10, std: 1, missing_rate: 0.01, unique_count: 5 }
};

const sampleCurrentStats = {
  income_bucket: { mean: 50, std: 10, missing_rate: 0.2, unique_count: 20 }
};

const sampleCurrentStatsMoreDrift = {
  income_bucket: { mean: 75, std: 25, missing_rate: 0.35, unique_count: 40 }
};

function safePrettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

async function readApiError(res: Response): Promise<string> {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = (await res.json()) as any;
      if (typeof data?.detail === 'string' && data.detail.trim()) return data.detail;
      if (typeof data?.error?.message === 'string' && data.error.message.trim()) return data.error.message;
      return JSON.stringify(data);
    }

    const text = await res.text();
    return text || `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

async function parseJsonOrThrow(text: string, label: string): Promise<any> {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON in ${label}`);
  }
}

const ModelOps: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useAuth();
  const accessToken = session?.access_token;

  const [modelId, setModelId] = useState('');

  useEffect(() => {
    const modelFromQuery = searchParams.get('model');
    if (modelFromQuery && !modelId) {
      setModelId(modelFromQuery);
    }
  }, [modelId, searchParams]);

  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return headers;
  }, [accessToken]);

  const createTestModel = useCallback(async () => {
    try {
      const res = await fetch('/api/modelops/dev/models', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ name: 'Test Model', model_type: 'demo', status: 'trained' })
      });

      if (!res.ok) {
        const message = await readApiError(res);
        throw new Error(message || `Failed to create test model (${res.status})`);
      }

      const data = (await res.json()) as { model_id?: string };
      if (!data?.model_id) {
        throw new Error('Backend did not return model_id');
      }

      setModelId(data.model_id);
      setSearchParams({ model: data.model_id });
      toast.success('Test model created');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create test model');
    }
  }, [authHeaders, setSearchParams]);

  const [referenceStatsText, setReferenceStatsText] = useState(() => safePrettyJson(sampleReferenceStats));
  const [currentStatsText, setCurrentStatsText] = useState(() => safePrettyJson(sampleCurrentStats));

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [driftResult, setDriftResult] = useState<DriftAnalyzeResponse | null>(null);
  const [lastIncidentIdFromDrift, setLastIncidentIdFromDrift] = useState<string | null>(null);

  const [deployInfo, setDeployInfo] = useState<Record<string, unknown> | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const [isAutopilotRunning, setIsAutopilotRunning] = useState(false);
  const [autopilotResult, setAutopilotResult] = useState<AutopilotRunResponse | null>(null);

  const [canaryStatus, setCanaryStatus] = useState<CanaryStatus>('idle');
  const [canarySecondsRemaining, setCanarySecondsRemaining] = useState(0);
  const [canaryMetrics, setCanaryMetrics] = useState<CanaryMetrics | null>(null);

  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const [rcaByIncidentId, setRcaByIncidentId] = useState<Record<string, IncidentRCA | undefined>>({});
  const [rcaLoading, setRcaLoading] = useState<Record<string, boolean>>({});
  const [rcaExpanded, setRcaExpanded] = useState<Record<string, boolean>>({});

  const [autoResolveLoading, setAutoResolveLoading] = useState<Record<string, boolean>>({});

  const scrollToElement = useCallback((id: string) => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const scrollToIncident = useCallback(
    (incidentId: string) => {
      if (!incidentId) return;
      scrollToElement(`incident-${incidentId}`);
    },
    [scrollToElement]
  );

  // Frontend-only canary monitor: ~10s of simulated metrics then auto-promote.
  useEffect(() => {
    if (!autopilotResult) return;

    setCanaryStatus('monitoring');
    setCanarySecondsRemaining(10);
    setCanaryMetrics({ errorRate: 0.006, latencyP95Ms: 180, driftScore: 0.18 });

    let tick = 0;
    const intervalId = window.setInterval(() => {
      tick += 1;
      const remaining = Math.max(0, 10 - tick);
      setCanarySecondsRemaining(remaining);

      setCanaryMetrics((prev) => {
        const base = prev ?? { errorRate: 0.006, latencyP95Ms: 180, driftScore: 0.18 };
        const jitter = () => Math.random() - 0.5;
        return {
          errorRate: Math.max(0.0005, Math.min(0.02, base.errorRate + jitter() * 0.001)),
          latencyP95Ms: Math.max(80, Math.min(450, base.latencyP95Ms + jitter() * 20)),
          driftScore: Math.max(0.0, Math.min(1.0, base.driftScore + jitter() * 0.03)),
        };
      });

      if (tick >= 10) {
        window.clearInterval(intervalId);
        setCanaryStatus('promoted');
        toast.success('Canary healthy — promoted to 100%');
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [autopilotResult]);

  const loadIncidents = useCallback(async () => {
    setIsLoadingIncidents(true);
    try {
      const res = await fetch('/api/modelops/incidents?status=open', {
        method: 'GET',
        headers: authHeaders
      });

      if (!res.ok) {
        const message = await readApiError(res);
        throw new Error(message || `Failed to load incidents (${res.status})`);
      }

      const data = (await res.json()) as Incident[];
      setIncidents(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load incidents');
      setIncidents([]);
    } finally {
      setIsLoadingIncidents(false);
    }
  }, [authHeaders]);

  const loadIncidentRca = useCallback(
    async (incidentId: string) => {
      if (!incidentId) return;

      setRcaLoading((prev) => ({ ...prev, [incidentId]: true }));
      try {
        const res = await fetch(`/api/modelops/incidents/${encodeURIComponent(incidentId)}/rca`, {
          method: 'GET',
          headers: authHeaders
        });

        if (!res.ok) {
          const message = await readApiError(res);
          throw new Error(message || `Failed to load RCA (${res.status})`);
        }

        const data = (await res.json()) as IncidentRCA;
        setRcaByIncidentId((prev) => ({ ...prev, [incidentId]: data }));
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load RCA');
      } finally {
        setRcaLoading((prev) => ({ ...prev, [incidentId]: false }));
      }
    },
    [authHeaders]
  );

  const seedDemoLineage = useCallback(
    async (feature: string) => {
      if (!feature.trim()) {
        toast.error('Missing feature name');
        return;
      }

      const res = await fetch('/api/knowledge/lineage/dev/seed', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ feature })
      });

      if (!res.ok) {
        const message = await readApiError(res);
        throw new Error(message || `Failed to seed lineage (${res.status})`);
      }
    },
    [authHeaders]
  );

  const autoResolveCheck = useCallback(
    async (incidentId: string) => {
      if (!incidentId) return;

      setAutoResolveLoading((prev) => ({ ...prev, [incidentId]: true }));
      try {
        const res = await fetch(`/api/modelops/incidents/${encodeURIComponent(incidentId)}/autoresolve-check`, {
          method: 'POST',
          headers: authHeaders
        });

        if (!res.ok) {
          const message = await readApiError(res);
          throw new Error(message || `Auto-resolve check failed (${res.status})`);
        }

        const data = (await res.json()) as any;
        const resolved = Boolean(data?.resolved);
        const reason = typeof data?.reason === 'string' ? data.reason : '';

        if (resolved) {
          toast.success('Incident auto-resolved');
        } else {
          toast.success(reason ? `No auto-resolve: ${reason}` : 'No auto-resolve');
        }

        await loadIncidents();
      } catch (e: any) {
        toast.error(e?.message || 'Auto-resolve check failed');
      } finally {
        setAutoResolveLoading((prev) => ({ ...prev, [incidentId]: false }));
      }
    },
    [authHeaders, loadIncidents]
  );

  const toggleRca = useCallback(
    async (incidentId: string) => {
      setRcaExpanded((prev) => ({ ...prev, [incidentId]: !prev[incidentId] }));

      const alreadyLoaded = Boolean(rcaByIncidentId[incidentId]);
      const isExpanding = !rcaExpanded[incidentId];
      if (isExpanding && !alreadyLoaded) {
        await loadIncidentRca(incidentId);
      }
    },
    [loadIncidentRca, rcaByIncidentId, rcaExpanded]
  );

  const renderRcaPanel = useCallback(
    (incidentId: string, rca: IncidentRCA) => {
      const stepName = String((rca.transformation_step as any)?.name ?? '');
      const codeRef = String((rca.transformation_step as any)?.code_ref ?? '');
      const datasetId = String((rca.dataset as any)?.dataset_id ?? (rca.dataset as any)?.id ?? '');
      const versionId = String((rca.dataset_version as any)?.version_id ?? (rca.dataset_version as any)?.id ?? '');

      const filters = Array.isArray(rca.filters) ? rca.filters : [];
      const upstream = Array.isArray(rca.upstream_columns) ? rca.upstream_columns : [];

      return (
        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="text-xs font-semibold text-gray-700">Lineage RCA</div>

          {!rca.lineage_found ? (
            <div className="mt-2 space-y-3">
              <div className="text-sm text-gray-600">No lineage found for feature: {rca.feature || 'unknown'}.</div>

              {import.meta.env.DEV && rca.feature && (
                <button
                  onClick={async () => {
                    try {
                      setRcaLoading((prev) => ({ ...prev, [incidentId]: true }));
                      await seedDemoLineage(String(rca.feature));
                      await loadIncidentRca(incidentId);
                      toast.success('Demo lineage seeded');
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to seed lineage');
                    } finally {
                      setRcaLoading((prev) => ({ ...prev, [incidentId]: false }));
                    }
                  }}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Seed demo lineage
                </button>
              )}
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <div className="text-xs text-gray-500">Feature</div>
                  <div className="text-sm font-medium text-gray-900">{rca.feature || 'unknown'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Transformation step</div>
                  <div className="text-sm font-medium text-gray-900">{stepName || 'unknown'}</div>
                  {codeRef && <div className="text-xs text-gray-600">{codeRef}</div>}
                </div>
                <div>
                  <div className="text-xs text-gray-500">Dataset</div>
                  <div className="text-sm font-medium text-gray-900">{datasetId || 'unknown'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Dataset version</div>
                  <div className="text-sm font-medium text-gray-900">{versionId || 'unknown'}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Filters</div>
                {filters.length === 0 ? (
                  <div className="text-sm text-gray-600">None</div>
                ) : (
                  <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
                    {filters.map((f, idx) => (
                      <li key={idx}>{String((f as any)?.expr ?? JSON.stringify(f))}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="text-xs text-gray-500">Upstream column changes</div>
                {upstream.length === 0 ? (
                  <div className="text-sm text-gray-600">No upstream column signals.</div>
                ) : (
                  <div className="mt-2 overflow-auto rounded-md border border-gray-200 bg-white">
                    <table className="min-w-full text-left text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 font-semibold text-gray-700">Column</th>
                          <th className="px-3 py-2 font-semibold text-gray-700">Type change</th>
                          <th className="px-3 py-2 font-semibold text-gray-700">Null Δ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upstream.map((c, idx) => {
                          const column = String((c as any)?.column ?? '');
                          const typeChanged = Boolean((c as any)?.type_changed);
                          const baselineType = (c as any)?.baseline_type;
                          const currentType = (c as any)?.current_type;
                          const delta = (c as any)?.null_rate_delta;
                          const deltaText =
                            typeof delta === 'number' && Number.isFinite(delta) ? delta.toFixed(3) : String(delta ?? '');

                          return (
                            <tr key={idx} className="border-t border-gray-100">
                              <td className="px-3 py-2 text-gray-900">{column || 'unknown'}</td>
                              <td className="px-3 py-2 text-gray-700">
                                {typeChanged ? (
                                  <span className="font-semibold text-amber-700">
                                    {String(baselineType ?? '?')} → {String(currentType ?? '?')}
                                  </span>
                                ) : (
                                  <span className="text-gray-600">No</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-gray-700">{deltaText || '0.000'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {Array.isArray(rca.warnings) && rca.warnings.length > 0 && (
            <div className="mt-3 text-xs text-amber-700">{rca.warnings.join(' ')}</div>
          )}
        </div>
      );
    },
    [loadIncidentRca, seedDemoLineage]
  );

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  const analyzeDrift = useCallback(async () => {
    if (!modelId.trim()) {
      toast.error('Enter a model UUID');
      return;
    }

    setIsAnalyzing(true);
    try {
      const reference_stats = await parseJsonOrThrow(referenceStatsText, 'reference_stats');
      const current_stats = await parseJsonOrThrow(currentStatsText, 'current_stats');

      const res = await fetch(`/api/modelops/models/${encodeURIComponent(modelId)}/drift/analyze`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ reference_stats, current_stats, context: {} })
      });

      if (!res.ok) {
          const message = await readApiError(res);
          throw new Error(message || `Drift analyze failed (${res.status})`);
      }

      const data = (await res.json()) as DriftAnalyzeResponse;
      setDriftResult(data);

      const incidentId = (data as any)?.drift_report?.incident?.id;
      if (typeof incidentId === 'string' && incidentId.trim()) {
        setLastIncidentIdFromDrift(incidentId);
      }

      toast.success('Drift report created');

      // Refresh incident list after analysis.
      await loadIncidents();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to analyze drift');
    } finally {
      setIsAnalyzing(false);
    }
  }, [authHeaders, currentStatsText, loadIncidents, modelId, referenceStatsText]);

  const simulateDrift = useCallback((level: 'normal' | 'more' = 'normal') => {
    setReferenceStatsText(safePrettyJson(sampleReferenceStats));
    setCurrentStatsText(safePrettyJson(level === 'more' ? sampleCurrentStatsMoreDrift : sampleCurrentStats));
    toast.success('Injected shifted distributions');
  }, []);

  const mockDeploy = useCallback(async () => {
    if (!modelId.trim()) {
      toast.error('Enter a model UUID');
      return;
    }

    setIsDeploying(true);
    try {
      const res = await fetch(`/api/deploy/models/${encodeURIComponent(modelId)}/endpoint-info`, {
        method: 'GET',
        headers: authHeaders
      });

      if (!res.ok) {
        const message = await readApiError(res);
        throw new Error(message || `Deploy info failed (${res.status})`);
      }

      const data = (await res.json()) as Record<string, unknown>;
      setDeployInfo(data);
      toast.success('Deployed (mock)');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to deploy (mock)');
    } finally {
      setIsDeploying(false);
    }
  }, [authHeaders, modelId]);

  const runAutopilot = useCallback(async () => {
    if (!modelId.trim()) {
      toast.error('Enter a model UUID');
      return;
    }

    setIsAutopilotRunning(true);
    try {
      const reference_stats = await parseJsonOrThrow(referenceStatsText, 'reference_stats');
      const current_stats = await parseJsonOrThrow(currentStatsText, 'current_stats');

      const res = await fetch(`/api/modelops/models/${encodeURIComponent(modelId)}/autopilot/run`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ reference_stats, current_stats, context: {}, simulate: true })
      });

      if (!res.ok) {
        const message = await readApiError(res);
        throw new Error(message || `Autopilot failed (${res.status})`);
      }

      const data = (await res.json()) as AutopilotRunResponse;
      setAutopilotResult(data);

      const incidentId = (data as any)?.incident?.incident_id;
      if (typeof incidentId === 'string' && incidentId.trim()) {
        setLastIncidentIdFromDrift(incidentId);
      }

      toast.success('Autopilot run complete');
      await loadIncidents();
    } catch (e: any) {
      toast.error(e?.message || 'Autopilot failed');
    } finally {
      setIsAutopilotRunning(false);
    }
  }, [authHeaders, currentStatsText, loadIncidents, modelId, referenceStatsText]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="ModelOps"
        description="Run drift analysis and review open incidents"
        icon={<Activity className="w-7 h-7 text-white" />}
      />

      <Card title="Drift analysis" description="Posts to /api/modelops/models/{model_id}/drift/analyze">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900">Model ID (UUID)</label>
            <input
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder="e.g. 0f9f8a3f-2d2b-4c61-9a9b-6f1f8f2b8c1e"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {!accessToken && (
              <p className="mt-2 text-sm text-amber-700">
                This page calls authenticated endpoints. Sign in if requests are rejected.
              </p>
            )}

            {import.meta.env.DEV && (
              <div className="mt-3">
                <button
                  onClick={() => void createTestModel()}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Create test model
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900">reference_stats (JSON)</label>
              <textarea
                value={referenceStatsText}
                onChange={(e) => setReferenceStatsText(e.target.value)}
                rows={10}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900">current_stats (JSON)</label>
              <textarea
                value={currentStatsText}
                onChange={(e) => setCurrentStatsText(e.target.value)}
                rows={10}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void mockDeploy()}
              disabled={isDeploying}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {isDeploying ? 'Deploying…' : 'Deploy (mock)'}
            </button>

            <button
              onClick={() => simulateDrift('more')}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Simulate drift
            </button>

            <button
              onClick={() => void analyzeDrift()}
              disabled={isAnalyzing}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {isAnalyzing ? 'Analyzing…' : 'Analyze drift'}
            </button>

            <button
              onClick={() => void runAutopilot()}
              disabled={isAutopilotRunning}
              className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {isAutopilotRunning ? 'Autopilot…' : 'Run Autopilot'}
            </button>
          </div>

          {deployInfo && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Deployment (mock)</h3>
              <pre className="w-full overflow-auto rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-900">
                {safePrettyJson(deployInfo)}
              </pre>
            </div>
          )}

          {driftResult && (
            <div id="drift-report">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Latest drift report</h3>
              <pre className="w-full overflow-auto rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-900">
                {safePrettyJson(driftResult.drift_report)}
              </pre>
            </div>
          )}

          {autopilotResult && (
            <div id="autopilot-run" className="space-y-3">
              <div className="rounded-md border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Postmortem</h3>
                    <div className="mt-1 text-xs text-gray-500">
                      Generated{' '}
                      {typeof (autopilotResult.postmortem as any)?.generated_at === 'string'
                        ? new Date((autopilotResult.postmortem as any).generated_at).toLocaleString()
                        : new Date().toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {typeof (autopilotResult.postmortem as any)?.incident_id === 'string' && (
                      <button
                        onClick={() => scrollToIncident((autopilotResult.postmortem as any).incident_id)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        View incident
                      </button>
                    )}
                    <button
                      onClick={() => scrollToElement('drift-report')}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      View drift report
                    </button>
                  </div>
                </div>

                {(() => {
                  const postmortem = (autopilotResult.postmortem ?? {}) as AutopilotPostmortem;
                  const remediation = Array.isArray(postmortem.remediation) ? postmortem.remediation : [];

                  return (
                    <div className="mt-4 space-y-4">
                      {postmortem.summary && <div className="text-sm text-gray-700">{postmortem.summary}</div>}

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                          <div className="text-xs text-gray-500">Incident</div>
                          <div className="mt-1 text-sm font-medium text-gray-900 break-all">
                            {postmortem.incident_id ?? '—'}
                          </div>
                        </div>
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                          <div className="text-xs text-gray-500">Model</div>
                          <div className="mt-1 text-sm font-medium text-gray-900 break-all">
                            {postmortem.model_id ?? autopilotResult.model_id}
                          </div>
                        </div>
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                          <div className="text-xs text-gray-500">Retrained model</div>
                          <div className="mt-1 text-sm font-medium text-gray-900 break-all">
                            {postmortem.retrained_model_id ?? '—'}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                        <div className="text-xs font-semibold text-gray-700">Root cause</div>
                        <div className="mt-1 text-sm text-gray-800">
                          <span className="font-medium">{postmortem.root_cause?.top_feature ?? 'Top feature'}</span>
                          {postmortem.root_cause?.narrative ? ` — ${postmortem.root_cause.narrative}` : ''}
                        </div>
                      </div>

                      {remediation.length > 0 && (
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                          <div className="text-xs font-semibold text-gray-700">Remediation</div>
                          <ul className="mt-2 list-disc pl-5 text-sm text-gray-800 space-y-1">
                            {remediation.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="rounded-md border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Canary monitor</h3>
                    <div className="mt-1 text-xs text-gray-500">
                      {canaryStatus === 'monitoring'
                        ? `Monitoring canary traffic (10%) — ${canarySecondsRemaining}s remaining`
                        : canaryStatus === 'promoted'
                          ? 'Promoted to 100% traffic'
                          : '—'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">~10 seconds (demo)</div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">Error rate</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {canaryMetrics ? `${(canaryMetrics.errorRate * 100).toFixed(2)}%` : '—'}
                    </div>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">p95 latency</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {canaryMetrics ? `${Math.round(canaryMetrics.latencyP95Ms)} ms` : '—'}
                    </div>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">Drift score</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {canaryMetrics ? canaryMetrics.driftScore.toFixed(2) : '—'}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-2 w-full rounded bg-gray-200 overflow-hidden">
                    <div
                      className="h-2 bg-gray-900"
                      style={{
                        width:
                          canaryStatus === 'idle'
                            ? '0%'
                            : canaryStatus === 'promoted'
                              ? '100%'
                              : `${Math.max(0, Math.min(100, ((10 - canarySecondsRemaining) / 10) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <details className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-gray-900">Raw Autopilot JSON</summary>
                <pre className="mt-2 w-full overflow-auto text-xs text-gray-900">{safePrettyJson(autopilotResult)}</pre>
              </details>
            </div>
          )}
        </div>
      </Card>

      <Card
        title="Open incidents"
        description="Fetched from /api/modelops/incidents?status=open"
        footer={
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">Showing {incidents.length} open incidents</div>
            <button
              onClick={() => void loadIncidents()}
              disabled={isLoadingIncidents}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {isLoadingIncidents ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        }
      >
        {incidents.length === 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertTriangle className="w-4 h-4 text-gray-400" />
              <span>
                No open incidents. Run drift analysis above to create one (incidents are scoped to the signed-in user).
              </span>
            </div>

            {lastIncidentIdFromDrift && (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <div className="text-xs text-gray-600">Last drift analysis created incident:</div>
                <div className="mt-1 text-sm font-medium text-gray-900 break-all">{lastIncidentIdFromDrift}</div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => void toggleRca(lastIncidentIdFromDrift)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    disabled={Boolean(rcaLoading[lastIncidentIdFromDrift])}
                  >
                    {rcaLoading[lastIncidentIdFromDrift]
                      ? 'Loading RCA…'
                      : rcaExpanded[lastIncidentIdFromDrift]
                        ? 'Hide RCA'
                        : 'View RCA'}
                  </button>
                </div>

                {rcaExpanded[lastIncidentIdFromDrift] &&
                  rcaByIncidentId[lastIncidentIdFromDrift] &&
                  renderRcaPanel(lastIncidentIdFromDrift, rcaByIncidentId[lastIncidentIdFromDrift] as IncidentRCA)}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map((i) => (
              <div id={`incident-${i.incident_id}`} key={i.incident_id} className="rounded-md border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{i.title}</div>
                    {i.summary && <div className="mt-1 text-sm text-gray-600">{i.summary}</div>}
                    <div className="mt-2 text-xs text-gray-500">
                      Model: {i.model_id} • Severity: {i.severity} • Status: {i.status} • Created:{' '}
                      {new Date(i.created_at).toLocaleString()}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => void toggleRca(i.incident_id)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        disabled={Boolean(rcaLoading[i.incident_id])}
                      >
                        {rcaLoading[i.incident_id]
                          ? 'Loading RCA…'
                          : rcaExpanded[i.incident_id]
                            ? 'Hide RCA'
                            : 'View RCA'}
                      </button>

                      <button
                        onClick={() => void autoResolveCheck(i.incident_id)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        disabled={Boolean(autoResolveLoading[i.incident_id])}
                      >
                        {autoResolveLoading[i.incident_id] ? 'Checking…' : 'Auto-resolve check'}
                      </button>
                    </div>

                    {rcaExpanded[i.incident_id] &&
                      rcaByIncidentId[i.incident_id] &&
                      renderRcaPanel(i.incident_id, rcaByIncidentId[i.incident_id] as IncidentRCA)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ModelOps;
