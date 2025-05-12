import React, { useState } from 'react';
import { Code, Copy, Check, Search, Filter, Download } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const APIDocumentation: React.FC = () => {
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const apiEndpoints = [
    {
      id: 'models-list',
      category: 'models',
      method: 'GET',
      path: '/v1/models',
      title: 'List Models',
      description: 'Retrieve a list of all models in your account.',
      parameters: [
        { name: 'status', type: 'string', description: 'Filter models by status (trained, deployed, all)', required: false },
        { name: 'limit', type: 'integer', description: 'Maximum number of models to return', required: false },
        { name: 'offset', type: 'integer', description: 'Number of models to skip', required: false }
      ],
      responses: [
        { code: '200', description: 'Success', example: '{"models": [...]}' },
        { code: '401', description: 'Unauthorized', example: '{"error": "Invalid API key"}' }
      ],
      example: `curl -X GET "https://api.dataflowhub.ai/v1/models" \\
  -H "Authorization: Bearer YOUR_API_KEY"`
    },
    {
      id: 'models-get',
      category: 'models',
      method: 'GET',
      path: '/v1/models/{model_id}',
      title: 'Get Model',
      description: 'Retrieve details of a specific model.',
      parameters: [
        { name: 'model_id', type: 'string', description: 'ID of the model to retrieve', required: true }
      ],
      responses: [
        { code: '200', description: 'Success', example: '{"id": "model_123", "name": "My Model", ...}' },
        { code: '404', description: 'Not Found', example: '{"error": "Model not found"}' }
      ],
      example: `curl -X GET "https://api.dataflowhub.ai/v1/models/model_123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`
    },
    {
      id: 'models-predict',
      category: 'models',
      method: 'POST',
      path: '/v1/models/predict',
      title: 'Make Prediction',
      description: 'Make predictions using a deployed model.',
      parameters: [
        { name: 'model_id', type: 'string', description: 'ID of the model to use for prediction', required: true },
        { name: 'data', type: 'object', description: 'Input data for prediction', required: true }
      ],
      responses: [
        { code: '200', description: 'Success', example: '{"prediction": [0.8, 0.2], "confidence": 0.9}' },
        { code: '400', description: 'Bad Request', example: '{"error": "Invalid input data"}' }
      ],
      example: `curl -X POST "https://api.dataflowhub.ai/v1/models/predict" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model_id": "model_123",
    "data": {
      "feature1": 0.5,
      "feature2": "category",
      "feature3": 42
    }
  }'`
    },
    {
      id: 'datasets-list',
      category: 'datasets',
      method: 'GET',
      path: '/v1/datasets',
      title: 'List Datasets',
      description: 'Retrieve a list of all datasets in your account.',
      parameters: [
        { name: 'limit', type: 'integer', description: 'Maximum number of datasets to return', required: false },
        { name: 'offset', type: 'integer', description: 'Number of datasets to skip', required: false }
      ],
      responses: [
        { code: '200', description: 'Success', example: '{"datasets": [...]}' },
        { code: '401', description: 'Unauthorized', example: '{"error": "Invalid API key"}' }
      ],
      example: `curl -X GET "https://api.dataflowhub.ai/v1/datasets" \\
  -H "Authorization: Bearer YOUR_API_KEY"`
    },
    {
      id: 'datasets-upload',
      category: 'datasets',
      method: 'POST',
      path: '/v1/datasets',
      title: 'Upload Dataset',
      description: 'Upload a new dataset.',
      parameters: [
        { name: 'file', type: 'file', description: 'The dataset file to upload', required: true },
        { name: 'name', type: 'string', description: 'Name of the dataset', required: true },
        { name: 'description', type: 'string', description: 'Description of the dataset', required: false }
      ],
      responses: [
        { code: '201', description: 'Created', example: '{"id": "dataset_123", "name": "My Dataset", ...}' },
        { code: '400', description: 'Bad Request', example: '{"error": "Invalid file format"}' }
      ],
      example: `curl -X POST "https://api.dataflowhub.ai/v1/datasets" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@data.csv" \\
  -F "name=My Dataset" \\
  -F "description=Description of my dataset"`
    },
    {
      id: 'training-start',
      category: 'training',
      method: 'POST',
      path: '/v1/training',
      title: 'Start Training',
      description: 'Start training a new model.',
      parameters: [
        { name: 'dataset_id', type: 'string', description: 'ID of the dataset to use for training', required: true },
        { name: 'target_variable', type: 'string', description: 'Name of the target variable', required: true },
        { name: 'model_type', type: 'string', description: 'Type of model to train (classification, regression)', required: true },
        { name: 'algorithms', type: 'array', description: 'List of algorithms to use for training', required: true }
      ],
      responses: [
        { code: '202', description: 'Accepted', example: '{"id": "training_123", "status": "pending", ...}' },
        { code: '400', description: 'Bad Request', example: '{"error": "Invalid training configuration"}' }
      ],
      example: `curl -X POST "https://api.dataflowhub.ai/v1/training" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "dataset_id": "dataset_123",
    "target_variable": "target",
    "model_type": "classification",
    "algorithms": ["random_forest", "xgboost"]
  }'`
    }
  ];

  const categories = [
    { id: 'models', name: 'Models' },
    { id: 'datasets', name: 'Datasets' },
    { id: 'training', name: 'Training' },
    { id: 'deployment', name: 'Deployment' }
  ];

  const filteredEndpoints = apiEndpoints.filter(endpoint => {
    const matchesSearch = searchQuery 
      ? endpoint.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        endpoint.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    const matchesCategory = selectedCategory 
      ? endpoint.category === selectedCategory 
      : true;
    
    return matchesSearch && matchesCategory;
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess(id);
        setTimeout(() => setCopySuccess(null), 2000);
      },
      () => {
        setCopySuccess('failed');
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
        <p className="mt-2 text-gray-600">
          Complete reference documentation for the DataFlowHub AI API.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/4">
          <Card className="sticky top-6">
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search endpoints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-4">
              <button
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-left text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                onClick={() => setShowFilters(!showFilters)}
              >
                <span>Filter by Category</span>
                <Filter className="w-4 h-4 text-gray-500" />
              </button>
              
              {showFilters && (
                <div className="mt-2 space-y-2">
                  <button
                    className={`w-full px-3 py-2 text-sm text-left rounded-md ${
                      selectedCategory === null
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    All Categories
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      className={`w-full px-3 py-2 text-sm text-left rounded-md ${
                        selectedCategory === category.id
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoints</h3>
              {filteredEndpoints.map(endpoint => (
                <button
                  key={endpoint.id}
                  className={`w-full px-3 py-2 text-sm text-left rounded-md ${
                    activeEndpoint === endpoint.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveEndpoint(endpoint.id)}
                >
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                      endpoint.method === 'GET' 
                        ? 'bg-green-100 text-green-800' 
                        : endpoint.method === 'POST'
                        ? 'bg-blue-100 text-blue-800'
                        : endpoint.method === 'PUT'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {endpoint.method}
                    </span>
                    <span className="truncate">{endpoint.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="md:w-3/4">
          {activeEndpoint ? (
            <Card>
              {(() => {
                const endpoint = apiEndpoints.find(e => e.id === activeEndpoint);
                if (!endpoint) return null;

                return (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium mr-3 ${
                            endpoint.method === 'GET' 
                              ? 'bg-green-100 text-green-800' 
                              : endpoint.method === 'POST'
                              ? 'bg-blue-100 text-blue-800'
                              : endpoint.method === 'PUT'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {endpoint.method}
                          </span>
                          <h2 className="text-xl font-bold text-gray-900">{endpoint.title}</h2>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{endpoint.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Download className="w-4 h-4" />}
                      >
                        Download
                      </Button>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Endpoint</h3>
                      <div className="bg-gray-100 p-3 rounded-md flex items-center justify-between">
                        <code className="text-sm font-mono text-indigo-600">{endpoint.path}</code>
                        <button
                          onClick={() => copyToClipboard(endpoint.path, 'path')}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
                        >
                          {copySuccess === 'path' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {endpoint.parameters.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Parameters</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {endpoint.parameters.map((param, index) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{param.name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{param.type}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {param.required ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        Required
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        Optional
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500">{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Responses</h3>
                      <div className="space-y-4">
                        {endpoint.responses.map((response, index) => (
                          <div key={index} className="border border-gray-200 rounded-md overflow-hidden">
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                              <div className="flex items-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                                  response.code.startsWith('2') 
                                    ? 'bg-green-100 text-green-800' 
                                    : response.code.startsWith('4')
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {response.code}
                                </span>
                                <span className="text-sm font-medium text-gray-700">{response.description}</span>
                              </div>
                            </div>
                            <div className="p-4">
                              <pre className="bg-gray-800 text-gray-200 p-3 rounded-md overflow-x-auto text-sm">
                                {response.example}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Example</h3>
                      <div className="relative">
                        <pre className="bg-gray-800 text-gray-200 p-4 rounded-md overflow-x-auto text-sm">
                          {endpoint.example}
                        </pre>
                        <button
                          onClick={() => copyToClipboard(endpoint.example, 'example')}
                          className="absolute top-2 right-2 p-1 bg-gray-700 text-gray-300 hover:text-white rounded-md"
                        >
                          {copySuccess === 'example' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </Card>
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-12">
                <Code className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Select an Endpoint</h3>
                <p className="mt-2 text-gray-500 text-center max-w-md">
                  Choose an API endpoint from the sidebar to view detailed documentation, parameters, and examples.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default APIDocumentation;