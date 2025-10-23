import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Dataset, Model } from '../types';

interface DemoContextType {
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  demoDatasets: Dataset[];
  demoModels: Model[];
  demoProgress: number;
  completeDemoStep: (step: string) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const DEMO_DATASETS: Dataset[] = [
  {
    id: 'demo-dataset-1',
    name: 'Sample Sales Data',
    description: 'Historical sales data with customer demographics',
    size: 2500000,
    totalRows: 5000,
    columns: [
      { name: 'customer_id', type: 'string', description: 'Unique customer identifier' },
      { name: 'age', type: 'number', description: 'Customer age' },
      { name: 'income', type: 'number', description: 'Annual income' },
      { name: 'purchase_amount', type: 'number', description: 'Total purchase amount' },
      { name: 'region', type: 'string', description: 'Geographic region' },
    ],
    uploadedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    uploadedBy: 'demo-user',
    tags: ['sales', 'demo', 'regression'],
    quality: {
      missingValues: 2,
      duplicates: 0,
      outliers: 15,
      score: 95,
    },
  },
  {
    id: 'demo-dataset-2',
    name: 'Customer Churn Dataset',
    description: 'Customer behavior and churn prediction data',
    size: 1800000,
    totalRows: 3500,
    columns: [
      { name: 'customer_id', type: 'string', description: 'Unique customer identifier' },
      { name: 'tenure', type: 'number', description: 'Months as customer' },
      { name: 'monthly_charges', type: 'number', description: 'Monthly charges' },
      { name: 'total_charges', type: 'number', description: 'Total charges' },
      { name: 'churn', type: 'boolean', description: 'Whether customer churned' },
    ],
    uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    uploadedBy: 'demo-user',
    tags: ['churn', 'demo', 'classification'],
    quality: {
      missingValues: 5,
      duplicates: 1,
      outliers: 8,
      score: 92,
    },
  },
];

const DEMO_MODELS: Model[] = [
  {
    id: 'demo-model-1',
    name: 'Sales Predictor',
    type: 'regression',
    algorithm: 'Random Forest',
    status: 'trained',
    datasetId: 'demo-dataset-1',
    metrics: {
      accuracy: 0.89,
      precision: 0.87,
      recall: 0.85,
      f1Score: 0.86,
      mse: 0.12,
      r2Score: 0.88,
    },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    trainedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    config: {
      testSize: 0.2,
      randomState: 42,
      crossValidation: true,
      folds: 5,
    },
  },
];

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    // Check if user is in demo mode
    const demoMode = localStorage.getItem('demoMode') === 'true';
    setIsDemoMode(demoMode);

    // Load completed demo steps
    const steps = localStorage.getItem('demoCompletedSteps');
    if (steps) {
      const parsed = JSON.parse(steps);
      setCompletedSteps(parsed);
      setDemoProgress((parsed.length / 5) * 100); // 5 total demo steps
    }
  }, []);

  const enterDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('demoStartTime', new Date().toISOString());

    // Initialize demo data in localStorage
    localStorage.setItem('demoDatasets', JSON.stringify(DEMO_DATASETS));
    localStorage.setItem('demoModels', JSON.stringify(DEMO_MODELS));
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    localStorage.removeItem('demoMode');
    localStorage.removeItem('demoStartTime');
    localStorage.removeItem('demoDatasets');
    localStorage.removeItem('demoModels');
    localStorage.removeItem('demoCompletedSteps');
    setCompletedSteps([]);
    setDemoProgress(0);
  };

  const completeDemoStep = (step: string) => {
    if (completedSteps.includes(step)) return;

    const newSteps = [...completedSteps, step];
    setCompletedSteps(newSteps);
    localStorage.setItem('demoCompletedSteps', JSON.stringify(newSteps));
    setDemoProgress((newSteps.length / 5) * 100);
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        enterDemoMode,
        exitDemoMode,
        demoDatasets: DEMO_DATASETS,
        demoModels: DEMO_MODELS,
        demoProgress,
        completeDemoStep,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within DemoProvider');
  }
  return context;
};
