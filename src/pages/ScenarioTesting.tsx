import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMLContext } from '../context/MLContext';
import { ScenarioBuilder } from '../components/ml/ScenarioBuilder';
import { EmptyState } from '../components/common/EmptyState';
import { Zap, Brain, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

const ScenarioTesting: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { models } = useMLContext();
  const modelId = searchParams.get('model');
  const [selectedModel, setSelectedModel] = useState<any>(null);

  useEffect(() => {
    if (modelId) {
      const model = models.find(m => m.id === modelId && m.status === 'trained');
      if (model) {
        setSelectedModel(model);
      }
    } else if (models.length > 0) {
      const trainedModels = models.filter(m => m.status === 'trained');
      if (trainedModels.length > 0) {
        setSelectedModel(trainedModels[0]);
      }
    }
  }, [modelId, models]);

  // Mock baseline inputs (in real app, would come from dataset)
  const baselineInputs = {
    age: 35,
    income: 65000,
    tenure_months: 12,
    engagement_score: 7.5,
    support_tickets: 2,
    payment_method: 'credit_card',
    location: 'urban'
  };

  if (models.filter(m => m.status === 'trained').length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <EmptyState
          icon={Zap}
          title="No trained models available"
          description="Train a machine learning model first to run what-if scenarios and test different inputs"
          actions={[
            {
              label: 'Train a Model',
              onClick: () => navigate('/app/train'),
              variant: 'primary',
              icon: Brain
            }
          ]}
          tip="Scenario testing helps you understand how changes in inputs affect predictions"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Scenario Testing</h1>
            <p className="text-gray-600">
              Run unlimited "what if" scenarios to understand how different inputs affect predictions
            </p>
          </div>

          {/* Model Selector */}
          {models.filter(m => m.status === 'trained').length > 1 && (
            <select
              value={selectedModel?.id || ''}
              onChange={(e) => {
                const model = models.find(m => m.id === e.target.value);
                setSelectedModel(model);
              }}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
            >
              {models.filter(m => m.status === 'trained').map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Scenario Builder */}
      {selectedModel && (
        <div className="max-w-7xl mx-auto">
          <ScenarioBuilder
            model={selectedModel}
            baselineInputs={baselineInputs}
            onPrediction={(scenario) => {
              console.log('Scenario prediction:', scenario);
            }}
          />
        </div>
      )}

      {/* Help Section */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">💡 How to Use Scenario Testing</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Adjust input sliders to test different values</li>
            <li>• Add new scenarios to compare multiple options side-by-side</li>
            <li>• Green arrows = improvement vs baseline, red arrows = worse</li>
            <li>• Export scenarios to share with your team or include in reports</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScenarioTesting;
