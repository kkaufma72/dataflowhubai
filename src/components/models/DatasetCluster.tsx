import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Dataset } from '../../types';
import Card from '../common/Card';
import { Layers, X, Activity, Check } from 'lucide-react';

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
      } ${isTraining ? 'border-indigo-300 bg-indigo-50' : ''}`}
    >
      <div className="flex items-center">
        {isTraining ? (
          <Activity className="w-4 h-4 text-indigo-500 mr-2 animate-pulse" />
        ) : (
          <Layers className="w-4 h-4 text-indigo-500 mr-2" />
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

  return (
    <div
      ref={drop}
      className={`p-4 rounded-lg border-2 border-dashed transition-colors ${
        isOver ? 'border-indigo-500 bg-indigo-50' : isTraining ? 'border-indigo-400' : 'border-gray-300'
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
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {results && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center mb-2">
            <Check className="w-5 h-5 text-green-500 mr-2" />
            <h4 className="text-sm font-medium text-green-800">Training Complete</h4>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <p className="text-xs font-medium text-green-600">Accuracy</p>
              <p className="text-sm font-semibold text-green-900">{(results.accuracy * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs font-medium text-green-600">F1 Score</p>
              <p className="text-sm font-semibold text-green-900">{(results.f1Score * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs font-medium text-green-600">Precision</p>
              <p className="text-sm font-semibold text-green-900">{(results.precision * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs font-medium text-green-600">Recall</p>
              <p className="text-sm font-semibold text-green-900">{(results.recall * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetCluster;