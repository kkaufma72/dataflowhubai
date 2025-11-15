import React from 'react';
import { Card } from '../common/Card';
import { Repeat, Check } from 'lucide-react';

interface CrossValidationProps {
  folds: number;
  onFoldsChange: (folds: number) => void;
  validationResults?: {
    fold: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  }[];
}

const CrossValidation: React.FC<CrossValidationProps> = ({
  folds,
  onFoldsChange,
  validationResults
}) => {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
            <Repeat className="w-6 h-6 text-primary-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">Cross Validation</h3>
            <p className="mt-1 text-xs text-gray-500">
              Validate model performance across different data splits
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">
          Number of Folds: {folds}
        </label>
        <input
          type="range"
          min={2}
          max={10}
          value={folds}
          onChange={(e) => onFoldsChange(parseInt(e.target.value))}
          className="w-full h-2 mt-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>2</span>
          <span>10</span>
        </div>
      </div>

      {validationResults && (
        <div className="space-y-4">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-sm font-medium text-green-900">
              Cross-validation complete
            </span>
          </div>

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
                {validationResults.map((result) => (
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
                    {(validationResults.reduce((acc, val) => acc + val.accuracy, 0) / validationResults.length * 100).toFixed(2)}%
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">
                    {(validationResults.reduce((acc, val) => acc + val.precision, 0) / validationResults.length * 100).toFixed(2)}%
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">
                    {(validationResults.reduce((acc, val) => acc + val.recall, 0) / validationResults.length * 100).toFixed(2)}%
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">
                    {(validationResults.reduce((acc, val) => acc + val.f1Score, 0) / validationResults.length * 100).toFixed(2)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CrossValidation;