import { useMemo } from 'react';
import { Clock3, Sparkles, TrendingUp, Wand2 } from 'lucide-react';
import Button from '../../../components/common/Button';
import { pipelineTemplates } from '../../data/mockPlatformData';
import { useMLContext } from '../../../context/MLContext';

const templateTone: Record<string, string> = {
  automated: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
  guided: 'bg-indigo-500/15 text-indigo-200 border border-indigo-500/30',
  custom: 'bg-amber-500/15 text-amber-200 border border-amber-500/30',
};

const PipelineWorkspace = () => {
  const { models } = useMLContext();

  const trainingSnapshot = useMemo(() => {
    const totalTrained = models.length;
    const avgAccuracy =
      models.length > 0
        ? Math.round(
            (models.reduce((sum, model) => sum + (model.metrics?.accuracy ?? 0), 0) / models.length) * 100
          ) / 100
        : 0;

    const daysSaved = Math.max(12, Math.round(totalTrained * 2.4));

    return { totalTrained, avgAccuracy, daysSaved };
  }, [models]);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-300">Automation studio</p>
            <h1 className="text-2xl font-semibold text-slate-100">Pipeline templates for SMB launch speed</h1>
            <p className="max-w-3xl text-sm text-slate-400">
              Templates bundle feature engineering, model selection, and deployment patterns used across
              hundreds of similar companies. Tailor inputs, then hit deploy—our guardrails handle governance,
              scaling, and fallbacks.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" className="bg-slate-900/80 text-slate-200 hover:bg-slate-800/80">
              Import existing workflow
            </Button>
            <Button size="sm" className="bg-indigo-500/90 hover:bg-indigo-500">
              Build custom pipeline
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Models trained with templates</span>
            <TrendingUp className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">{trainingSnapshot.totalTrained}</p>
          <p className="mt-2 text-xs text-slate-400">Autotuned ensembles recommended by the system</p>
        </article>
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Average validation accuracy</span>
            <Sparkles className="h-4 w-4 text-indigo-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">
            {(trainingSnapshot.avgAccuracy * 100).toFixed(1)}%
          </p>
          <p className="mt-2 text-xs text-slate-400">With explainability report auto-generated</p>
        </article>
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Days of analyst time saved</span>
            <Wand2 className="h-4 w-4 text-amber-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">{trainingSnapshot.daysSaved}</p>
          <p className="mt-2 text-xs text-slate-400">Automation coverage compared to fully manual builds</p>
        </article>
      </div>

      <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Launch-ready templates</h2>
            <p className="text-sm text-slate-400">
              Pick a use case, confirm data sources, and hit deploy. Governance and MLOps steps are packaged
              for you.
            </p>
          </div>
          <Button variant="outline" className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-900/60">
            View automation roadmap
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {pipelineTemplates.map(template => (
            <article
              key={template.id}
              className="flex flex-col gap-4 rounded-xl border border-slate-800/60 bg-slate-900/70 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">{template.name}</h3>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    {template.problemType.toUpperCase()}
                  </p>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${templateTone[template.automationLevel]}`}>
                  {template.automationLevel === 'automated' && 'Hands-off'}
                  {template.automationLevel === 'guided' && 'Guided'}
                  {template.automationLevel === 'custom' && 'Configurable'}
                </span>
              </div>
              <p className="text-sm text-slate-300">{template.description}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-indigo-300" />
                  {template.durationMinutes} min runtime
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-600" />
                <span>{(template.successRate * 100).toFixed(0)}% success rate</span>
                <span className="h-1 w-1 rounded-full bg-slate-600" />
                <span>{template.version}</span>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <p className="text-xs text-slate-400">Launch-ready with guardrails applied</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="inline-flex items-center gap-2 bg-slate-900/80 text-slate-200 transition-colors hover:bg-slate-800/80"
                >
                  Configure
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PipelineWorkspace;

