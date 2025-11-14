import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Plus, Layers, Check, BarChart2, GitBranch, Package } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useMLContext } from '../context/MLContext';
import { Dataset, ModelTrainingConfig, MLModel } from '../types';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ModelCard from '../components/models/ModelCard';
import ModelTrainingForm from '../components/models/ModelTrainingForm';
import DatasetCluster from '../components/models/DatasetCluster';
import DraggableDataset from '../components/models/DraggableDataset';
import ModelComparison from '../components/models/ModelComparison';
import ModelVersioning from '../components/models/ModelVersioning';
import ModelExportImport from '../components/models/ModelExportImport';
import CrossValidation from '../components/models/CrossValidation';
import TensorFlowTrainer from '../components/ml/TensorFlowTrainer';
import DockerTensorFlowTrainer from '../components/ml/DockerTensorFlowTrainer';
import toast from 'react-hot-toast';
import {
  insightPanelClass,
  insightHeadingClass,
  insightHelperClass,
  chipButtonClass,
  insightAnswerClass,
  subtleListBulletClass,
} from '../styles/insightPanels';

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
  const { datasets, models, addModel } = useMLContext();
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

  const handleTrainingSubmit = async (config: ModelTrainingConfig) => {
    try {
      setIsTraining(true);
      setProgress(0);

      toast.loading('Starting model training...', { id: 'training' });

      const newModel: MLModel = {
        id: `model-${Date.now()}`,
        name: `${config.modelType === 'classification' ? 'Classification' : 'Regression'} Model (${
          config.algorithms.length > 1 ? 'Ensemble' : config.algorithms[0].split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        })`,
        description: `${config.modelType === 'classification' ? 'Classification' : 'Regression'} model trained on ${
          datasets.find((d) => d.id === config.datasetId)?.name || 'dataset'
        }`,
        status: 'training',
        datasetId: config.datasetId,
        projectId: '1',
        createdAt: new Date().toISOString(),
      };

      await addModel(newModel);
      setCurrentTraining(newModel);
      setSelectedDataset(null);

      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.random() * 5;
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
    const newModel: MLModel = {
      ...importedModel,
      id: `imported-${Date.now()}`,
      status: 'trained',
      projectId: '1',
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
      <div>
        {/* Page Header - Improved visibility */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Layers className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                Model Training
              </h1>
              <p className="mt-2 text-lg text-gray-600 font-medium">
                Train and deploy production-ready machine learning models
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between mb-6 md:flex-row md:items-center">
          <div className="hidden"></div>
          <div className="mt-4 md:mt-0">
            {datasets.length > 0 && !isTraining && (
              <div className="flex items-center space-x-2">
                {selectedDataset ? (
                  <div className="flex items-center space-x-2">
                    <select
                      className="block w-48 px-3 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={selectedDatasetSafe?.id ?? ''}
                      onChange={(e) => handleDatasetSelect(e.target.value)}
                    >
                      {datasets.map((dataset) => (
                        <option key={dataset.id} value={dataset.id}>
                          {dataset.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDataset(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <select
                      className="block w-48 px-3 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value=""
                      onChange={(e) => handleDatasetSelect(e.target.value)}
                    >
                      <option value="">Select a dataset</option>
                      {datasets.map((dataset) => (
                        <option key={dataset.id} value={dataset.id}>
                          {dataset.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => handleDatasetSelect(datasets[0].id)}
                    >
                      Train New Model
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {datasets.length === 0 && (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No datasets available</h3>
            <p className="mt-1 text-sm text-gray-500">
              You need to upload a dataset before you can train models
            </p>
            <Button
              className="mt-4"
              onClick={() => navigate('/app/data')}
            >
              Upload Dataset
            </Button>
          </Card>
        )}

        {selectedDataset && (
          <Card className="mb-6" title={`Train New Model on ${selectedDatasetSafe?.name ?? ''}`}>
            <ModelTrainingForm 
              dataset={selectedDatasetSafe as Dataset} 
              onSubmit={handleTrainingSubmit} 
            />
          </Card>
        )}

        {!selectedDataset && datasets.length > 0 && (
          <div className="mb-6">
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('train')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'train'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Training
                </button>
                <button
                  onClick={() => setActiveTab('compare')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'compare'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Compare Models
                </button>
                <button
                  onClick={() => setActiveTab('versions')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'versions'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Versioning
                </button>
                <button
                  onClick={() => setActiveTab('export')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'export'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Export/Import
                </button>
                <button
                  onClick={() => setActiveTab('tensorflow')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === 'tensorflow'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>TensorFlow</span>
                </button>
              </nav>
            </div>

            {activeTab === 'train' && (
              <Card>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dataset Clustering</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Available Datasets</h4>
                    <div className="grid gap-4">
                      {datasets
                        .filter(d => !clusteredDatasets.find(cd => cd.id === d.id))
                        .map((dataset) => (
                          <DraggableDataset
                            key={dataset.id}
                            dataset={dataset}
                            onDragEnd={() => handleAddToCluster(dataset)}
                            onClick={() => handleAddToCluster(dataset)}
                          />
                        ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Cluster Training</h4>
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
              </Card>
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
                  <Card>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Select Dataset for TensorFlow Training</h3>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                  </Card>
                )}

                {selectedDataset && (
                  <>
                    {/* Dataset Info */}
                    <Card>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{selectedDatasetSafe?.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {selectedDatasetSafe?.rows} rows × {selectedDatasetSafe?.columns} columns
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDataset(null)}
                        >
                          Change Dataset
                        </Button>
                      </div>
                    </Card>

                    {/* Browser-Based TensorFlow.js */}
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">TensorFlow.js (Browser)</h3>
                          <p className="text-sm text-gray-500">Train models directly in your browser - no server needed</p>
                        </div>
                      </div>
                      <TensorFlowTrainer dataset={selectedDatasetSafe as Dataset} />
                    </div>

                    {/* Docker-Based TensorFlow (if configured) */}
                    {import.meta.env.VITE_TENSORFLOW_API_URL && (
                      <div>
                        <div className="flex items-center space-x-2 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">TensorFlow (Docker GPU)</h3>
                            <p className="text-sm text-gray-500">Server-side training with GPU acceleration</p>
                          </div>
                        </div>
                        <DockerTensorFlowTrainer dataset={selectedDatasetSafe as Dataset} />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {isTraining && currentTraining && (
          <Card className="mb-6" title="Training in Progress">
            <div className="space-y-4">
              <div className="flex items-center">
                <Layers className="w-5 h-5 mr-2 text-indigo-600" />
                <span className="text-sm font-medium text-gray-900">
                  {currentTraining.name}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Training progress</span>
                  <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 transition-all duration-300 bg-indigo-600 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-start p-4 mt-4 bg-blue-50 rounded-md">
                <div className="flex-shrink-0">
                  <BarChart2 className="w-5 h-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Training Information</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Evaluating multiple algorithms in parallel</li>
                      <li>Performing hyperparameter optimization</li>
                      <li>Validation using cross-validation</li>
                      <li>Generating model evaluation metrics</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {trainingModels.length > 0 && !isTraining && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Models in Training</h2>
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
          <div>
            <h2 className="mb-4 text-lg font-medium text-gray-900">Trained Models</h2>
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
          </div>
        )}

        {trainedModels.length === 0 && trainingModels.length === 0 && !isTraining && (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
              <Layers className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No models trained yet</h3>
            <p className="mt-1 text-sm text-gray-500">
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cross-Validation Results</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Fold
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Accuracy
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Precision
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Recall
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        F1 Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {crossValidationResults.map((result) => (
                      <tr key={result.fold}>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {result.fold}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {(result.accuracy * 100).toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {(result.precision * 100).toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {(result.recall * 100).toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {(result.f1Score * 100).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-medium">
                      <td className="px-3 py-2 text-sm text-gray-900">
                        Average
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {(crossValidationResults.reduce((acc, val) => acc + val.accuracy, 0) / crossValidationResults.length * 100).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {(crossValidationResults.reduce((acc, val) => acc + val.precision, 0) / crossValidationResults.length * 100).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {(crossValidationResults.reduce((acc, val) => acc + val.recall, 0) / crossValidationResults.length * 100).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {(crossValidationResults.reduce((acc, val) => acc + val.f1Score, 0) / crossValidationResults.length * 100).toFixed(2)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {crossValidationNarrative && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className={insightPanelClass}>
                  <div className="space-y-3 text-sm text-slate-700">
                    <p>{crossValidationNarrative.intro}</p>
                    <p>{crossValidationNarrative.balanceMessage}</p>
                    <p>{crossValidationNarrative.spreadMessage}</p>
                    <ul className="mt-4 space-y-2">
                      {crossValidationNarrative.supportingBullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2">
                          <span className={subtleListBulletClass} aria-hidden="true"></span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>

                <Card className={insightPanelClass}>
                  <div className="space-y-4">
                    <div>
                      <h4 className={insightHeadingClass}>Ask about these results</h4>
                      <p className={insightHelperClass}>Use natural language to interpret fold stability, top performers, or imbalance.</p>
                    </div>
                    <form onSubmit={handleCvQuestionSubmit} className="space-y-3">
                      <input
                        type="text"
                        value={cvQuestion}
                        onChange={(e) => setCvQuestion(e.target.value)}
                        placeholder="e.g., How consistent are the folds?"
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      />
                      <div className="flex items-center gap-2">
                        <Button type="submit" size="sm" disabled={!cvQuestion.trim()}>
                          Ask
                        </Button>
                        <button
                          type="button"
                          onClick={() => setCvAnswer(null)}
                          className="text-xs font-medium text-slate-500 hover:text-indigo-600"
                        >
                          Clear answer
                        </button>
                      </div>
                    </form>
                    {cvAnswer && (
                      <div className={insightAnswerClass} aria-live="polite">
                        {cvAnswer}
                      </div>
                    )}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick suggestions</p>
                      <div className="flex flex-wrap gap-2">
                        {questionSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={chipButtonClass}
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
      </div>
    </DndProvider>
  );
};

export default ModelTraining;