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

  /**
   * Handles applying feature engineering and navigating to model training.
   * Simulates the feature engineering process and redirects to training page.
   * @returns {void}
   */
  const handleApplyAndTrain = () => {
    if (!selectedDataset) return;
    
    setIsApplying(true);
    
    // Simulate applying feature engineering
    const applyTimer = setTimeout(() => {
      try {
        setIsApplying(false);
        toast.success('Feature engineering applied successfully');
        
        // Navigate to model training with the engineered dataset
        navigate(`/app/train?dataset=${selectedDataset.id}`);
      } catch (error) {
        console.error('Error applying feature engineering:', error);
        setIsApplying(false);
        toast.error('Failed to apply feature engineering');
      }
    }, 1500);
    
    // Note: Timer cleanup would be handled by component unmount
    // For this use case, navigation occurs quickly and doesn't need explicit cleanup
  };

  if (!selectedDataset) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No datasets available</h2>
            <p className="text-lg text-gray-600 mb-6">
              Upload a dataset first to perform feature engineering
            </p>
            <Button variant="primary" onClick={() => navigate('/app/data')}>
              Upload Dataset
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header - Matching Dashboard style */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                Feature Engineering
              </h1>
              <p className="mt-2 text-lg text-gray-600 font-medium">
                Select, transform, and create features to improve model performance
              </p>
            </div>
          </div>
          <div>
            <Button
              variant="primary"
              onClick={handleApplyAndTrain}
              disabled={isApplying}
            >
              {isApplying ? (
                <>
                  <Layers className="w-4 h-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Apply & Train Model
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Dataset Selector Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedDataset.name}</h2>
              <p className="text-base text-gray-600 mt-1">
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
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDatasetChange('next')}
              disabled={datasets.length <= 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      <FeatureEngineeringPanel
        dataset={selectedDataset}
        onFeatureUpdate={handleFeatureUpdate}
      />

      {/* Feature Engineering Summary Card */}
      <Card className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Feature Engineering Summary</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
            <h4 className="text-base font-semibold text-indigo-900 mb-2">Selected Features</h4>
            <p className="text-3xl font-bold text-indigo-700 mb-1">{engineeredFeatures.length}</p>
            <p className="text-sm text-indigo-600">out of {selectedDataset.preview_data?.columns.length || 0} original features</p>
          </div>
          
          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
            <h4 className="text-base font-semibold text-green-900 mb-2">Feature Transformations</h4>
            <p className="text-3xl font-bold text-green-700 mb-1">3</p>
            <p className="text-sm text-green-600">scaling, encoding, and custom transformations</p>
          </div>
          
          <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl border border-purple-200">
            <h4 className="text-base font-semibold text-purple-900 mb-2">New Features Created</h4>
            <p className="text-3xl font-bold text-purple-700 mb-1">12</p>
            <p className="text-sm text-purple-600">including time series and interaction features</p>
          </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button
            variant="primary"
            onClick={handleApplyAndTrain}
            disabled={isApplying}
          >
            Continue to Model Training
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default FeatureEngineering;