import { type LucideIcon, LayoutDashboard, GitBranch, Rocket, ActivitySquare, Database, LineChart, Workflow, Sparkles, Settings } from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  path: string;
  badge?: {
    label: string;
    tone?: 'info' | 'success' | 'warning';
  };
};

export type NavGroup = {
  id: string;
  title: string;
  items: NavItem[];
};

export const primaryNav: NavGroup[] = [
  {
    id: 'workspace',
    title: 'Workspace',
    items: [
      {
        id: 'overview',
        label: 'Overview',
        description: 'Business health snapshot',
        icon: LayoutDashboard,
        path: '/app',
      },
      {
        id: 'pipelines',
        label: 'Pipelines',
        description: 'Automated ML workflows',
        icon: GitBranch,
        path: '/app/pipelines',
      },
      {
        id: 'deployments',
        label: 'Deployments',
        description: 'Model delivery & runtime',
        icon: Rocket,
        path: '/app/deployments',
      },
      {
        id: 'monitoring',
        label: 'Monitoring',
        description: 'Model performance & drift',
        icon: ActivitySquare,
        path: '/app/monitoring',
      },
    ],
  },
  {
    id: 'assets',
    title: 'Data & Intelligence',
    items: [
      {
        id: 'data',
        label: 'Datasets',
        description: 'Catalog & quality guardrails',
        icon: Database,
        path: '/app/data',
      },
      {
        id: 'insights',
        label: 'Insights',
        description: 'AI-guided analytics',
        icon: LineChart,
        path: '/app/insights',
      },
      {
        id: 'automations',
        label: 'Automations',
        description: 'Production workflows',
        icon: Workflow,
        path: '/app/automations',
        badge: { label: 'Beta', tone: 'warning' },
      },
    ],
  },
];

export const secondaryNav: NavGroup = {
  id: 'system',
  title: 'Organization',
  items: [
    {
      id: 'assist',
      label: 'AI Copilot',
      description: 'Get expert guidance',
      icon: Sparkles,
      path: '/app/copilot',
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Billing & governance',
      icon: Settings,
      path: '/app/settings',
    },
  ],
};

