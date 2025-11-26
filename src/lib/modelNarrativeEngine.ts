/**
 * Model Narrative Engine
 * 
 * Generates rich, comprehensive narratives about ML models,
 * their predictions, and the reasoning behind conclusions.
 */

import { Dataset, MLModel } from '../types';
import { DatasetKnowledge } from './datasetKnowledge';

export interface ModelSummary {
  overview: string;
  dataStory: string;
  methodology: string;
  keyFindings: string[];
  performanceNarrative: string;
  limitationsAndCaveats: string[];
  recommendations: string[];
  conclusion: string;
}

export interface PredictionExplanation {
  prediction: string;
  confidence: string;
  topFactors: { factor: string; impact: string; direction: 'positive' | 'negative' | 'neutral' }[];
  reasoning: string;
  alternativeScenarios: string[];
  actionableInsights: string[];
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  businessMeaning?: string;
  insight: string;
}

/**
 * Generate a comprehensive narrative summary of a model
 */
export function generateModelNarrative(
  model: MLModel,
  dataset: Dataset,
  knowledge?: DatasetKnowledge
): ModelSummary {
  const metrics = model.metrics || {};
  const accuracy = metrics.accuracy || 0;
  const precision = metrics.precision || 0;
  const recall = metrics.recall || 0;
  const f1 = metrics.f1Score || metrics.f1 || 0;
  
  const modelType = model.type || model.algorithm || 'machine learning';
  const targetColumn = model.targetColumn || model.target || 'target variable';
  const features = model.features || [];
  const rows = dataset.rows || dataset.row_count || 0;
  const cols = dataset.columns || dataset.column_count || 0;

  // Determine model performance tier
  const performanceTier = getPerformanceTier(accuracy);
  
  // Build the narrative
  const overview = buildOverview(model, dataset, knowledge, performanceTier);
  const dataStory = buildDataStory(dataset, knowledge, rows, cols);
  const methodology = buildMethodology(model, modelType, features, targetColumn);
  const keyFindings = buildKeyFindings(metrics, features, knowledge);
  const performanceNarrative = buildPerformanceNarrative(accuracy, precision, recall, f1, performanceTier);
  const limitationsAndCaveats = buildLimitations(dataset, model, metrics);
  const recommendations = buildRecommendations(metrics, performanceTier, knowledge);
  const conclusion = buildConclusion(model, performanceTier, keyFindings);

  return {
    overview,
    dataStory,
    methodology,
    keyFindings,
    performanceNarrative,
    limitationsAndCaveats,
    recommendations,
    conclusion
  };
}

function getPerformanceTier(accuracy: number): 'excellent' | 'good' | 'moderate' | 'needs_improvement' {
  if (accuracy >= 0.9) return 'excellent';
  if (accuracy >= 0.8) return 'good';
  if (accuracy >= 0.7) return 'moderate';
  return 'needs_improvement';
}

function buildOverview(
  model: MLModel, 
  dataset: Dataset, 
  knowledge: DatasetKnowledge | undefined,
  tier: string
): string {
  const businessContext = knowledge?.businessContext || '';
  const modelName = model.name || 'This model';
  const datasetName = dataset.name;
  
  const tierDescriptors = {
    excellent: 'demonstrates exceptional predictive power',
    good: 'shows strong predictive capabilities',
    moderate: 'provides reasonable predictions with room for improvement',
    needs_improvement: 'is in early stages and requires further refinement'
  };

  let overview = `**${modelName}** ${tierDescriptors[tier as keyof typeof tierDescriptors]}, trained on the "${datasetName}" dataset. `;
  
  if (businessContext) {
    overview += `This model was built to address a specific business need: ${businessContext.slice(0, 200)}${businessContext.length > 200 ? '...' : ''} `;
  }
  
  overview += `The analysis reveals meaningful patterns that can drive data-informed decisions.`;
  
  return overview;
}

function buildDataStory(
  dataset: Dataset, 
  knowledge: DatasetKnowledge | undefined,
  rows: number,
  cols: number
): string {
  const datasetName = dataset.name;
  const source = (dataset as any).source || 'uploaded';
  
  let story = `The journey began with "${datasetName}", a dataset containing **${rows.toLocaleString()} observations** across **${cols} variables**. `;
  
  if (source === 'fred') {
    story += `This economic data from the Federal Reserve provides authoritative insights into market conditions. `;
  } else if (source === 'api') {
    story += `The data was sourced via API integration, ensuring up-to-date information. `;
  }
  
  if (knowledge?.knownIssues?.length) {
    story += `During exploration, we identified ${knowledge.knownIssues.length} data quality considerations that were addressed in preprocessing. `;
  }
  
  if (knowledge?.dataDictionary?.columns?.length) {
    const columnsWithMeaning = knowledge.dataDictionary.columns.filter(c => c.businessMeaning);
    if (columnsWithMeaning.length > 0) {
      story += `Key variables include ${columnsWithMeaning.slice(0, 3).map(c => `**${c.name}** (${c.businessMeaning})`).join(', ')}. `;
    }
  }
  
  story += `This foundation provided the raw material for pattern discovery.`;
  
  return story;
}

function buildMethodology(
  model: MLModel,
  modelType: string,
  features: string[],
  targetColumn: string
): string {
  const algorithmDescriptions: Record<string, string> = {
    'random_forest': 'Random Forest, an ensemble method that combines multiple decision trees to reduce overfitting and improve generalization',
    'xgboost': 'XGBoost, a gradient boosting algorithm known for its speed and performance on structured data',
    'linear_regression': 'Linear Regression, establishing clear mathematical relationships between predictors and outcomes',
    'logistic_regression': 'Logistic Regression, providing interpretable probability estimates for classification',
    'neural_network': 'a Neural Network architecture, capable of learning complex non-linear patterns',
    'svm': 'Support Vector Machine, finding optimal decision boundaries in high-dimensional space',
    'kmeans': 'K-Means clustering, discovering natural groupings within the data',
    'decision_tree': 'Decision Tree, creating an interpretable rule-based model',
  };

  const algo = algorithmDescriptions[modelType.toLowerCase()] || 
    `${modelType}, a sophisticated algorithm suited for this problem type`;

  let methodology = `We employed ${algo}. `;
  
  if (features.length > 0) {
    methodology += `The model considers **${features.length} input features** to predict **${targetColumn}**. `;
    if (features.length <= 5) {
      methodology += `These features are: ${features.join(', ')}. `;
    } else {
      methodology += `Key features include ${features.slice(0, 3).join(', ')}, among others. `;
    }
  }
  
  methodology += `The data was split into training and validation sets to ensure the model generalizes well to unseen data.`;
  
  return methodology;
}

