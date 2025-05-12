import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { 
  Wand2, 
  Layers, 
  BarChart2, 
  Clock, 
  ArrowRight, 
  Plus, 
  X, 
  Check, 
  AlertTriangle,
  Trash2,
  Edit,
  Save,
  Sparkles
} from 'lucide-react';
import Button from '../common/Button';
import { Dataset } from '../../types';
import FeatureImportanceChart from './FeatureImportanceChart';
import FeatureTransformationPipeline from './FeatureTransformationPipeline';
import TimeSeriesFeatures from './TimeSeriesFeatures';
import FeatureSelectionTable from './FeatureSelectionTable';
import toast from 'react-hot-toast';

interface FeatureEngineeringPanelProps {
  dataset: Dataset;
  onFeatureUpdate: (updatedFeatures: string[]) => void;
}

const FeatureEngineeringPanel: React.FC<FeatureEngineeringPanelProps> = ({ 
  dataset, 
  onFeatureUpdate 
}) => {
  const [activeTab, setActiveTab] = useState<'selection' | 'importance' | 'transformation' | 'timeseries'>('selection');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [featureImportance, setFeatureImportance] = useState<{feature: string; importance: number}[]>([]);
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);
  const [autoSelectProgress, setAutoSelectProgress] = useState(0);
  const [transformations, setTransformations] = useState<{
    id: string;
    type: 'scaling' | 'normalization' | 'encoding' | 'binning' | 'custom';
    features: string[];
    config: Record<string, any>;
  }[]>([]);
  const [timeSeriesConfig, setTimeSeriesConfig] = useState<{
    timestampColumn: string;
    lagFeatures: {feature: string; lags: number[]}[];
    rollingFeatures: {feature: string; windows: number[]; operations: ('mean' | 'sum' | 'min' | 'max' | 'std')[]}[];
    seasonalFeatures: boolean;
  }>({
    timestampColumn: '',
    lagFeatures: [],
    rollingFeatures: [],
    seasonalFeatures: false
  });

  // Initialize selected features from dataset
  useEffect(() => {
    if (dataset && dataset.previewData?.columns) {
      // Exclude ID columns and timestamp columns by default
      const initialFeatures = dataset.previewData.columns.filter(col => 
        !col.toLowerCase().includes('id') && 
        !col.toLowerCase().includes('_id') &&
        !col.toLowerCase().includes('timestamp') &&
        !col.toLowerCase().includes('date') &&
        !col.toLowerCase().includes('created_at') &&
        !col.toLowerCase().includes('updated_at')
      );
      setSelectedFeatures(initialFeatures);
      
      // Find potential timestamp column
      const timestampCol = dataset.previewData.columns.find(col => 
        col.toLowerCase().includes('timestamp') || 
        col.toLowerCase().includes('date') ||
        col.toLowerCase().includes('time')
      );
      
      if (timestampCol) {
        setTimeSeriesConfig(prev => ({
          ...prev,
          timestampColumn: timestampCol
        }));
      }
      
      // Generate mock feature importance
      generateFeatureImportance(dataset.previewData.columns);
    }
  }, [dataset]);

  const generateFeatureImportance = (columns: string[]) => {
    const importance = columns.map(feature => {
      // Generate random importance value, but make it somewhat realistic
      // ID columns and metadata columns typically have lower importance
      let importanceValue = Math.random();
      
      if (
        feature.toLowerCase().includes('id') || 
        feature.toLowerCase().includes('_id') ||
        feature.toLowerCase().includes('created_at') ||
        feature.toLowerCase().includes('updated_at')
      ) {
        importanceValue *= 0.3; // Lower importance for ID and metadata columns
      }
      
      return {
        feature,
        importance: importanceValue
      };
    });
    
    // Sort by importance (descending)
    importance.sort((a, b) => b.importance - a.importance);
    
    setFeatureImportance(importance);
  };

  const handleFeatureToggle = (feature: string) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  const handleAutoSelectFeatures = () => {
    setIsAutoSelecting(true);
    setAutoSelectProgress(0);
    
    // Simulate feature selection process
    const interval = setInterval(() => {
      setAutoSelectProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        if (newProgress >= 100) {
          clearInterval(interval);
          
          // Select top features based on importance
          const topFeatures = featureImportance
            .filter(f => f.importance > 0.3) // Only select features with importance > 0.3
            .map(f => f.feature);
          
          setSelectedFeatures(topFeatures);
          setIsAutoSelecting(false);
          
          toast.success(`Automatically selected ${topFeatures.length} important features`);
          
          return 100;
        }
        return newProgress;
      });
    }, 100);
  };

  const handleAddTransformation = (transformation: {
    type: 'scaling' | 'normalization' | 'encoding' | 'binning' | 'custom';
    features: string[];
    config: Record<string, any>;
  }) => {
    const newTransformation = {
      id: Date.now().toString(),
      ...transformation
    };
    
    setTransformations([...transformations, newTransformation]);
    toast.success(`Added ${transformation.type} transformation`);
  };

  const handleRemoveTransformation = (id: string) => {
    setTransformations(transformations.filter(t => t.id !== id));
    toast.success('Transformation removed');
  };

  const handleUpdateTimeSeriesConfig = (config: typeof timeSeriesConfig) => {
    setTimeSeriesConfig(config);
    toast.success('Time series configuration updated');
  };

  const handleApplyFeatureEngineering = () => {
    // In a real implementation, this would apply the transformations and generate new features
    // For this demo, we'll just update the selected features
    onFeatureUpdate(selectedFeatures);
    
    // Show success message
    toast.success('Feature engineering applied successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Feature Engineering</h2>
          <p className="mt-1 text-sm text-gray-500">
            Select, transform, and optimize features for your model
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleAutoSelectFeatures}
            disabled={isAutoSelecting}
            icon={<Wand2 className="w-4 h-4" />}
          >
            {isAutoSelecting ? 'Selecting...' : 'Auto Select Features'}
          </Button>
          <Button
            onClick={handleApplyFeatureEngineering}
            icon={<Sparkles className="w-4 h-4" />}
          >
            Apply Feature Engineering
          </Button>
        </div>
      </div>

      {isAutoSelecting && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Analyzing features</span>
              <span className="text-sm font-medium text-gray-700">{Math.round(autoSelectProgress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 transition-all duration-300 bg-indigo-600 rounded-full"
                style={{ width: `${autoSelectProgress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500">
              <p>Analyzing feature correlations and importance...</p>
            </div>
          </div>
        </Card>
      )}

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('selection')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'selection'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Feature Selection
          </button>
          <button
            onClick={() => setActiveTab('importance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'importance'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Feature Importance
          </button>
          <button
            onClick={() => setActiveTab('transformation')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transformation'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transformation Pipeline
          </button>
          <button
            onClick={() => setActiveTab('timeseries')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'timeseries'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Time Series Features
          </button>
        </nav>
      </div>

      {activeTab === 'selection' && (
        <FeatureSelectionTable
          dataset={dataset}
          selectedFeatures={selectedFeatures}
          onFeatureToggle={handleFeatureToggle}
          featureImportance={featureImportance}
        />
      )}

      {activeTab === 'importance' && (
        <FeatureImportanceChart
          featureImportance={featureImportance}
          selectedFeatures={selectedFeatures}
          onFeatureToggle={handleFeatureToggle}
        />
      )}

      {activeTab === 'transformation' && (
        <FeatureTransformationPipeline
          dataset={dataset}
          selectedFeatures={selectedFeatures}
          transformations={transformations}
          onAddTransformation={handleAddTransformation}
          onRemoveTransformation={handleRemoveTransformation}
        />
      )}

      {activeTab === 'timeseries' && (
        <TimeSeriesFeatures
          dataset={dataset}
          config={timeSeriesConfig}
          onConfigUpdate={handleUpdateTimeSeriesConfig}
        />
      )}
    </div>
  );
};

export default FeatureEngineeringPanel;