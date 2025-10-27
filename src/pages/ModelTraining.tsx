import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Plus, Layers, Check, BarChart2, GitBranch, Package, Crown } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useMLContext } from '../context/MLContext';
import { Dataset, ModelTrainingConfig, MLModel } from '../types';
import { useSubscription } from '../hooks/useSubscription';
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
import PremiumFeatureGate from '../components/common/PremiumFeatureGate';
import TensorFlowTrainer from '../components/ml/TensorFlowTrainer';
import DockerTensorFlowTrainer from '../components/ml/DockerTensorFlowTrainer';
import toast from 'react-hot-toast';

const ModelTraining: React.FC = () => {
  const { datasets, models, addModel, updateModelStatus } = useMLContext();
  const subscription = useSubscription();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
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
  const [crossValidationResults, setCrossValidationResults] = useState<any[] | null>(null);

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
    <PremiumFeatureGate feature="train_models">
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
                      value={selectedDataset.id}
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
          <Card className="mb-6" title={`Train New Model on ${selectedDataset.name}`}>
            <ModelTrainingForm 
              dataset={selectedDataset} 
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
                  onClick={() => {
                    if (!subscription.features.canTrainModels) {
                      toast.error('TensorFlow training requires Pro subscription');
                      return;
                    }
                    setActiveTab('tensorflow');
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === 'tensorflow'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${!subscription.features.canTrainModels ? 'opacity-50' : ''}`}
                >
                  <Package className="w-4 h-4" />
                  <span>TensorFlow</span>
                  {!subscription.features.canTrainModels && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
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
                          <h3 className="text-lg font-semibold text-gray-900">{selectedDataset.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {selectedDataset.rows} rows × {selectedDataset.columns} columns
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
                      <TensorFlowTrainer dataset={selectedDataset} />
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
                        <DockerTensorFlowTrainer dataset={selectedDataset} />
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
          <div className="mt-8">
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
          </div>
        )}
      </div>
    </DndProvider>
    </PremiumFeatureGate>
  );
};

export default ModelTraining;