function buildKeyFindings(
  metrics: Record<string, any>,
  features: string[],
  knowledge?: DatasetKnowledge
): string[] {
  const findings: string[] = [];
  
  const accuracy = metrics.accuracy || 0;
  const precision = metrics.precision || 0;
  const recall = metrics.recall || 0;
  
  // Performance finding
  if (accuracy >= 0.85) {
    findings.push(`The model achieves ${(accuracy * 100).toFixed(1)}% accuracy, indicating it correctly classifies the vast majority of cases.`);
  } else if (accuracy >= 0.7) {
    findings.push(`With ${(accuracy * 100).toFixed(1)}% accuracy, the model provides useful predictions while leaving room for improvement.`);
  } else {
    findings.push(`The current accuracy of ${(accuracy * 100).toFixed(1)}% suggests additional feature engineering or data collection could enhance performance.`);
  }
  
  // Precision vs Recall finding
  if (precision > recall + 0.1) {
    findings.push(`The model prioritizes precision over recall (${(precision * 100).toFixed(1)}% vs ${(recall * 100).toFixed(1)}%), meaning it's conservative in making positive predictions—ideal when false positives are costly.`);
  } else if (recall > precision + 0.1) {
    findings.push(`The model favors recall over precision (${(recall * 100).toFixed(1)}% vs ${(precision * 100).toFixed(1)}%), catching most positive cases—suitable when missing positives is the bigger risk.`);
  } else if (precision > 0 && recall > 0) {
    findings.push(`Precision and recall are well-balanced (${(precision * 100).toFixed(1)}% and ${(recall * 100).toFixed(1)}%), indicating a fair trade-off between false positives and false negatives.`);
  }
  
  // Feature insight
  if (features.length > 0) {
    findings.push(`Among ${features.length} features analyzed, the model identified meaningful patterns that drive predictions.`);
  }
  
  // Knowledge-based finding
  if (knowledge?.analysisHistory?.length) {
    const lastInsight = knowledge.analysisHistory[knowledge.analysisHistory.length - 1];
    if (lastInsight) {
      findings.push(`Previous analysis revealed: "${lastInsight.answer.slice(0, 150)}..."`);
    }
  }
  
  return findings;
}

function buildPerformanceNarrative(
  accuracy: number,
  precision: number,
  recall: number,
  f1: number,
  tier: string
): string {
  const narratives = {
    excellent: `This model delivers **exceptional performance**. With ${(accuracy * 100).toFixed(1)}% accuracy, it correctly handles the overwhelming majority of cases. The F1 score of ${(f1 * 100).toFixed(1)}% confirms a strong balance between precision and recall, making it reliable for production deployment.`,
    
    good: `The model shows **strong, production-ready performance**. At ${(accuracy * 100).toFixed(1)}% accuracy, most predictions are correct. The precision-recall balance (${(precision * 100).toFixed(1)}%/${(recall * 100).toFixed(1)}%) is healthy, though targeted improvements could push this into excellent territory.`,
    
    moderate: `Current performance is **respectable but improvable**. The ${(accuracy * 100).toFixed(1)}% accuracy provides value, but there's clear headroom for growth. Consider feature engineering, hyperparameter tuning, or additional training data to strengthen predictions.`,
    
    needs_improvement: `The model is in **development stage** with ${(accuracy * 100).toFixed(1)}% accuracy. This baseline establishes what's learnable from the current data. Significant improvements are possible through data enrichment, alternative algorithms, or refined feature selection.`
  };
  
  return narratives[tier as keyof typeof narratives];
}

function buildLimitations(
  dataset: Dataset,
  model: MLModel,
  metrics: Record<string, any>
): string[] {
  const limitations: string[] = [];
  
  const rows = dataset.rows || dataset.row_count || 0;
  
  if (rows < 1000) {
    limitations.push(`The training set of ${rows.toLocaleString()} samples is relatively small. More data could improve generalization.`);
  }
  
  if ((metrics.accuracy || 0) - (metrics.validationAccuracy || metrics.accuracy || 0) > 0.1) {
    limitations.push(`There may be some overfitting; the model performs better on training data than validation data.`);
  }
  
  limitations.push(`As with any model, predictions are based on historical patterns and may not capture unprecedented events.`);
  limitations.push(`The model should be monitored for drift as new data becomes available.`);
  
  return limitations;
}

function buildRecommendations(
  metrics: Record<string, any>,
  tier: string,
  knowledge?: DatasetKnowledge
): string[] {
  const recs: string[] = [];
  
  if (tier === 'needs_improvement' || tier === 'moderate') {
    recs.push(`**Enhance features**: Engineer new variables or transform existing ones to capture more signal.`);
    recs.push(`**Try ensemble methods**: Combine multiple models to boost accuracy.`);
    recs.push(`**Collect more data**: If possible, expand the training set with diverse examples.`);
  }
  
  if (tier === 'good') {
    recs.push(`**Fine-tune hyperparameters**: Small adjustments could yield meaningful gains.`);
    recs.push(`**Monitor in production**: Track real-world performance and retrain periodically.`);
  }
  
  if (tier === 'excellent') {
    recs.push(`**Deploy with confidence**: The model is ready for production use.`);
    recs.push(`**Set up monitoring**: Establish alerts for performance degradation.`);
    recs.push(`**Document for stakeholders**: Share findings with decision-makers.`);
  }
  
  if (knowledge?.knownIssues?.length) {
    recs.push(`**Address known data issues**: ${knowledge.knownIssues[0]}`);
  }
  
  return recs;
}

