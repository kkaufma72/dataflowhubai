import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import { Wand2 } from 'lucide-react';
import { Dataset } from '../../types';
import PreprocessingPipeline from './PreprocessingPipeline';
import { PreprocessingResult } from '../../lib/dataProcessing';


interface DataPreprocessingProps {
  dataset: Dataset;
  onPreprocessingComplete: (updatedDataset: Dataset) => void;
}
const DataPreprocessing: React.FC<DataPreprocessingProps> = ({
  dataset,
  onPreprocessingComplete
}) => {
  const handlePreprocessingComplete = (result: PreprocessingResult) => {
    // Create a new dataset from the preprocessing result
    const preprocessedDataset: Dataset = {
      ...dataset,
      id: `${dataset.id}-preprocessed`,
      name: `${dataset.name} (Preprocessed)`,
      description: `Preprocessed version of ${dataset.name}`,
      dateUploaded: new Date().toISOString(),
      rows: result.data.length,
      columns: result.columns.length,
      previewData: {
        columns: result.columns,
        rows: result.data.slice(0, Math.min(100, result.data.length))
      }
    };
    
    onPreprocessingComplete(preprocessedDataset);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
            <Wand2 className="w-6 h-6 text-primary-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">Automated Data Preprocessing</h3>
            <p className="mt-1 text-xs text-gray-500">
              Clean, transform, and prepare your data for modeling
            </p>
          </div>
        </div>
      </div>

      <PreprocessingPipeline
        dataset={dataset}
        onPreprocessingComplete={handlePreprocessingComplete}
      />
    </Card>
  );
};

export default DataPreprocessing;