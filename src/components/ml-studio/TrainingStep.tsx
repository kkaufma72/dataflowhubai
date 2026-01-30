import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, ChevronDown, Sparkles, Play, Zap, Settings, Wand2 } from 'lucide-react';
import { Dataset, MLModel } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import MLTrainingPipeline from './MLTrainingPipeline';

interface TrainingStepProps {
  dataset: Dataset;
  onNext: (model: MLModel) => void;
  onBack: () => void;
  onGuardrailsChange?: (state: { targetColumn: string; selectedFeatures: string[] }) => void;
  autoPickRequest?: number;
}

const TrainingStep: React.FC<TrainingStepProps> = ({
  dataset,
  onNext,
  onBack,
  onGuardrailsChange,
  autoPickRequest = 0,
}) => {
  const [targetColumn, setTargetColumn] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [showOrbitOverlay, setShowOrbitOverlay] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentModel, setCurrentModel] = useState<MLModel | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const trainingIntervalRef = useRef<number | null>(null);
  const overlayHideTimerRef = useRef<number | null>(null);
  const lastAutoPickRequestRef = useRef(0);
  
  // Advanced settings - use simpler type for UI state
  const [config, setConfig] = useState<{
    modelType?: string;
    trainTestSplit?: number;
    crossValidation?: boolean;
    cvFolds?: number;
    hyperparameterTuning?: boolean;
    featureSelection?: boolean;
    handleImbalance?: boolean;
  }>({
    modelType: 'auto',
    trainTestSplit: 0.2,
    crossValidation: true,
    cvFolds: 5,
    hyperparameterTuning: true,
    featureSelection: true,
    handleImbalance: true,
  });

  // Auto-detect target column
  const columns = useMemo(() => {
    if (!dataset.preview_data?.columns) return [];
    return dataset.preview_data.columns.filter(
      col => !col.toLowerCase().includes('id')
    );
  }, [dataset]);

  const featureColumns = useMemo(() => {
    // For the one-click flow, treat all non-ID columns as eligible features.
    return columns;
  }, [columns]);

  const targetCandidates = useMemo(() => {
    const ranked: string[] = [];
    const seen = new Set<string>();

    const add = (name: string) => {
      if (!name) return;
      if (seen.has(name)) return;
      seen.add(name);
      ranked.push(name);
    };

    const byKeyword = (keywords: string[]) =>
      columns.filter((col) => keywords.some((k) => col.toLowerCase().includes(k)));

    byKeyword(['target', 'label', 'class', 'outcome', 'y']).forEach(add);
    byKeyword(['churn', 'fraud', 'default', 'risk', 'price', 'revenue']).forEach(add);

    // Fallback: last column is often a label/target in CSV exports.
    if (columns.length > 0) add(columns[columns.length - 1]);
    return ranked.slice(0, 4);
  }, [columns]);

  useEffect(() => {
    // Default: select all features.
    setSelectedFeatures(featureColumns);
  }, [featureColumns]);

  useEffect(() => {
    onGuardrailsChange?.({ targetColumn, selectedFeatures });
  }, [onGuardrailsChange, selectedFeatures, targetColumn]);

  useEffect(() => {
    // Auto-select likely target column
    const targetCandidates = columns.filter(col => 
      col.toLowerCase().includes('target') ||
      col.toLowerCase().includes('label') ||
      col.toLowerCase().includes('class') ||
      col.toLowerCase().includes('outcome')
    );
    
    if (targetCandidates.length > 0) {
      setTargetColumn(targetCandidates[0]);
    }
  }, [columns]);

  const handleAutoPick = () => {
    if (!columns || columns.length === 0) {
      toast.error('No columns available to auto-pick');
      return;
    }

    const pickedTarget = targetColumn || targetCandidates[0] || '';
    if (!pickedTarget) {
      toast.error('Could not detect a target column');
      return;
    }

    if (!targetColumn) {
      setTargetColumn(pickedTarget);
    }

    // Default features: all eligible columns except the target.
    const recommendedFeatures = featureColumns.filter((c) => c !== pickedTarget);
    if (!selectedFeatures || selectedFeatures.length === 0) {
      setSelectedFeatures(recommendedFeatures.length ? recommendedFeatures : featureColumns);
    }

    toast.success('Auto-picked target + features');
  };

  useEffect(() => {
    if (!autoPickRequest) return;
    if (autoPickRequest === lastAutoPickRequestRef.current) return;
    lastAutoPickRequestRef.current = autoPickRequest;
    if (isTraining) return;
    handleAutoPick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPickRequest]);

  const algorithmOptions = [
    { value: 'auto', label: 'Auto (Recommended)', icon: Sparkles, description: 'AI selects the best algorithm' },
    { value: 'random_forest', label: 'Random Forest', icon: Zap, description: 'Robust ensemble method' },
    { value: 'xgboost', label: 'XGBoost', icon: Zap, description: 'High performance gradient boosting' },
    { value: 'neural_network', label: 'Neural Network', icon: Zap, description: 'Deep learning approach' },
    { value: 'logistic_regression', label: 'Logistic Regression', icon: Zap, description: 'Simple and interpretable' },
  ];

  const selectedAlgorithm = algorithmOptions.find(opt => opt.value === config.modelType) || algorithmOptions[0];

  const handleStartTraining = async () => {
    if (!targetColumn) {
      toast.error('Please select a target column');
      return;
    }

    if (!selectedFeatures || selectedFeatures.length === 0) {
      toast.error('Please select at least one feature');
      return;
    }

    setIsTraining(true);
    setShowOrbitOverlay(true);
    setProgress(0);

    // Simulate training progress
    const modelId = `model_${Date.now()}`;
    const newModel: MLModel = {
      id: modelId,
      name: `${dataset.name} - ${selectedAlgorithm.label}`,
      description: `Model trained on ${dataset.name}`,
      datasetId: dataset.id,
      status: 'training',
      modelType: config.modelType || 'auto',
      createdAt: new Date().toISOString(),
    };

    setCurrentModel(newModel);

    // Simulate training epochs
    if (trainingIntervalRef.current) {
      window.clearInterval(trainingIntervalRef.current);
      trainingIntervalRef.current = null;
    }
    if (overlayHideTimerRef.current) {
      window.clearTimeout(overlayHideTimerRef.current);
      overlayHideTimerRef.current = null;
    }

    const interval = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + (Math.random() * 5);
        if (next >= 100) {
          window.clearInterval(interval);
          trainingIntervalRef.current = null;
          
          // Training complete
          const trainedModel: MLModel = {
            ...newModel,
            status: 'trained',
            metrics: {
              accuracy: 0.87 + Math.random() * 0.1,
              precision: 0.85 + Math.random() * 0.1,
              recall: 0.83 + Math.random() * 0.1,
              f1_score: 0.84 + Math.random() * 0.1,
              training_time: Math.random() * 300 + 100,
            },
          };

          setCurrentModel(trainedModel);
          setIsTraining(false);
          toast.success('Model training completed!');

          // Keep the orbit visible for 4 seconds, then advance.
          overlayHideTimerRef.current = window.setTimeout(() => {
            setShowOrbitOverlay(false);
            onNext(trainedModel);
            overlayHideTimerRef.current = null;
          }, 4000);
          
          return 100;
        }
        return next;
      });
    }, 200);

    trainingIntervalRef.current = interval;
  };

  useEffect(() => {
    return () => {
      if (trainingIntervalRef.current) {
        window.clearInterval(trainingIntervalRef.current);
        trainingIntervalRef.current = null;
      }
      if (overlayHideTimerRef.current) {
        window.clearTimeout(overlayHideTimerRef.current);
        overlayHideTimerRef.current = null;
      }
    };
  }, []);

  const currentEpoch = Math.floor((progress / 100) * 100);
  const estimatedTime = ((100 - progress) / 100) * 180; // seconds

  // Map overall training progress (0-100) to the 8-step orbital timeline.
  // When progress reaches 100%, advance currentStep past the last node so all nodes render as completed.
  const ORBIT_TOTAL_STEPS = 8;
  const orbitStepSpan = 100 / ORBIT_TOTAL_STEPS;
  const orbitStepIndex = Math.min(
    ORBIT_TOTAL_STEPS - 1,
    Math.floor(Math.max(0, Math.min(99.999, progress)) / orbitStepSpan)
  );
  const orbitCurrentStep = progress >= 100 ? ORBIT_TOTAL_STEPS + 1 : orbitStepIndex + 1;
  const orbitStepProgress =
    progress >= 100
      ? 100
      : Math.max(
          0,
          Math.min(
            100,
            ((progress - orbitStepIndex * orbitStepSpan) / orbitStepSpan) * 100
          )
        );

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Orbital Training Visualization Overlay */}
      {showOrbitOverlay && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
          <MLTrainingPipeline
            datasetName={dataset.name}
            modelType={selectedAlgorithm.label}
            currentStep={orbitCurrentStep}
            trainingProgress={orbitStepProgress}
          />
          
          {/* Progress overlay */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 glass-card px-8 py-4 max-w-md">
            <div className="text-center">
              <p className="text-white font-mono text-3xl font-bold mb-2">{progress.toFixed(0)}%</p>
              <p className="text-gray-400 text-sm">Overall Training Progress</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
          Features & Training
        </h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          Select features, then let AI train and optimize
        </p>
      </div>

      {/* Inline helper for common blockers */}
      {(!targetColumn || selectedFeatures.length === 0) && (
        <Card className="mb-6 bg-indigo-950/30 border-indigo-500/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Quick fix</p>
              <p className="text-xs text-gray-400 mt-1">
                {targetColumn
                  ? 'Features are empty — auto-select recommended features.'
                  : 'Missing target column — auto-detect a likely target and select features.'}
              </p>
              {!targetColumn && targetCandidates.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  Detected targets: <span className="text-gray-300">{targetCandidates.join(', ')}</span>
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleAutoPick}
              disabled={isTraining}
              icon={<Wand2 className="w-4 h-4" />}
            >
              Auto-pick
            </Button>
          </div>
        </Card>
      )}

      {/* Feature Engineering (simplified) */}
      <div id="ml-feature-selection">
        <Card className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Feature Engineering</h3>
              <p className="text-sm text-gray-500 mt-1">
                Choose which columns to use as features.
              </p>
            </div>
          <div className="text-right">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-white">{selectedFeatures.length}</span> / {featureColumns.length} selected
            </p>
            <div className="mt-2 flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                disabled={isTraining}
                onClick={() => {
                  setSelectedFeatures(featureColumns);
                  toast.success('Selected all features');
                }}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                disabled={isTraining}
                onClick={() => {
                  setSelectedFeatures([]);
                  toast.success('Cleared feature selection');
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        {featureColumns.length === 0 ? (
          <div className="text-sm text-gray-500">
            No columns available from dataset preview.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-auto pr-1">
            {featureColumns.map((col) => {
              const checked = selectedFeatures.includes(col);
              return (
                <label
                  key={col}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-800 bg-gray-950/40 hover:bg-gray-900 transition cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isTraining}
                    onChange={() => {
                      setSelectedFeatures((prev) =>
                        prev.includes(col)
                          ? prev.filter((c) => c !== col)
                          : [...prev, col]
                      );
                    }}
                    className="accent-indigo-500"
                  />
                  <span className="text-sm text-gray-200 truncate">{col}</span>
                </label>
              );
            })}
          </div>
          )}
        </Card>
      </div>

      {/* Main Configuration */}
      <Card className="mb-6">
        <div className="space-y-6">
          {/* Target Column Selection */}
          <div id="ml-target-column">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              What do you want to predict? <span className="text-red-400">*</span>
            </label>
            <select
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
              disabled={isTraining}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select target column...</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              The column you want your model to predict
            </p>
          </div>

          {/* Algorithm Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Algorithm
            </label>
            <div className="grid grid-cols-1 gap-3">
              {algorithmOptions.map((algo) => {
                const isSelected = config.modelType === algo.value;
                const Icon = algo.icon;
                
                return (
                  <button
                    key={algo.value}
                    onClick={() => setConfig({ ...config, modelType: algo.value })}
                    disabled={isTraining}
                    className={`
                      flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-950/30'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }
                      ${isTraining ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isSelected ? 'text-indigo-400' : 'text-gray-500'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                          {algo.label}
                        </span>
                        {algo.value === 'auto' && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-indigo-600 text-white rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{algo.description}</p>
                    </div>
                    <div
                      className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600'}
                      `}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Advanced Settings Accordion */}
      <Card className="mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={isTraining}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-white">Advanced Settings</span>
            <span className="text-xs text-gray-500">(Optional)</span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          />
        </button>

        {showAdvanced && (
          <div className="mt-6 pt-6 border-t border-gray-700 space-y-6">
            {/* Train/Test Split */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Train/Test Split
              </label>
              <input
                type="range"
                min="0.1"
                max="0.4"
                step="0.05"
                value={config.trainTestSplit}
                onChange={(e) => setConfig({ ...config, trainTestSplit: parseFloat(e.target.value) })}
                disabled={isTraining}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Train: {((1 - (config.trainTestSplit || 0.2)) * 100).toFixed(0)}%</span>
                <span>Test: {((config.trainTestSplit || 0.2) * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Cross Validation */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Cross Validation</label>
                <p className="text-xs text-gray-500 mt-1">K-fold validation for robust metrics</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, crossValidation: !config.crossValidation })}
                disabled={isTraining}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${config.crossValidation ? 'bg-indigo-600' : 'bg-gray-700'}
                  ${isTraining ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${config.crossValidation ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {config.crossValidation && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Folds
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={config.cvFolds}
                  onChange={(e) => setConfig({ ...config, cvFolds: parseInt(e.target.value) })}
                  disabled={isTraining}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
            )}

            {/* Other toggles */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Hyperparameter Tuning</label>
                <p className="text-xs text-gray-500 mt-1">Automatically optimize model parameters</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, hyperparameterTuning: !config.hyperparameterTuning })}
                disabled={isTraining}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${config.hyperparameterTuning ? 'bg-indigo-600' : 'bg-gray-700'}
                  ${isTraining ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${config.hyperparameterTuning ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Auto Feature Selection</label>
                <p className="text-xs text-gray-500 mt-1">Remove low-importance features</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, featureSelection: !config.featureSelection })}
                disabled={isTraining}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${config.featureSelection ? 'bg-indigo-600' : 'bg-gray-700'}
                  ${isTraining ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${config.featureSelection ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Handle Class Imbalance</label>
                <p className="text-xs text-gray-500 mt-1">Apply SMOTE or class weighting</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, handleImbalance: !config.handleImbalance })}
                disabled={isTraining}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${config.handleImbalance ? 'bg-indigo-600' : 'bg-gray-700'}
                  ${isTraining ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${config.handleImbalance ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Training Progress */}
      {isTraining && (
        <Card className="mb-6 bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border-indigo-500/40 shadow-xl shadow-indigo-500/20">
          <div className="space-y-4 p-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Zap className="w-6 h-6 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Training in Progress</h3>
                  <p className="text-sm text-gray-400">
                    Epoch {currentEpoch}/100 • {Math.ceil(estimatedTime)}s remaining
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-indigo-400">
                {progress.toFixed(0)}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Live Metrics */}
            {progress > 20 && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Accuracy</p>
                  <p className="text-lg font-semibold text-green-400">
                    {(0.5 + (progress / 100) * 0.4).toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Loss</p>
                  <p className="text-lg font-semibold text-orange-400">
                    {(1.5 - (progress / 100) * 1.2).toFixed(3)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Training Complete */}
      {currentModel?.status === 'trained' && (
        <Card className="mb-6 bg-gradient-to-br from-green-950/50 to-emerald-950/50 border-green-500/40 shadow-xl shadow-green-500/20">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">Training Complete!</h3>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-400">Accuracy</p>
                  <p className="text-lg font-bold text-green-400">
                    {((currentModel.metrics?.accuracy || 0) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Precision</p>
                  <p className="text-lg font-bold text-blue-400">
                    {((currentModel.metrics?.precision || 0) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Recall</p>
                  <p className="text-lg font-bold text-purple-400">
                    {((currentModel.metrics?.recall || 0) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">F1 Score</p>
                  <p className="text-lg font-bold text-indigo-400">
                    {((currentModel.metrics?.f1_score || 0) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                Your model is ready for deployment!
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="secondary"
          onClick={onBack}
          disabled={isTraining}
          className="px-6 py-2.5"
        >
          Back
        </Button>

        {!isTraining && !currentModel && (
          <div className="text-right">
            <button
              onClick={handleStartTraining}
              disabled={!targetColumn || selectedFeatures.length === 0}
              className="orbital-button px-10 py-3.5 text-base font-semibold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Play className="w-5 h-5" />
              Start Training
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Train — baseline + 10 quick configs, ~2 min
            </p>
          </div>
        )}

        {currentModel?.status === 'trained' && (
          <Button
            onClick={() => onNext(currentModel)}
            className="px-10 py-3.5 text-base font-semibold flex items-center gap-2 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
          >
            Continue to Monitoring
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default TrainingStep;