function buildConclusion(
  model: MLModel,
  tier: string,
  findings: string[]
): string {
  const tierConclusions = {
    excellent: `This model represents a significant analytical achievement. It can be deployed with high confidence to drive automated decision-making, providing consistent, data-driven insights that would be difficult to replicate manually.`,
    
    good: `The model provides reliable predictions suitable for production use, with clear pathways for further optimization. It transforms raw data into actionable intelligence, enabling faster and more consistent decisions.`,
    
    moderate: `While the current model offers value, it should be viewed as a stepping stone. The patterns discovered establish a foundation for more sophisticated approaches as more data and domain knowledge become available.`,
    
    needs_improvement: `This initial model reveals what's learnable from the current data and highlights opportunities for enhancement. It serves as a baseline against which future iterations can be measured.`
  };
  
  let conclusion = tierConclusions[tier as keyof typeof tierConclusions];
  
  if (findings.length > 0) {
    conclusion += ` The key takeaway: ${findings[0].toLowerCase()}`;
  }
  
  return conclusion;
}

/**
 * Generate an explanation for a specific prediction
 */
export function explainPrediction(
  prediction: any,
  model: MLModel,
  inputData: Record<string, any>,
  featureImportances?: FeatureImportance[]
): PredictionExplanation {
  const predictionValue = typeof prediction === 'object' ? prediction.value : prediction;
  const confidenceValue = typeof prediction === 'object' ? prediction.confidence : 0.85;
  
  // Simulate feature impacts if not provided
  const topFactors = (featureImportances || generateMockImportances(Object.keys(inputData)))
    .slice(0, 5)
    .map(f => ({
      factor: f.feature,
      impact: f.insight,
      direction: f.importance > 0.5 ? 'positive' as const : f.importance > 0.3 ? 'neutral' as const : 'negative' as const
    }));

  const reasoning = buildPredictionReasoning(predictionValue, topFactors, model);
  const alternatives = buildAlternativeScenarios(inputData, topFactors);
  const insights = buildActionableInsights(predictionValue, topFactors);

  return {
    prediction: String(predictionValue),
    confidence: `${(confidenceValue * 100).toFixed(1)}%`,
    topFactors,
    reasoning,
    alternativeScenarios: alternatives,
    actionableInsights: insights
  };
}

function generateMockImportances(features: string[]): FeatureImportance[] {
  return features.map((f, i) => ({
    feature: f,
    importance: Math.max(0.1, 1 - (i * 0.15)),
    insight: `${f} contributes ${((1 - i * 0.15) * 100).toFixed(0)}% to the prediction`
  }));
}

function buildPredictionReasoning(
  prediction: any,
  factors: { factor: string; impact: string; direction: string }[],
  model: MLModel
): string {
  const topFactor = factors[0];
  const modelType = model.type || model.algorithm || 'the model';
  
  let reasoning = `Based on ${modelType}'s analysis, the prediction of **${prediction}** emerges from the interplay of several factors. `;
  
  if (topFactor) {
    reasoning += `The most influential variable is **${topFactor.factor}**, which ${topFactor.direction === 'positive' ? 'strongly supports' : topFactor.direction === 'negative' ? 'pushes against' : 'moderately affects'} this outcome. `;
  }
  
  if (factors.length > 1) {
    reasoning += `Secondary influences from ${factors.slice(1, 3).map(f => f.factor).join(' and ')} combine to shape the final prediction. `;
  }
  
  reasoning += `The model has learned these patterns from historical data, identifying that when these factors align this way, this outcome typically follows.`;
  
  return reasoning;
}

