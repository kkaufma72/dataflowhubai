import React from 'react';
import { Card } from '../common/Card';
import { Layers, BarChart2, BrainCircuit, Network, GitBranch } from 'lucide-react';

export interface Algorithm {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  type: 'classification' | 'regression' | 'both';
  hyperparameters: {
    name: string;
    type: 'number' | 'select' | 'boolean';
    label: string;
    default: any;
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
  }[];
}

export const algorithms: Algorithm[] = [
  {
    id: 'random_forest',
    name: 'Random Forest',
    description: 'Ensemble learning method using multiple decision trees',
    icon: Layers,
    type: 'both',
    hyperparameters: [
      {
        name: 'n_estimators',
        type: 'number',
        label: 'Number of Trees',
        default: 100,
        min: 10,
        max: 1000,
        step: 10
      },
      {
        name: 'max_depth',
        type: 'number',
        label: 'Maximum Depth',
        default: 10,
        min: 1,
        max: 50,
        step: 1
      },
      {
        name: 'min_samples_split',
        type: 'number',
        label: 'Minimum Samples to Split',
        default: 2,
        min: 2,
        max: 20,
        step: 1
      }
    ]
  },
  {
    id: 'xgboost',
    name: 'XGBoost',
    description: 'Gradient boosting algorithm optimized for performance',
    icon: BarChart2,
    type: 'both',
    hyperparameters: [
      {
        name: 'learning_rate',
        type: 'number',
        label: 'Learning Rate',
        default: 0.1,
        min: 0.001,
        max: 1,
        step: 0.001
      },
      {
        name: 'max_depth',
        type: 'number',
        label: 'Maximum Depth',
        default: 6,
        min: 1,
        max: 20,
        step: 1
      },
      {
        name: 'n_estimators',
        type: 'number',
        label: 'Number of Boosting Rounds',
        default: 100,
        min: 10,
        max: 1000,
        step: 10
      }
    ]
  },
  {
    id: 'neural_network',
    name: 'Neural Network',
    description: 'Deep learning model with multiple layers',
    icon: BrainCircuit,
    type: 'both',
    hyperparameters: [
      {
        name: 'hidden_layers',
        type: 'number',
        label: 'Hidden Layers',
        default: 2,
        min: 1,
        max: 5,
        step: 1
      },
      {
        name: 'neurons_per_layer',
        type: 'number',
        label: 'Neurons per Layer',
        default: 64,
        min: 8,
        max: 512,
        step: 8
      },
      {
        name: 'activation',
        type: 'select',
        label: 'Activation Function',
        default: 'relu',
        options: ['relu', 'tanh', 'sigmoid']
      },
      {
        name: 'learning_rate',
        type: 'number',
        label: 'Learning Rate',
        default: 0.001,
        min: 0.0001,
        max: 0.1,
        step: 0.0001
      }
    ]
  },
  {
    id: 'svm',
    name: 'Support Vector Machine',
    description: 'Powerful algorithm for classification and regression',
    icon: Network,
    type: 'both',
    hyperparameters: [
      {
        name: 'kernel',
        type: 'select',
        label: 'Kernel Function',
        default: 'rbf',
        options: ['linear', 'rbf', 'poly', 'sigmoid']
      },
      {
        name: 'C',
        type: 'number',
        label: 'Regularization Parameter',
        default: 1.0,
        min: 0.1,
        max: 10,
        step: 0.1
      },
      {
        name: 'gamma',
        type: 'select',
        label: 'Kernel Coefficient',
        default: 'scale',
        options: ['scale', 'auto']
      }
    ]
  },
  {
    id: 'ensemble',
    name: 'Ensemble Model',
    description: 'Combines multiple models for better predictions',
    icon: GitBranch,
    type: 'both',
    hyperparameters: [
      {
        name: 'voting',
        type: 'select',
        label: 'Voting Method',
        default: 'soft',
        options: ['hard', 'soft']
      },
      {
        name: 'weights',
        type: 'select',
        label: 'Weighting Method',
        default: 'uniform',
        options: ['uniform', 'dynamic']
      },
      {
        name: 'use_probabilities',
        type: 'boolean',
        label: 'Use Probabilities',
        default: true
      }
    ]
  }
];

interface ModelAlgorithmsProps {
  selectedAlgorithms: string[];
  onAlgorithmSelect: (algorithmId: string) => void;
  modelType: 'classification' | 'regression';
}

const ModelAlgorithms: React.FC<ModelAlgorithmsProps> = ({
  selectedAlgorithms,
  onAlgorithmSelect,
  modelType
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {algorithms
        .filter(algo => algo.type === 'both' || algo.type === modelType)
        .map((algorithm) => {
          const isSelected = selectedAlgorithms.includes(algorithm.id);
          const Icon = algorithm.icon;
          
          return (
            <Card 
              key={algorithm.id}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'ring-2 ring-indigo-500 bg-indigo-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onAlgorithmSelect(algorithm.id)}
            >
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                  isSelected ? 'bg-indigo-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    isSelected ? 'text-indigo-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="ml-4">
                  <h3 className={`text-sm font-medium ${
                    isSelected ? 'text-indigo-900' : 'text-gray-900'
                  }`}>
                    {algorithm.name}
                  </h3>
                  <p className={`mt-1 text-xs ${
                    isSelected ? 'text-indigo-500' : 'text-gray-500'
                  }`}>
                    {algorithm.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
    </div>
  );
};

export default ModelAlgorithms;