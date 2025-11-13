import { useMemo, useState } from 'react';
import { ChevronRight, ExternalLink, ShieldCheck, Users, TrendingUp, Clock3, Sparkles, Wand2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../../components/common/Button';
import { projectSummaries, pipelineTemplates, type PipelineTemplate } from '../../data/mockPlatformData';
import { useMLContext } from '../../../context/MLContext';

const templateTone: Record<PipelineTemplate['automationLevel'], string> = {
  automated: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30',
  guided: 'bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-500/30',
  custom: 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/30',
};
const statusStyles: Record<string, string> = {
  excellent: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20',
  good: 'bg-indigo-500/10 text-indigo-200 ring-1 ring-indigo-400/20',
  watch: 'bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/20',
  'at-risk': 'bg-rose-500/10 text-rose-200 ring-1 ring-rose-400/20',
};

const formatRelative = (dateIso: string) => {
  const diffInMinutes = Math.max(1, Math.round((Date.now() - new Date(dateIso).getTime()) / 60000));
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.round(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr ago`;
  const diffInDays = Math.round(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  const diffInWeeks = Math.round(diffInDays / 7);
  return `${diffInWeeks} wk${diffInWeeks > 1 ? 's' : ''} ago`;
};

const ProjectsOverview = () => {
  const navigate = useNavigate();
  const { datasets, models, setCurrentProject } = useMLContext();
  const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunchTemplate = async (template: PipelineTemplate) => {
    try {
      setIsLaunching(true);
      const projectId = `template-${template.id}-${Date.now()}`;
      setCurrentProject({
        id: projectId,
        name: template.name,
        description: template.description,
        createdAt: new Date().toISOString(),
      });
      toast.success(`Project "${template.name}" ready to configure`, { duration: 3500 });
      setTemplateModalOpen(false);
      navigate('/app/pipelines');
    } catch (error) {
      console.error('Failed to launch template project', error);
      toast.error('Could not start project. Please try again.');
    } finally {
      setIsLaunching(false);
    }
  };

  const platformSnapshot = useMemo(() => {
    const totalDatasets = datasets.length;
    const totalModels = models.length;
    const productionModels = models.filter(model => model.status === 'production').length;

    return {
      totalDatasets,
      totalModels,
      productionModels,
      automationCoverage: Math.min(100, Math.round((productionModels / Math.max(totalModels, 1)) * 82 + 18)),
    };
  }, [datasets.length, models]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 shadow-md shadow-black/20 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Projects workspace</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Curated use cases for small and mid-sized teams. Each workspace includes data guardrails,
            AutoML templates, and deployment guides your analysts can launch without MLOps overhead.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="bg-slate-900/80 text-slate-200 hover:bg-slate-800/80"
            onClick={() => {
              toast.success('Launching guided onboarding');
              navigate('/app/product-tour');
            }}
          >
            Launch guided onboarding
          </Button>
          <Button
            size="sm"
            onClick={() => setTemplateModalOpen(true)}
            className="bg-indigo-500/90 hover:bg-indigo-500"
          >
            Start project from template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-300">Datasets on platform</h2>
            <Users className="h-4 w-4 text-indigo-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">
            {platformSnapshot.totalDatasets.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-slate-400">Ready with validation policies applied</p>
        </article>
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-300">Models in workspace</h2>
            <TrendingUp className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">
            {platformSnapshot.totalModels.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {platformSnapshot.productionModels} ready for business consumption
          </p>
        </article>
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-300">Automation coverage</h2>
            <ShieldCheck className="h-4 w-4 text-sky-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">{platformSnapshot.automationCoverage}%</p>
          <p className="mt-2 text-xs text-slate-400">Critical workflows protected with playbooks</p>
        </article>
        <article className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-300">Enablement score</h2>
            <ExternalLink className="h-4 w-4 text-amber-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-50">92</p>
          <p className="mt-2 text-xs text-slate-400">Team adoption index across projects</p>
        </article>
      </div>

      <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Active projects</h2>
            <p className="text-sm text-slate-400">
              Each project ships with curated notebook examples, recommended datasets, and automated QA.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-900/60"
            onClick={() => {
              toast('Backlog view coming next — opening pipeline workspace for now.', { icon: '🗂️' });
              navigate('/app/pipelines');
            }}
          >
            View project backlog
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {projectSummaries.map(project => (
            <article
              key={project.id}
              className="group flex flex-col gap-4 rounded-xl border border-slate-800/60 bg-slate-900/70 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">{project.name}</h3>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{project.industry}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${statusStyles[project.status]}`}
                >
                  {project.status === 'excellent' && 'Green'}
                  {project.status === 'good' && 'Stable'}
                  {project.status === 'watch' && 'Watch'}
                  {project.status === 'at-risk' && 'At Risk'}
                </span>
              </div>
              <p className="text-sm text-slate-300">{project.objective}</p>
              {project.upcomingAction ? (
                <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs text-indigo-200">
                  <p className="font-medium uppercase tracking-[0.2em] text-indigo-300">Next action</p>
                  <p className="mt-1 text-indigo-100">{project.upcomingAction}</p>
                </div>
              ) : null}
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{project.datasets} datasets</span>
                <span className="h-1 w-1 rounded-full bg-slate-600" />
                <span>{project.activeModels} active models</span>
                <span className="h-1 w-1 rounded-full bg-slate-600" />
                <span>Updated {formatRelative(project.lastUpdated)}</span>
              </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="text-xs text-slate-400">Owner · {project.owner}</div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="inline-flex items-center gap-2 bg-slate-900/80 text-slate-200 transition-colors hover:bg-slate-800/80"
                    onClick={() => {
                      setCurrentProject({
                        id: project.id,
                        name: project.name,
                        description: project.description,
                        createdAt: project.lastUpdated,
                      });
                      toast.success(`Opening ${project.name}`);
                      navigate('/app/data');
                    }}
                  >
                    Open workspace
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
            </article>
          ))}
        </div>
      </div>
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur">
          <div className="relative w-full max-w-5xl rounded-3xl border border-slate-800/70 bg-slate-950/95 shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Choose a launch template</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Each template configures datasets, pipelines, and guardrails for a targeted use case.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="rounded-full border border-slate-800/80 p-2 text-slate-400 transition hover:text-white"
                aria-label="Close template selection"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {pipelineTemplates.map(template => (
                  <div
                    key={template.id}
                    className="flex h-full flex-col justify-between rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                            {template.problemType.toUpperCase()}
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-slate-100">{template.name}</h3>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${templateTone[template.automationLevel]}`}>
                          {template.automationLevel === 'automated' && 'Hands-off'}
                          {template.automationLevel === 'guided' && 'Guided'}
                          {template.automationLevel === 'custom' && 'Configurable'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">{template.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-4 w-4 text-indigo-300" />
                          {template.durationMinutes} min build
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="h-4 w-4 text-emerald-300" />
                          {(template.successRate * 100).toFixed(0)}% success
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Wand2 className="h-4 w-4 text-amber-300" />
                          {template.version}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="mt-4 inline-flex items-center justify-center bg-indigo-500/90 hover:bg-indigo-500"
                      onClick={() => handleLaunchTemplate(template)}
                      isLoading={isLaunching}
                      disabled={isLaunching}
                    >
                      Use template
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProjectsOverview;

