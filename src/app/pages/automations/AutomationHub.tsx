import Button from '../../../components/common/Button';
import { automationRecipes } from '../../data/mockPlatformData';
import { Bolt, CheckCircle2, PauseCircle, PlayCircle, Workflow } from 'lucide-react';

const AutomationHub = () => {
  const enabledCount = automationRecipes.filter(recipe => recipe.isEnabled).length;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-300">Automation studio</p>
            <h1 className="text-2xl font-semibold text-slate-100">Production playbooks & AI guardrails</h1>
            <p className="max-w-3xl text-sm text-slate-400">
              Encode the expertise of your data team into reusable automations. Trigger retraining, route alerts,
              and power business workflows with zero DevOps scripting required.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" className="bg-slate-900/80 text-slate-200 hover:bg-slate-800/80">
              Import from template
            </Button>
            <Button size="sm" className="bg-indigo-500/90 hover:bg-indigo-500">
              Create automation
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Automations live</span>
            <PlayCircle className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">{enabledCount}</p>
          <p className="mt-2 text-xs text-slate-400">Guardrails running across projects</p>
        </article>
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Playbooks available</span>
            <Workflow className="h-4 w-4 text-indigo-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">{automationRecipes.length}</p>
          <p className="mt-2 text-xs text-slate-400">Customize triggers, responses, and notifications</p>
        </article>
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>SLA adherence</span>
            <CheckCircle2 className="h-4 w-4 text-sky-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">97%</p>
          <p className="mt-2 text-xs text-slate-400">Automation responses meeting SLA target</p>
        </article>
      </div>

      <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Automation recipes</h2>
            <p className="text-sm text-slate-400">
              Each recipe bundles triggers, actions, human approvals, and post-action metrics in one place.
            </p>
          </div>
          <Button variant="outline" className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-900/60">
            View audit log
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {automationRecipes.map(recipe => (
            <article
              key={recipe.id}
              className="flex flex-col gap-4 rounded-xl border border-slate-800/60 bg-slate-900/70 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">{recipe.name}</h3>
                  <p className="text-xs text-slate-500">Owned by {recipe.owner}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide ${
                    recipe.isEnabled ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/20' : 'bg-slate-500/15 text-slate-200 ring-1 ring-slate-500/20'
                  }`}
                >
                  {recipe.isEnabled ? (
                    <>
                      <PlayCircle className="h-4 w-4" />
                      Live
                    </>
                  ) : (
                    <>
                      <PauseCircle className="h-4 w-4" />
                      Paused
                    </>
                  )}
                </span>
              </div>
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4 text-sm text-slate-200">
                <p className="font-medium uppercase tracking-[0.2em] text-indigo-300">Trigger</p>
                <p className="mt-2 text-slate-100">{recipe.trigger}</p>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-slate-200">
                <p className="font-medium uppercase tracking-[0.2em] text-emerald-300">Action</p>
                <p className="mt-2 text-slate-100">{recipe.action}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Bolt className="h-4 w-4 text-amber-300" />
                  SLA · {recipe.slaMinutes} min
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-slate-900/80 text-slate-200 hover:bg-slate-800/80"
                >
                  Open playbook
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AutomationHub;