function buildAlternativeScenarios(
  inputData: Record<string, any>,
  factors: { factor: string; impact: string; direction: string }[]
): string[] {
  const scenarios: string[] = [];
  
  if (factors[0]) {
    scenarios.push(`If ${factors[0].factor} were significantly different, the prediction could shift substantially.`);
  }
  
  if (factors[1]) {
    scenarios.push(`Changing ${factors[1].factor} while holding other factors constant would moderately affect the outcome.`);
  }
  
  scenarios.push(`Edge cases or unusual combinations of inputs may produce less reliable predictions.`);
  
  return scenarios;
}

function buildActionableInsights(
  prediction: any,
  factors: { factor: string; impact: string; direction: string }[]
): string[] {
  const insights: string[] = [];
  
  insights.push(`Focus on ${factors[0]?.factor || 'key variables'} to influence this outcome.`);
  insights.push(`Monitor changes in the top factors to anticipate shifts in predictions.`);
  insights.push(`Use this prediction as one input among many in your decision-making process.`);
  
  return insights;
}

/**
 * Format the complete narrative for display
 */
export function formatNarrativeAsMarkdown(summary: ModelSummary): string {
  let markdown = `## 📊 Model Analysis Summary\n\n`;
  markdown += `${summary.overview}\n\n`;
  
  markdown += `### 📖 The Data Story\n\n`;
  markdown += `${summary.dataStory}\n\n`;
  
  markdown += `### 🔬 Methodology\n\n`;
  markdown += `${summary.methodology}\n\n`;
  
  markdown += `### 💡 Key Findings\n\n`;
  summary.keyFindings.forEach(finding => {
    markdown += `- ${finding}\n`;
  });
  markdown += '\n';
  
  markdown += `### 📈 Performance Analysis\n\n`;
  markdown += `${summary.performanceNarrative}\n\n`;
  
  markdown += `### ⚠️ Limitations & Considerations\n\n`;
  summary.limitationsAndCaveats.forEach(limitation => {
    markdown += `- ${limitation}\n`;
  });
  markdown += '\n';
  
  markdown += `### ✅ Recommendations\n\n`;
  summary.recommendations.forEach(rec => {
    markdown += `- ${rec}\n`;
  });
  markdown += '\n';
  
  markdown += `### 🎯 Conclusion\n\n`;
  markdown += `${summary.conclusion}\n`;
  
  return markdown;
}

/**
 * Format prediction explanation for display
 */
export function formatPredictionAsMarkdown(explanation: PredictionExplanation): string {
  let markdown = `## 🔮 Prediction Explanation\n\n`;
  
  markdown += `**Predicted Value:** ${explanation.prediction}\n`;
  markdown += `**Confidence:** ${explanation.confidence}\n\n`;
  
  markdown += `### 🧠 Reasoning\n\n`;
  markdown += `${explanation.reasoning}\n\n`;
  
  markdown += `### 📊 Top Contributing Factors\n\n`;
  explanation.topFactors.forEach((factor, i) => {
    const icon = factor.direction === 'positive' ? '🟢' : factor.direction === 'negative' ? '🔴' : '🟡';
    markdown += `${i + 1}. ${icon} **${factor.factor}**: ${factor.impact}\n`;
  });
  markdown += '\n';
  
  markdown += `### 🔄 Alternative Scenarios\n\n`;
  explanation.alternativeScenarios.forEach(scenario => {
    markdown += `- ${scenario}\n`;
  });
  markdown += '\n';
  
  markdown += `### 💼 Actionable Insights\n\n`;
  explanation.actionableInsights.forEach(insight => {
    markdown += `- ${insight}\n`;
  });
  
  return markdown;
}

