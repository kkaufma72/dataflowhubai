import { monitoringMetrics } from '../../data/mockPlatformData';
import Button from '../../../components/common/Button';
import { Activity, BarChart3, Radar, RefreshCw } from 'lucide-react';

const trendTone: Record<string, string> = {
  up: 'text-emerald-300',
  down: 'text-amber-300',
  steady: 'text-slate-300',
};

const MonitoringOverview = () => {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Observability control</p>
            <h1 className="text-2xl font-semibold text-slate-100">Real-time monitoring & drift defense</h1>
            <p className="max-w-3xl text-sm text-slate-400">
              Track performance, drift, and business KPIs with ready dashboards. Automations trigger retraining,
              stakeholder alerts, and business workflows when thresholds are hit.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" className="bg-slate-900/80 text-slate-200 hover:bg-slate-800/80">
              Configure alerts
            </Button>
            <Button size="sm" className="bg-sky-500/90 hover:bg-sky-500">
              Add metric board
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Monitoring cadence</span>
            <RefreshCw className="h-4 w-4 text-indigo-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">15 min</p>
          <p className="mt-2 text-xs text-slate-400">Real-time metrics ingestion window</p>
        </article>
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Alert policies</span>
            <Radar className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">18</p>
          <p className="mt-2 text-xs text-slate-400">Active guardrails across deployments</p>
        </article>
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Incidents auto-resolved</span>
            <Activity className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">12</p>
          <p className="mt-2 text-xs text-slate-400">Last 30 days via automation playbooks</p>
        </article>
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Executive health score</span>
            <BarChart3 className="h-4 w-4 text-amber-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">88</p>
          <p className="mt-2 text-xs text-slate-400">Business-aligned KPI coverage</p>
        </article>
      </div>

      <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Key production metrics</h2>
            <p className="text-sm text-slate-400">
              Thresholds tuned for SMB coverage with a mix of accuracy, latency, drift, and cost KPIs.
            </p>
          </div>
          <Button variant="outline" className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-900/60">
            Download monitoring report
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {monitoringMetrics.map(metric => {
            const value = metric.current;
            const target = metric.target;
            const percentage =
              metric.label.includes('latency') || metric.label.includes('spend')
                ? Math.min(100, Math.round((target / Math.max(value, 1)) * 100))
                : Math.min(120, Math.round((value / Math.max(target, 1e-6)) * 100));
            return (
              <article key={metric.id} className="rounded-xl border border-slate-800/60 bg-slate-900/70 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">{metric.label}</h3>
                    <p className="text-xs text-slate-500">
                      Target {metric.formatter ? metric.formatter(target) : target}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold ${trendTone[metric.trend]}`}>
                    {metric.trend === 'up' && 'Improving'}
                    {metric.trend === 'down' && 'Decreasing'}
                    {metric.trend === 'steady' && 'Stable'}
                  </p>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <p className="text-2xl font-semibold text-slate-50">
                    {metric.formatter ? metric.formatter(value) : value}
                  </p>
                  <span className="text-xs text-slate-500">
                    {metric.trend === 'up' ? '▲' : metric.trend === 'down' ? '▼' : '■'}
                  </span>
                </div>
                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-sky-400"
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  {(Math.min(100, percentage)).toFixed(0)}% towards target guardrail
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MonitoringOverview;

