import React, { useState, useRef, useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { 
  Database, 
  FileSpreadsheet, 
  Filter, 
  BarChart2, 
  Layers, 
  Rocket, 
  Plus, 
  X, 
  ArrowRight, 
  Save, 
  Play,
  Settings,
  Move,
  Copy,
  Trash2,
  Edit,
  Check,
  AlertCircle
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { useMLContext } from '../../context/MLContext';
import toast from 'react-hot-toast';

// Define node types for the pipeline
const NODE_TYPES = {
  DATA_SOURCE: 'data_source',
  PREPROCESSING: 'preprocessing',
  FEATURE_ENGINEERING: 'feature_engineering',
  MODEL_TRAINING: 'model_training',
  EVALUATION: 'evaluation',
  DEPLOYMENT: 'deployment'
};

// Define node templates
const NODE_TEMPLATES = [
  {
    id: 'data_source_template',
    type: NODE_TYPES.DATA_SOURCE,
    label: 'Data Source',
    icon: Database,
    color: 'bg-blue-100 text-blue-600',
    description: 'Connect to a data source',
    inputs: [],
    outputs: ['data'],
    configOptions: [
      { name: 'source_type', label: 'Source Type', type: 'select', options: ['Dataset', 'Database', 'API', 'File'] },
      { name: 'dataset_id', label: 'Dataset', type: 'dataset_select', condition: { field: 'source_type', value: 'Dataset' } }
    ]
  },
  {
    id: 'preprocessing_template',
    type: NODE_TYPES.PREPROCESSING,
    label: 'Data Preprocessing',
    icon: Filter,
    color: 'bg-primary/10 text-primary-600',
    description: 'Clean and prepare data',
    inputs: ['data'],
    outputs: ['processed_data'],
    configOptions: [
      { name: 'handle_missing', label: 'Handle Missing Values', type: 'select', options: ['Drop', 'Impute Mean', 'Impute Median', 'Impute Mode', 'Custom Value'] },
      { name: 'outlier_detection', label: 'Outlier Detection', type: 'select', options: ['None', 'Z-Score', 'IQR', 'Isolation Forest'] },
      { name: 'normalization', label: 'Normalization', type: 'select', options: ['None', 'Min-Max', 'Z-Score', 'Robust Scaler'] }
    ]
  },
  {
    id: 'feature_engineering_template',
    type: NODE_TYPES.FEATURE_ENGINEERING,
    label: 'Feature Engineering',
    icon: FileSpreadsheet,
    color: 'bg-green-100 text-green-600',
    description: 'Create and select features',
    inputs: ['processed_data'],
    outputs: ['features'],
    configOptions: [
      { name: 'feature_selection', label: 'Feature Selection', type: 'select', options: ['None', 'PCA', 'Recursive Feature Elimination', 'Feature Importance'] },
      { name: 'create_interactions', label: 'Create Interaction Features', type: 'boolean' },
      { name: 'polynomial_features', label: 'Polynomial Features', type: 'select', options: ['None', 'Degree 2', 'Degree 3'] }
    ]
  },
  {
    id: 'model_training_template',
    type: NODE_TYPES.MODEL_TRAINING,
    label: 'Model Training',
    icon: Layers,
    color: 'bg-primary/10 text-primary-600',
    description: 'Train machine learning models',
    inputs: ['features'],
    outputs: ['model'],
    configOptions: [
      { name: 'algorithm', label: 'Algorithm', type: 'select', options: ['Random Forest', 'XGBoost', 'Linear Regression', 'Logistic Regression', 'Neural Network'] },
      { name: 'hyperparameter_tuning', label: 'Hyperparameter Tuning', type: 'boolean' },
      { name: 'cross_validation', label: 'Cross Validation', type: 'boolean' }
    ]
  },
  {
    id: 'evaluation_template',
    type: NODE_TYPES.EVALUATION,
    label: 'Model Evaluation',
    icon: BarChart2,
    color: 'bg-amber-100 text-amber-600',
    description: 'Evaluate model performance',
    inputs: ['model', 'features'],
    outputs: ['evaluation'],
    configOptions: [
      { name: 'metrics', label: 'Metrics', type: 'multiselect', options: ['Accuracy', 'Precision', 'Recall', 'F1 Score', 'ROC AUC', 'RMSE', 'MAE', 'R²'] },
      { name: 'visualization', label: 'Visualizations', type: 'multiselect', options: ['Confusion Matrix', 'ROC Curve', 'Feature Importance', 'Learning Curve'] }
    ]
  },
  {
    id: 'deployment_template',
    type: NODE_TYPES.DEPLOYMENT,
    label: 'Model Deployment',
    icon: Rocket,
    color: 'bg-red-100 text-red-600',
    description: 'Deploy model to production',
    inputs: ['model', 'evaluation'],
    outputs: [],
    configOptions: [
      { name: 'deployment_type', label: 'Deployment Type', type: 'select', options: ['API Endpoint', 'Batch Prediction', 'Streaming'] },
      { name: 'monitoring', label: 'Enable Monitoring', type: 'boolean' },
      { name: 'versioning', label: 'Enable Versioning', type: 'boolean' }
    ]
  }
];

// Define the interface for a pipeline node
interface PipelineNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  inputs: string[];
  outputs: string[];
  icon: React.ElementType;
  color: string;
}

// Define the interface for a connection between nodes
interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceOutput: string;
  targetInput: string;
}

