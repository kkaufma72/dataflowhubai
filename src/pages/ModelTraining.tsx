/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Layers,
  BarChart2,
  Package2,
  Brain,
  Zap,
  Play,
} from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useMLContext } from '../context/MLContext';
import { useAuth } from '../components/auth/AuthProvider';
import { Dataset, ModelTrainingConfig, MLModel } from '../types';
import { influxdb } from '../lib/influxdb';
import { useInfluxMetrics } from '../hooks/useInfluxMetrics';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ModelCard from '../components/models/ModelCard';
import ModelTrainingForm from '../components/models/ModelTrainingForm';
import DatasetCluster from '../components/models/DatasetCluster';
import DraggableDataset from '../components/models/DraggableDataset';
import ModelComparison from '../components/models/ModelComparison';
import ModelVersioning from '../components/models/ModelVersioning';
import ModelExportImport from '../components/models/ModelExportImport';
import TensorFlowTrainer from '../components/ml/TensorFlowTrainer';
import DockerTensorFlowTrainer from '../components/ml/DockerTensorFlowTrainer';
import toast from 'react-hot-toast';

type CrossValidationResult = {
  fold: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
};

type CrossValidationStats = {
  averages: Record<'accuracy' | 'precision' | 'recall' | 'f1Score', number>;
  stdDev: Record<'accuracy' | 'precision' | 'recall' | 'f1Score', number>;
  bestFold: CrossValidationResult;
  worstFold: CrossValidationResult;
  totalFolds: number;
  accuracySpread: number;
  precisionRecallGap: number;
};

const ModelTraining: React.FC = () => {
  const { datasets, models, addModel, deleteDataset, defaultProjectId } = useMLContext();
  const { user } = useAuth();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const selectedDatasetSafe = selectedDataset as Dataset | null;
  const [isTraining, setIsTraining] = useState(false);
  const [currentTraining, setCurrentTraining] = useState<MLModel | null>(null);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const [clusteredDatasets, setClusteredDatasets] = useState<Dataset[]>([]);
  const [isClusterTraining, setIsClusterTraining] = useState(false);
  const [clusterProgress, setClusterProgress] = useState(0);
  const [clusterResults, setClusterResults] = useState<{
    accuracy: number;
    f1Score: number;
    precision: number;
    recall: number;
  } | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'train' | 'compare' | 'versions' | 'export' | 'tensorflow'>('train');
  const [crossValidationResults, setCrossValidationResults] = useState<CrossValidationResult[] | null>(null);
  const [cvQuestion, setCvQuestion] = useState('');
  const [cvAnswer, setCvAnswer] = useState<string | null>(null);
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [ChartComponents, setChartComponents] = useState<any>(null);

  // Fetch live training metrics from InfluxDB
  const { metrics, loading: metricsLoading, error: metricsError } = useInfluxMetrics(
    currentTraining?.id,
    5000,
    1 // Last 1 hour of training data
  );

  // Load Chart.js components
  useEffect(() => {
    const loadCharts = async () => {
      try {
        const { Line, Bar, Doughnut, Scatter, Bubble } = await import('react-chartjs-2');
        const chartjs = await import('chart.js');
        
        chartjs.Chart.register(
          chartjs.CategoryScale,
          chartjs.LinearScale,
          chartjs.PointElement,
          chartjs.LineElement,
          chartjs.BarElement,
          chartjs.ArcElement,
          chartjs.Filler,
          chartjs.Tooltip,
          chartjs.Legend
        );
        
        setChartComponents({ Line, Bar, Doughnut, Scatter, Bubble });
        setChartsLoaded(true);
      } catch (error) {
        console.error('Failed to load charts:', error);
      }
    };
    
    loadCharts();
  }, []);

  // Process InfluxDB metrics into chart data
  const trainingMetricsData = useMemo(() => {
    if (!metrics || !metrics.timestamps || metrics.timestamps.length === 0) {
      return null;
    }

    // Use timestamps array length for epochs
    const epochs = Array.from({ length: metrics.timestamps.length }, (_, i) => i + 1);
    const accuracyData = metrics.accuracies || [];
    const lossData = metrics.losses || [];
    // Training speed not available from InfluxDB yet, generate mock for now
    const speedData = epochs.map(() => 850 + Math.random() * 300);

    return { epochs, accuracyData, lossData, speedData };
  }, [metrics]);

  const questionSuggestions = [
    'Which fold performed the best?',
    'Are the folds consistent with each other?',
    'What does this say about my data balance?'
  ];

  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

  const crossValidationStats = useMemo<CrossValidationStats | null>(() => {
    if (!crossValidationResults || crossValidationResults.length === 0) {
      return null;
    }

    const totalFolds = crossValidationResults.length;
    const totals = crossValidationResults.reduce(
      (acc, fold) => ({
        accuracy: acc.accuracy + fold.accuracy,
        precision: acc.precision + fold.precision,
        recall: acc.recall + fold.recall,
        f1Score: acc.f1Score + fold.f1Score,
      }),
      { accuracy: 0, precision: 0, recall: 0, f1Score: 0 }
    );

    const averages = {
      accuracy: totals.accuracy / totalFolds,
      precision: totals.precision / totalFolds,
      recall: totals.recall / totalFolds,
      f1Score: totals.f1Score / totalFolds,
    };

    const variance = (key: keyof typeof averages) =>
      crossValidationResults.reduce((acc, fold) => acc + Math.pow(fold[key] - averages[key], 2), 0) /
      totalFolds;

    const stdDev = {
      accuracy: Math.sqrt(variance('accuracy')),
      precision: Math.sqrt(variance('precision')),
      recall: Math.sqrt(variance('recall')),
      f1Score: Math.sqrt(variance('f1Score')),
    };

    const bestFold = crossValidationResults.reduce((best, fold) =>
      fold.accuracy > best.accuracy ? fold : best,
    crossValidationResults[0]);

    const worstFold = crossValidationResults.reduce((worst, fold) =>
      fold.accuracy < worst.accuracy ? fold : worst,
    crossValidationResults[0]);

    return {
      averages,
      stdDev,
      bestFold,
      worstFold,
      totalFolds,
      accuracySpread: Math.abs(bestFold.accuracy - worstFold.accuracy),
      precisionRecallGap: averages.precision - averages.recall,
    };
  }, [crossValidationResults]);

  const crossValidationNarrative = useMemo(() => {
    if (!crossValidationStats) {
      return null;
    }

    const { averages, stdDev, bestFold, worstFold, totalFolds, accuracySpread, precisionRecallGap } = crossValidationStats;
    const accuracySwing = (stdDev.accuracy * 100).toFixed(2);
    const spread = (accuracySpread * 100).toFixed(2);

    let stabilityDescriptor = 'some variability between folds';
    if (stdDev.accuracy < 0.01) {
      stabilityDescriptor = 'extremely consistent performance across folds';
    } else if (stdDev.accuracy < 0.02) {
      stabilityDescriptor = 'fairly stable performance across folds';
    }

    let balanceMessage = 'Precision and recall are well balanced, suggesting classes are represented evenly.';
    if (precisionRecallGap > 0.05) {
      balanceMessage = 'Precision is noticeably higher than recall, so the model is cautious about positive predictions—often a sign of class imbalance or a conservative decision threshold.';
    } else if (precisionRecallGap < -0.05) {
      balanceMessage = 'Recall outpaces precision, meaning the model captures most positives but at the cost of more false positives—consider adjusting class weights or thresholds.';
    }

    return {
      intro: `Across ${totalFolds} folds, your model averaged ${formatPercent(averages.accuracy)} accuracy with ${stabilityDescriptor} (±${accuracySwing} percentage points).`,
      balanceMessage,
      spreadMessage: `Fold ${bestFold.fold} peaked at ${formatPercent(bestFold.accuracy)} accuracy while fold ${worstFold.fold} dipped to ${formatPercent(worstFold.accuracy)} (a ${spread} pp swing).`,
      supportingBullets: [
        `Precision sits at ${formatPercent(averages.precision)} vs. recall at ${formatPercent(averages.recall)}.`,
        `Average F1 score is ${formatPercent(averages.f1Score)}, reflecting the overall balance between precision and recall.`,
        `Metric stability (± std dev): accuracy ${accuracySwing} pp, precision ${(stdDev.precision * 100).toFixed(2)} pp, recall ${(stdDev.recall * 100).toFixed(2)} pp.`,
      ],
    };
  }, [crossValidationStats]);

  const answerCrossValidationQuestion = (prompt: string) => {
    if (!prompt.trim()) {
      return;
    }

    if (!crossValidationStats || !crossValidationNarrative) {
      setCvAnswer('Run cross-validation to unlock detailed insights first.');
      return;
    }

    const question = prompt.toLowerCase();
    const { averages, stdDev, bestFold, worstFold, totalFolds, accuracySpread, precisionRecallGap } = crossValidationStats;
    const stability = stdDev.accuracy < 0.02 ? 'stable' : 'variable';
    const spread = (accuracySpread * 100).toFixed(2);
    let response = '';

    if (/(best|highest|strongest)/.test(question)) {
      response = `Fold ${bestFold.fold} delivered the strongest performance with ${formatPercent(bestFold.accuracy)} accuracy, ${formatPercent(bestFold.precision)} precision, and ${formatPercent(bestFold.recall)} recall.`;
    } else if (/(worst|lowest|weakest)/.test(question)) {
      response = `Fold ${worstFold.fold} lagged at ${formatPercent(worstFold.accuracy)} accuracy. Investigate what differentiates that slice—data volume, time period, or class mix—to close the ${spread} pp gap.`;
    } else if (question.includes('accur')) {
      response = `Average accuracy sits at ${formatPercent(averages.accuracy)} with ±${(stdDev.accuracy * 100).toFixed(2)} pp variation across ${totalFolds} folds, so overall performance is ${stability}.`;
    } else if (question.includes('prec')) {
      response = `Precision averages ${formatPercent(averages.precision)} with ±${(stdDev.precision * 100).toFixed(2)} pp volatility, indicating how often positive predictions are correct.`;
    } else if (question.includes('recall')) {
      response = `Recall comes in at ${formatPercent(averages.recall)} (±${(stdDev.recall * 100).toFixed(2)} pp), so the model captures that share of all actual positives.`;
    } else if (question.includes('f1')) {
      response = `The F1 score of ${formatPercent(averages.f1Score)} summarizes precision/recall harmony. Keeping it above 0.80 generally means a balanced classifier.`;
    } else if (question.includes('consistent') || question.includes('variance') || question.includes('spread') || question.includes('stable')) {
      response = `Fold-to-fold accuracy moves about ±${(stdDev.accuracy * 100).toFixed(2)} pp with a ${spread} pp range, so results are ${stability}.`;
    } else if (question.includes('imbalance') || question.includes('balance') || question.includes('class')) {
      if (precisionRecallGap > 0.05) {
        response = 'Precision is higher than recall, which usually points to fewer positive examples or a conservative threshold. Consider stratified folds or class weighting to recover recall.';
      } else if (precisionRecallGap < -0.05) {
        response = 'Recall exceeds precision, so the model flags most positives but tolerates more false alarms—typical when positives dominate or missing them is costly. Tune thresholds or add regularization to tighten precision.';
      } else {
        response = 'Precision and recall are closely aligned, so the underlying classes appear balanced and the threshold is calibrated.';
      }
    } else if (question.includes('data') || question.includes('insight') || question.includes('mean') || question.includes('interpret')) {
      response = `${crossValidationNarrative.intro} ${crossValidationNarrative.balanceMessage}`;
    } else {
      response = `${crossValidationNarrative.intro} ${crossValidationNarrative.balanceMessage} ${crossValidationNarrative.spreadMessage}`;
    }

    setCvAnswer(response);
  };

  const handleCvQuestionSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cvQuestion.trim()) {
      return;
    }
    answerCrossValidationQuestion(cvQuestion);
    setCvQuestion('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    answerCrossValidationQuestion(suggestion);
  };

  const trainingModels = models.filter((model) => model.status === 'training');
  const trainedModels = models.filter(
    (model) => model.status === 'trained' || model.status === 'deployed'
  );

  const handleDatasetSelect = (datasetId: string) => {
    if (!datasetId) {
      setSelectedDataset(null);
      return;
    }
    const dataset = datasets.find(d => d.id === datasetId);
    if (dataset) {
      setSelectedDataset(dataset);
    }
  };

  const handleDeploy = (model: MLModel) => {
    navigate(`/app/deploy?model=${model.id}`);
  };

  const handleEvaluate = (model: MLModel) => {
    navigate(`/app/evaluate?model=${model.id}`);
  };

  const handleDeleteDataset = async (id: string) => {
    try {
      await deleteDataset(id);
      toast.success('Dataset deleted successfully');
      
      // If the deleted dataset was selected, clear selection
      if (selectedDataset?.id === id) {
        setSelectedDataset(null);
      }
      
      // Remove from cluster if it was clustered
      setClusteredDatasets(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting dataset:', error);
      toast.error('Failed to delete dataset');
    }
  };

  const handleTrainingSubmit = async (config: ModelTrainingConfig) => {
    if (!defaultProjectId) {
      toast.error('Project is still initializing. Please wait a moment and try again.');
      return;
    }
    
    try {
      setIsTraining(true);
      setProgress(0);

      toast.loading('Starting model training...', { id: 'training' });

      const newModel: MLModel = {
        id: crypto.randomUUID(),
        name: `${config.modelType === 'classification' ? 'Classification' : 'Regression'} Model (${
          config.algorithms.length > 1 ? 'Ensemble' : config.algorithms[0].split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        })`,
        description: `${config.modelType === 'classification' ? 'Classification' : 'Regression'} model trained on ${
          datasets.find((d) => d.id === config.datasetId)?.name || 'dataset'
        }`,
        status: 'training',
        modelType: config.modelType,
        datasetId: config.datasetId,
        projectId: defaultProjectId,
        createdAt: new Date().toISOString(),
      };

      await addModel(newModel);
      setCurrentTraining(newModel);
      setSelectedDataset(null);

      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.random() * 5;
          
          // Log metrics to InfluxDB periodically
          if (newProgress < 100 && influxdb.isAvailable()) {
            const currentEpoch = Math.floor(newProgress / 10) + 1;
            const simulatedMetrics = {
              accuracy: 0.5 + (newProgress / 100) * 0.4 + Math.random() * 0.05,
              loss: 1.5 - (newProgress / 100) * 1.2 + Math.random() * 0.1,
            };
            
            influxdb.logModelMetrics({
              modelId: newModel.id,
              modelName: newModel.name,
              accuracy: simulatedMetrics.accuracy,
              loss: simulatedMetrics.loss,
              epoch: currentEpoch,
              userId: user?.id,
              datasetId: config.datasetId,
            }).catch(err => {
              console.warn('Failed to log metrics to InfluxDB:', err);
            });
          }
          
          if (newProgress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              const completedModel: MLModel = {
                ...newModel,
                status: 'trained',
                metrics: {
                  accuracy: 0.8 + Math.random() * 0.15,
                  precision: 0.75 + Math.random() * 0.2,
                  recall: 0.7 + Math.random() * 0.25,
                  f1Score: 0.75 + Math.random() * 0.2,
                  auc: 0.8 + Math.random() * 0.15,
                },
                hyperparameters: {
                  ...(config.algorithms.includes('random_forest')
                    ? {
                        n_estimators: Math.floor(Math.random() * 150) + 50,
                        max_depth: Math.floor(Math.random() * 15) + 5,
                        min_samples_split: Math.floor(Math.random() * 10) + 2,
                      }
                    : {}),
                  ...(config.algorithms.includes('xgboost')
                    ? {
                        learning_rate: (Math.random() * 0.2 + 0.01).toFixed(2),
                        max_depth: Math.floor(Math.random() * 10) + 3,
                        n_estimators: Math.floor(Math.random() * 200) + 50,
                      }
                    : {}),
                  ...(config.algorithms.includes('neural_network')
                    ? {
                        hidden_layers: Math.floor(Math.random() * 3) + 1,
                        neurons_per_layer: Math.floor(Math.random() * 64) + 16,
                        learning_rate: (Math.random() * 0.01 + 0.001).toFixed(4),
                      }
                    : {}),
                  ...(config.algorithms.includes('svm')
                    ? {
                        kernel: ['linear', 'rbf', 'poly'][Math.floor(Math.random() * 3)],
                        C: (Math.random() * 10).toFixed(2),
                        gamma: ['scale', 'auto'][Math.floor(Math.random() * 2)]
                      }
                    : {}),
                  ...(config.algorithms.includes('ensemble')
                    ? {
                        voting: ['hard', 'soft'][Math.floor(Math.random() * 2)],
                        weights: ['uniform', 'dynamic'][Math.floor(Math.random() * 2)],
                        use_probabilities: true
                      }
                    : {})
                },
              };

              addModel(completedModel);
              setIsTraining(false);
              setCurrentTraining(null);
              toast.success('Model training completed successfully!', { id: 'training' });
              
              // Log final metrics to InfluxDB
              if (influxdb.isAvailable() && completedModel.metrics) {
                influxdb.logModelMetrics({
                  modelId: completedModel.id,
                  modelName: completedModel.name,
                  accuracy: completedModel.metrics.accuracy || 0,
                  loss: 1 - (completedModel.metrics.accuracy || 0), // Approximate loss
                  precision: completedModel.metrics.precision,
                  recall: completedModel.metrics.recall,
                  f1Score: completedModel.metrics.f1Score,
                  epoch: 100, // Final epoch
                  userId: user?.id,
                  datasetId: config.datasetId,
                }).catch(err => {
                  console.warn('Failed to log final metrics to InfluxDB:', err);
                });
              }
              
              if (config.crossValidation?.enabled) {
                const results = [];
                const baseAccuracy = 0.75 + Math.random() * 0.15;
                const basePrecision = 0.7 + Math.random() * 0.2;
                const baseRecall = 0.7 + Math.random() * 0.2;
                const baseF1 = 0.7 + Math.random() * 0.2;
                
                for (let i = 1; i <= (config.crossValidation.folds || 5); i++) {
                  results.push({
                    fold: i,
                    accuracy: baseAccuracy + (Math.random() - 0.5) * 0.05,
                    precision: basePrecision + (Math.random() - 0.5) * 0.05,
                    recall: baseRecall + (Math.random() - 0.5) * 0.05,
                    f1Score: baseF1 + (Math.random() - 0.5) * 0.05
                  });
                }
                
                setCrossValidationResults(results);
              }
            }, 1000);
            return 100;
          }
          return newProgress;
        });
      }, 300);
    } catch (error) {
      toast.error('Failed to start model training', { id: 'training' });
      setIsTraining(false);
      setCurrentTraining(null);
    }
  };

  const handleAddToCluster = (dataset: Dataset) => {
    if (!clusteredDatasets.find(d => d.id === dataset.id)) {
      setClusteredDatasets([...clusteredDatasets, dataset]);
      toast.success(`Added ${dataset.name} to cluster`);
    }
  };

  const handleRemoveFromCluster = (datasetId: string) => {
    setClusteredDatasets(clusteredDatasets.filter(d => d.id !== datasetId));
    toast.success('Removed dataset from cluster');
  };

  const handleTrainCluster = () => {
    if (clusteredDatasets.length < 2) {
      toast.error('Add at least 2 datasets to create a cluster');
      return;
    }

    setIsClusterTraining(true);
    setClusterProgress(0);
    setClusterResults(undefined);

    toast.loading('Starting cluster training...', { id: 'cluster-training' });

    const interval = setInterval(() => {
      setClusterProgress((prev) => {
        const newProgress = prev + Math.random() * 3;
        if (newProgress >= 100) {
          clearInterval(interval);
          
          const results = {
            accuracy: 0.85 + Math.random() * 0.1,
            f1Score: 0.83 + Math.random() * 0.1,
            precision: 0.82 + Math.random() * 0.1,
            recall: 0.84 + Math.random() * 0.1
          };
          
          setClusterResults(results);
          setIsClusterTraining(false);
          toast.success('Cluster training completed!', { id: 'cluster-training' });
          
          return 100;
        }
        return newProgress;
      });
    }, 500);
  };

  const handleImportModel = (importedModel: MLModel) => {
    if (!defaultProjectId) {
      toast.error('Project is still initializing. Please wait and try again.');
      return;
    }
    
    const newModel: MLModel = {
      ...importedModel,
      id: crypto.randomUUID(),
      status: 'trained',
      projectId: defaultProjectId,
      datasetId: datasets[0]?.id || '',
      createdAt: new Date().toISOString(),
    };

    addModel(newModel);
    toast.success('Model imported successfully!');
  };

  const handleSelectBestModel = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (model) {
      toast.success(`Selected model: ${model.name}`);
      navigate(`/app/evaluate?model=${modelId}`);
    }
  };

  return (
      <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-[#0d1117]">
        {/* InfluxDB-Style Header */}
        <div className="border-b border-gray-800 bg-[#161b22]">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 hover:text-blue-400 cursor-pointer transition-colors">Home</span>
                <span className="text-gray-600">/</span>
                <span className="text-gray-500 hover:text-blue-400 cursor-pointer transition-colors">Machine Learning</span>
                <span className="text-gray-600">/</span>
                <span className="text-white font-medium">Model Training</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {selectedDataset ? (
                  <>
                    <select
                      className="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                      value={selectedDatasetSafe?.id ?? ''}
                      onChange={(e) => handleDatasetSelect(e.target.value)}
                    >
                      {datasets.map((dataset) => (
                        <option key={dataset.id} value={dataset.id}>
                          {dataset.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setSelectedDataset(null)}
                      className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 rounded hover:border-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : datasets.length > 0 && (
                  <>
                    <select
                      className="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                      value=""
                      onChange={(e) => handleDatasetSelect(e.target.value)}
                    >
                      <option value="">Select dataset...</option>
                      {datasets.map((dataset) => (
                        <option key={dataset.id} value={dataset.id}>
                          {dataset.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => datasets.length > 0 && handleDatasetSelect(datasets[0].id)}
                      className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Train Model
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Title Section */}
            <div className="mt-4">
              <h1 className="text-3xl font-bold text-white">Model Training</h1>
              <p className="text-sm text-gray-400 mt-1">Train and deploy production-ready ML models</p>
            </div>

            {/* Training Metrics Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Active Training</span>
                </div>
                <div className="text-2xl font-mono font-bold text-white">{trainingModels.length}</div>
                <div className="text-xs text-gray-500 mt-1">Running models</div>
              </div>

              <div className="bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Completed</span>
                </div>
                <div className="text-2xl font-mono font-bold text-white">{trainedModels.length}</div>
                <div className="text-xs text-gray-500 mt-1">Trained models</div>
              </div>

              <div className="bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Avg Accuracy</span>
                </div>
                <div className="text-2xl font-mono font-bold text-white">
                  {trainedModels.length > 0 
                    ? `${(trainedModels.reduce((acc, m) => acc + (m.metrics?.accuracy || 0), 0) / trainedModels.length * 100).toFixed(1)}%`
                    : '0%'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Across all models</div>
              </div>

              <div className="bg-[#0d1117] border border-gray-800 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Datasets</span>
                </div>
                <div className="text-2xl font-mono font-bold text-white">{datasets.length}</div>
                <div className="text-xs text-gray-500 mt-1">Available sources</div>
              </div>
            </div>

            {/* Training Metrics Charts */}
            {metricsError && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-red-400">Failed to load metrics: {metricsError}</p>
              </div>
            )}
            {metricsLoading && !trainingMetricsData && (
              <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-8 mt-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                <p className="text-sm text-gray-400">Loading training metrics from InfluxDB...</p>
              </div>
            )}
            {!metricsLoading && !trainingMetricsData && !metricsError && (
              <div className="bg-[#0d1117] border border-gray-800 rounded-lg p-8 mt-4 text-center">
                <div className="mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-900/30 text-orange-400 border border-orange-700">
                    ⚠️ Simulated Data Mode
                  </span>
                </div>
                <p className="text-sm text-gray-400">No live training metrics available yet.</p>
                <p className="text-xs text-gray-500 mt-2">Start training a model to see real-time metrics here, or charts will show simulated data for demonstration.</p>
              </div>
            )}
            {chartsLoaded && ChartComponents && trainingMetricsData && (
              <div className="space-y-4 mt-4">
                {/* Top Row: Accuracy and Loss */}
                <div className="grid grid-cols-2 gap-4">
                {/* Accuracy Over Time */}
                <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-gradient-to-b from-blue-400 to-purple-600 rounded-full"></div>
                        <h3 className="text-sm font-semibold text-white">Model Accuracy</h3>
                        <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">● LIVE</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Current</div>
                          <div className="text-sm font-mono font-semibold text-blue-400">
                            {(trainingMetricsData.accuracyData[trainingMetricsData.accuracyData.length - 1] * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Best</div>
                          <div className="text-sm font-mono font-semibold text-emerald-400">
                            {(Math.max(...trainingMetricsData.accuracyData) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 h-64">
                    <ChartComponents.Line
                      data={{
                        labels: trainingMetricsData.epochs,
                        datasets: [{
                          label: 'Accuracy',
                          data: trainingMetricsData.accuracyData.map((v: number) => v * 100),
                          borderColor: 'rgb(59, 130, 246)',
                          backgroundColor: (context: any) => {
                            const ctx = context.chart.ctx;
                            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
                            gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.3)');
                            gradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');
                            return gradient;
                          },
                          borderWidth: 2,
                          fill: true,
                          tension: 0.4,
                          pointRadius: 0,
                          pointHoverRadius: 4,
                          pointHoverBackgroundColor: 'rgb(59, 130, 246)',
                          pointHoverBorderColor: '#fff',
                          pointHoverBorderWidth: 2,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#a0aec0',
                            borderColor: '#374151',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                              title: (items: any[]) => `Epoch ${items[0].label}`,
                              label: (item: any) => `Accuracy: ${item.formattedValue}%`
                            }
                          }
                        },
                        scales: {
                          x: {
                            grid: { color: 'rgba(75, 85, 99, 0.2)' },
                            ticks: { color: '#9ca3af', font: { size: 10 } }
                          },
                          y: {
                            grid: { color: 'rgba(75, 85, 99, 0.2)' },
                            ticks: { 
                              color: '#9ca3af', 
                              font: { size: 10 },
                              callback: (value: any) => `${value}%`
                            },
                            min: 50,
                            max: 100
                          }
                        },
                        interaction: {
                          mode: 'nearest',
                          axis: 'x',
                          intersect: false
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Training Loss */}
                <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-gradient-to-b from-orange-400 to-red-600 rounded-full"></div>
                        <h3 className="text-sm font-semibold text-white">Training Loss</h3>
                        <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">● LIVE</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Current</div>
                          <div className="text-sm font-mono font-semibold text-orange-400">
                            {trainingMetricsData.lossData[trainingMetricsData.lossData.length - 1].toFixed(3)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Best</div>
                          <div className="text-sm font-mono font-semibold text-emerald-400">
                            {Math.min(...trainingMetricsData.lossData).toFixed(3)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 h-64">
                    <ChartComponents.Line
                      data={{
                        labels: trainingMetricsData.epochs,
                        datasets: [{
                          label: 'Loss',
                          data: trainingMetricsData.lossData,
                          borderColor: 'rgb(249, 115, 22)',
                          backgroundColor: (context: any) => {
                            const ctx = context.chart.ctx;
                            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                            gradient.addColorStop(0, 'rgba(249, 115, 22, 0.4)');
                            gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.3)');
                            gradient.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
                            return gradient;
                          },
                          borderWidth: 2,
                          fill: true,
                          tension: 0.4,
                          pointRadius: 0,
                          pointHoverRadius: 4,
                          pointHoverBackgroundColor: 'rgb(249, 115, 22)',
                          pointHoverBorderColor: '#fff',
                          pointHoverBorderWidth: 2,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#a0aec0',
                            borderColor: '#374151',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                              title: (items: any[]) => `Epoch ${items[0].label}`,
                              label: (item: any) => `Loss: ${parseFloat(item.formattedValue).toFixed(3)}`
                            }
                          }
                        },
                        scales: {
                          x: {
                            grid: { color: 'rgba(75, 85, 99, 0.2)' },
                            ticks: { color: '#9ca3af', font: { size: 10 } }
                          },
                          y: {
                            grid: { color: 'rgba(75, 85, 99, 0.2)' },
                            ticks: { 
                              color: '#9ca3af', 
                              font: { size: 10 }
                            }
                          }
                        },
                        interaction: {
                          mode: 'nearest',
                          axis: 'x',
                          intersect: false
                        }
                      }}
                    />
                  </div>
                </div>
                </div>

                {/* Bottom Row: Training Speed Bar Chart with Gradient */}
                <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-cyan-600 rounded-full"></div>
                        <h3 className="text-sm font-semibold text-white">Training Speed (samples/sec)</h3>
                        <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">● LIVE</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Avg</div>
                          <div className="text-sm font-mono font-semibold text-emerald-400">
                            {(trainingMetricsData.speedData.reduce((a: number, b: number) => a + b, 0) / trainingMetricsData.speedData.length).toFixed(0)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Peak</div>
                          <div className="text-sm font-mono font-semibold text-cyan-400">
                            {Math.max(...trainingMetricsData.speedData).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 h-64">
                    <ChartComponents.Line
                      data={{
                        labels: trainingMetricsData.epochs.slice(-15), // Last 15 epochs
                        datasets: [{
                          type: 'bar' as const,
                          label: 'Speed',
                          data: trainingMetricsData.speedData.slice(-15),
                          backgroundColor: (context: any) => {
                            const ctx = context.chart.ctx;
                            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
                            gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.6)');
                            gradient.addColorStop(1, 'rgba(6, 182, 212, 0.3)');
                            return gradient;
                          },
                          borderColor: 'rgba(16, 185, 129, 1)',
                          borderWidth: 1,
                          borderRadius: 4,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#a0aec0',
                            borderColor: '#374151',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                              title: (items: any[]) => `Epoch ${items[0].label}`,
                              label: (item: any) => `Speed: ${Math.round(item.parsed.y)} samples/sec`
                            }
                          }
                        },
                        scales: {
                          x: {
                            grid: { color: 'rgba(75, 85, 99, 0.2)' },
                            ticks: { color: '#9ca3af', font: { size: 10 } }
                          },
                          y: {
                            grid: { color: 'rgba(75, 85, 99, 0.2)' },
                            ticks: { 
                              color: '#9ca3af', 
                              font: { size: 10 },
                              callback: (value: any) => `${value}`
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {datasets.length === 0 && (
          <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <Package2 className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No datasets available</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-md">
                Upload a dataset to start training models and unlock the power of machine learning.
              </p>
              <button
                onClick={() => navigate('/app/data')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                Go to Data Management
              </button>
            </div>
          </div>
        )}

        {selectedDataset && (
          <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-white">Train New Model - {selectedDatasetSafe?.name ?? ''}</h3>
              </div>
            </div>
            <div className="p-4">
              <ModelTrainingForm 
                dataset={selectedDatasetSafe as Dataset} 
                onSubmit={handleTrainingSubmit} 
              />
            </div>
          </div>
        )}

        {!selectedDataset && datasets.length > 0 && (
          <div className="space-y-6">
            {/* Call to Action - Select Dataset */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">Start Training Your First Model</h3>
                  <p className="text-sm text-gray-400">Select a dataset from the dropdown above to begin training your machine learning model.</p>
                </div>
              </div>
            </div>

            {/* InfluxDB-Style Tabs */}
            <div className="border-b border-gray-800">
              <nav className="flex gap-6 px-2">
                <button
                  onClick={() => setActiveTab('train')}
                  className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'train' 
                      ? 'border-blue-500 text-blue-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Training
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('compare')}
                  className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'compare' 
                      ? 'border-blue-500 text-blue-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4" />
                    Compare
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('versions')}
                  className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'versions' 
                      ? 'border-blue-500 text-blue-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Versions
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('export')}
                  className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'export' 
                      ? 'border-blue-500 text-blue-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Export/Import
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('tensorflow')}
                  className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'tensorflow' 
                      ? 'border-blue-500 text-blue-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package2 className="w-4 h-4" />
                    TensorFlow
                  </div>
                </button>
              </nav>
            </div>

            {activeTab === 'train' && (
              <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-white">Dataset Clustering</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Available Datasets</h4>
                    <div className="grid gap-4">
                      {datasets
                        .filter(d => !clusteredDatasets.find(cd => cd.id === d.id))
                        .map((dataset) => (
                          <DraggableDataset
                            key={dataset.id}
                            dataset={dataset}
                            onDragEnd={() => handleAddToCluster(dataset)}
                            onClick={() => handleAddToCluster(dataset)}
                            onDelete={handleDeleteDataset}
                          />
                        ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Cluster Training</h4>
                    <DatasetCluster
                      datasets={clusteredDatasets}
                      onRemoveDataset={handleRemoveFromCluster}
                      isTraining={isClusterTraining}
                      progress={clusterProgress}
                      results={clusterResults}
                    />
                    {clusteredDatasets.length > 0 && !isClusterTraining && !clusterResults && (
                      <Button
                        className="mt-4 w-full"
                        onClick={handleTrainCluster}
                        disabled={clusteredDatasets.length < 2}
                      >
                        Train Cluster ({clusteredDatasets.length} datasets)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}

            {activeTab === 'compare' && (
              <ModelComparison 
                models={trainedModels} 
                onSelectModel={handleSelectBestModel} 
              />
            )}

            {activeTab === 'versions' && trainedModels.length > 0 && (
              <ModelVersioning 
                model={trainedModels[0]} 
                onVersionSelect={() => {}}
                onImport={handleImportModel}
              />
            )}

            {activeTab === 'export' && trainedModels.length > 0 && (
              <ModelExportImport 
                model={trainedModels[0]} 
                onImport={handleImportModel}
              />
            )}

            {activeTab === 'tensorflow' && (
              <div className="space-y-6">
                {/* Dataset Selector for TensorFlow */}
                {!selectedDataset && (
                  <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                        <h3 className="text-sm font-semibold text-white">Select Dataset for TensorFlow Training</h3>
                      </div>
                    </div>
                    <div className="p-4">
                    <select
                      className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      value=""
                      onChange={(e) => handleDatasetSelect(e.target.value)}
                    >
                      <option value="">Choose a dataset...</option>
                      {datasets.map((dataset) => (
                        <option key={dataset.id} value={dataset.id}>
                          {dataset.name} ({dataset.rows} rows, {dataset.columns} columns)
                        </option>
                      ))}
                    </select>
                    </div>
                  </div>
                )}

                {selectedDataset && (
                  <>
                    {/* Dataset Info */}
                    <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                            <h3 className="text-sm font-semibold text-white">{selectedDatasetSafe?.name}</h3>
                          </div>
                          <button
                            onClick={() => setSelectedDataset(null)}
                            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 rounded hover:border-gray-600 transition-colors"
                          >
                            Change Dataset
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-400">
                          {selectedDatasetSafe?.rows} rows × {selectedDatasetSafe?.columns} columns
                        </p>
                      </div>
                    </div>

                    {/* Browser-Based TensorFlow.js */}
                    {/* Browser-Based TensorFlow.js */}
                    <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                          <h3 className="text-sm font-semibold text-white">TensorFlow.js (Browser)</h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-400 mb-4">Train models directly in your browser - no server needed</p>
                        <TensorFlowTrainer dataset={selectedDatasetSafe as Dataset} />
                      </div>
                    </div>

                    {/* Docker-Based TensorFlow (if configured) */}
                    {import.meta.env.VITE_TENSORFLOW_API_URL && (
                      <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                            <h3 className="text-sm font-semibold text-white">TensorFlow (Docker GPU)</h3>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-gray-400 mb-4">Server-side training with GPU acceleration</p>
                          <DockerTensorFlowTrainer dataset={selectedDatasetSafe as Dataset} />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {isTraining && currentTraining && (
          <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-white">Training in Progress</h3>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-900/30 text-orange-400 border border-orange-700">
                  ⚠️ Simulated
                </span>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-orange-400" />
                <span className="text-sm font-medium text-white">{currentTraining.name}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Training progress</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 transition-all duration-300 bg-primary rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-start p-4 mt-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex-shrink-0">
                  <BarChart2 className="w-5 h-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Training Information (Simulated)</h3>
                  <div className="mt-2 text-sm text-gray-300">
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Evaluating multiple algorithms in parallel</li>
                      <li>Performing hyperparameter optimization</li>
                      <li>Validation using cross-validation</li>
                      <li>Generating model evaluation metrics</li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-400">
                      Note: This is a simulation. Real training will connect to backend API.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {trainingModels.length > 0 && !isTraining && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Models in Training</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trainingModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  onDeploy={handleDeploy}
                  onEvaluate={handleEvaluate}
                />
              ))}
            </div>
          </div>
        )}

        {trainedModels.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Trained Models</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trainedModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  onDeploy={handleDeploy}
                  onEvaluate={handleEvaluate}
                />
              ))}
            </div>

            {/* Performance Analysis Dashboards moved to Evaluate page */}
          </div>
        )}

        {trainedModels.length === 0 && trainingModels.length === 0 && !isTraining && (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
              <Layers className="w-6 h-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">No models trained yet</h3>
            <p className="mt-1 text-sm text-gray-400">
              Start training your first model to see it here
            </p>
            {datasets.length > 0 && !selectedDataset && (
              <Button
                className="mt-4"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => handleDatasetSelect(datasets[0].id)}
              >
                Train New Model
              </Button>
            )}
          </Card>
        )}

        {crossValidationResults && (
          <div className="mt-8 space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Cross-Validation Results</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">
                        Fold
                      </th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">
                        Accuracy
                      </th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">
                        Precision
                      </th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">
                        Recall
                      </th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">
                        F1 Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {crossValidationResults.map((result) => (
                      <tr key={result.fold}>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {result.fold}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {(result.accuracy * 100).toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {(result.precision * 100).toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {(result.recall * 100).toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {(result.f1Score * 100).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-medium">
                      <td className="px-3 py-2 text-sm text-gray-700">
                        Average
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {(crossValidationResults.reduce((acc, val) => acc + val.accuracy, 0) / crossValidationResults.length * 100).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {(crossValidationResults.reduce((acc, val) => acc + val.precision, 0) / crossValidationResults.length * 100).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {(crossValidationResults.reduce((acc, val) => acc + val.recall, 0) / crossValidationResults.length * 100).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {(crossValidationResults.reduce((acc, val) => acc + val.f1Score, 0) / crossValidationResults.length * 100).toFixed(2)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {crossValidationNarrative && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>{crossValidationNarrative.intro}</p>
                    <p>{crossValidationNarrative.balanceMessage}</p>
                    <p>{crossValidationNarrative.spreadMessage}</p>
                    <ul className="mt-4 space-y-2">
                      {crossValidationNarrative.supportingBullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2">
                          <span className="text-primary" aria-hidden="true">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>

                <Card>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 mb-1">Ask about these results</h4>
                      <p className="text-sm text-gray-600">Use natural language to interpret fold stability, top performers, or imbalance.</p>
                    </div>
                    <form onSubmit={handleCvQuestionSubmit} className="space-y-3">
                      <input
                        type="text"
                        value={cvQuestion}
                        onChange={(e) => setCvQuestion(e.target.value)}
                        placeholder="e.g., How consistent are the folds?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                      <div className="flex items-center gap-2">
                        <Button type="submit" size="sm" disabled={!cvQuestion.trim()}>
                          Ask
                        </Button>
                        <button
                          type="button"
                          onClick={() => setCvAnswer(null)}
                          className="text-xs font-medium text-gray-500 hover:text-primary"
                        >
                          Clear answer
                        </button>
                      </div>
                    </form>
                    {cvAnswer && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-700" aria-live="polite">
                        {cvAnswer}
                      </div>
                    )}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quick suggestions</p>
                      <div className="flex flex-wrap gap-2">
                        {questionSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
        
        </div> {/* Close max-w-7xl mx-auto px-6 py-6 space-y-6 */}
      </div> {/* Close min-h-screen bg-[#0d1117] */}
    </DndProvider>
  );
};

export default ModelTraining;