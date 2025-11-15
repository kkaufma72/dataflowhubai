import React, { useMemo, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Dataset } from '../../types';
import Card from '../common/Card';
import { Layers, X, Activity, Check } from 'lucide-react';
import {
  insightPanelClass,
  insightHeadingClass,
  insightHelperClass,
  chipButtonClass,
  insightAnswerClass,
} from '../../styles/insightPanels';

interface DatasetClusterProps {
  datasets: Dataset[];
  onRemoveDataset: (datasetId: string) => void;
  isTraining?: boolean;
  progress?: number;
  results?: {
    accuracy: number;
    f1Score: number;
    precision: number;
    recall: number;
  };
}

interface DatasetItemProps {
  dataset: Dataset;
  onRemove: (id: string) => void;
  isTraining?: boolean;
}

const DatasetItem: React.FC<DatasetItemProps> = ({ dataset, onRemove, isTraining }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'dataset',
    item: { id: dataset.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`flex items-center justify-between p-3 mb-2 bg-white rounded-lg border ${
        isDragging ? 'opacity-50' : ''
      } ${isTraining ? 'border-primary/30 bg-primary/5' : ''}`}
    >
      <div className="flex items-center">
        {isTraining ? (
          <Activity className="w-4 h-4 text-primary mr-2 animate-pulse" />
        ) : (
          <Layers className="w-4 h-4 text-primary mr-2" />
        )}
        <span className="text-sm font-medium text-gray-700">{dataset.name}</span>
      </div>
      {!isTraining && (
        <button
          onClick={() => onRemove(dataset.id)}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const DatasetCluster: React.FC<DatasetClusterProps> = ({ 
  datasets, 
  onRemoveDataset,
  isTraining = false,
  progress = 0,
  results
}) => {
  const [clusterQuestion, setClusterQuestion] = useState('');
  const [clusterAnswer, setClusterAnswer] = useState<string | null>(null);

  const clusterSuggestions = [
    'Is this cluster balanced?',
    'How strong is the precision/recall mix?',
    'What should I do next with this cluster?'
  ];

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'dataset',
    drop: (item: { id: string }) => {
      // Return success to signal a valid drop
      console.log('Dataset dropped:', item.id);
      return { success: true };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const clusterNarrative = useMemo(() => {
    if (!results) return null;

    let cohesionMessage = 'Precision and recall are closely aligned, indicating the clustered datasets deliver balanced predictions.';
    if (results.precision - results.recall > 0.05) {
      cohesionMessage = 'Precision outpaces recall, so the cluster is cautious—great for reducing false positives but keep an eye on missed detections.';
    } else if (results.recall - results.precision > 0.05) {
      cohesionMessage = 'Recall is higher than precision, meaning the cluster captures most positives but may introduce more false alarms.';
    }

    const accuracyDescriptor = results.accuracy > 0.9
      ? 'This cluster delivers production-grade accuracy.'
      : results.accuracy > 0.82
        ? 'Accuracy is solid; a quick hyperparameter sweep could push it higher.'
        : 'Accuracy trails the target. Consider pruning noisier datasets or adjusting preprocessing.';

    const f1Descriptor = results.f1Score > 0.85
      ? 'F1 score confirms the ensemble is harmonized.'
      : 'F1 score suggests some imbalance between precision and recall—worth reviewing feature distributions or class weights.';

    return {
      cohesionMessage,
      accuracyDescriptor,
      f1Descriptor,
    };
  }, [results]);

  const answerClusterQuestion = (prompt: string) => {
    if (!prompt.trim()) return;
    if (!results || !clusterNarrative) {
      setClusterAnswer('Train the cluster to generate insights.');
      return;
    }

    const q = prompt.toLowerCase();
    let response = '';

    if (q.includes('accuracy')) {
      response = `Cluster accuracy is ${formatPercent(results.accuracy)}, so roughly that share of combined predictions are correct.`;
    } else if (q.includes('precision')) {
      response = `Precision lands at ${formatPercent(results.precision)}, showing how often a positive prediction is truly positive for this cluster.`;
    } else if (q.includes('recall')) {
      response = `Recall runs at ${formatPercent(results.recall)}, meaning the cluster captures that portion of all positives.`;
    } else if (q.includes('balance') || q.includes('cohesion')) {
      response = clusterNarrative.cohesionMessage;
    } else if (q.includes('next') || q.includes('improve') || q.includes('optimize')) {
      response = `${clusterNarrative.accuracyDescriptor} ${clusterNarrative.f1Descriptor}`;
    } else {
      response = `${clusterNarrative.cohesionMessage} ${clusterNarrative.f1Descriptor}`;
    }

    setClusterAnswer(response);
  };

  const handleClusterQuestionSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clusterQuestion.trim()) return;
    answerClusterQuestion(clusterQuestion);
    setClusterQuestion('');
  };

  const handleClusterSuggestion = (suggestion: string) => {
    answerClusterQuestion(suggestion);
  };

  return (
    <div
      ref={drop}
      className={`p-4 rounded-lg border-2 border-dashed transition-colors ${
        isOver ? 'border-primary bg-primary/5' : isTraining ? 'border-primary-400' : 'border-gray-300'
      }`}
    >
      <div className="text-center mb-4">
        <h3 className="text-sm font-medium text-gray-700">
          {datasets.length === 0
            ? 'Drag datasets here to create a cluster'
            : `${datasets.length} Dataset${datasets.length !== 1 ? 's' : ''} in Cluster`}
        </h3>
      </div>

      <div className="space-y-2">
        {datasets.map((dataset) => (
          <DatasetItem
            key={dataset.id}
            dataset={dataset}
            onRemove={onRemoveDataset}
            isTraining={isTraining}
          />
        ))}
      </div>

      {isTraining && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Training Progress</span>
            <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {results && (
        <div className={`mt-4 ${insightPanelClass} p-4 space-y-4`}>
          <div className="flex items-center">
            <Check className="w-5 h-5 text-emerald-500 mr-2" />
            <h4 className="text-sm font-semibold text-slate-900">Training complete</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Accuracy</p>
              <p className="text-sm font-semibold text-slate-900">{(results.accuracy * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">F1 Score</p>
              <p className="text-sm font-semibold text-slate-900">{(results.f1Score * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Precision</p>
              <p className="text-sm font-semibold text-slate-900">{(results.precision * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Recall</p>
              <p className="text-sm font-semibold text-slate-900">{(results.recall * 100).toFixed(1)}%</p>
            </div>
          </div>

          {clusterNarrative && (
            <div className="space-y-2 text-sm text-slate-700">
              <p>{clusterNarrative.accuracyDescriptor}</p>
              <p>{clusterNarrative.cohesionMessage}</p>
              <p>{clusterNarrative.f1Descriptor}</p>
            </div>
          )}

          <div className={`${insightPanelClass} p-3 space-y-2`}>
            <p className={`${insightHeadingClass} uppercase tracking-wide text-[11px]`}>Ask about this cluster</p>
            <p className={insightHelperClass}>Use natural language to interpret cohesion, balance, or next steps.</p>
            <form onSubmit={handleClusterQuestionSubmit} className="space-y-2">
              <input
                type="text"
                value={clusterQuestion}
                onChange={(e) => setClusterQuestion(e.target.value)}
                placeholder="e.g., Is this cluster balanced?"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!clusterQuestion.trim()}
                  className="rounded-md bg-primary-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
                >
                  Ask
                </button>
                <button
                  type="button"
                  onClick={() => setClusterAnswer(null)}
                  className="text-xs font-medium text-slate-500 hover:text-primary-600"
                >
                  Clear
                </button>
              </div>
            </form>
            {clusterAnswer && (
              <div className={insightAnswerClass} aria-live="polite">
                {clusterAnswer}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {clusterSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleClusterSuggestion(suggestion)}
                  className={chipButtonClass}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetCluster;