
import React, { useState } from 'react';
import { useDatasets } from '../../hooks/useDatasets';
import TensorFlowTrainer from '../../components/ml/TensorFlowTrainer';
import Card from '../../components/common/Card';

const ModelTrainingPage: React.FC = () => {
  const { datasets } = useDatasets();
  const [selectedDataset, setSelectedDataset] = useState(datasets[0]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Train ML Models</h1>
      
      {/* Dataset Selector */}
      <Card className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Select Dataset
        </label>
        <select 
          value={selectedDataset?.id}
          onChange={(e) => setSelectedDataset(datasets.find(d => d.id === e.target.value))}
          className="w-full px-4 py-2 border rounded-lg"
        >
          {datasets.map(ds => (
            <option key={ds.id} value={ds.id}>{ds.name}</option>
          ))}
        </select>
      </Card>

      {/* TensorFlow Trainer */}
      {selectedDataset && (
        <TensorFlowTrainer dataset={selectedDataset} />
      )}
    </div>
  );
};

export default ModelTrainingPage;
