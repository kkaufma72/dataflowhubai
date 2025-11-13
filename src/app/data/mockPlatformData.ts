export type HealthStatus = 'excellent' | 'good' | 'watch' | 'at-risk';

export interface ProjectSummary {
  id: string;
  name: string;
  industry: string;
  owner: string;
  lastUpdated: string;
  status: HealthStatus;
  datasets: number;
  activeModels: number;
  objective: string;
  upcomingAction?: string;
}

export interface PipelineTemplate {
  id: string;
  name: string;
  problemType: 'classification' | 'regression' | 'forecasting' | 'nlp';
  description: string;
  durationMinutes: number;
  automationLevel: 'guided' | 'automated' | 'custom';
  successRate: number;
  version: string;
}

export interface DeploymentRecord {
  id: string;
  name: string;
  status: 'online' | 'degraded' | 'offline' | 'scheduled';
  environment: 'production' | 'staging' | 'preview';
  latencyMs: number;
  accuracy: number;
  drift: number;
  lastDeployedAt: string;
}

export interface MonitoringMetric {
  id: string;
  label: string;
  current: number;
  trend: 'up' | 'down' | 'steady';
  target: number;
  formatter?: (value: number) => string;
}

export interface AutomationRecipe {
  id: string;
  name: string;
  trigger: string;
  action: string;
  owner: string;
  isEnabled: boolean;
  slaMinutes: number;
}

export const projectSummaries: ProjectSummary[] = [
  {
    id: 'proj-retail-forecast',
    name: 'Retail Demand Forecasting',
    industry: 'Retail',
    owner: 'Alex Johnson',
    lastUpdated: '2025-01-20T14:10:00Z',
    status: 'excellent',
    datasets: 8,
    activeModels: 3,
    objective: 'Monthly demand forecasting per store cluster',
    upcomingAction: 'Rollout revised promotion uplift features by Friday',
  },
  {
    id: 'proj-finance-risk',
    name: 'SMB Credit Risk Insights',
    industry: 'Financial Services',
    owner: 'Priya Patel',
    lastUpdated: '2025-01-22T09:45:00Z',
    status: 'good',
    datasets: 5,
    activeModels: 2,
    objective: 'Automate credit score recalibration for loan renewals',
  },
  {
    id: 'proj-saas-churn',
    name: 'SaaS Churn Prediction',
    industry: 'Software',
    owner: 'Daniel Lee',
    lastUpdated: '2025-01-18T17:30:00Z',
    status: 'watch',
    datasets: 6,
    activeModels: 1,
    objective: 'Predict churn probability pre-renewal with feature tier uplift',
    upcomingAction: 'Investigate drop in onboarding completion for tier Plus',
  },
];

export const pipelineTemplates: PipelineTemplate[] = [
  {
    id: 'template-quick-demand',
    name: 'Quick Demand Forecast',
    problemType: 'forecasting',
    description:
      'Auto-detects seasonal patterns, enriches with weather and promotions, deploys in under 25 minutes.',
    durationMinutes: 25,
    automationLevel: 'automated',
    successRate: 0.93,
    version: 'v3.4',
  },
  {
    id: 'template-churn-sm',
    name: 'Customer Churn Classifier',
    problemType: 'classification',
    description:
      'Feature templates for lifecycle, product usage, and support signals. Includes explainability pack.',
    durationMinutes: 32,
    automationLevel: 'guided',
    successRate: 0.9,
    version: 'v2.8',
  },
  {
    id: 'template-cashflow',
    name: 'Cashflow Health Forecast',
    problemType: 'regression',
    description:
      'Predicts weekly cashflow with automated anomaly detection and bank feed ingestion pre-built.',
    durationMinutes: 41,
    automationLevel: 'automated',
    successRate: 0.88,
    version: 'v1.2',
  },
  {
    id: 'template-nlp-insights',
    name: 'Support Ticket Insights',
    problemType: 'nlp',
    description:
      'Summarizes tickets, tags sentiment, and routes to playbooks. Includes Zendesk connector.',
    durationMinutes: 35,
    automationLevel: 'custom',
    successRate: 0.86,
    version: 'v2.1',
  },
];

export const deploymentRecords: DeploymentRecord[] = [
  {
    id: 'deploy-prd-demand',
    name: 'Store Demand Forecast v3',
    status: 'online',
    environment: 'production',
    latencyMs: 215,
    accuracy: 0.91,
    drift: 0.04,
    lastDeployedAt: '2025-01-15T10:22:00Z',
  },
  {
    id: 'deploy-prd-churn',
    name: 'Churn Risk Scorer v2',
    status: 'degraded',
    environment: 'production',
    latencyMs: 420,
    accuracy: 0.87,
    drift: 0.09,
    lastDeployedAt: '2025-01-10T08:15:00Z',
  },
  {
    id: 'deploy-stg-cashflow',
    name: 'Cashflow Forecast v1',
    status: 'scheduled',
    environment: 'staging',
    latencyMs: 180,
    accuracy: 0.89,
    drift: 0.02,
    lastDeployedAt: '2025-01-19T19:40:00Z',
  },
  {
    id: 'deploy-prv-support',
    name: 'Support Insights v2',
    status: 'online',
    environment: 'preview',
    latencyMs: 265,
    accuracy: 0.82,
    drift: 0.06,
    lastDeployedAt: '2025-01-21T13:05:00Z',
  },
];

export const monitoringMetrics: MonitoringMetric[] = [
  {
    id: 'metric-accuracy',
    label: 'Prediction accuracy',
    current: 0.91,
    trend: 'up',
    target: 0.88,
    formatter: value => `${(value * 100).toFixed(1)}%`,
  },
  {
    id: 'metric-latency',
    label: 'Median latency',
    current: 245,
    trend: 'steady',
    target: 260,
    formatter: value => `${Math.round(value)}ms`,
  },
  {
    id: 'metric-drift',
    label: 'Population drift',
    current: 0.05,
    trend: 'down',
    target: 0.07,
    formatter: value => `${(value * 100).toFixed(1)}%`,
  },
  {
    id: 'metric-cost',
    label: 'Monthly spend',
    current: 740,
    trend: 'down',
    target: 850,
    formatter: value => `$${value.toLocaleString()}`,
  },
];

export const automationRecipes: AutomationRecipe[] = [
  {
    id: 'auto-retrain',
    name: 'Auto-retrain on accuracy drop',
    trigger: 'Accuracy below 85% for 3 consecutive hours',
    action: 'Launch retraining job with latest labeled data slice',
    owner: 'Alex Johnson',
    isEnabled: true,
    slaMinutes: 30,
  },
  {
    id: 'auto-notify',
    name: 'Customer health alerts',
    trigger: 'Churn probability above 65% for high-value account',
    action: 'Create HubSpot task & send Slack alert to success lead',
    owner: 'Priya Patel',
    isEnabled: true,
    slaMinutes: 10,
  },
  {
    id: 'auto-batch',
    name: 'Nightly batch scoring',
    trigger: 'Every weekday at 11pm',
    action: 'Score active opportunities and refresh dashboards',
    owner: 'Daniel Lee',
    isEnabled: false,
    slaMinutes: 60,
  },
];

