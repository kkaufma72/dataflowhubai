import React, { useState } from 'react';
import { Card } from '../common/Card';
import { MLModel } from '../../types';
import { BarChart2, ArrowRight, Check, X } from 'lucide-react';
import Button from '../common/Button';

interface ModelComparisonProps {
  models: MLModel[];
  onSelectModel: (modelId: string) => void;
}

const ModelComparison: React.FC<ModelComparisonProps> = ({ models, onSelectModel }) => {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [comparisonMetric, setComparisonMetric] = useState<string>('accuracy');

  const toggleModelSelection = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      setSelectedModels(selectedModels.filter(id => id !== modelId));
    } else {
      setSelectedModels([...selectedModels, modelId]);
    }
  };

  const getMetricValue = (model: MLModel, metric: string): number => {
    if (!model.metrics || !(metric in model.metrics)) {
      return 0;
    }
    return model.metrics[metric];
  };

  const sortedModels = [...models].sort((a, b) => {
    const aValue = getMetricValue(a, comparisonMetric);
    const bValue = getMetricValue(b, comparisonMetric);
    return bValue - aValue;
  });

  const bestModel = sortedModels.length > 0 ? sortedModels[0] : null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
            <BarChart2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">Model Comparison</h3>
            <p className="mt-1 text-xs text-gray-500">
              Compare performance across different models
            </p>
          </div>
        </div>
        <div>
          <select
            value={comparisonMetric}
            onChange={(e) => setComparisonMetric(e.target.value)}
            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="accuracy">Accuracy</option>
            <option value="precision">Precision</option>
            <option value="recall">Recall</option>
            <option value="f1Score">F1 Score</option>
            <option value="auc">AUC</option>
          </select>
        </div>
      </div>

      {models.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No models available for comparison</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {comparisonMetric.charAt(0).toUpperCase() + comparisonMetric.slice(1).replace(/([A-Z])/g, ' $1')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compare
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedModels.map((model) => (
                  <tr 
                    key={model.id}
                    className={model.id === bestModel?.id ? 'bg-green-50' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {model.name}
                          {model.id === bestModel?.id && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Best
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{model.modelType || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getMetricValue(model, comparisonMetric) 
                          ? (getMetricValue(model, comparisonMetric) * 100).toFixed(2) + '%' 
                          : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        model.status === 'trained' 
                          ? 'bg-green-100 text-green-800' 
                          : model.status === 'deployed' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <input
                        type="checkbox"
                        checked={selectedModels.includes(model.id)}
                        onChange={() => toggleModelSelection(model.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedModels.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Comparison</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Metric
                      </th>
                      {selectedModels.map(id => {
                        const model = models.find(m => m.id === id);
                        return (
                          <th key={id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {model?.name || 'Unknown'}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {['accuracy', 'precision', 'recall', 'f1Score', 'auc'].map(metric => (
                      <tr key={metric}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {metric.charAt(0).toUpperCase() + metric.slice(1).replace(/([A-Z])/g, ' $1')}
                        </td>
                        {selectedModels.map(id => {
                          const model = models.find(m => m.id === id);
                          const value = model?.metrics?.[metric];
                          const isHighest = selectedModels.every(otherId => {
                            if (otherId === id) return true;
                            const otherModel = models.find(m => m.id === otherId);
                            return !otherModel?.metrics?.[metric] || value >= otherModel.metrics[metric];
                          });
                          
                          return (
                            <td 
                              key={id} 
                              className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${isHighest && value ? 'font-bold text-green-600' : ''}`}
                            >
                              {value 
                                ? (
                                  <div className="flex items-center">
                                    {(value * 100).toFixed(2)}%
                                    {isHighest && <Check className="ml-1 w-4 h-4 text-green-500" />}
                                  </div>
                                ) 
                                : 'N/A'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Training Time
                      </td>
                      {selectedModels.map(id => {
                        // Simulate training time
                        const randomTime = Math.floor(Math.random() * 300) + 60;
                        return (
                          <td key={id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {randomTime} seconds
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => onSelectModel(bestModel?.id || '')}
                  disabled={!bestModel}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Select Best Model
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default ModelComparison;