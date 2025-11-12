import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { deploymentRecords } from '../../data/mockPlatformData';
import Button from '../../../components/common/Button';
import { CloudLightning, PlugZap, Server, ShieldAlert, Rocket, CheckCircle2 } from 'lucide-react';

const statusTone: Record<string, string> = {
  online: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/20',
  degraded: 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/20',
  offline: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/20',
  scheduled: 'bg-slate-500/15 text-slate-200 ring-1 ring-slate-500/20',
};

const environmentTone: Record<string, string> = {
  production: 'text-emerald-300',
  staging: 'text-indigo-300',
  preview: 'text-slate-300',
};

const formatNumber = (value: number, unit: string) => `${value}${unit}`;

const DeploymentsOverview = () => {
  const navigate = useNavigate();
  const [isLaunching, setLaunching] = useState(false);
  const [showLaunchSummary, setShowLaunchSummary] = useState(false);
  const activeIncidents = deploymentRecords.filter(deploy => deploy.status !== 'online').length;

  const handleLaunchDeployment = () => {
    if (isLaunching) return;

    setLaunching(true);
    toast.loading('Preparing deployment...', { id: 'deployment-launch' });

    setTimeout(() => {
      toast.success('Deployment pipeline queued', { id: 'deployment-launch', duration: 3500 });
      setLaunching(false);
      setShowLaunchSummary(true);
      navigate('/app/deploy');
    }, 1200);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">Runtime control</p>
            <h1 className="text-2xl font-semibold text-slate-100">Deployment health & release governance</h1>
            <p className="max-w-3xl text-sm text-slate-400">
              Ship confidence updates fast with built-in blue/green, canary, and automatic rollback policies.
              SMB teams get enterprise-grade MLOps guardrails without infrastructure chaos.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" className="bg-slate-900/80 text-slate-200 hover:bg-slate-800/80">
              View release calendar
            </Button>
            <Button
              size="sm"
              className="inline-flex items-center gap-2 bg-emerald-500/90 hover:bg-emerald-500"
              onClick={handleLaunchDeployment}
              isLoading={isLaunching}
            >
              <Rocket className="h-4 w-4" />
              Launch deployment
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Active runtimes</span>
            <Server className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">{deploymentRecords.length}</p>
          <p className="mt-2 text-xs text-slate-400">Across production, staging, and preview tiers</p>
        </article>
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Incidents requiring review</span>
            <ShieldAlert className="h-4 w-4 text-amber-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">{activeIncidents}</p>
          <p className="mt-2 text-xs text-slate-400">Our playbooks provide the next best action</p>
        </article>
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Average latency (p50)</span>
            <PlugZap className="h-4 w-4 text-sky-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">
            {Math.round(
              deploymentRecords.reduce((sum, record) => sum + record.latencyMs, 0) / deploymentRecords.length
            )}
            ms
          </p>
          <p className="mt-2 text-xs text-slate-400">Real-time scoring with autoscaling enabled</p>
        </article>
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Average accuracy</span>
            <CloudLightning className="h-4 w-4 text-indigo-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">
            {((deploymentRecords.reduce((sum, record) => sum + record.accuracy, 0) / deploymentRecords.length) * 100).toFixed(1)}%
          </p>
          <p className="mt-2 text-xs text-slate-400">Live telemetry aggregated every 15 minutes</p>
        </article>
      </div>

      <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Deployment activity</h2>
            <p className="text-sm text-slate-400">Track status, drift, and guardrail compliance in one view.</p>
          </div>
          <Button variant="outline" className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-900/60">
            Export compliance report
          </Button>
        </div>
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/70">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Deployment</th>
                <th className="px-6 py-4 font-medium">Environment</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Latency</th>
                <th className="px-6 py-4 font-medium">Accuracy</th>
                <th className="px-6 py-4 font-medium">Drift</th>
                <th className="px-6 py-4 font-medium">Last deployed</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {deploymentRecords.map(record => (
                <tr
                  key={record.id}
                  className="border-t border-slate-800/60 bg-slate-950/40 transition-colors hover:bg-slate-900/70"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-100">{record.name}</p>
                    <p className="text-xs text-slate-500">ID · {record.id}</p>
                  </td>
                  <td className={`px-6 py-4 text-xs font-medium ${environmentTone[record.environment]}`}>
                    {record.environment.toUpperCase()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide ${statusTone[record.status]}`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-200">{formatNumber(record.latencyMs, 'ms')}</td>
                  <td className="px-6 py-4 text-slate-200">{(record.accuracy * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4 text-slate-200">{(record.drift * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(record.lastDeployedAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-slate-900/80 text-slate-200 hover:bg-slate-800/80"
                    >
                      View runbook
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showLaunchSummary && (
        <div className="rounded-2xl border border-emerald-600/40 bg-emerald-500/5 p-5 text-sm text-emerald-100">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-emerald-200 font-semibold">Deployment workflow queued</p>
              <p className="mt-1 text-emerald-100/80">
                We routed you to the deployment runbook so you can monitor rollout progress, configure canary thresholds,
                and promote to production when validation passes.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default DeploymentsOverview;

