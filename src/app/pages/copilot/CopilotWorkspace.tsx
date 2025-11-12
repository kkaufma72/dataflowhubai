import { Suspense, lazy } from 'react';
import Button from '../../../components/common/Button';
import { Sparkles, BookOpen, MessageCircle } from 'lucide-react';

const EnhancedAIChat = lazy(() => import('../../../components/ai/EnhancedAIChat'));

const CopilotWorkspace = () => {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-purple-300">AI copilot</p>
            <h1 className="text-2xl font-semibold text-slate-100">Ask anything about your ML workspace</h1>
            <p className="max-w-3xl text-sm text-slate-400">
              The copilot knows your datasets, models, and automations. Ask for summaries, recommended actions,
              or help building a new experiment—then convert its guidance into workflows instantly.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" className="bg-slate-900/80 text-slate-200 hover:bg-slate-800/80">
              View prompt library
            </Button>
            <Button size="sm" className="bg-purple-500/90 hover:bg-purple-500">
              Summarize workspace
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Workspace awareness</span>
            <MessageCircle className="h-4 w-4 text-purple-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">Full</p>
          <p className="mt-2 text-xs text-slate-400">Datasets, models, pipelines, and deployments</p>
        </article>
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Playbook mapping</span>
            <Sparkles className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">Auto</p>
          <p className="mt-2 text-xs text-slate-400">Convert responses to automations instantly</p>
        </article>
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Guided learning</span>
            <BookOpen className="h-4 w-4 text-indigo-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">18</p>
          <p className="mt-2 text-xs text-slate-400">Interactive playbooks for your team</p>
        </article>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800/60 bg-white shadow-2xl">
        <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading AI copilot…</div>}>
          <EnhancedAIChat />
        </Suspense>
      </div>
    </section>
  );
};

export default CopilotWorkspace;