// DraggableNodeTemplate component
const DraggableNodeTemplate = ({ template }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'node-template',
    item: { template },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const Icon = template.icon;

  return (
    <div
      ref={drag}
      className={`flex items-center p-3 mb-2 bg-white rounded-lg border cursor-move transition-all ${
        isDragging ? 'opacity-50' : ''
      } hover:shadow-md`}
    >
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${template.color} mr-3`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-900">{template.label}</h3>
        <p className="text-xs text-gray-500">{template.description}</p>
      </div>
    </div>
  );
};

// PipelineNode component
const PipelineNode = ({ 
  node, 
  isSelected, 
  onSelect, 
  onMove, 
  onDelete, 
  onConfigure,
  connections
}) => {
  const nodeRef = useRef(null);
  const Icon = node.icon;

  // Set up drag functionality
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'pipeline-node',
    item: { id: node.id, type: node.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // Find connections for this node
  const nodeInputs = connections.filter(conn => conn.targetId === node.id);
  const nodeOutputs = connections.filter(conn => conn.sourceId === node.id);

  return (
    <div
      ref={(el) => {
        nodeRef.current = el;
        drag(el);
      }}
      className={`absolute p-4 bg-white rounded-lg border shadow-sm transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
      style={{ 
        left: `${node.position.x}px`, 
        top: `${node.position.y}px`,
        zIndex: isSelected ? 10 : 1,
        minWidth: '200px'
      }}
      onClick={() => onSelect(node.id)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${node.color} mr-2`}>
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-gray-900">{node.label}</h3>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConfigure(node.id);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Input ports */}
      {node.inputs.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-gray-500 mb-1">Inputs:</p>
          <div className="flex flex-wrap gap-1">
            {node.inputs.map(input => {
              const hasConnection = nodeInputs.some(conn => conn.targetInput === input);
              return (
                <div 
                  key={`${node.id}-input-${input}`}
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    hasConnection ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {input}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Output ports */}
      {node.outputs.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Outputs:</p>
          <div className="flex flex-wrap gap-1">
            {node.outputs.map(output => {
              const hasConnection = nodeOutputs.some(conn => conn.sourceOutput === output);
              return (
                <div 
                  key={`${node.id}-output-${output}`}
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    hasConnection ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {output}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Configuration summary */}
      {Object.keys(node.config).length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Configuration:</p>
          <div className="text-xs text-gray-700">
            {Object.entries(node.config).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span>{key.replace(/_/g, ' ')}:</span>
                <span className="font-medium">{value?.toString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Connection component to draw lines between nodes
const Connection = ({ connection, nodes, selected, onSelect }) => {
  const sourceNode = nodes.find(n => n.id === connection.sourceId);
  const targetNode = nodes.find(n => n.id === connection.targetId);

  if (!sourceNode || !targetNode) return null;

  // Calculate connection points
  const sourceX = sourceNode.position.x + 100; // Center of source node
  const sourceY = sourceNode.position.y + 50;
  const targetX = targetNode.position.x + 100; // Center of target node
  const targetY = targetNode.position.y + 50;

  // Calculate control points for the curve
  const controlPointX1 = sourceX + (targetX - sourceX) * 0.4;
  const controlPointY1 = sourceY;
  const controlPointX2 = targetX - (targetX - sourceX) * 0.4;
  const controlPointY2 = targetY;

  // Create SVG path
  const path = `M ${sourceX} ${sourceY} C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${targetX} ${targetY}`;

  return (
    <svg 
      className="absolute top-0 left-0 w-full h-full pointer-events-none" 
      style={{ zIndex: 0 }}
    >
      <path
        d={path}
        stroke={selected ? "#4F46E5" : "#94A3B8"}
        strokeWidth={selected ? 2 : 1.5}
        fill="none"
        strokeDasharray={selected ? "none" : "none"}
        onClick={() => onSelect(connection.id)}
      />
      {/* Arrow at the end of the connection */}
      <circle 
        cx={targetX} 
        cy={targetY} 
        r={3} 
        fill={selected ? "#4F46E5" : "#94A3B8"} 
      />
    </svg>
  );
};

// NodeConfigPanel component
const NodeConfigPanel = ({ node, onUpdate, onClose }) => {
  const { datasets } = useMLContext();
  const [config, setConfig] = useState(node.config);

  // Find the template for this node type
  const template = NODE_TEMPLATES.find(t => t.type === node.type);
  
  if (!template) return null;

  const handleChange = (name, value) => {
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    onUpdate(node.id, config);
    onClose();
  };

  return (
    <div className="p-4 bg-white rounded-lg border shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${node.color} mr-2`}>
            <node.icon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-gray-900">{node.label} Configuration</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {template.configOptions.map(option => {
          // Check if this option should be shown based on conditions
          if (option.condition) {
            const conditionMet = config[option.condition.field] === option.condition.value;
            if (!conditionMet) return null;
          }

          return (
            <div key={option.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {option.label}
              </label>
              
              {option.type === 'select' && (
                <select
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  value={config[option.name] || ''}
                  onChange={(e) => handleChange(option.name, e.target.value)}
                >
                  <option value="">Select...</option>
                  {option.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
              
              {option.type === 'dataset_select' && (
                <select
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  value={config[option.name] || ''}
                  onChange={(e) => handleChange(option.name, e.target.value)}
                >
                  <option value="">Select dataset...</option>
                  {datasets.map(dataset => (
                    <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
                  ))}
                </select>
              )}
              
              {option.type === 'boolean' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`${node.id}-${option.name}`}
                    checked={!!config[option.name]}
                    onChange={(e) => handleChange(option.name, e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor={`${node.id}-${option.name}`} className="ml-2 block text-sm text-gray-900">
                    Enable
                  </label>
                </div>
              )}
              
              {option.type === 'multiselect' && (
                <div className="space-y-2">
                  {option.options.map(opt => (
                    <div key={opt} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${node.id}-${option.name}-${opt}`}
                        checked={Array.isArray(config[option.name]) ? config[option.name].includes(opt) : false}
                        onChange={(e) => {
                          const currentValues = Array.isArray(config[option.name]) ? [...config[option.name]] : [];
                          if (e.target.checked) {
                            handleChange(option.name, [...currentValues, opt]);
                          } else {
                            handleChange(option.name, currentValues.filter(v => v !== opt));
                          }
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor={`${node.id}-${option.name}-${opt}`} className="ml-2 block text-sm text-gray-900">
                        {opt}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="mr-2"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          icon={<Check className="w-4 h-4" />}
        >
          Save Configuration
        </Button>
      </div>
    </div>
  );
};

// Main PipelineBuilder component
const PipelineBuilder: React.FC = () => {
  const { datasets } = useMLContext();
  const [nodes, setNodes] = useState<PipelineNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string, output: string } | null>(null);
  const [showNodeConfig, setShowNodeConfig] = useState<string | null>(null);
  const [pipelineName, setPipelineName] = useState('New ML Pipeline');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{ valid: boolean, messages: string[] } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle dropping a node template onto the canvas
  const [, drop] = useDrop(() => ({
    accept: 'node-template',
    drop: (item: { template: any }, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      
      if (offset && canvasRect) {
        const x = offset.x - canvasRect.left;
        const y = offset.y - canvasRect.top;
        
        addNode(item.template, { x, y });
      }
    },
  }));

  // Add a new node to the pipeline
  const addNode = (template, position) => {
    const newNode: PipelineNode = {
      id: `${template.type}-${Date.now()}`,
      type: template.type,
      label: template.label,
      position,
      config: {},
      inputs: [...template.inputs],
      outputs: [...template.outputs],
      icon: template.icon,
      color: template.color
    };
    
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    toast.success(`Added ${template.label} node`);
  };

  // Delete a node from the pipeline
  const deleteNode = (nodeId: string) => {
    // Delete any connections to/from this node
    setConnections(prev => prev.filter(conn => 
      conn.sourceId !== nodeId && conn.targetId !== nodeId
    ));
    
    // Delete the node
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    
    // Clear selection if this node was selected
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    
    toast.success('Node deleted');
  };

  // Update a node's position
  const moveNode = (nodeId: string, newPosition: { x: number, y: number }) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, position: newPosition } : node
    ));
  };

  // Update a node's configuration
  const updateNodeConfig = (nodeId: string, newConfig: Record<string, any>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, config: newConfig } : node
    ));
    toast.success('Configuration updated');
  };

  // Create a connection between nodes
  const createConnection = (sourceId: string, targetId: string, sourceOutput: string, targetInput: string) => {
    // Check if connection already exists
    const connectionExists = connections.some(conn => 
      conn.sourceId === sourceId && 
      conn.targetId === targetId && 
      conn.sourceOutput === sourceOutput && 
      conn.targetInput === targetInput
    );
    
    if (connectionExists) {
      toast.error('Connection already exists');
      return;
    }
    
    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      sourceId,
      targetId,
      sourceOutput,
      targetInput
    };
    
    setConnections(prev => [...prev, newConnection]);
    toast.success('Connection created');
  };

  // Delete a connection
  const deleteConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    
    // Clear selection if this connection was selected
    if (selectedConnectionId === connectionId) {
      setSelectedConnectionId(null);
    }
    
    toast.success('Connection deleted');
  };

  // Validate the pipeline
  const validatePipeline = () => {
    setIsValidating(true);
    
    // Simulate validation process
    setTimeout(() => {
      const messages = [];
      let isValid = true;
      
      // Check if there are any nodes
      if (nodes.length === 0) {
        messages.push('Pipeline is empty. Add at least one node.');
        isValid = false;
      }
      
      // Check if there's at least one data source
      const hasDataSource = nodes.some(node => node.type === NODE_TYPES.DATA_SOURCE);
      if (!hasDataSource) {
        messages.push('Pipeline must have at least one Data Source node.');
        isValid = false;
      }
      
      // Check for disconnected nodes
      const connectedNodeIds = new Set();
      connections.forEach(conn => {
        connectedNodeIds.add(conn.sourceId);
        connectedNodeIds.add(conn.targetId);
      });
      
      const disconnectedNodes = nodes.filter(node => 
        node.inputs.length > 0 && !connectedNodeIds.has(node.id)
      );
      
      if (disconnectedNodes.length > 0) {
        messages.push(`${disconnectedNodes.length} nodes are not connected to the pipeline.`);
        isValid = false;
      }
      
      // Check for missing configurations
      nodes.forEach(node => {
        const template = NODE_TEMPLATES.find(t => t.type === node.type);
        if (template) {
          const requiredOptions = template.configOptions.filter(opt => !opt.condition);
          const missingOptions = requiredOptions.filter(opt => !node.config[opt.name]);
          
          if (missingOptions.length > 0) {
            messages.push(`Node "${node.label}" is missing required configuration.`);
            isValid = false;
          }
        }
      });
      
      setValidationResults({ valid: isValid, messages });
      setIsValidating(false);
      
      if (isValid) {
        toast.success('Pipeline validation successful!');
      } else {
        toast.error('Pipeline validation failed. Please fix the issues.');
      }
    }, 1500);
  };

  // Run the pipeline
  const runPipeline = () => {
    if (!validationResults?.valid) {
      validatePipeline();
      return;
    }
    
    setIsRunning(true);
    setRunProgress(0);
    setRunStatus('running');
    
    // Simulate pipeline execution
    const interval = setInterval(() => {
      setRunProgress(prev => {
        const newProgress = prev + Math.random() * 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          setRunStatus('completed');
          toast.success('Pipeline execution completed successfully!');
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };

  // Save the pipeline
  const savePipeline = () => {
    // In a real implementation, this would save to a backend
    toast.success('Pipeline saved successfully!');
  };

  // Handle node selection
  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedConnectionId(null);
  };

  // Handle connection selection
  const handleSelectConnection = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    setSelectedNodeId(null);
  };

  // Get the selected node
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  
  // Get the selected connection
  const selectedConnection = selectedConnectionId ? connections.find(c => c.id === selectedConnectionId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isEditingName ? (
            <div className="flex items-center">
              <input
                type="text"
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                autoFocus
              />
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => setIsEditingName(false)}
                icon={<Check className="w-4 h-4" />}
              >
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-gray-900">{pipelineName}</h2>
              <button
                onClick={() => setIsEditingName(true)}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={validatePipeline}
            disabled={isValidating || isRunning}
            icon={isValidating ? <Layers className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          >
            {isValidating ? 'Validating...' : 'Validate'}
          </Button>
          <Button
            variant="outline"
            onClick={savePipeline}
            disabled={isRunning}
            icon={<Save className="w-4 h-4" />}
          >
            Save
          </Button>
          <Button
            onClick={runPipeline}
            disabled={isRunning || runStatus === 'completed'}
            icon={isRunning ? <Layers className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          >
            {isRunning ? 'Running...' : runStatus === 'completed' ? 'Run Again' : 'Run Pipeline'}
          </Button>
        </div>
      </div>

      {validationResults && !validationResults.valid && (
        <div className="p-4 bg-red-50 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Validation Failed</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {validationResults.messages.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRunning && (
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Pipeline Execution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-medium text-gray-700">{Math.round(runProgress)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-primary-600 rounded-full transition-all duration-300"
                  style={{ width: `${runProgress}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {nodes.map((node, index) => {
                const isProcessed = runProgress > (index + 1) * (100 / nodes.length);
                const isProcessing = runProgress > index * (100 / nodes.length) && !isProcessed;
                
                return (
                  <div key={node.id} className="flex items-center">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      isProcessed ? 'bg-green-100' : isProcessing ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {isProcessed ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : isProcessing ? (
                        <div className="w-3 h-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                      )}
                    </div>
                    <span className={`ml-2 text-sm ${
                      isProcessed ? 'text-green-600' : isProcessing ? 'text-blue-600 font-medium' : 'text-gray-500'
                    }`}>
                      {node.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Pipeline Components</h3>
            <div className="space-y-4">
              {Object.keys(NODE_TYPES).map(type => {
                const templates = NODE_TEMPLATES.filter(t => t.type === NODE_TYPES[type]);
                return (
                  <div key={type}>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                      {type.replace(/_/g, ' ')}
                    </h4>
                    {templates.map(template => (
                      <DraggableNodeTemplate key={template.id} template={template} />
                    ))}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card className="h-[600px] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Pipeline Canvas</h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNodes([]);
                    setConnections([]);
                    setSelectedNodeId(null);
                    setSelectedConnectionId(null);
                    toast.success('Pipeline cleared');
                  }}
                  disabled={nodes.length === 0}
                >
                  Clear Canvas
                </Button>
              </div>
            </div>
            
            <div 
              ref={(el) => {
                canvasRef.current = el;
                drop(el);
              }}
              className="relative w-full h-[520px] bg-gray-50 rounded-lg overflow-auto"
            >
              {/* Render connections */}
              {connections.map(connection => (
                <Connection
                  key={connection.id}
                  connection={connection}
                  nodes={nodes}
                  selected={selectedConnectionId === connection.id}
                  onSelect={handleSelectConnection}
                />
              ))}
              
              {/* Render nodes */}
              {nodes.map(node => (
                <PipelineNode
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onSelect={handleSelectNode}
                  onMove={moveNode}
                  onDelete={deleteNode}
                  onConfigure={(nodeId) => setShowNodeConfig(nodeId)}
                  connections={connections}
                />
              ))}
              
              {/* Node configuration panel */}
              {showNodeConfig && (
                <div className="absolute top-4 right-4 z-20 w-80">
                  <NodeConfigPanel
                    node={nodes.find(n => n.id === showNodeConfig)!}
                    onUpdate={updateNodeConfig}
                    onClose={() => setShowNodeConfig(null)}
                  />
                </div>
              )}
              
              {/* Empty state */}
              {nodes.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                    <Layers className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">Build Your ML Pipeline</h3>
                  <p className="mt-1 text-sm text-gray-500 max-w-xs">
                    Drag and drop components from the left panel to create your machine learning pipeline
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {selectedNode && (
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Selected Node: {selectedNode.label}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Properties</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Type:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedNode.type.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">ID:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedNode.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Position:</span>
                  <span className="text-sm font-medium text-gray-900">
                    x: {selectedNode.position.x.toFixed(0)}, y: {selectedNode.position.y.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Actions</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNodeConfig(selectedNode.id)}
                  icon={<Settings className="w-4 h-4" />}
                >
                  Configure
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nodeCopy = {
                      ...selectedNode,
                      id: `${selectedNode.type}-${Date.now()}`,
                      position: {
                        x: selectedNode.position.x + 50,
                        y: selectedNode.position.y + 50
                      }
                    };
                    setNodes(prev => [...prev, nodeCopy]);
                    toast.success('Node duplicated');
                  }}
                  icon={<Copy className="w-4 h-4" />}
                >
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteNode(selectedNode.id)}
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {selectedConnection && (
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Selected Connection</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Properties</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">From:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {nodes.find(n => n.id === selectedConnection.sourceId)?.label || 'Unknown'} ({selectedConnection.sourceOutput})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">To:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {nodes.find(n => n.id === selectedConnection.targetId)?.label || 'Unknown'} ({selectedConnection.targetInput})
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Actions</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteConnection(selectedConnection.id)}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Delete Connection
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PipelineBuilder;