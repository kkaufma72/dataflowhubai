import React, { useState } from 'react';
import { Card } from '../common/Card';
import { 
  Layers, 
  Plus, 
  X, 
  ArrowDown, 
  ArrowUp, 
  Edit, 
  Save, 
  Trash2,
  Code,
  RefreshCw,
  Wand2
} from 'lucide-react';
import Button from '../common/Button';
import { Dataset } from '../../types';
import toast from 'react-hot-toast';

interface FeatureTransformationPipelineProps {
  dataset: Dataset;
  selectedFeatures: string[];
  transformations: {
    id: string;
    type: 'scaling' | 'normalization' | 'encoding' | 'binning' | 'custom';
    features: string[];
    config: Record<string, any>;
  }[];
  onAddTransformation: (transformation: {
    type: 'scaling' | 'normalization' | 'encoding' | 'binning' | 'custom';
    features: string[];
    config: Record<string, any>;
  }) => void;
  onRemoveTransformation: (id: string) => void;
}

const FeatureTransformationPipeline: React.FC<FeatureTransformationPipelineProps> = ({
  dataset,
  selectedFeatures,
  transformations,
  onAddTransformation,
  onRemoveTransformation
}) => {
  const [showNewTransformationForm, setShowNewTransformationForm] = useState(false);
  const [newTransformation, setNewTransformation] = useState<{
    type: 'scaling' | 'normalization' | 'encoding' | 'binning' | 'custom';
    features: string[];
    config: Record<string, any>;
  }>({
    type: 'scaling',
    features: [],
    config: {}
  });
  const [editingTransformationId, setEditingTransformationId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const transformationTypes = [
    { 
      value: 'scaling', 
      label: 'Scaling', 
      description: 'Scale numeric features to a specific range',
      configOptions: [
        { name: 'method', label: 'Method', type: 'select', options: ['min-max', 'standard', 'robust'] },
        { name: 'range_min', label: 'Min Value', type: 'number', default: 0 },
        { name: 'range_max', label: 'Max Value', type: 'number', default: 1 }
      ]
    },
    { 
      value: 'normalization', 
      label: 'Normalization', 
      description: 'Normalize features to have zero mean and unit variance',
      configOptions: [
        { name: 'method', label: 'Method', type: 'select', options: ['z-score', 'decimal-scaling', 'log'] }
      ]
    },
    { 
      value: 'encoding', 
      label: 'Categorical Encoding', 
      description: 'Convert categorical features to numeric representation',
      configOptions: [
        { name: 'method', label: 'Method', type: 'select', options: ['one-hot', 'label', 'target', 'frequency'] },
        { name: 'handle_unknown', label: 'Handle Unknown', type: 'select', options: ['error', 'ignore', 'value'] }
      ]
    },
    { 
      value: 'binning', 
      label: 'Binning', 
      description: 'Group numeric features into discrete bins',
      configOptions: [
        { name: 'n_bins', label: 'Number of Bins', type: 'number', default: 5 },
        { name: 'strategy', label: 'Strategy', type: 'select', options: ['uniform', 'quantile', 'kmeans'] },
        { name: 'encode', label: 'Encode', type: 'select', options: ['ordinal', 'onehot'] }
      ]
    },
    { 
      value: 'custom', 
      label: 'Custom Transformation', 
      description: 'Apply a custom function to transform features',
      configOptions: [
        { name: 'expression', label: 'Python Expression', type: 'text', default: 'lambda x: x' },
        { name: 'output_name', label: 'Output Feature Name', type: 'text', default: 'custom_feature' }
      ]
    }
  ];

  const handleAddNewTransformation = () => {
    if (newTransformation.features.length === 0) {
      toast.error('Please select at least one feature');
      return;
    }
    
    onAddTransformation(newTransformation);
    setShowNewTransformationForm(false);
    setNewTransformation({
      type: 'scaling',
      features: [],
      config: {}
    });
  };

  const handleFeatureToggle = (feature: string) => {
    if (newTransformation.features.includes(feature)) {
      setNewTransformation({
        ...newTransformation,
        features: newTransformation.features.filter(f => f !== feature)
      });
    } else {
      setNewTransformation({
        ...newTransformation,
        features: [...newTransformation.features, feature]
      });
    }
  };

  const handleConfigChange = (name: string, value: any) => {
    setNewTransformation({
      ...newTransformation,
      config: {
        ...newTransformation.config,
        [name]: value
      }
    });
  };

  const handleGeneratePreview = () => {
    setIsGeneratingPreview(true);
    
    // Simulate generating preview data
    setTimeout(() => {
      // Create mock preview data
      const preview = [];
      
      // Get a few sample rows from the dataset
      const sampleRows = dataset.previewData?.rows.slice(0, 5) || [];
      
      // For each sample row, create a before/after comparison
      for (const row of sampleRows) {
        const originalValues: Record<string, any> = {};
        const transformedValues: Record<string, any> = {};
        
        // Get original values for selected features
        dataset.previewData?.columns.forEach((col, index) => {
          if (selectedFeatures.includes(col)) {
            originalValues[col] = row[index];
          }
        });
        
        // Generate transformed values (mock data)
        for (const feature of selectedFeatures) {
          const originalValue = originalValues[feature];
          let transformedValue = originalValue;
          
          // Apply each transformation in the pipeline
          for (const transformation of transformations) {
            if (transformation.features.includes(feature)) {
              switch (transformation.type) {
                case 'scaling':
                  // Mock scaling transformation
                  if (typeof originalValue === 'number' || !isNaN(Number(originalValue))) {
                    const value = Number(originalValue);
                    const min = transformation.config.range_min || 0;
                    const max = transformation.config.range_max || 1;
                    transformedValue = ((value - 0) / (100 - 0)) * (max - min) + min;
                  }
                  break;
                case 'normalization':
                  // Mock normalization
                  if (typeof originalValue === 'number' || !isNaN(Number(originalValue))) {
                    const value = Number(originalValue);
                    transformedValue = (value - 50) / 25; // Mock z-score
                  }
                  break;
                case 'encoding':
                  // Mock encoding
                  if (typeof originalValue === 'string') {
                    if (transformation.config.method === 'one-hot') {
                      transformedValue = `[0,0,1,0]`; // Mock one-hot encoding
                    } else {
                      transformedValue = originalValue.charCodeAt(0) % 10; // Simple hash for demo
                    }
                  }
                  break;
                case 'binning':
                  // Mock binning
                  if (typeof originalValue === 'number' || !isNaN(Number(originalValue))) {
                    const value = Number(originalValue);
                    const nBins = transformation.config.n_bins || 5;
                    transformedValue = Math.floor(value / (100 / nBins));
                  }
                  break;
                case 'custom':
                  // Mock custom transformation
                  if (typeof originalValue === 'number' || !isNaN(Number(originalValue))) {
                    const value = Number(originalValue);
                    transformedValue = value * 2; // Simple mock transformation
                  } else if (typeof originalValue === 'string') {
                    transformedValue = originalValue.toUpperCase();
                  }
                  break;
              }
            }
          }
          
          transformedValues[feature] = transformedValue;
        }
        
        preview.push({
          original: originalValues,
          transformed: transformedValues
        });
      }
      
      setPreviewData(preview);
      setIsGeneratingPreview(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
              <Layers className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Transformation Pipeline</h3>
              <p className="mt-1 text-xs text-gray-500">
                Create a sequence of transformations to apply to your features
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowNewTransformationForm(!showNewTransformationForm)}
            icon={showNewTransformationForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          >
            {showNewTransformationForm ? 'Cancel' : 'Add Transformation'}
          </Button>
        </div>

        {showNewTransformationForm && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 mb-4">New Transformation</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transformation Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={newTransformation.type}
                  onChange={(e) => setNewTransformation({
                    ...newTransformation,
                    type: e.target.value as any,
                    config: {}
                  })}
                >
                  {transformationTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {transformationTypes.find(t => t.value === newTransformation.type)?.description}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features to Transform
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {selectedFeatures.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">No features selected</p>
                  ) : (
                    <div className="space-y-1">
                      {selectedFeatures.map(feature => (
                        <div key={feature} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`feature-${feature}`}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked={newTransformation.features.includes(feature)}
                            onChange={() => handleFeatureToggle(feature)}
                          />
                          <label htmlFor={`feature-${feature}`} className="ml-2 text-sm text-gray-700">
                            {feature}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Configuration</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transformationTypes
                  .find(t => t.value === newTransformation.type)
                  ?.configOptions.map(option => (
                    <div key={option.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {option.label}
                      </label>
                      {option.type === 'select' ? (
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={newTransformation.config[option.name] || option.options?.[0]}
                          onChange={(e) => handleConfigChange(option.name, e.target.value)}
                        >
                          {option.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : option.type === 'number' ? (
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={newTransformation.config[option.name] || option.default || ''}
                          onChange={(e) => handleConfigChange(option.name, parseFloat(e.target.value))}
                        />
                      ) : (
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={newTransformation.config[option.name] || option.default || ''}
                          onChange={(e) => handleConfigChange(option.name, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={handleAddNewTransformation}
                icon={<Plus className="w-4 h-4" />}
              >
                Add to Pipeline
              </Button>
            </div>
          </div>
        )}

        {transformations.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
            <Layers className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transformations</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add transformations to create your feature engineering pipeline
            </p>
            <div className="mt-6">
              <Button
                onClick={() => setShowNewTransformationForm(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Transformation
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              {/* Vertical line connecting transformations */}
              <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gray-200"></div>
              
              {transformations.map((transformation, index) => (
                <div key={transformation.id} className="relative flex items-start mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 z-10">
                    <span className="text-sm font-medium text-indigo-700">{index + 1}</span>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="p-4 border border-gray-200 rounded-lg bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {transformationTypes.find(t => t.value === transformation.type)?.label}
                        </h4>
                        <div className="flex space-x-1">
                          {index > 0 && (
                            <button
                              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                              title="Move up"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                          )}
                          {index < transformations.length - 1 && (
                            <button
                              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                              title="Move down"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                            title="Edit"
                            onClick={() => setEditingTransformationId(
                              editingTransformationId === transformation.id ? null : transformation.id
                            )}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                            title="Remove"
                            onClick={() => onRemoveTransformation(transformation.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <div className="mb-1">
                          <span className="font-medium">Features:</span>{' '}
                          {transformation.features.join(', ')}
                        </div>
                        
                        {editingTransformationId === transformation.id ? (
                          <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            <h5 className="text-xs font-medium text-gray-700 mb-2">Configuration</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {Object.entries(transformation.config).map(([key, value]) => (
                                <div key={key} className="flex items-center">
                                  <span className="text-xs font-medium text-gray-500 w-1/3">{key}:</span>
                                  <input
                                    type={typeof value === 'number' ? 'number' : 'text'}
                                    className="ml-2 flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md"
                                    value={value}
                                    onChange={() => {}} // This would be implemented in a real app
                                    disabled
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingTransformationId(null)}
                              >
                                Close
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-medium">Config:</span>{' '}
                            {Object.entries(transformation.config)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                icon={<Code className="w-4 h-4" />}
              >
                View Pipeline Code
              </Button>
              
              <Button
                onClick={handleGeneratePreview}
                disabled={isGeneratingPreview}
                icon={isGeneratingPreview ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              >
                {isGeneratingPreview ? 'Generating...' : 'Generate Preview'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {previewData && (
        <Card>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Transformation Preview</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feature
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original Value
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transformed Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.flatMap((row, rowIndex) => 
                  Object.keys(row.original).map((feature, featureIndex) => (
                    <tr key={`${rowIndex}-${featureIndex}`} className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {rowIndex === 0 && featureIndex === 0 ? (
                          <div className="flex items-center">
                            <span>{feature}</span>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Row {rowIndex + 1}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span>{feature}</span>
                            {featureIndex === 0 && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Row {rowIndex + 1}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.original[feature]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={row.original[feature] !== row.transformed[feature] ? 'text-indigo-600 font-medium' : ''}>
                          {typeof row.transformed[feature] === 'number' 
                            ? row.transformed[feature].toFixed(4) 
                            : row.transformed[feature]}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FeatureTransformationPipeline;