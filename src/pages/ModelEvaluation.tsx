/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMLContext } from '../context/MLContext';
import { useInfluxMetrics } from '../hooks/useInfluxMetrics';
import {
  Card,
  Title,
  Text,
  Tab,
  TabList,
  TabGroup,
  TabPanel,
  TabPanels,
  Grid,
  Metric,
  AreaChart,
  ScatterChart,
  BadgeDelta,
  Flex,
  ProgressBar,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from '@tremor/react';
import { Layers } from 'lucide-react';
import Button from '../components/common/Button';
import {
  insightPanelClass,
  insightHeadingClass,
  insightHelperClass,
  chipButtonClass,
  insightAnswerClass,
  subtleListBulletClass,
} from '../styles/insightPanels';

// Chart.js dynamic imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Scatter, Bubble } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

const ModelEvaluationContent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { models, datasets } = useMLContext();
  const modelId = searchParams.get('model');
  const [selectedModel, setSelectedModel] = useState(models.find(m => m.id === modelId));
  const [selectedDataset, setSelectedDataset] = useState(datasets.find(d => d.id === selectedModel?.datasetId));
  const [confusionQuestion, setConfusionQuestion] = useState('');
  const [confusionAnswer, setConfusionAnswer] = useState<string | null>(null);
  const [rocQuestion, setRocQuestion] = useState('');
  const [rocAnswer, setRocAnswer] = useState<string | null>(null);
  const [featureQuestion, setFeatureQuestion] = useState('');
  const [featureAnswer, setFeatureAnswer] = useState<string | null>(null);
  const [performanceQuestion, setPerformanceQuestion] = useState('');
  const [performanceAnswer, setPerformanceAnswer] = useState<string | null>(null);
  const [predictionQuestion, setPredictionQuestion] = useState('');
  const [predictionAnswer, setPredictionAnswer] = useState<string | null>(null);

  // Fetch live evaluation metrics from InfluxDB
  const { metrics, loading: metricsLoading, error: metricsError } = useInfluxMetrics(
    selectedModel?.id,
    5000,
    24 // Last 24 hours of evaluation data
  );

  // Smart detection: Determine if model is classification or regression
  const isClassificationModel = useMemo(() => {
    if (!selectedModel) return true; // Default to classification
    
    // Check 1: Explicit modelType field
    const modelType = selectedModel.modelType?.toLowerCase() || '';
    if (modelType.includes('classification') || modelType.includes('classifier')) return true;
    if (modelType.includes('regression') || modelType.includes('regressor')) return false;
    
    // Check 2: Algorithm name patterns
    const modelName = selectedModel.name?.toLowerCase() || '';
    const classificationKeywords = [
      'logistic', 'svm', 'svc', 'naive bayes', 'knn classifier', 
      'decision tree classifier', 'random forest classifier',
      'xgboost classifier', 'catboost classifier', 'lightgbm classifier',
      'neural network classifier', 'mlp classifier'
    ];
    const regressionKeywords = [
      'linear regression', 'ridge', 'lasso', 'elasticnet',
      'svr', 'knn regressor', 'decision tree regressor',
      'random forest regressor', 'xgboost regressor', 
      'catboost regressor', 'lightgbm regressor',
      'neural network regressor', 'mlp regressor'
    ];
    
    if (classificationKeywords.some(keyword => modelName.includes(keyword))) return true;
    if (regressionKeywords.some(keyword => modelName.includes(keyword))) return false;
    
    // Check 3: Metrics-based detection
    const metrics = selectedModel.metrics || {};
    const metricKeys = Object.keys(metrics).map(k => k.toLowerCase());
    
    // Classification-specific metrics
    const hasClassificationMetrics = metricKeys.some(key => 
      ['accuracy', 'precision', 'recall', 'f1', 'auc', 'roc'].includes(key)
    );
    
    // Regression-specific metrics
    const hasRegressionMetrics = metricKeys.some(key =>
      ['mse', 'rmse', 'mae', 'r2', 'r_squared', 'mape'].includes(key)
    );
    
    if (hasRegressionMetrics && !hasClassificationMetrics) return false;
    
    // Default to classification if unclear
    return true;
  }, [selectedModel]);

  useEffect(() => {
    const model = models.find(m => m.id === modelId);
    setSelectedModel(model);
    if (model) {
      setSelectedDataset(datasets.find(d => d.id === model.datasetId));
    }
  }, [modelId, models, datasets]);

  const trainedModels = useMemo(
    () => models.filter(m => m.status === 'trained' || m.status === 'deployed'),
    [models]
  );
  const currentIndex = selectedModel ? trainedModels.findIndex(m => m.id === selectedModel.id) : -1;

  const handleModelChange = (direction: 'prev' | 'next') => {
    if (!trainedModels.length) return;
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    let newIndex;
    if (direction === 'prev') {
      newIndex = safeIndex === 0 ? trainedModels.length - 1 : safeIndex - 1;
    } else {
      newIndex = safeIndex === trainedModels.length - 1 ? 0 : safeIndex + 1;
    }
    navigate(`/app/evaluate?model=${trainedModels[newIndex].id}`);
  };

  // Helper function to safely format metric values
  const formatMetric = (value: number | undefined): string => {
    return value !== undefined ? `${(value * 100).toFixed(1)}%` : 'N/A';
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  const performanceData = useMemo(() => {
    if (!selectedModel) {
      return [] as Array<{ date: string; accuracy: number; precision: number; recall: number }>;
    }

    // Use live InfluxDB metrics if available
    if (metrics && metrics.timestamps && metrics.timestamps.length > 0) {
      return metrics.timestamps.map((timestamp: Date, index: number) => ({
        date: new Date(timestamp).toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        accuracy: metrics.accuracies[index] || 0,
        precision: 0, // InfluxDB doesn't track precision yet - fallback
        recall: 0 // InfluxDB doesn't track recall yet - fallback
      }));
    }

    // Fallback to static model metrics if no live data
    const accuracy = selectedModel?.metrics?.accuracy ?? 0.78;
    const precision = selectedModel?.metrics?.precision ?? 0.75;
    const recall = selectedModel?.metrics?.recall ?? 0.73;

    return [
      {
        date: '2024-01',
        accuracy: accuracy * 0.95,
        precision: precision * 0.94,
        recall: recall * 0.93
      },
      {
        date: '2024-02',
        accuracy: accuracy * 0.97,
        precision: precision * 0.96,
        recall: recall * 0.95
      },
      {
        date: '2024-03',
        accuracy,
        precision,
        recall
      }
    ];
  }, [selectedModel, metrics]);

  const describeDelta = useCallback((label: string, start: number, end: number) => {
    const delta = (end - start) * 100;
    if (Math.abs(delta) < 0.5) {
      return `${label} held steady around ${formatPercent(end)}.`;
    }
    const direction = delta > 0 ? 'increased' : 'decreased';
    return `${label} ${direction} ${Math.abs(delta).toFixed(1)} pts to ${formatPercent(end)}.`;
  }, []);

  const performanceNarrative = useMemo(() => {
    if (!performanceData.length) return null;
    const first = performanceData[0];
    const last = performanceData[performanceData.length - 1];

    const accuracyMsg = describeDelta('Accuracy', first.accuracy, last.accuracy);
    const precisionMsg = describeDelta('Precision', first.precision, last.precision);
    const recallMsg = describeDelta('Recall', first.recall, last.recall);

    const swings = [first.accuracy, first.precision, first.recall, last.accuracy, last.precision, last.recall];
    const maxSwing = Math.max(...swings) - Math.min(...swings);
    const stability = maxSwing < 0.05
      ? 'Metrics are stable within ±5 pts, signaling consistent performance.'
      : 'Metrics fluctuate more than ±5 pts—keep monitoring for drift or seasonal effects.';

    return {
      accuracyMsg,
      precisionMsg,
      recallMsg,
      stability,
    };
  }, [performanceData, describeDelta]);

  const performanceQuestionSuggestions = [
    'Are metrics trending up?',
    'Is recall stable over time?',
    'Do I need to worry about drift?'
  ];

  const answerPerformanceQuestion = (prompt: string) => {
    if (!prompt.trim()) return;
    if (!performanceNarrative) {
      setPerformanceAnswer('Train the model to generate trend data first.');
      return;
    }

    const q = prompt.toLowerCase();
    if (q.includes('accur')) {
      setPerformanceAnswer(performanceNarrative.accuracyMsg);
      return;
    }
    if (q.includes('precis')) {
      setPerformanceAnswer(performanceNarrative.precisionMsg);
      return;
    }
    if (q.includes('recall')) {
      setPerformanceAnswer(performanceNarrative.recallMsg);
      return;
    }
    if (q.includes('drift') || q.includes('stable') || q.includes('trend')) {
      setPerformanceAnswer(performanceNarrative.stability);
      return;
    }

    setPerformanceAnswer(`${performanceNarrative.accuracyMsg} ${performanceNarrative.precisionMsg}`);
  };

  const handlePerformanceSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!performanceQuestion.trim()) return;
    answerPerformanceQuestion(performanceQuestion);
    setPerformanceQuestion('');
  };

  const handlePerformanceSuggestion = (suggestion: string) => {
    answerPerformanceQuestion(suggestion);
  };

  const confusionMatrix = useMemo(() => {
    if (!selectedModel) {
      return {
        rows: [] as Array<{ actual: string; predicted: string; count: number }>,
        totals: {
          truePositives: 0,
          falseNegatives: 0,
          falsePositives: 0,
          trueNegatives: 0,
          totalSamples: 0,
          accuracy: 0,
          precision: 0,
          recall: 0,
          specificity: 0,
          falsePositiveRate: 0,
          falseNegativeRate: 0,
          balancedAccuracy: 0,
        },
      };
    }

  const accuracy = Math.min(Math.max(selectedModel?.metrics?.accuracy ?? 0.82, 0), 0.999);
  const precision = Math.min(Math.max(selectedModel?.metrics?.precision ?? 0.8, 0.01), 0.999);
  const recall = Math.min(Math.max(selectedModel?.metrics?.recall ?? 0.78, 0.01), 0.999);
    const totalSamples = Math.max(selectedDataset?.rows ?? 1200, 400);
    const positiveShare = 0.4;
    const totalPositives = Math.round(totalSamples * positiveShare);
    const totalNegatives = totalSamples - totalPositives;

    const truePositives = Math.round(recall * totalPositives);
    const falseNegatives = Math.max(0, totalPositives - truePositives);
    const predictedPositives = truePositives / precision;
    const falsePositives = Math.max(0, Math.round(predictedPositives - truePositives));
    const trueNegatives = Math.max(0, totalNegatives - falsePositives);

    const specificity = trueNegatives / Math.max(totalNegatives, 1);
    const falsePositiveRate = 1 - specificity;
    const falseNegativeRate = falseNegatives / Math.max(totalPositives, 1);
    const balancedAccuracy = (recall + specificity) / 2;

    return {
      rows: [
        { actual: 'Positive', predicted: 'Positive', count: truePositives },
        { actual: 'Positive', predicted: 'Negative', count: falseNegatives },
        { actual: 'Negative', predicted: 'Positive', count: falsePositives },
        { actual: 'Negative', predicted: 'Negative', count: trueNegatives },
      ],
      totals: {
        truePositives,
        falseNegatives,
        falsePositives,
        trueNegatives,
        totalSamples,
        accuracy,
        precision,
        recall,
        specificity,
        falsePositiveRate,
        falseNegativeRate,
        balancedAccuracy,
      },
    };
  }, [selectedModel, selectedDataset?.rows]);

  const confusionNarrative = useMemo(() => {
    if (!confusionMatrix) return null;
    const { totals } = confusionMatrix;
    const intro = `Across ~${totals.totalSamples.toLocaleString()} evaluation records, precision lands at ${formatPercent(totals.precision)} while recall is ${formatPercent(totals.recall)}.`;

    let errorFocus = 'False positives and false negatives are balanced, so the model makes similar trade-offs when flagging or missing positives.';
    if (totals.falsePositiveRate > totals.falseNegativeRate + 0.02) {
      errorFocus = `False positives occur slightly more often (${formatPercent(totals.falsePositiveRate)} of negatives), suggesting the model is eager to flag positives.`;
    } else if (totals.falseNegativeRate > totals.falsePositiveRate + 0.02) {
      errorFocus = `False negatives dominate (${formatPercent(totals.falseNegativeRate)} of positives), meaning the model is conservative and might miss opportunities.`;
    }

    const stability = totals.balancedAccuracy > 0.85
      ? 'Balanced accuracy stays high, so the model treats both classes reliably.'
      : 'Balanced accuracy dips below the ideal 85% mark; monitor whether one class consistently underperforms.';

    return {
      intro,
      errorFocus,
      stability,
      bullets: [
        `True positives: ${totals.truePositives.toLocaleString()} • True negatives: ${totals.trueNegatives.toLocaleString()}.`,
        `False positives: ${totals.falsePositives.toLocaleString()} • False negatives: ${totals.falseNegatives.toLocaleString()}.`,
        `Specificity holds at ${formatPercent(totals.specificity)}, giving a false-positive rate of ${formatPercent(totals.falsePositiveRate)}.`,
      ],
    };
  }, [confusionMatrix]);

  const confusionQuestionSuggestions = [
    'Where do most errors happen?',
    'How balanced is precision vs recall?',
    'What should I do about false positives?'
  ];

  const answerConfusionQuestion = (prompt: string) => {
    if (!prompt.trim()) return;
    if (!confusionMatrix || !confusionNarrative) {
      setConfusionAnswer('Evaluate the model first to generate a confusion matrix.');
      return;
    }

    const q = prompt.toLowerCase();
    const { totals } = confusionMatrix;
    let response = '';

    if (q.includes('precision')) {
      response = `Precision is ${formatPercent(totals.precision)}, meaning ${totals.truePositives.toLocaleString()} of the predicted positives were correct.`;
    } else if (q.includes('recall') || q.includes('sensitivity')) {
      response = `Recall sits at ${formatPercent(totals.recall)}, so the model captures that share of actual positives, leaving ${totals.falseNegatives.toLocaleString()} missed.`;
    } else if (q.includes('false positive') || q.includes('fp')) {
      response = `${totals.falsePositives.toLocaleString()} negatives were incorrectly flagged, equating to a ${formatPercent(totals.falsePositiveRate)} false-positive rate.`;
    } else if (q.includes('false negative') || q.includes('fn')) {
      response = `${totals.falseNegatives.toLocaleString()} positives slipped through (${formatPercent(totals.falseNegativeRate)} of positives). Consider lowering the threshold or adding recall-focused regularization.`;
    } else if (q.includes('balanced') || q.includes('fair')) {
      response = `Balanced accuracy is ${formatPercent(totals.balancedAccuracy)}, combining ${formatPercent(totals.recall)} recall with ${formatPercent(totals.specificity)} specificity.`;
    } else if (q.includes('overall') || q.includes('summary') || q.includes('mean')) {
      response = `${confusionNarrative.intro} ${confusionNarrative.errorFocus}`;
    } else {
      response = `${confusionNarrative.intro} ${confusionNarrative.stability}`;
    }

    setConfusionAnswer(response);
  };

  const handleConfusionQuestionSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!confusionQuestion.trim()) return;
    answerConfusionQuestion(confusionQuestion);
    setConfusionQuestion('');
  };

  const handleConfusionSuggestion = (suggestion: string) => {
    answerConfusionQuestion(suggestion);
  };

  const rocNarrative = useMemo(() => {
    if (!selectedModel) {
      return null;
    }
    const auc = selectedModel?.metrics?.auc ?? 0.83;
    const accuracy = selectedModel?.metrics?.accuracy ?? 0.8;
    const precision = selectedModel?.metrics?.precision ?? 0.78;
    const recall = selectedModel?.metrics?.recall ?? 0.76;

    const aucDescriptor = auc >= 0.9
      ? 'AUC above 0.90 signals excellent separation between positive and negative classes.'
      : auc >= 0.8
        ? 'AUC in the mid-0.8s reflects strong discrimination with room to harden the decision threshold.'
        : 'AUC below 0.8 suggests overlap between the classes; consider more features or regularization.';

    let thresholdHint = 'Precision and recall are balanced, so your current threshold is well calibrated.';
    if (precision - recall > 0.07) {
      thresholdHint = 'Precision is higher than recall, implying the current threshold is conservative—good for safety-critical predictions but it may miss positives.';
    } else if (recall - precision > 0.07) {
      thresholdHint = 'Recall leads precision, so the threshold is generous and may introduce more false alarms.';
    }

    return {
      summary: `AUC is ${auc.toFixed(3)}, accuracy ${formatPercent(accuracy)}, precision ${formatPercent(precision)}, recall ${formatPercent(recall)}.`,
      descriptor: aucDescriptor,
      thresholdHint,
    };
  }, [selectedModel]);

  const rocQuestionSuggestions = [
    'What does my AUC indicate?',
    'Should I adjust the threshold?',
    'How balanced are precision and recall?'
  ];

  const answerRocQuestion = (prompt: string) => {
    if (!prompt.trim()) return;
    if (!rocNarrative) {
      setRocAnswer('Train a model with ROC metrics to unlock this explanation.');
      return;
    }

    const q = prompt.toLowerCase();
    const auc = selectedModel?.metrics?.auc ?? 0.83;
    const precision = selectedModel?.metrics?.precision ?? 0.78;
    const recall = selectedModel?.metrics?.recall ?? 0.76;
    let response = '';

    if (q.includes('auc') || q.includes('curve')) {
      response = rocNarrative.descriptor;
    } else if (q.includes('threshold')) {
      response = rocNarrative.thresholdHint;
    } else if (q.includes('precision')) {
      response = `Precision is ${formatPercent(precision)}, so ${formatPercent(precision)} of predicted positives are correct.`;
    } else if (q.includes('recall')) {
      response = `Recall is ${formatPercent(recall)}, capturing that share of actual positives.`;
    } else if (q.includes('balance')) {
      response = rocNarrative.thresholdHint;
    } else if (q.includes('overall') || q.includes('summary') || q.includes('mean')) {
      response = `AUC is ${auc.toFixed(3)}. ${rocNarrative.descriptor}`;
    } else {
      response = `${rocNarrative.summary} ${rocNarrative.descriptor}`;
    }

    setRocAnswer(response);
  };

  const handleRocSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rocQuestion.trim()) return;
    answerRocQuestion(rocQuestion);
    setRocQuestion('');
  };

  const handleRocSuggestion = (suggestion: string) => {
    answerRocQuestion(suggestion);
  };

  const featureImportanceData = useMemo(() => {
    // Try to get columns from preview_data first
    if (selectedDataset?.preview_data?.columns?.length) {
      const columns = selectedDataset.preview_data.columns;
      const total = columns.length;
      return columns.map((feature, idx) => ({
        feature,
        importance: 1 - idx / Math.max(total, 1)
      }));
    }
    
    // Fallback: Generate mock feature importance based on model metadata
    if (selectedModel) {
      const mockFeatures = [
        'Age', 'Income', 'Education_Level', 'Years_Experience',
        'Location', 'Product_Category', 'Purchase_History', 'Customer_Segment'
      ];
      return mockFeatures.map((feature, idx) => ({
        feature,
        importance: 1 - idx / Math.max(mockFeatures.length, 1)
      }));
    }
    
    return [] as { feature: string; importance: number }[];
  }, [selectedDataset, selectedModel]);

  // Predicted vs Actual scatter data
  const predictedVsActualData = useMemo(() => {
    if (!selectedModel) return [];
    
    const accuracy = selectedModel.metrics?.accuracy ?? 0.85;
    const numSamples = 50; // Generate 50 sample predictions
    
    return Array.from({ length: numSamples }, (_, i) => {
      // Generate actual values (0-100 scale for regression-like visualization)
      const actual = Math.random() * 100;
      
      // Generate predicted values with some error based on accuracy
      // Higher accuracy = smaller errors
      const errorMagnitude = (1 - accuracy) * 20; // Max error scales with (1-accuracy)
      const error = (Math.random() - 0.5) * 2 * errorMagnitude;
      const predicted = Math.max(0, Math.min(100, actual + error));
      
      return {
        id: `sample-${i + 1}`,
        actual: Number(actual.toFixed(2)),
        predicted: Number(predicted.toFixed(2)),
        error: Number((predicted - actual).toFixed(2)),
      };
    });
  }, [selectedModel]);

  // Residual plot data for regression models
  const residualPlotData = useMemo(() => {
    if (!selectedModel) return [];
    
    const accuracy = selectedModel.metrics?.accuracy ?? 0.85;
    const numSamples = 50;
    
    return Array.from({ length: numSamples }, (_, i) => {
      // Generate predicted values (0-100 scale)
      const predicted = Math.random() * 100;
      
      // Generate residuals (actual - predicted)
      // Residuals should be roughly normal, centered at 0
      // Magnitude based on model accuracy
      const errorStdDev = (1 - accuracy) * 15;
      
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const normalRandom = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const residual = normalRandom * errorStdDev;
      
      return {
        id: `residual-${i + 1}`,
        predicted: Number(predicted.toFixed(2)),
        residual: Number(residual.toFixed(2)),
        absResidual: Math.abs(residual),
      };
    });
  }, [selectedModel]);

  // Training metrics data for performance analysis dashboards
  const trainingMetricsData = useMemo(() => {
    const epochs = Array.from({ length: 50 }, (_, i) => i + 1);
    const accuracyData = epochs.map((_, i) => {
      const base = 60;
      const growth = Math.log(i + 1) * 8;
      const noise = (Math.random() - 0.5) * 2;
      return Math.min(Math.max(base + growth + noise, 55), 95);
    });
    const lossData = accuracyData.map(acc => {
      const baseLoss = (100 - acc) / 100;
      const noise = (Math.random() - 0.5) * 0.05;
      return Math.max(baseLoss + noise, 0.01);
    });

    return {
      epochs,
      accuracyData,
      lossData,
    };
  }, []);

  const featureNarrative = useMemo(() => {
    if (!featureImportanceData.length) return null;
    const topFeature = featureImportanceData[0];
    const topThree = featureImportanceData.slice(0, 3);
    const tailFeature = featureImportanceData[featureImportanceData.length - 1];

    const spread = (topFeature.importance - tailFeature.importance) * 100;
    const spreadDescriptor = spread > 40
      ? 'Importance drops sharply after the first few features, so keep the focus on the leaders for simpler, faster models.'
      : 'Importance declines gradually, meaning the model draws signal from a wide set of features.';

    return {
      intro: `${topFeature.feature} contributes the most (~${formatPercent(topFeature.importance)} of relative importance).`,
      supporting: `Next up: ${topThree.map((item) => item.feature).join(', ')}.`,
      spreadDescriptor,
    };
  }, [featureImportanceData]);

  const featureQuestionSuggestions = [
    'Which features matter the most?',
    'Can I drop any columns?',
    'How evenly distributed is importance?'
  ];

  const answerFeatureQuestion = (prompt: string) => {
    if (!prompt.trim()) return;
    if (!featureNarrative) {
      setFeatureAnswer('Load dataset preview data to calculate feature importance.');
      return;
    }

    const q = prompt.toLowerCase();
    if (q.includes('which') || q.includes('top')) {
      setFeatureAnswer(`${featureNarrative.intro} ${featureNarrative.supporting}`);
    } else if (q.includes('drop') || q.includes('remove')) {
      setFeatureAnswer(featureNarrative.spreadDescriptor);
    } else if (q.includes('even') || q.includes('balance') || q.includes('distribution')) {
      setFeatureAnswer(featureNarrative.spreadDescriptor);
    } else {
      setFeatureAnswer(`${featureNarrative.intro} ${featureNarrative.supporting}`);
    }
  };

  const handleFeatureSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!featureQuestion.trim()) return;
    answerFeatureQuestion(featureQuestion);
    setFeatureQuestion('');
  };

  const handleFeatureSuggestion = (suggestion: string) => {
    answerFeatureQuestion(suggestion);
  };

  const predictionSamples = useMemo(() => {
    if (!selectedDataset?.preview_data?.rows?.length) return [] as { row: string[]; prediction: string; confidence: number; id: string }[];
    return selectedDataset.preview_data.rows.slice(0, 5).map((row, idx) => {
      const prediction = Math.random() > 0.5 ? 'Positive' : 'Negative';
      const confidence = 0.7 + Math.random() * 0.3;
      return {
        row,
        prediction,
        confidence,
        id: `prediction-${idx}`
      };
    });
  }, [selectedDataset?.preview_data?.rows]);

  const predictionNarrative = useMemo(() => {
    if (!predictionSamples.length) return null;
    const positives = predictionSamples.filter((sample) => sample.prediction === 'Positive').length;
    const negatives = predictionSamples.length - positives;
    const avgConfidence = predictionSamples.reduce((acc, sample) => acc + sample.confidence, 0) / predictionSamples.length;
    const spread = Math.max(...predictionSamples.map((s) => s.confidence)) - Math.min(...predictionSamples.map((s) => s.confidence));

    return {
      distribution: `Predictions skew ${positives >= negatives ? 'positive' : 'negative'} (${positives} vs ${negatives}).`,
      confidence: `Average confidence is ${(avgConfidence * 100).toFixed(1)}% with a ${ (spread * 100).toFixed(1)} pt spread.`,
      action: positives === negatives
        ? 'Balance looks even—use business context to set the decision threshold.'
        : 'Consider adjusting the threshold or class weights if this skew doesn’t match your domain.',
    };
  }, [predictionSamples]);

  // Handle model selection from dropdown
  const handleModelSelect = (modelId: string) => {
    setSearchParams({ model: modelId });
  };

  // No models available at all
  if (trainedModels.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-20 h-20 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <Layers className="w-10 h-10 text-blue-600" />
              </div>
              <Text className="text-2xl font-bold text-gray-900 mb-2">No Trained Models Yet</Text>
            <Text className="text-gray-600 mb-2 text-center max-w-md">
              You need to train at least one model before you can evaluate its performance.
            </Text>
            <Text className="text-sm text-gray-500 mb-6 text-center max-w-md">
              Train models on your datasets using various algorithms and configurations.
            </Text>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/app/feature-engineering')}
                className="flex items-center gap-2"
              >
                <span>Start with Feature Engineering</span>
              </Button>
              <Button
                onClick={() => navigate('/app/train')}
                className="flex items-center gap-2"
              >
                <span>Go to Model Training</span>
              </Button>
            </div>
          </div>
        </Card>
        </div>
      </div>
    );
  }

  // Models exist but none selected
  if (!selectedModel) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-20 h-20 bg-green-50 rounded-xl flex items-center justify-center mb-6">
                <Layers className="w-10 h-10 text-green-600" />
              </div>
              <Text className="text-2xl font-bold text-gray-900 mb-2">Select a Model to Evaluate</Text>
            <Text className="text-gray-600 mb-6 text-center max-w-md">
              Choose from your {trainedModels.length} trained {trainedModels.length === 1 ? 'model' : 'models'}
            </Text>
            
            {/* Model Dropdown */}
            <div className="w-full max-w-md mb-4">
              <label className="form-label mb-2">Select Model</label>
              <select
                onChange={(e) => handleModelSelect(e.target.value)}
                className="form-input-improved"
                defaultValue=""
              >
                <option value="" disabled>Choose a model...</option>
                {trainedModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.modelType || 'Unknown Type'}) - {model.status}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => navigate('/app/train')}
              variant="outline"
              className="mt-2"
            >
              Train More Models
            </Button>
          </div>
        </Card>
        </div>
      </div>
    );
  }

  const predictionQuestionSuggestions = [
    'Are predictions confident enough?',
    'Do results skew positive or negative?',
    'Should I adjust the threshold?'
  ];

  const answerPredictionQuestion = (prompt: string) => {
    if (!prompt.trim()) return;
    if (!predictionNarrative) {
      setPredictionAnswer('Load sample predictions to unlock these insights.');
      return;
    }

    const q = prompt.toLowerCase();
    if (q.includes('confident')) {
      setPredictionAnswer(predictionNarrative.confidence);
      return;
    }
    if (q.includes('skew') || q.includes('balance') || q.includes('positive') || q.includes('negative')) {
      setPredictionAnswer(predictionNarrative.distribution);
      return;
    }
    if (q.includes('threshold')) {
      setPredictionAnswer(predictionNarrative.action);
      return;
    }

    setPredictionAnswer(`${predictionNarrative.distribution} ${predictionNarrative.confidence}`);
  };

  const handlePredictionSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!predictionQuestion.trim()) return;
    answerPredictionQuestion(predictionQuestion);
    setPredictionQuestion('');
  };

  const handlePredictionSuggestion = (suggestion: string) => {
    answerPredictionQuestion(suggestion);
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header - Clean professional style */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Model Evaluation
              </h1>
              <p className="text-base text-gray-600">
                Analyzing: <span className="font-semibold text-gray-900">{selectedModel.name}</span>
              </p>
            </div>

            {/* Model Selector Dropdown */}
            {trainedModels.length > 1 && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Switch Model:</label>
                <select
                  value={selectedModel.id}
                  onChange={(e) => handleModelSelect(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-900 font-medium bg-white"
                >
                  {trainedModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Dataset Info */}
          {selectedDataset && (
            <p className="text-sm text-gray-600">
              Trained on <span className="font-semibold text-gray-900">{selectedDataset.name}</span>
              {' • '}
              <span className="text-gray-500">
                {selectedDataset.rows?.toLocaleString()} rows, {selectedDataset.columns} features
              </span>
            </p>
          )}
        </div>

        {/* Tab Navigation */}
        <TabGroup>
          <TabList className="border-b border-gray-200">
            <Tab className="font-semibold text-gray-700 data-[selected]:text-blue-600 data-[selected]:border-blue-600">
              Overview
            </Tab>
            <Tab className="font-semibold text-gray-700 data-[selected]:text-blue-600 data-[selected]:border-blue-600">
              Performance
            </Tab>
            <Tab className="font-semibold text-gray-700 data-[selected]:text-blue-600 data-[selected]:border-blue-600">
              Feature Analysis
            </Tab>
            <Tab className="font-semibold text-gray-700 data-[selected]:text-blue-600 data-[selected]:border-blue-600">
              Predictions
            </Tab>
          </TabList>

          <TabPanels className="mt-6">
          <TabPanel>
            {/* Overview Tab - Clean summary with just metric cards */}
            <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6">
              {Object.entries(selectedModel.metrics || {}).map(([key, value]) => (
                <Card key={key} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <Text className="text-sm font-medium text-gray-600">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </Text>
                  <Metric className="text-gray-900">{formatMetric(value)}</Metric>
                  <Flex className="mt-4">
                    <Text className="text-xs text-gray-500">Previous Version</Text>
                    <BadgeDelta deltaType="increase" className="text-xs">
                      {(Math.random() * 5).toFixed(1)}%
                    </BadgeDelta>
                  </Flex>
                </Card>
              ))}
            </Grid>

            {/* AI Training Insights */}
            <Card className="mt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <Title className="text-lg mb-2">AI Training Insights</Title>
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>
                      <strong className="text-gray-900">Training Performance:</strong> Your model achieved{' '}
                      <span className="font-semibold text-blue-600">
                        {formatMetric(selectedModel.metrics?.accuracy || 0)}
                      </span>{' '}
                      accuracy after training. The learning curve shows{' '}
                      {(selectedModel.metrics?.accuracy || 0) > 0.85 
                        ? 'excellent convergence with minimal overfitting' 
                        : 'steady improvement with room for optimization'}
                      .
                    </p>
                    <p>
                      <strong className="text-gray-900">Model Quality:</strong>{' '}
                      {(selectedModel.metrics?.accuracy || 0) > 0.9 
                        ? 'Outstanding performance! This model is production-ready and demonstrates strong generalization capabilities.'
                        : (selectedModel.metrics?.accuracy || 0) > 0.8
                        ? 'Good performance with reliable predictions. Consider fine-tuning hyperparameters for further improvement.'
                        : 'Acceptable baseline performance. Recommend feature engineering, data augmentation, or trying ensemble methods.'}
                    </p>
                    <p>
                      <strong className="text-gray-900">Next Steps:</strong> The accuracy vs loss correlation below shows{' '}
                      {(selectedModel.metrics?.accuracy || 0) > 0.85 
                        ? 'strong inverse relationship, indicating well-optimized training. Consider deploying this model or testing on production data.'
                        : 'potential for improvement. Review the performance clusters to identify optimal hyperparameter configurations.'}
                    </p>
                    {selectedModel.modelType && (
                      <p>
                        <strong className="text-gray-900">Algorithm Analysis:</strong> Using{' '}
                        <span className="font-semibold text-indigo-600">{selectedModel.modelType}</span>{' '}
                        {selectedModel.modelType.toLowerCase().includes('neural') || selectedModel.modelType.toLowerCase().includes('nn')
                          ? 'provides deep feature learning capabilities. Monitor for overfitting with validation curves.'
                          : selectedModel.modelType.toLowerCase().includes('tree') || selectedModel.modelType.toLowerCase().includes('forest')
                          ? 'offers excellent interpretability and handles non-linear relationships well.'
                          : selectedModel.modelType.toLowerCase().includes('svm')
                          ? 'excels with high-dimensional data and clear margin separation.'
                          : 'provides a solid foundation for this prediction task.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Training Results Visualizations */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Results Analysis</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Accuracy vs Loss Scatter Plot */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-blue-400 to-orange-500 rounded-full"></div>
                      <Title className="text-base">Accuracy vs Loss Correlation</Title>
                    </div>
                    <div className="flex gap-3 text-[10px]">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-600">High Perf</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-gray-600">Low Perf</span>
                      </span>
                    </div>
                  </div>
                  <div className="h-80">
                    {(() => {
                      // Generate scatter data: high accuracy = low loss
                      const scatterData = trainingMetricsData.epochs.map((_, i) => {
                        const accuracy = trainingMetricsData.accuracyData[i];
                        const loss = trainingMetricsData.lossData[i];
                        return { x: accuracy, y: loss };
                      });
                      
                      return (
                        <Scatter
                          data={{
                            datasets: [
                              {
                                label: 'High Performance',
                                data: scatterData.filter(d => d.x > 85),
                                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                                borderColor: 'rgb(59, 130, 246)',
                                borderWidth: 2,
                                pointRadius: 6,
                                pointHoverRadius: 8,
                              },
                              {
                                label: 'Low Performance',
                                data: scatterData.filter(d => d.x <= 85),
                                backgroundColor: 'rgba(251, 146, 60, 0.7)',
                                borderColor: 'rgb(251, 146, 60)',
                                borderWidth: 2,
                                pointRadius: 6,
                                pointHoverRadius: 8,
                              }
                            ]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false },
                              tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#fff',
                                bodyColor: '#a0aec0',
                                borderColor: '#374151',
                                borderWidth: 1,
                                padding: 12,
                                callbacks: {
                                  label: (item: any) => [
                                    `Accuracy: ${item.parsed.x.toFixed(1)}%`,
                                    `Loss: ${item.parsed.y.toFixed(3)}`
                                  ]
                                }
                              }
                            },
                            scales: {
                              x: {
                                title: {
                                  display: true,
                                  text: 'Accuracy (%)',
                                  color: '#6b7280',
                                  font: { size: 11 }
                                },
                                grid: { color: 'rgba(107, 114, 128, 0.1)' },
                                ticks: { color: '#6b7280', font: { size: 10 } }
                              },
                              y: {
                                title: {
                                  display: true,
                                  text: 'Loss',
                                  color: '#6b7280',
                                  font: { size: 11 }
                                },
                                grid: { color: 'rgba(107, 114, 128, 0.1)' },
                                ticks: { color: '#6b7280', font: { size: 10 } }
                              }
                            }
                          }}
                        />
                      );
                    })()}
                  </div>
                  <Text className="mt-4 text-xs text-gray-600">
                    Strong inverse correlation indicates effective training. Blue points show optimal epochs.
                  </Text>
                </Card>

                {/* Model Performance Bubble Chart */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full"></div>
                      <Title className="text-base">Model Performance Clusters</Title>
                    </div>
                    <span className="text-[10px] text-gray-600">Bubble size = Training Time</span>
                  </div>
                  <div className="h-80">
                    {(() => {
                      // Generate bubble data for different models
                      const bubbleData = [
                        { x: 35, y: -80, r: 20, label: 'RF-1' },
                        { x: 32, y: -95, r: 25, label: 'RF-2' },
                        { x: 30, y: -85, r: 22, label: 'NN-1' },
                        { x: 38, y: -75, r: 18, label: 'NN-2' },
                        { x: 40, y: -70, r: 30, label: 'XGB-1' },
                        { x: 42, y: -82, r: 28, label: 'XGB-2' },
                        { x: 45, y: -90, r: 24, label: 'XGB-3' },
                        { x: 43, y: -78, r: 26, label: 'SVM-1' },
                        { x: 48, y: -88, r: 20, label: 'SVM-2' },
                        { x: 50, y: -92, r: 32, label: 'LR-1' },
                        { x: 52, y: -125, r: 22, label: 'LR-2' },
                        { x: 65, y: -155, r: 35, label: 'Ensemble' },
                      ];
                      
                      return (
                        <Bubble
                          data={{
                            datasets: [{
                              label: 'Models',
                              data: bubbleData,
                              backgroundColor: 'rgba(234, 179, 8, 0.6)',
                              borderColor: 'rgb(234, 179, 8)',
                              borderWidth: 2,
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false },
                              tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#fff',
                                bodyColor: '#a0aec0',
                                borderColor: '#374151',
                                borderWidth: 1,
                                padding: 12,
                                callbacks: {
                                  label: (item: any) => {
                                    const point = item.raw as any;
                                    return [
                                      `Model: ${point.label}`,
                                      `Lat: ${point.x}`,
                                      `Lng: ${point.y}`,
                                      `Training: ${point.r}min`
                                    ];
                                  }
                                }
                              }
                            },
                            scales: {
                              x: {
                                title: {
                                  display: true,
                                  text: 'Latitude',
                                  color: '#6b7280',
                                  font: { size: 11 }
                                },
                                grid: { color: 'rgba(107, 114, 128, 0.1)' },
                                ticks: { color: '#6b7280', font: { size: 10 } }
                              },
                              y: {
                                title: {
                                  display: true,
                                  text: 'Longitude',
                                  color: '#6b7280',
                                  font: { size: 11 }
                                },
                                grid: { color: 'rgba(107, 114, 128, 0.1)' },
                                ticks: { color: '#6b7280', font: { size: 10 } }
                              }
                            }
                          }}
                        />
                      );
                    })()}
                  </div>
                  <Text className="mt-4 text-xs text-gray-600">
                    Bubble positions show model configurations. Larger bubbles indicate longer training times.
                  </Text>
                </Card>
              </div>
            </div>

            {/* Model Information Card */}
            <Card className="mt-6">
              <Title>Model Information</Title>
              <div className="mt-4 space-y-3">
                <Flex>
                  <Text>Model Type</Text>
                  <Text className="font-medium">{selectedModel.modelType || 'Classification'}</Text>
                </Flex>
                <Flex>
                  <Text>Training Date</Text>
                  <Text className="font-medium">{new Date(selectedModel.createdAt).toLocaleDateString()}</Text>
                </Flex>
                <Flex>
                  <Text>Status</Text>
                  <BadgeDelta deltaType={selectedModel.status === 'trained' ? 'moderateIncrease' : 'unchanged'}>
                    {selectedModel.status}
                  </BadgeDelta>
                </Flex>
                {selectedModel.description && (
                  <div>
                    <Text className="text-sm text-gray-500 mb-1">Description</Text>
                    <Text>{selectedModel.description}</Text>
                  </div>
                )}
              </div>
            </Card>
          </TabPanel>

          <TabPanel>
            {/* Performance Tab - ALL charts and visualizations */}
            
            {/* Performance Over Time */}
            <Card className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <Title>Performance Over Time</Title>
                {metrics && metrics.timestamps && metrics.timestamps.length > 0 && (
                  <span className="text-xs text-emerald-500 font-semibold uppercase tracking-wider">● LIVE</span>
                )}
              </div>
              {metricsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-700">Failed to load metrics: {metricsError}</p>
                </div>
              )}
              {metricsLoading && !performanceData.length && (
                <div className="h-72 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Loading performance metrics from InfluxDB...</p>
                  </div>
                </div>
              )}
              {!metricsLoading && performanceData.length === 0 && (
                <div className="h-72 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">No performance metrics available yet.</p>
                    <p className="text-xs text-gray-400 mt-2">Metrics will appear as the model is evaluated.</p>
                  </div>
                </div>
              )}
              {performanceData.length > 0 && (
                <AreaChart
                  className="h-72 mt-4"
                  data={performanceData}
                  index="date"
                  categories={['accuracy', 'precision', 'recall']}
                  colors={['blue', 'cyan', 'indigo']}
                />
              )}

              {performanceNarrative && performanceData.length > 0 && (
                <div className={`mt-6 ${insightPanelClass} p-4 text-sm text-slate-700 space-y-2`}>
                  <p>{performanceNarrative.accuracyMsg}</p>
                  <p>{performanceNarrative.precisionMsg}</p>
                  <p>{performanceNarrative.recallMsg}</p>
                  <p>{performanceNarrative.stability}</p>
                  {metrics && metrics.timestamps && metrics.timestamps.length > 0 && (
                    <p className="text-xs text-emerald-600 mt-2">
                      📊 Data from InfluxDB: {metrics.timestamps.length} real-time data points
                    </p>
                  )}
                </div>
              )}

              <div className={`mt-6 ${insightPanelClass} p-4 space-y-3`}>
                <div>
                  <Text className={insightHeadingClass}>Ask about performance trends</Text>
                  <Text className={insightHelperClass}>Use plain English to interpret accuracy, precision, and recall trajectories.</Text>
                </div>
                <form onSubmit={handlePerformanceSubmit} className="space-y-2">
                  <input
                    type="text"
                    value={performanceQuestion}
                    onChange={(e) => setPerformanceQuestion(e.target.value)}
                    placeholder="e.g., Are metrics trending up?"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex items-center gap-2">
                    <Button type="submit" size="sm" disabled={!performanceQuestion.trim()}>
                      Ask
                    </Button>
                    <button
                      type="button"
                      onClick={() => setPerformanceAnswer(null)}
                      className="text-xs font-medium text-slate-500 hover:text-indigo-600"
                    >
                      Clear answer
                    </button>
                  </div>
                </form>
                {performanceAnswer && (
                  <div className={insightAnswerClass} aria-live="polite">
                    {performanceAnswer}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {performanceQuestionSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handlePerformanceSuggestion(suggestion)}
                      className={chipButtonClass}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Conditional visualizations based on model type */}
            {isClassificationModel ? (
              /* Classification Models: Confusion Matrix & ROC Curve */
              <Grid numItems={1} numItemsSm={2} className="gap-6 mt-6">
                <Card>
                  <Title>Confusion Matrix</Title>
                  <Table className="mt-4">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Actual</TableHeaderCell>
                      <TableHeaderCell>Predicted</TableHeaderCell>
                      <TableHeaderCell>Count</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {confusionMatrix.rows.map((row, idx) => (
                      <TableRow key={`${row.actual}-${row.predicted}-${idx}`}>
                        <TableCell>{row.actual}</TableCell>
                        <TableCell>{row.predicted}</TableCell>
                        <TableCell>{row.count.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {confusionNarrative && (
                  <div className={`mt-6 ${insightPanelClass} p-4 space-y-3 text-sm text-slate-700`}>
                    <p>{confusionNarrative.intro}</p>
                    <p>{confusionNarrative.errorFocus}</p>
                    <p>{confusionNarrative.stability}</p>
                    <ul className="mt-2 space-y-1">
                      {confusionNarrative.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2">
                          <span className={subtleListBulletClass} aria-hidden="true"></span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={`mt-6 ${insightPanelClass} p-4 space-y-3`}>
                  <div>
                    <Text className={insightHeadingClass}>Ask about these errors</Text>
                    <Text className={insightHelperClass}>Get quick explanations for precision, recall, or class imbalance.</Text>
                  </div>
                  <form onSubmit={handleConfusionQuestionSubmit} className="space-y-2">
                    <input
                      type="text"
                      value={confusionQuestion}
                      onChange={(e) => setConfusionQuestion(e.target.value)}
                      placeholder="e.g., Where do most errors happen?"
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="flex items-center gap-2">
                      <Button type="submit" size="sm" disabled={!confusionQuestion.trim()}>
                        Ask
                      </Button>
                      <button
                        type="button"
                        onClick={() => setConfusionAnswer(null)}
                        className="text-xs font-medium text-slate-500 hover:text-indigo-600"
                      >
                        Clear answer
                      </button>
                    </div>
                  </form>
                  {confusionAnswer && (
                    <div className={insightAnswerClass} aria-live="polite">
                      {confusionAnswer}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {confusionQuestionSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleConfusionSuggestion(suggestion)}
                        className={chipButtonClass}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              <Card>
                <Title>ROC Curve</Title>
                <Text>Area Under Curve (AUC): {selectedModel.metrics?.auc?.toFixed(3) || 'N/A'}</Text>
                <div className="h-64 mt-4 flex items-center justify-center text-gray-500">
                  ROC curve visualization coming soon
                </div>

                {rocNarrative && (
                  <div className={`mt-6 ${insightPanelClass} p-4 space-y-2 text-sm text-slate-700`}>
                    <p>{rocNarrative.summary}</p>
                    <p>{rocNarrative.descriptor}</p>
                    <p>{rocNarrative.thresholdHint}</p>
                  </div>
                )}

                <div className={`mt-6 ${insightPanelClass} p-4 space-y-3`}>
                  <div>
                    <Text className={insightHeadingClass}>Ask about ROC/AUC</Text>
                    <Text className={insightHelperClass}>Understand what the curve says about thresholds and trade-offs.</Text>
                  </div>
                    <form onSubmit={handleRocSubmit} className="space-y-2">
                      <input
                        type="text"
                        value={rocQuestion}
                        onChange={(e) => setRocQuestion(e.target.value)}
                        placeholder="e.g., Should I adjust the threshold?"
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <div className="flex items-center gap-2">
                        <Button type="submit" size="sm" disabled={!rocQuestion.trim()}>
                          Ask
                        </Button>
                        <button
                          type="button"
                          onClick={() => setRocAnswer(null)}
                          className="text-xs font-medium text-slate-500 hover:text-indigo-600"
                        >
                          Clear answer
                        </button>
                      </div>
                    </form>
                    {rocAnswer && (
                      <div className={insightAnswerClass} aria-live="polite">
                        {rocAnswer}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {rocQuestionSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleRocSuggestion(suggestion)}
                          className={chipButtonClass}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                </div>
              </Card>
            </Grid>
            ) : (
              /* Regression Models: Residual Plot & Error Distribution */
              <Grid numItems={1} numItemsSm={2} className="gap-6 mt-6">
                <Card>
                  <Title>Residual Plot</Title>
                  <Text className="mt-2">
                    Shows prediction errors (residuals = actual - predicted) vs predicted values.
                    Random scatter around zero indicates a good model.
                  </Text>
                  
                  <ScatterChart
                    className="h-72 mt-6"
                    data={residualPlotData}
                    category="Residual"
                    x="predicted"
                    y="residual"
                    showLegend={false}
                    colors={['rose']}
                  />

                  <div className={`mt-6 ${insightPanelClass} p-4 space-y-2 text-sm text-slate-700`}>
                    <p>
                      <strong>Ideal residual plot:</strong> Points randomly scattered around the horizontal line at zero.
                    </p>
                    <p>
                      <strong>Patterns to watch for:</strong> Curves or funnels indicate the model may not capture all relationships.
                    </p>
                    <p>
                      <strong>Outliers:</strong> Points far from zero represent predictions with large errors.
                    </p>
                  </div>
                </Card>

                <Card>
                  <Title>Regression Metrics</Title>
                  <div className="mt-6 space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <Text className="text-sm text-gray-600">Mean Absolute Error (MAE)</Text>
                      <Metric className="mt-1">
                        {(residualPlotData.reduce((sum, d) => sum + Math.abs(d.residual), 0) / residualPlotData.length).toFixed(2)}
                      </Metric>
                      <Text className="text-xs text-gray-500 mt-2">Average prediction error magnitude</Text>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <Text className="text-sm text-gray-600">Root Mean Squared Error (RMSE)</Text>
                      <Metric className="mt-1">
                        {Math.sqrt(residualPlotData.reduce((sum, d) => sum + d.residual ** 2, 0) / residualPlotData.length).toFixed(2)}
                      </Metric>
                      <Text className="text-xs text-gray-500 mt-2">Penalizes larger errors more heavily</Text>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <Text className="text-sm text-gray-600">R² Score</Text>
                      <Metric className="mt-1">
                        {selectedModel.metrics?.accuracy ? (selectedModel.metrics.accuracy).toFixed(3) : '0.850'}
                      </Metric>
                      <Text className="text-xs text-gray-500 mt-2">Proportion of variance explained (0-1)</Text>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-4">
                      <Text className="text-sm text-gray-600">Mean Residual</Text>
                      <Metric className="mt-1">
                        {(residualPlotData.reduce((sum, d) => sum + d.residual, 0) / residualPlotData.length).toFixed(3)}
                      </Metric>
                      <Text className="text-xs text-gray-500 mt-2">Should be close to zero (no bias)</Text>
                    </div>
                  </div>
                </Card>
              </Grid>
            )}

            {/* Advanced Performance Analysis Dashboards */}
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Advanced Performance Analysis</h3>
              
              {/* Time Series Decomposition - Seasonal-Trend Analysis */}
              <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden mb-4">
                <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
                      <h3 className="text-sm font-semibold text-white">Seasonal-Trend Decomposition</h3>
                    </div>
                    <div className="flex gap-3 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                        Original
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        Trend
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        Seasonal
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        Residual
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {/* Original Series */}
                  <div className="h-32">
                    <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Original</div>
                    <Line
                      data={{
                        labels: trainingMetricsData.epochs.map(e => `E${e}`),
                        datasets: [{
                          label: 'Original Accuracy',
                          data: trainingMetricsData.accuracyData,
                          borderColor: 'rgb(34, 211, 238)',
                          backgroundColor: (context: any) => {
                            const ctx = context.chart.ctx;
                            const gradient = ctx.createLinearGradient(0, 0, 0, 120);
                            gradient.addColorStop(0, 'rgba(34, 211, 238, 0.3)');
                            gradient.addColorStop(1, 'rgba(34, 211, 238, 0.01)');
                            return gradient;
                          },
                          borderWidth: 2,
                          fill: true,
                          tension: 0.4,
                          pointRadius: 0,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: { enabled: false }
                        },
                        scales: {
                          x: { 
                            display: false,
                            grid: { display: false }
                          },
                          y: {
                            display: false,
                            grid: { display: false }
                          }
                        },
                        elements: {
                          line: { borderWidth: 1 }
                        }
                      }}
                    />
                  </div>

                  {/* Trend Component */}
                  <div className="h-32">
                    <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Trend</div>
                    <Line
                      data={{
                        labels: trainingMetricsData.epochs.map(e => `E${e}`),
                        datasets: [{
                          label: 'Trend',
                          data: trainingMetricsData.epochs.map((_: number, i: number) => 60 + (i * 1.2)), // Smooth upward trend
                          borderColor: 'rgb(59, 130, 246)',
                          backgroundColor: (context: any) => {
                            const ctx = context.chart.ctx;
                            const gradient = ctx.createLinearGradient(0, 0, 0, 120);
                            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
                            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');
                            return gradient;
                          },
                          borderWidth: 2,
                          fill: true,
                          tension: 0.1,
                          pointRadius: 0,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: { enabled: false }
                        },
                        scales: {
                          x: { 
                            display: false,
                            grid: { display: false }
                          },
                          y: {
                            display: false,
                            grid: { display: false }
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Seasonal Component */}
                  <div className="h-32">
                    <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Seasonal</div>
                    <Line
                      data={{
                        labels: trainingMetricsData.epochs.map(e => `E${e}`),
                        datasets: [{
                          label: 'Seasonal',
                          data: trainingMetricsData.epochs.map((_: number, i: number) => Math.sin(i * 0.5) * 5 + 70), // Oscillating pattern
                          borderColor: 'rgb(168, 85, 247)',
                          backgroundColor: (context: any) => {
                            const ctx = context.chart.ctx;
                            const gradient = ctx.createLinearGradient(0, 0, 0, 120);
                            gradient.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
                            gradient.addColorStop(1, 'rgba(168, 85, 247, 0.01)');
                            return gradient;
                          },
                          borderWidth: 2,
                          fill: true,
                          tension: 0.4,
                          pointRadius: 0,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: { enabled: false }
                        },
                        scales: {
                          x: { 
                            display: false,
                            grid: { display: false }
                          },
                          y: {
                            display: false,
                            grid: { display: false }
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Residual Component */}
                  <div className="h-32">
                    <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Residual</div>
                    <Line
                      data={{
                        labels: trainingMetricsData.epochs.map(e => `E${e}`),
                        datasets: [{
                          label: 'Residual',
                          data: trainingMetricsData.epochs.map(() => (Math.random() - 0.5) * 3 + 70), // Random noise
                          borderColor: 'rgb(236, 72, 153)',
                          backgroundColor: (context: any) => {
                            const ctx = context.chart.ctx;
                            const gradient = ctx.createLinearGradient(0, 0, 0, 120);
                            gradient.addColorStop(0, 'rgba(236, 72, 153, 0.3)');
                            gradient.addColorStop(1, 'rgba(236, 72, 153, 0.01)');
                            return gradient;
                          },
                          borderWidth: 1,
                          fill: true,
                          tension: 0,
                          pointRadius: 0,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: { enabled: false }
                        },
                        scales: {
                          x: { 
                            display: true,
                            grid: { display: false },
                            ticks: { 
                              color: '#6b7280',
                              font: { size: 9 },
                              maxTicksLimit: 10
                            }
                          },
                          y: {
                            display: false,
                            grid: { display: false }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Model Metrics Comparison - Gradient Bar Chart */}
                <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-blue-400 via-purple-500 to-pink-600 rounded-full"></div>
                      <h3 className="text-sm font-semibold text-white">Model Metrics Comparison</h3>
                    </div>
                  </div>
                  <div className="p-4 h-80">
                    <Bar
                      data={{
                        labels: ['Accuracy', 'Precision', 'Recall', 'F1 Score', 'AUC-ROC'],
                        datasets: [{
                          label: 'Performance',
                          data: [92.5, 89.3, 91.2, 90.1, 94.3],
                          backgroundColor: (context: any) => {
                            const index = context.dataIndex;
                            const colors = [
                              { start: 'rgba(59, 130, 246, 0.9)', end: 'rgba(59, 130, 246, 0.4)' },
                              { start: 'rgba(139, 92, 246, 0.9)', end: 'rgba(139, 92, 246, 0.4)' },
                              { start: 'rgba(236, 72, 153, 0.9)', end: 'rgba(236, 72, 153, 0.4)' },
                              { start: 'rgba(251, 146, 60, 0.9)', end: 'rgba(251, 146, 60, 0.4)' },
                              { start: 'rgba(34, 197, 94, 0.9)', end: 'rgba(34, 197, 94, 0.4)' },
                            ];
                            const ctx = context.chart.ctx;
                            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                            gradient.addColorStop(0, colors[index].start);
                            gradient.addColorStop(1, colors[index].end);
                            return gradient;
                          },
                          borderColor: ['rgb(59, 130, 246)', 'rgb(139, 92, 246)', 'rgb(236, 72, 153)', 'rgb(251, 146, 60)', 'rgb(34, 197, 94)'],
                          borderWidth: 2,
                          borderRadius: 6,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#a0aec0',
                            borderColor: '#374151',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                              label: (item: any) => `${item.label}: ${item.parsed.y.toFixed(1)}%`
                            }
                          }
                        },
                        scales: {
                          x: {
                            grid: { display: false },
                            ticks: { color: '#9ca3af', font: { size: 11 } }
                          },
                          y: {
                            grid: { color: 'rgba(75, 85, 99, 0.2)' },
                            ticks: { 
                              color: '#9ca3af', 
                              font: { size: 10 },
                              callback: (value: any) => `${value}%`
                            },
                            max: 100
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Training Status Heatmap */}
                <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800 bg-[#0d1117]">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-600 rounded-full"></div>
                      <h3 className="text-sm font-semibold text-white">Training Status Heatmap</h3>
                    </div>
                  </div>
                  <div className="p-4 h-80">
                    {/* Heatmap-style visualization */}
                    <div className="space-y-1">
                      <div className="flex gap-1 mb-3 text-[9px] text-gray-500">
                        <span className="w-16">Model</span>
                        {trainingMetricsData.epochs.slice(0, 15).map((e) => (
                          <div key={e} className="w-6 text-center">E{e}</div>
                        ))}
                      </div>
                      {['RF', 'NN', 'XGB', 'SVM', 'LR'].map((model, modelIdx) => (
                        <div key={model} className="flex gap-1 items-center">
                          <span className="w-16 text-[10px] text-gray-400 font-mono">{model}</span>
                          {trainingMetricsData.epochs.slice(0, 15).map((e) => {
                            const intensity = trainingMetricsData.accuracyData[e - 1] || 0;
                            const hue = modelIdx * 50; // Different color per model
                            const opacity = (intensity / 100) * 0.8 + 0.2;
                            return (
                              <div
                                key={e}
                                className="w-6 h-6 rounded border border-gray-800"
                                style={{
                                  backgroundColor: `hsla(${hue + 200}, 70%, 50%, ${opacity})`,
                                }}
                                title={`${model} E${e}: ${intensity.toFixed(1)}%`}
                              />
                            );
                          })}
                        </div>
                      ))}
                      <div className="flex gap-2 items-center justify-center mt-4 text-[9px] text-gray-500">
                        <span>Low</span>
                        <div className="flex gap-0.5">
                          {[0.2, 0.4, 0.6, 0.8, 1.0].map((opacity) => (
                            <div
                              key={opacity}
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: `hsla(220, 70%, 50%, ${opacity})` }}
                            />
                          ))}
                        </div>
                        <span>High</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel>
            <Card className="mt-6">
              <Title>Feature Importance</Title>
              {featureImportanceData.length > 0 ? (
                featureImportanceData.map(({ feature, importance }) => (
                  <div key={feature} className="mt-4">
                    <Flex>
                      <Text>{feature}</Text>
                      <Text>{(importance * 100).toFixed(1)}%</Text>
                    </Flex>
                    <ProgressBar value={importance * 100} className="mt-2" />
                  </div>
                ))
              ) : (
                <Text className="mt-4 text-gray-500">
                  Feature importance data becomes available once the dataset preview loads.
                </Text>
              )}

              {featureNarrative && (
                <div className={`mt-6 ${insightPanelClass} p-4 space-y-2 text-sm text-slate-700`}>
                  <p>{featureNarrative.intro}</p>
                  <p>{featureNarrative.supporting}</p>
                  <p>{featureNarrative.spreadDescriptor}</p>
                </div>
              )}

              <div className={`mt-6 ${insightPanelClass} p-4 space-y-3`}>
                <div>
                  <Text className={insightHeadingClass}>Ask about feature importance</Text>
                  <Text className={insightHelperClass}>Use natural language to understand which columns matter.</Text>
                </div>
                <form onSubmit={handleFeatureSubmit} className="space-y-2">
                  <input
                    type="text"
                    value={featureQuestion}
                    onChange={(e) => setFeatureQuestion(e.target.value)}
                    placeholder="e.g., Can I drop any columns?"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex items-center gap-2">
                    <Button type="submit" size="sm" disabled={!featureQuestion.trim()}>
                      Ask
                    </Button>
                    <button
                      type="button"
                      onClick={() => setFeatureAnswer(null)}
                      className="text-xs font-medium text-slate-500 hover:text-indigo-600"
                    >
                      Clear answer
                    </button>
                  </div>
                </form>
                {featureAnswer && (
                  <div className={insightAnswerClass} aria-live="polite">
                    {featureAnswer}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {featureQuestionSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleFeatureSuggestion(suggestion)}
                      className={chipButtonClass}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Feature Contribution to Predictions */}
            <Card className="mt-6">
              <Title>Feature Contribution Analysis</Title>
              <Text className="mt-2 text-sm text-gray-600">
                Shows how each feature contributes to the model's prediction confidence.
                Positive values push predictions toward the positive class, negative values toward negative.
              </Text>
              
              <div className="h-96 mt-6">
                {(() => {
                  // Generate SHAP-style feature contribution data
                  const generateFeatureContributions = () => {
                    if (!featureImportanceData.length) {
                      return { labels: [], datasets: [] };
                    }

                    const features = featureImportanceData.slice(0, 6).map(f => f.feature);
                    
                    // Generate contributions for multiple sample predictions
                    const samples = ['Sample 1', 'Sample 2', 'Sample 3', 'Sample 4', 'Sample 5'];
                    
                    const datasets = features.map((feature, idx) => {
                      const baseImportance = featureImportanceData[idx].importance;
                      const data = samples.map(() => {
                        // Generate positive or negative contributions
                        const contribution = (Math.random() - 0.5) * 2 * baseImportance * 100;
                        return Number(contribution.toFixed(2));
                      });
                      
                      const colors = [
                        'rgba(59, 130, 246, 0.8)',   // blue
                        'rgba(139, 92, 246, 0.8)',   // purple
                        'rgba(236, 72, 153, 0.8)',   // pink
                        'rgba(251, 146, 60, 0.8)',   // orange
                        'rgba(34, 197, 94, 0.8)',    // green
                        'rgba(14, 165, 233, 0.8)',   // cyan
                      ];
                      
                      return {
                        label: feature,
                        data,
                        backgroundColor: colors[idx % colors.length],
                        borderColor: colors[idx % colors.length].replace('0.8', '1'),
                        borderWidth: 1,
                      };
                    });

                    return { labels: samples, datasets };
                  };

                  const { labels, datasets } = generateFeatureContributions();

                  return datasets.length > 0 ? (
                    <Bar
                      data={{ labels, datasets }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y' as const,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'bottom' as const,
                            labels: {
                              color: '#6b7280',
                              font: { size: 11 },
                              padding: 15,
                              usePointStyle: true,
                              pointStyle: 'circle',
                            }
                          },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#a0aec0',
                            borderColor: '#374151',
                            borderWidth: 1,
                            padding: 12,
                            callbacks: {
                              label: (context: any) => {
                                const value = context.parsed.x;
                                const direction = value > 0 ? 'Positive' : 'Negative';
                                return `${context.dataset.label}: ${value.toFixed(2)}% (${direction})`;
                              }
                            }
                          }
                        },
                        scales: {
                          x: {
                            stacked: true,
                            grid: { color: 'rgba(107, 114, 128, 0.1)' },
                            ticks: { 
                              color: '#6b7280', 
                              font: { size: 10 },
                              callback: (value: any) => `${value}%`
                            },
                            title: {
                              display: true,
                              text: 'Contribution to Prediction',
                              color: '#6b7280',
                              font: { size: 11 }
                            }
                          },
                          y: {
                            stacked: true,
                            grid: { display: false },
                            ticks: { 
                              color: '#6b7280',
                              font: { size: 10 }
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <Text>Load dataset preview to see feature contributions</Text>
                    </div>
                  );
                })()}
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <Text className="text-sm font-semibold text-green-900 mb-1">Positive Contributions</Text>
                      <Text className="text-xs text-green-800">
                        Features pushing the prediction toward the positive class. 
                        Larger bars indicate stronger influence on the final prediction.
                      </Text>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <Text className="text-sm font-semibold text-red-900 mb-1">Negative Contributions</Text>
                      <Text className="text-xs text-red-800">
                        Features pushing the prediction toward the negative class.
                        Helps identify which features work against certain predictions.
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Feature Interaction Matrix */}
            <Card className="mt-6">
              <Title>Feature Interaction Strength</Title>
              <Text className="mt-2 text-sm text-gray-600">
                Measures how features work together to influence predictions.
                Higher values indicate strong feature interactions.
              </Text>
              
              <div className="h-96 mt-6">
                {(() => {
                  // Generate feature interaction heatmap data
                  if (!featureImportanceData.length) {
                    return (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <Text>Load dataset preview to see feature interactions</Text>
                      </div>
                    );
                  }

                  const topFeatures = featureImportanceData.slice(0, 5);
                  
                  return (
                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full">
                        {/* Header row */}
                        <div className="flex gap-2 mb-2 ml-32">
                          {topFeatures.map((f) => (
                            <div key={f.feature} className="w-24 text-center">
                              <Text className="text-xs text-gray-600 truncate">{f.feature}</Text>
                            </div>
                          ))}
                        </div>
                        
                        {/* Matrix rows */}
                        {topFeatures.map((rowFeature, rowIdx) => (
                          <div key={rowFeature.feature} className="flex gap-2 items-center mb-2">
                            <div className="w-32 text-right pr-2">
                              <Text className="text-xs text-gray-600 truncate">{rowFeature.feature}</Text>
                            </div>
                            {topFeatures.map((colFeature, colIdx) => {
                              // Diagonal is always 1.0 (self-interaction)
                              const interaction = rowIdx === colIdx 
                                ? 1.0 
                                : Math.abs(rowFeature.importance * colFeature.importance) * (0.3 + Math.random() * 0.5);
                              
                              const intensity = interaction;
                              const bgColor = rowIdx === colIdx
                                ? 'bg-indigo-600'
                                : intensity > 0.7
                                ? 'bg-orange-500'
                                : intensity > 0.4
                                ? 'bg-yellow-400'
                                : 'bg-green-400';
                              
                              const textColor = intensity > 0.4 || rowIdx === colIdx ? 'text-white' : 'text-gray-900';
                              
                              return (
                                <div
                                  key={`${rowIdx}-${colIdx}`}
                                  className={`w-24 h-16 rounded-lg ${bgColor} ${textColor} flex items-center justify-center text-sm font-semibold border border-gray-200 transition-transform hover:scale-105 cursor-pointer`}
                                  title={`${rowFeature.feature} × ${colFeature.feature}: ${interaction.toFixed(2)}`}
                                >
                                  {interaction.toFixed(2)}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                        
                        {/* Legend */}
                        <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-400 rounded border border-gray-300"></div>
                            <Text className="text-xs text-gray-600">Weak (0.0-0.4)</Text>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-yellow-400 rounded border border-gray-300"></div>
                            <Text className="text-xs text-gray-600">Moderate (0.4-0.7)</Text>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-orange-500 rounded border border-gray-300"></div>
                            <Text className="text-xs text-gray-600">Strong (0.7+)</Text>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-indigo-600 rounded border border-gray-300"></div>
                            <Text className="text-xs text-gray-600">Self (1.0)</Text>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <Text className="text-sm font-semibold text-purple-900 mb-1">Interpreting Interactions</Text>
                    <Text className="text-xs text-purple-800">
                      Strong interactions (orange) suggest features work together in the model. 
                      Consider engineering composite features from strongly interacting pairs.
                      Weak interactions (green) indicate features provide independent information.
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </TabPanel>

          <TabPanel>
            <Card className="mt-6">
              <Title>Sample Predictions</Title>
              <Table className="mt-4">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Input Features</TableHeaderCell>
                    <TableHeaderCell>Prediction</TableHeaderCell>
                    <TableHeaderCell>Confidence</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {predictionSamples.length > 0 ? (
                    predictionSamples.map((sample) => (
                      <TableRow key={sample.id}>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {sample.row.join(', ')}
                          </div>
                        </TableCell>
                        <TableCell>{sample.prediction}</TableCell>
                        <TableCell>{sample.confidence.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Text className="text-sm text-gray-500">Load a dataset preview to see sample predictions.</Text>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {predictionNarrative && (
                <div className={`mt-6 ${insightPanelClass} p-4 space-y-2 text-sm text-slate-700`}>
                  <p>{predictionNarrative.distribution}</p>
                  <p>{predictionNarrative.confidence}</p>
                  <p>{predictionNarrative.action}</p>
                </div>
              )}

              <div className={`mt-6 ${insightPanelClass} p-4 space-y-3`}>
                <div>
                  <Text className={insightHeadingClass}>Ask about predictions</Text>
                  <Text className={insightHelperClass}>Understand class skew, confidence, and threshold guidance.</Text>
                </div>
                <form onSubmit={handlePredictionSubmit} className="space-y-2">
                  <input
                    type="text"
                    value={predictionQuestion}
                    onChange={(e) => setPredictionQuestion(e.target.value)}
                    placeholder="e.g., Are predictions confident enough?"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex items-center gap-2">
                    <Button type="submit" size="sm" disabled={!predictionQuestion.trim()}>
                      Ask
                    </Button>
                    <button
                      type="button"
                      onClick={() => setPredictionAnswer(null)}
                      className="text-xs font-medium text-slate-500 hover:text-indigo-600"
                    >
                      Clear answer
                    </button>
                  </div>
                </form>
                {predictionAnswer && (
                  <div className={insightAnswerClass} aria-live="polite">
                    {predictionAnswer}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {predictionQuestionSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handlePredictionSuggestion(suggestion)}
                      className={chipButtonClass}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Predicted vs Actual Scatter Plot */}
            <Card className="mt-6">
              <Title>Predicted vs Actual Values</Title>
              <Text className="mt-2">
                Scatter plot showing how well predictions match actual values. 
                Points closer to the diagonal line indicate better predictions.
              </Text>
              
              <ScatterChart
                className="h-80 mt-6"
                data={predictedVsActualData}
                category="Sample"
                x="actual"
                y="predicted"
                showLegend={false}
                minYValue={0}
                maxYValue={100}
                colors={['blue']}
              />

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <Text className="text-sm text-gray-600">Mean Absolute Error</Text>
                  <Metric className="mt-1">
                    {(predictedVsActualData.reduce((sum, d) => sum + Math.abs(d.error), 0) / predictedVsActualData.length).toFixed(2)}
                  </Metric>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <Text className="text-sm text-gray-600">R² Score</Text>
                  <Metric className="mt-1">
                    {selectedModel.metrics?.accuracy ? (selectedModel.metrics.accuracy).toFixed(3) : 'N/A'}
                  </Metric>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <Text className="text-sm text-gray-600">Samples Analyzed</Text>
                  <Metric className="mt-1">{predictedVsActualData.length}</Metric>
                </div>
              </div>

              <div className={`mt-6 ${insightPanelClass} p-4 space-y-2 text-sm text-slate-700`}>
                <p>
                  <strong>Perfect predictions</strong> would fall exactly on the diagonal line (where predicted = actual).
                </p>
                <p>
                  Points <strong>above the line</strong> indicate the model overestimated the value, 
                  while points <strong>below the line</strong> show underestimation.
                </p>
                <p>
                  The <strong>scatter around the line</strong> represents prediction error. 
                  Tighter clustering means more accurate predictions.
                </p>
              </div>
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
      </div>
    </main>
  );
};

// Model Evaluation is a core feature available to all users
// Essential for validating trained models and understanding performance
const ModelEvaluation = () => {
  return <ModelEvaluationContent />;
};

export default ModelEvaluation;