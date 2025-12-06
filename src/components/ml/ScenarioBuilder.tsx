import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, TrendingUp, TrendingDown, AlertCircle, Share2, Download } from 'lucide-react';
import { MLModel } from '../../types';
import Button from '../common/Button';
import toast from 'react-hot-toast';

interface Scenario {
  id: string;
  name: string;
  inputs: Record<string, any>;
  outputs: Record<string, any> | null;
  isBaseline: boolean;
}

interface ScenarioBuilderProps {
  model: MLModel;
  baselineInputs: Record<string, any>;
  onPrediction?: (scenario: Scenario) => void;
  className?: string;
}

export const ScenarioBuilder: React.FC<ScenarioBuilderProps> = ({
  model,
  baselineInputs,
  onPrediction,
  className = ''
}) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: 'baseline',
      name: 'Base Case (Current)',
      inputs: { ...baselineInputs },
      outputs: null,
      isBaseline: true
    }
  ]);

  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['baseline']);

  // Simulate prediction (replace with actual model.predict() call)
  const getPrediction = async (inputs: Record<string, any>): Promise<Record<string, any>> => {
    // TODO: Replace with actual API call to model endpoint
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

    // Mock prediction based on inputs
    const mockPrediction = {
      prediction: Math.random() > 0.5 ? 'Churn' : 'No Churn',
      probability: Math.random(),
      confidence: 0.85 + Math.random() * 0.15,
      impact: Math.round((Math.random() - 0.5) * 100)
    };

    return mockPrediction;
  };

  const addScenario = () => {
    const newScenario: Scenario = {
      id: `scenario-${Date.now()}`,
      name: `Scenario ${scenarios.length}`,
      inputs: { ...baselineInputs },
      outputs: null,
      isBaseline: false
    };

    setScenarios([...scenarios, newScenario]);
    setSelectedScenarios([...selectedScenarios, newScenario.id]);
  };

  const duplicateScenario = (scenarioId: string) => {
    const original = scenarios.find(s => s.id === scenarioId);
    if (!original) return;

    const duplicate: Scenario = {
      id: `scenario-${Date.now()}`,
      name: `${original.name} (Copy)`,
      inputs: { ...original.inputs },
      outputs: null,
      isBaseline: false
    };

    setScenarios([...scenarios, duplicate]);
  };

  const deleteScenario = (scenarioId: string) => {
    setScenarios(scenarios.filter(s => s.id !== scenarioId && !s.isBaseline));
    setSelectedScenarios(selectedScenarios.filter(id => id !== scenarioId));
  };

  const updateInput = async (scenarioId: string, field: string, value: any) => {
    const updated = scenarios.map(s => {
      if (s.id === scenarioId) {
        return { ...s, inputs: { ...s.inputs, [field]: value } };
      }
      return s;
    });

    setScenarios(updated);

    // Get prediction for updated scenario
    const scenario = updated.find(s => s.id === scenarioId);
    if (scenario) {
      const prediction = await getPrediction(scenario.inputs);
      updateOutput(scenarioId, prediction);
      
      if (onPrediction) {
        onPrediction({ ...scenario, outputs: prediction });
      }
    }
  };

  const updateOutput = (scenarioId: string, outputs: Record<string, any>) => {
    setScenarios(scenarios.map(s =>
      s.id === scenarioId ? { ...s, outputs } : s
    ));
  };

  const updateName = (scenarioId: string, name: string) => {
    setScenarios(scenarios.map(s =>
      s.id === scenarioId ? { ...s, name } : s
    ));
  };

  const runAllScenarios = async () => {
    toast.loading('Running all scenarios...', { id: 'scenarios' });

    for (const scenario of scenarios) {
      const prediction = await getPrediction(scenario.inputs);
      updateOutput(scenario.id, prediction);
    }

    toast.success('All scenarios complete!', { id: 'scenarios' });
  };

  const exportScenarios = () => {
    const csv = [
      ['Scenario', ...Object.keys(baselineInputs), 'Prediction', 'Probability', 'Impact'],
      ...scenarios.map(s => [
        s.name,
        ...Object.values(s.inputs),
        s.outputs?.prediction || '-',
        s.outputs?.probability?.toFixed(3) || '-',
        s.outputs?.impact || '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenarios-${model.name}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Scenarios exported!');
  };

  const baselineOutputs = scenarios[0]?.outputs;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">What-If Scenario Builder</h2>
          <p className="text-sm text-gray-600">
            Adjust inputs to see how predictions change • Model: {model.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runAllScenarios} variant="secondary" size="sm">
            Run All
          </Button>
          <Button onClick={exportScenarios} variant="secondary" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button onClick={addScenario} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Scenario
          </Button>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {scenarios
          .filter(s => selectedScenarios.includes(s.id))
          .map((scenario, idx) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              baselineOutputs={baselineOutputs}
              isFirst={idx === 0}
              onUpdateInput={updateInput}
              onUpdateName={updateName}
              onDuplicate={duplicateScenario}
              onDelete={deleteScenario}
            />
          ))}
      </div>

      {/* Comparison Summary */}
      {scenarios.length > 1 && scenarios.every(s => s.outputs) && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Scenario Comparison</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {scenarios.map(scenario => (
              <div key={scenario.id} className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-2">{scenario.name}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scenario.outputs?.probability ? 
                    `${(scenario.outputs.probability * 100).toFixed(1)}%` : 
                    '-'
                  }
                </p>
                {scenario.outputs && baselineOutputs && !scenario.isBaseline && (
                  <div className="flex items-center gap-1 mt-1">
                    {scenario.outputs.probability > baselineOutputs.probability ? (
                      <>
                        <TrendingUp className="w-3 h-3 text-red-600" />
                        <span className="text-xs font-medium text-red-600">
                          +{((scenario.outputs.probability - baselineOutputs.probability) * 100).toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-medium text-green-600">
                          {((scenario.outputs.probability - baselineOutputs.probability) * 100).toFixed(1)}%
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Scenario Card Component
interface ScenarioCardProps {
  scenario: Scenario;
  baselineOutputs: Record<string, any> | null;
  isFirst: boolean;
  onUpdateInput: (scenarioId: string, field: string, value: any) => void;
  onUpdateName: (scenarioId: string, name: string) => void;
  onDuplicate: (scenarioId: string) => void;
  onDelete: (scenarioId: string) => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  baselineOutputs,
  isFirst,
  onUpdateInput,
  onUpdateName,
  onDuplicate,
  onDelete
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(scenario.name);

  const handleNameSave = () => {
    if (editedName.trim()) {
      onUpdateName(scenario.id, editedName);
    }
    setIsEditingName(false);
  };

  const getDifference = (field: string, value: any): string | null => {
    if (!baselineOutputs || scenario.isBaseline) return null;
    const baseline = scenario.inputs[field];
    const baselineValue = typeof baseline === 'number' ? baseline : parseFloat(baseline);
    const currentValue = typeof value === 'number' ? value : parseFloat(value);
    
    if (isNaN(baselineValue) || isNaN(currentValue)) return null;
    
    const diff = ((currentValue - baselineValue) / baselineValue) * 100;
    return diff !== 0 ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%` : null;
  };

  return (
    <div className={`
      bg-white rounded-xl border-2 p-6 transition-all
      ${scenario.isBaseline 
        ? 'border-indigo-300 bg-indigo-50/30' 
        : 'border-gray-200 hover:border-indigo-200'
      }
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {isEditingName ? (
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
            className="text-lg font-bold text-gray-900 border-b-2 border-indigo-600 focus:outline-none"
            autoFocus
          />
        ) : (
          <div>
            <h3
              onClick={() => !scenario.isBaseline && setIsEditingName(true)}
              className={`text-lg font-bold text-gray-900 ${!scenario.isBaseline && 'cursor-pointer hover:text-indigo-600'}`}
            >
              {scenario.name}
              {scenario.isBaseline && (
                <span className="ml-2 px-2 py-1 bg-indigo-600 text-white text-xs font-bold rounded">
                  BASELINE
                </span>
              )}
            </h3>
            {scenario.isBaseline && (
              <p className="text-xs text-gray-500 mt-1">
                Reference values • Click "Add Scenario" to test changes
              </p>
            )}
          </div>
        )}

        {!scenario.isBaseline && (
          <div className="flex gap-1">
            <button
              onClick={() => onDuplicate(scenario.id)}
              className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(scenario.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Inputs */}
      <div className="space-y-3 mb-6">
        {Object.entries(scenario.inputs).map(([field, value]) => {
          const diff = getDifference(field, value);
          
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {diff && (
                  <span className={`ml-2 text-xs font-bold ${
                    diff.startsWith('+') ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {diff}
                  </span>
                )}
              </label>
              
              {typeof value === 'number' ? (
                <div className="space-y-1">
                  <input
                    type="range"
                    min={value * 0.5}
                    max={value * 1.5}
                    step={value * 0.01}
                    value={value}
                    onChange={(e) => onUpdateInput(scenario.id, field, parseFloat(e.target.value))}
                    disabled={scenario.isBaseline}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => onUpdateInput(scenario.id, field, parseFloat(e.target.value))}
                    disabled={scenario.isBaseline}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:outline-none disabled:bg-gray-100"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => onUpdateInput(scenario.id, field, e.target.value)}
                  disabled={scenario.isBaseline}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:outline-none disabled:bg-gray-100"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Outputs */}
      {scenario.outputs ? (
        <div className={`
          border-t-2 pt-4
          ${scenario.isBaseline ? 'border-indigo-200' : 'border-gray-200'}
        `}>
          <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Prediction Results</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Prediction</span>
              <span className="text-lg font-bold text-gray-900">{scenario.outputs.prediction}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Probability</span>
              <span className="text-lg font-bold text-gray-900">
                {(scenario.outputs.probability * 100).toFixed(1)}%
              </span>
            </div>

            {!scenario.isBaseline && baselineOutputs && (
              <div className={`
                flex items-center justify-between p-3 rounded-lg
                ${scenario.outputs.probability > baselineOutputs.probability 
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-green-50 border border-green-200'
                }
              `}>
                <span className="text-sm font-medium text-gray-700">vs Baseline</span>
                <div className="flex items-center gap-2">
                  {scenario.outputs.probability > baselineOutputs.probability ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-red-600" />
                      <span className="font-bold text-red-600">
                        +{((scenario.outputs.probability - baselineOutputs.probability) * 100).toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-green-600">
                        {((scenario.outputs.probability - baselineOutputs.probability) * 100).toFixed(1)}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="border-t-2 border-gray-200 pt-4">
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Adjust inputs to see prediction
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioBuilder;
