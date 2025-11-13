import { Fragment, useMemo } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import CommandPalette from '../../components/CommandPalette/CommandPalette';
import { primaryNav, secondaryNav, type NavItem } from '../navigation/navConfig';
import Button from '../../components/common/Button';
import { Bell, HelpCircle, PlusCircle } from 'lucide-react';
import { useMLContext } from '../../context/MLContext';

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const badgeToneStyles: Record<NonNullable<NavItem['badge']>['tone'] | 'info', string> = {
  info: 'bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-500/30',
  success: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-200 ring-1 ring-inset ring-amber-500/30',
};

const ActiveIndicator = ({ isActive }: { isActive: boolean }) => (
  <span
    aria-hidden
    className={cn(
      'absolute inset-y-1.5 left-1 w-1 rounded-full transition-all duration-200',
      isActive ? 'bg-indigo-400' : 'bg-transparent'
    )}
  />
);

const NavLink = ({ item, isActive }: { item: NavItem; isActive: boolean }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      className={cn(
        'relative flex flex-col gap-1 rounded-lg px-3 py-2 transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80',
        isActive
          ? 'bg-slate-900/60 text-slate-100 shadow-md shadow-indigo-500/10'
          : 'text-slate-300 hover:bg-slate-900/30 hover:text-white'
      )}
    >
      <ActiveIndicator isActive={isActive} />
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200',
            isActive ? 'bg-indigo-500/15 text-indigo-300' : 'bg-slate-900/40 text-slate-400'
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <div className="flex-1">
          <p className="font-medium text-sm">{item.label}</p>
          {item.description ? (
            <p className="text-xs text-slate-400">{item.description}</p>
          ) : null}
        </div>
        {item.badge ? (
          <span
            className={cn(
              'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide',
              badgeToneStyles[item.badge.tone ?? 'info']
            )}
          >
            {item.badge.label}
          </span>
        ) : null}
      </div>
    </Link>
  );
};

const WorkspaceHeader = () => {
  const navigate = useNavigate();
  const { currentProject, models } = useMLContext();

  const activeModelCount = useMemo(
    () => models.filter(model => ['production', 'staging'].includes(model.status ?? '')).length,
    [models]
  );

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/70 px-6 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">Active project</p>
          <p className="text-base font-semibold text-slate-100">
            {currentProject?.name ?? 'Onboarding Workspace'}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {activeModelCount} live models
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            Guided automations enabled
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/app/pipelines')}
          className="hidden md:inline-flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          New pipeline
        </Button>
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-800/80 bg-slate-900/70 text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80"
          aria-label="Open help center"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-800/80 bg-slate-900/70 text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

export const AppShell = () => {
  const location = useLocation();

  const renderNavGroup = (groupItems: NavItem[]) =>
    groupItems.map(item => {
      const isActive =
        item.path === '/app'
          ? location.pathname === '/app'
          : location.pathname.startsWith(item.path);
      return <NavLink key={item.id} item={item} isActive={isActive} />;
    });

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden w-72 border-r border-slate-900/60 bg-slate-950/90 pb-6 pt-10 shadow-xl shadow-black/10 lg:flex lg:flex-col">
        <Link to="/app" className="flex items-center gap-3 px-6 pb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
            DF
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">DataFlowHub AI</p>
            <p className="text-xs text-slate-500">SMB Machine Learning Fabric</p>
          </div>
        </Link>
        <nav className="flex-1 space-y-8 overflow-y-auto px-4">
          {primaryNav.map(group => (
            <Fragment key={group.id}>
              <p className="px-2 text-[11px] uppercase tracking-[0.25em] text-slate-500">
                {group.title}
              </p>
              <div className="space-y-2">{renderNavGroup(group.items)}</div>
            </Fragment>
          ))}
        </nav>
        <div className="mt-auto space-y-2 px-4">
          <p className="px-2 text-[11px] uppercase tracking-[0.25em] text-slate-500">
            {secondaryNav.title}
          </p>
          <div className="space-y-2">{renderNavGroup(secondaryNav.items)}</div>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <WorkspaceHeader />
        <div className="relative flex flex-1 flex-col">
          <main className="flex-1 overflow-y-auto bg-slate-950 px-6 py-6">
            <div className="mx-auto max-w-6xl space-y-6">
              <Outlet />
            </div>
          </main>
          <CommandPalette />
        </div>
      </div>
    </div>
  );
};

export default AppShell;

