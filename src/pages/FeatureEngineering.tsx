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
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-12 text-center">
        <div className="saas-icon-blue w-20 h-20">
          <Database className="w-10 h-10" />
        </div>
        <h3 className="mt-6 saas-h3">No datasets available</h3>
        <p className="mt-2 saas-body text-gray-400">
          Upload a dataset first to perform feature engineering
        </p>
        <button 
          className="mt-6 saas-btn-primary saas-btn-md" 
          onClick={() => navigate('/app/data')}
        >
          Upload Dataset
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6 space-y-6">
      <div className="flex flex-col justify-between mb-6 md:flex-row md:items-center">
        <div>
          <h1 className="saas-h2">Feature Engineering</h1>
          <p className="mt-2 saas-body text-gray-400">
            Select, transform, and create features to improve model performance
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={handleApplyAndTrain}
            disabled={isApplying}
            className="saas-btn-primary saas-btn-md flex items-center gap-2"
          >
            {isApplying ? (
              <>
                <Layers className="w-4 h-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Apply & Train Model
              </>
            )}
          </button>
        </div>
      </div>

      <div className="saas-card">
        <div className="saas-card-body">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="saas-icon-blue w-12 h-12">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="saas-h4">{selectedDataset.name}</h2>
                <p className="saas-caption text-gray-400">
                  {selectedDataset.rows?.toLocaleString()} rows • {selectedDataset.columns} columns
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDatasetChange('prev')}
                disabled={datasets.length <= 1}
                className="saas-btn-outline saas-btn-sm text-gray-300 hover:text-blue-400 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => handleDatasetChange('next')}
                disabled={datasets.length <= 1}
                className="saas-btn-outline saas-btn-sm text-gray-300 hover:text-blue-400 flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <FeatureEngineeringPanel
        dataset={selectedDataset}
        onFeatureUpdate={handleFeatureUpdate}
      />

      <div className="saas-card">
        <div className="saas-card-header">
          <h3 className="saas-h4">Feature Engineering Summary</h3>
        </div>
        
        <div className="saas-card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="saas-stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="saas-label text-blue-400">Selected Features</span>
                <div className="saas-icon-blue w-10 h-10">
                  <Wand2 className="w-5 h-5" />
                </div>
              </div>
              <div className="saas-stat-value">{engineeredFeatures.length}</div>
              <p className="saas-caption text-gray-400">out of {selectedDataset.preview_data?.columns.length || 0} original features</p>
            </div>
            
            <div className="saas-stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="saas-label text-green-400">Transformations</span>
                <div className="saas-icon-green w-10 h-10">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="saas-stat-value">3</div>
              <p className="saas-caption text-gray-400">scaling, encoding, and custom transformations</p>
            </div>
            
            <div className="saas-stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="saas-label text-purple-400">New Features</span>
                <div className="saas-icon-purple w-10 h-10">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <div className="saas-stat-value">12</div>
              <p className="saas-caption text-gray-400">including time series and interaction features</p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleApplyAndTrain}
              disabled={isApplying}
              className="saas-btn-primary saas-btn-md flex items-center gap-2"
            >
              Continue to Model Training
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureEngineering;