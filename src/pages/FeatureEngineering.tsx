import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMLContext } from '../context/MLContext';
import { Dataset } from '../types';
import { 
  Wand2, 
  Database, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import FeatureEngineeringPanel from '../components/features/FeatureEngineeringPanel';
import toast from 'react-hot-toast';

const FeatureEngineering: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { datasets } = useMLContext();
  const datasetId = searchParams.get('dataset');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [engineeredFeatures, setEngineeredFeatures] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (datasetId) {
      const dataset = datasets.find(d => d.id === datasetId);
      if (dataset) {
        setSelectedDataset(dataset);
        // Initialize with all non-ID columns
        if (dataset.preview_data?.columns) {
          const initialFeatures = dataset.preview_data.columns.filter(col => 
            !col.toLowerCase().includes('id') && 
            !col.toLowerCase().includes('_id')
          );
          setEngineeredFeatures(initialFeatures);
        }
      }
    } else if (datasets.length > 0) {
      setSelectedDataset(datasets[0]);
      if (datasets[0].preview_data?.columns) {
        const initialFeatures = datasets[0].preview_data.columns.filter(col => 
          !col.toLowerCase().includes('id') && 
          !col.toLowerCase().includes('_id')
        );
        setEngineeredFeatures(initialFeatures);
      }
    }
  }, [datasetId, datasets]);

  const handleDatasetChange = (direction: 'prev' | 'next') => {
    if (!selectedDataset) return;
    
    const currentIndex = datasets.findIndex(d => d.id === selectedDataset.id);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? datasets.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === datasets.length - 1 ? 0 : currentIndex + 1;
    }
    
    const newDataset = datasets[newIndex];
    navigate(`/app/feature-engineering?dataset=${newDataset.id}`);
  };

  const handleFeatureUpdate = (updatedFeatures: string[]) => {
    setEngineeredFeatures(updatedFeatures);
  };

  const handleApplyAndTrain = () => {
    if (!selectedDataset) return;
    
    setIsApplying(true);
    
    // Simulate applying feature engineering
    setTimeout(() => {
      setIsApplying(false);
      toast.success('Feature engineering applied successfully');
      
      // Navigate to model training with the engineered dataset
      navigate(`/app/train?dataset=${selectedDataset.id}`);
    }, 1500);
  };

  if (!selectedDataset) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-lg">
          <Database className="w-6 h-6 text-indigo-600" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No datasets available</h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload a dataset first to perform feature engineering
        </p>
        <Button className="mt-4" onClick={() => navigate('/app/data')}>
          Upload Dataset
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col justify-between mb-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Engineering</h1>
          <p className="mt-1 text-sm text-gray-500">
            Select, transform, and create features to improve model performance
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            onClick={handleApplyAndTrain}
            disabled={isApplying}
            icon={isApplying ? <Layers className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          >
            {isApplying ? 'Applying...' : 'Apply & Train Model'}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-50 rounded-lg mr-4">
            <Database className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{selectedDataset.name}</h2>
            <p className="text-sm text-gray-500">
              {selectedDataset.rows?.toLocaleString()} rows • {selectedDataset.columns} columns
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDatasetChange('prev')}
            disabled={datasets.length <= 1}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDatasetChange('next')}
            disabled={datasets.length <= 1}
            icon={<ChevronRight className="w-4 h-4 ml-1" />}
          >
            Next
          </Button>
        </div>
      </div>

      <FeatureEngineeringPanel
        dataset={selectedDataset}
        onFeatureUpdate={handleFeatureUpdate}
      />

      <div className="mt-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Feature Engineering Summary</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Features</h4>
              <p className="text-2xl font-semibold text-gray-900">{engineeredFeatures.length}</p>
              <p className="text-sm text-indigo-600">out of {selectedDataset.preview_data?.columns.length || 0} original features</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-900 mb-2">Feature Transformations</h4>
              <p className="text-2xl font-semibold text-green-700">3</p>
              <p className="text-sm text-green-600">scaling, encoding, and custom transformations</p>
            </div>
            
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">New Features Created</h4>
              <p className="text-2xl font-semibold text-gray-900">12</p>
              <p className="text-sm text-indigo-600">including time series and interaction features</p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleApplyAndTrain}
              disabled={isApplying}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Model Training
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FeatureEngineering;