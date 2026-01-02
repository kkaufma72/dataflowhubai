import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart2, InfoIcon, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { Dataset, ModelTrainingConfig } from '../../types';
import Button from '../common/Button';
import Card from '../common/Card';
import ModelAlgorithms from './ModelAlgorithms';
import CrossValidation from './CrossValidation';
import toast from 'react-hot-toast';
import { profileDataset, getConfidenceBadgeColor, getConfidenceIcon, DatasetProfileResult } from '../../lib/datasetProfiling';

interface ModelTrainingFormProps {
  dataset: Dataset;
  onSubmit: (config: ModelTrainingConfig) => void;
}

type CrossValidationResult = {
  fold: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
};

const ModelTrainingForm: React.FC<ModelTrainingFormProps> = ({
  dataset,
  onSubmit,
}) => {
  const [targetVariable, setTargetVariable] = useState('');
  const [modelType, setModelType] = useState('classification');
  const [trainTestSplit, setTrainTestSplit] = useState(0.8);
  const [hyperparameterTuning, setHyperparameterTuning] = useState(true);
  const [optimizationMetric, setOptimizationMetric] = useState('f1');
  const [algorithms, setAlgorithms] = useState<string[]>([]);
  const [userChoseAlgorithms, setUserChoseAlgorithms] = useState(false);
  const userChoseAlgorithmsRef = useRef(false);
  const [crossValidationFolds, setCrossValidationFolds] = useState(5);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Smart recommendations state
  const [profilingResult, setProfilingResult] = useState<DatasetProfileResult | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [validationResults, setValidationResults] = useState<CrossValidationResult[] | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const recommendedAlgorithms = useMemo(
    () => profilingResult?.algorithmRecommendations.slice(0, 2) ?? [],
    [profilingResult]
  );
  const suggestedTarget = profilingResult?.targetRecommendations[0];
  const datasetStats = useMemo(
    () => ({
      rows: dataset.rows?.toLocaleString?.() ?? '—',
      columns: dataset.columns?.toLocaleString?.() ?? '—'
    }),
    [dataset.columns, dataset.rows]
  );

  const toggleAlgorithm = (algorithm: string) => {
    setAlgorithms((prev) =>
      prev.includes(algorithm) ? prev.filter((a) => a !== algorithm) : [...prev, algorithm]
    );
    setUserChoseAlgorithms(true);
    userChoseAlgorithmsRef.current = true;
  };

  const handleApplySmartPlan = () => {
    if (!profilingResult) return;

    if (suggestedTarget) {
      setTargetVariable(suggestedTarget);
    }

    if (profilingResult.modelTypeRecommendation) {
      setModelType(profilingResult.modelTypeRecommendation.type);
    }

    if (profilingResult.algorithmRecommendations.length > 0) {
      const topAlgorithms = profilingResult.algorithmRecommendations
        .slice(0, 2)
        .map(rec => rec.algorithm);
      setAlgorithms(topAlgorithms);
      setUserChoseAlgorithms(false);
      userChoseAlgorithmsRef.current = false;
    }

    toast.success('Applied smart defaults for this dataset', { icon: '✨' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const config: ModelTrainingConfig = {
      datasetId: dataset.id,
      targetVariable,
      modelType,
      trainTestSplit,
      hyperparameterTuning,
      optimizationMetric,
      algorithms,
      crossValidation: {
        enabled: true,
        folds: crossValidationFolds,
        stratified: true
      }
    };
    onSubmit(config);
  };

  // Get available columns from dataset
  const availableColumns = useMemo(
    () => dataset.preview_data?.columns ?? [],
    [dataset.id, dataset.preview_data?.columns]
  );

  // Reset target variable if it's not in the new dataset's columns
  useEffect(() => {
    if (!availableColumns.includes(targetVariable)) {
      setTargetVariable('');
    }
  }, [dataset.id, availableColumns, targetVariable]);
  
  // Profile dataset and generate smart recommendations
  useEffect(() => {
    // New dataset: reset auto-selection guard
    setUserChoseAlgorithms(false);
    userChoseAlgorithmsRef.current = false;
    setAlgorithms([]);

    const runProfiling = async () => {
      setIsProfileLoading(true);
      try {
        const result = await profileDataset(dataset);
        setProfilingResult(result);
        
        // Auto-apply recommendations
        if (result.targetRecommendations.length > 0 && !targetVariable) {
          setTargetVariable(result.targetRecommendations[0]);
          toast.success(
            `Suggested target variable: "${result.targetRecommendations[0]}"`,
            { icon: '🎯', duration: 4000 }
          );
        }
        
        if (result.modelTypeRecommendation) {
          setModelType(result.modelTypeRecommendation.type);
        }
        
        if (!userChoseAlgorithmsRef.current && result.algorithmRecommendations.length > 0) {
          // Auto-select top 2 recommended algorithms only if user hasn't chosen yet
          const topAlgorithms = result.algorithmRecommendations
            .slice(0, 2)
            .map(rec => rec.algorithm);
          setAlgorithms(topAlgorithms);
        }
        
        // Show data quality warnings
        if (result.dataQualityIssues.length > 0) {
          result.dataQualityIssues.forEach(issue => {
            toast.error(issue, { duration: 6000, icon: '⚠️' });
          });
        }
      } catch (error) {
        console.error('Dataset profiling failed:', error);
        toast.error('Failed to analyze dataset');
      } finally {
        setIsProfileLoading(false);
      }
    };
    
    if (dataset && dataset.preview_data?.columns && dataset.preview_data?.rows) {
      runProfiling();
    }
  }, [dataset.id]); // Only run when dataset changes

  const handleRunCrossValidation = async () => {
    if (!targetVariable || algorithms.length === 0) return;
    
    setIsValidating(true);
    toast.loading('Running cross-validation...', { id: 'cross-validation' });
    setValidationResults(null);
    
    try {
      const response = await fetch('/api/ml/cross-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          datasetId: dataset.id,
          targetColumn: targetVariable,
          taskType: modelType,
          folds: crossValidationFolds,
          algorithms,
          previewData: dataset.preview_data,
          trainTestSplit
        })
      });

      if (!response.ok) {
        throw new Error('Cross-validation request failed');
      }

      const payload = await response.json();
      const folds = payload.results || payload.folds || [];
      const results = folds.map((fold: any, index: number) => ({
        fold: fold.fold ?? fold.index ?? index + 1,
        accuracy: fold.accuracy ?? fold.metrics?.accuracy ?? 0,
        precision: fold.precision ?? fold.metrics?.precision ?? 0,
        recall: fold.recall ?? fold.metrics?.recall ?? 0,
        f1Score: fold.f1Score ?? fold.f1 ?? fold.metrics?.f1 ?? fold.metrics?.f1Score ?? fold.metrics?.f1_score ?? 0
      }));

      setValidationResults(results);
      toast.success('Cross-validation completed', { id: 'cross-validation' });
    } catch (error) {
      console.error('Cross-validation failed:', error);
      toast.error('Failed to run cross-validation', { id: 'cross-validation' });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Outcome</p>
              <h2 className="text-lg font-bold text-slate-900">
                Train a ready-to-deploy model with safe defaults
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Uses stratified split, auto-tuned metrics, and top recommended algorithms so you can run with confidence.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700">
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 border border-slate-200">
                  Dataset: {dataset.name} • {datasetStats.rows} rows, {datasetStats.columns} columns
                </span>
                {profilingResult?.dataQualityIssues?.length ? (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 border border-amber-200 text-amber-800">
                    Data quality flags: {profilingResult.dataQualityIssues.length}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 border border-emerald-200 text-emerald-800">
                    Data check ready
                  </span>
                )}
              </div>
            </div>
            <div className="w-full md:w-auto">
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Plan</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li>
                    Target: <span className="font-semibold">{targetVariable || suggestedTarget || 'Pick target'}</span>
                  </li>
                  <li>
                    Model: <span className="font-semibold capitalize">{modelType}</span>
                  </li>
                  <li>
                    Algorithms: <span className="font-semibold">
                      {algorithms.length > 0
                        ? `${algorithms.length} selected`
                        : recommendedAlgorithms.length > 0
                          ? 'Will auto-select top matches'
                          : 'Choose 1–2'}
                    </span>
                  </li>
                  <li>
                    Validation: <span className="font-semibold">Stratified CV · {crossValidationFolds} folds</span>
                  </li>
                </ul>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplySmartPlan}
                    disabled={!profilingResult}
                    className="w-full"
                  >
                    Apply smart defaults
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Recommendations Banner */}
        {profilingResult && profilingResult.algorithmRecommendations.length > 0 && showRecommendations && (
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-indigo-900">AI-Powered Recommendations</h3>
                  <button
                    type="button"
                    onClick={() => setShowRecommendations(false)}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="space-y-3">
                  {/* Model Type Recommendation */}
                  {profilingResult.modelTypeRecommendation && (
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600 mt-0.5" />
                      <div className="text-sm text-indigo-800">
                        <span className="font-medium">Model Type:</span>{' '}
                        <span className="capitalize">{profilingResult.modelTypeRecommendation.type}</span>{' '}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getConfidenceBadgeColor(profilingResult.modelTypeRecommendation.confidence)}`}>
                          {getConfidenceIcon(profilingResult.modelTypeRecommendation.confidence)} {profilingResult.modelTypeRecommendation.confidence} confidence
                        </span>
                        <p className="mt-1 text-xs text-indigo-700">{profilingResult.modelTypeRecommendation.reasoning}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Top Algorithm Recommendation */}
                  {profilingResult.algorithmRecommendations[0] && (
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 mt-0.5" />
                      <div className="text-sm text-indigo-800">
                        <span className="font-medium">Top Algorithm:</span>{' '}
                        <span>{profilingResult.algorithmRecommendations[0].name}</span>{' '}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getConfidenceBadgeColor(profilingResult.algorithmRecommendations[0].confidence)}`}>
                          {profilingResult.algorithmRecommendations[0].confidenceScore}% match
                        </span>
                        <p className="mt-1 text-xs text-indigo-700">
                          {profilingResult.algorithmRecommendations[0].reasoning[0]}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Data Quality Issues */}
                  {profilingResult.dataQualityIssues.length > 0 && (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-medium text-orange-800">Data Quality:</span>
                        <ul className="mt-1 space-y-1">
                          {profilingResult.dataQualityIssues.slice(0, 2).map((issue, idx) => (
                            <li key={idx} className="text-xs text-orange-700">• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {isProfileLoading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-800">Analyzing dataset and generating recommendations...</span>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="targetVariable" className="block text-sm font-medium text-gray-700">
            Target Variable
            {profilingResult?.targetRecommendations.includes(targetVariable) && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                <Sparkles className="w-3 h-3 mr-1" /> AI Suggested
              </span>
            )}
          </label>
          <select
            id="targetVariable"
            name="targetVariable"
            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
            value={targetVariable}
            onChange={(e) => setTargetVariable(e.target.value)}
            required
          >
            <option value="">Select target variable</option>
            {availableColumns.map((column) => {
              const isRecommended = profilingResult?.targetRecommendations.includes(column);
              return (
                <option key={column} value={column}>
                  {column} {isRecommended ? '⭐ (Recommended)' : ''}
                </option>
              );
            })}
          </select>
          {profilingResult && profilingResult.targetRecommendations.length > 0 && (
            <p className="mt-1 text-xs text-gray-600">
              💡 Suggested: {profilingResult.targetRecommendations.slice(0, 3).join(', ')}
            </p>
          )}
          {availableColumns.length === 0 && (
            <p className="mt-1 text-sm text-red-600">
              No columns available. Please ensure the dataset has been properly loaded.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Model Type</label>
          <div className="mt-2 space-y-4">
            <div className="flex items-center">
              <input
                id="modelType-classification"
                name="modelType"
                type="radio"
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary"
                value="classification"
                checked={modelType === 'classification'}
                onChange={(e) => setModelType(e.target.value)}
              />
              <label htmlFor="modelType-classification" className="block ml-3 text-sm font-medium text-gray-700">
                Classification
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="modelType-regression"
                name="modelType"
                type="radio"
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary"
                value="regression"
                checked={modelType === 'regression'}
                onChange={(e) => setModelType(e.target.value)}
              />
              <label htmlFor="modelType-regression" className="block ml-3 text-sm font-medium text-gray-700">
                Regression
              </label>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Algorithms</h3>
          {profilingResult && profilingResult.algorithmRecommendations.length > 0 && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-800 uppercase tracking-wide">
                  Algorithm Recommendations
                </span>
              </div>
              <div className="space-y-2">
                {profilingResult.algorithmRecommendations.slice(0, 3).map((rec, idx) => (
                  <div key={rec.algorithm} className="flex items-start gap-2 text-xs">
                    <span className="flex-shrink-0 font-bold text-purple-700">{idx + 1}.</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{rec.name}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getConfidenceBadgeColor(rec.confidence)}`}>
                          {rec.confidenceScore}% match
                        </span>
                        <span className="text-gray-600">~{rec.estimatedTrainingTime}</span>
                      </div>
                      <p className="mt-1 text-gray-700">{rec.reasoning[0]}</p>
                      {rec.pros.length > 0 && (
                        <div className="mt-1 text-emerald-700">
                          ✓ {rec.pros.slice(0, 2).join(' • ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <ModelAlgorithms 
            selectedAlgorithms={algorithms}
            onAlgorithmSelect={toggleAlgorithm}
            modelType={modelType as 'classification' | 'regression'}
          />
        </div>

        <div>
          <label htmlFor="trainTestSplit" className="block text-sm font-medium text-gray-700">
            Training/Test Split: {Math.round(trainTestSplit * 100)}% / {100 - Math.round(trainTestSplit * 100)}%
          </label>
          <input
            type="range"
            id="trainTestSplit"
            min="0.5"
            max="0.9"
            step="0.05"
            value={trainTestSplit}
            onChange={(e) => setTrainTestSplit(parseFloat(e.target.value))}
            className="w-full h-2 mt-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>50/50</span>
            <span>90/10</span>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="hyperparameterTuning"
              name="hyperparameterTuning"
              type="checkbox"
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary"
              checked={hyperparameterTuning}
              onChange={(e) => setHyperparameterTuning(e.target.checked)}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="hyperparameterTuning" className="font-medium text-gray-700">
              Hyperparameter Tuning
            </label>
            <p className="text-gray-500">
              Automatically optimize model parameters for best performance
            </p>
          </div>
        </div>

        {hyperparameterTuning && (
          <div>
            <label htmlFor="optimizationMetric" className="block text-sm font-medium text-gray-700">
              Optimization Metric
            </label>
            <select
              id="optimizationMetric"
              name="optimizationMetric"
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              value={optimizationMetric}
              onChange={(e) => setOptimizationMetric(e.target.value)}
            >
              {modelType === 'classification' ? (
                <>
                  <option value="accuracy">Accuracy</option>
                  <option value="precision">Precision</option>
                  <option value="recall">Recall</option>
                  <option value="f1">F1 Score</option>
                  <option value="auc">AUC</option>
                </>
              ) : (
                <>
                  <option value="mse">Mean Squared Error</option>
                  <option value="rmse">Root Mean Squared Error</option>
                  <option value="mae">Mean Absolute Error</option>
                  <option value="r2">R² Score</option>
                </>
              )}
            </select>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <button
            type="button"
            className="flex items-center text-sm text-primary-600 hover:text-primary"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
            <svg
              className={`ml-1 h-5 w-5 transform ${
                showAdvancedOptions ? 'rotate-180' : ''
              } transition-transform`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {showAdvancedOptions && (
          <div className="space-y-6 pt-2">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Cross-Validation</h4>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                  ⚠️ Simulated Data
                </span>
              </div>
              <CrossValidation 
                folds={crossValidationFolds}
                onFoldsChange={setCrossValidationFolds}
                validationResults={validationResults ?? undefined}
              />
              
              {!validationResults && targetVariable && algorithms.length > 0 && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRunCrossValidation}
                    disabled={isValidating}
                  >
                    {isValidating ? 'Running...' : 'Run Cross-Validation (Simulated)'}
                  </Button>
                  <p className="mt-2 text-xs text-gray-500">
                    Note: Cross-validation currently uses simulated data. Real backend integration coming soon.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <InfoIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Advanced Configuration</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Cross-validation helps ensure your model generalizes well to new data by
                      training and evaluating on different subsets of your dataset.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-5">
          <Button
            type="submit"
            icon={<BarChart2 className="w-4 h-4" />}
            disabled={!targetVariable || algorithms.length === 0}
          >
            Start Training
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ModelTrainingForm;
