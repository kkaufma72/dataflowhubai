import React, { useState } from 'react';
import { Code, FileText, Book, Copy, Check } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LazySwaggerUI from '../components/common/LazySwaggerUI';

const APIReference: React.FC = () => {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess(type);
        setTimeout(() => setCopySuccess(null), 2000);
      },
      () => {
        setCopySuccess('failed');
      }
    );
  };

  const apiKey = 'sk_test_automl_' + Math.random().toString(36).substring(2, 15);

  const swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'AutoML Platform API',
      version: '1.0.0',
      description: 'API documentation for the AutoML Platform'
    },
    servers: [
      {
        url: 'https://api.automl-platform.com/v1',
        description: 'Production server'
      }
    ],
    paths: {
      '/models/predict': {
        post: {
          summary: 'Make predictions using a deployed model',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    model_id: { type: 'string' },
                    data: { type: 'object' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successful prediction',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      prediction: { type: 'array' },
                      confidence: { type: 'number' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' }
                    }
                  }
                }
              }
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/models': {
        get: {
          summary: 'List all models',
          parameters: [
            {
              name: 'status',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['trained', 'deployed', 'all']
              },
              description: 'Filter models by status'
            }
          ],
          responses: {
            '200': {
              description: 'List of models',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        status: { type: 'string' },
                        created_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  const pythonExample = `import requests
import json

url = "https://api.automl-platform.com/v1/models/predict"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${apiKey}"
}
data = {
    "model_id": "model_123456",
    "data": {
        "feature1": 0.5,
        "feature2": "category",
        "feature3": 42
    }
}

response = requests.post(url, headers=headers, json=data)
prediction = response.json()
print(prediction)`;

  const javascriptExample = `fetch("https://api.automl-platform.com/v1/models/predict", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${apiKey}"
  },
  body: JSON.stringify({
    model_id: "model_123456",
    data: {
      feature1: 0.5,
      feature2: "category",
      feature3: 42
    }
  })
})
.then(response => response.json())
.then(prediction => console.log(prediction))
.catch(error => console.error("Error:", error));`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">API Reference</h1>
          <p className="text-lg text-gray-600 mb-8">
            Integrate our AutoML platform with your applications using our RESTful API.
          </p>

          <Card className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication</h2>
            <p className="text-gray-600 mb-4">
              All API requests require authentication using an API key in the Authorization header.
            </p>
            
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">API Key Format</h3>
                <button
                  onClick={() => copyToClipboard(`Authorization: Bearer ${apiKey}`, 'auth')}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
                >
                  {copySuccess === 'auth' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <code className="block text-sm font-mono bg-gray-800 text-gray-200 p-3 rounded">
                Authorization: Bearer {apiKey}
              </code>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Security Best Practices</h3>
              <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                <li>Store API keys securely and never expose them in client-side code</li>
                <li>Rotate your API keys periodically</li>
                <li>Use environment variables to store API keys in your applications</li>
                <li>Set up IP restrictions for production environments</li>
              </ul>
            </div>
          </Card>

          <Card className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Code Examples</h2>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Python</h3>
                <button
                  onClick={() => copyToClipboard(pythonExample, 'python')}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
                >
                  {copySuccess === 'python' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                <pre className="text-sm text-gray-200 font-mono">
                  {pythonExample}
                </pre>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">JavaScript</h3>
                <button
                  onClick={() => copyToClipboard(javascriptExample, 'javascript')}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
                >
                  {copySuccess === 'javascript' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                <pre className="text-sm text-gray-200 font-mono">
                  {javascriptExample}
                </pre>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">API Endpoints</h2>
            <div className="border border-gray-200 rounded-lg">
              <LazySwaggerUI spec={swaggerSpec} />
            </div>
          </Card>

          <div className="mt-12 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Need help?</h2>
              <p className="text-gray-600">
                Check our comprehensive documentation or contact our support team.
              </p>
            </div>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                icon={<Book className="w-4 h-4" />}
                onClick={() => window.location.href = '/documentation'}
              >
                Documentation
              </Button>
              <Button
                icon={<FileText className="w-4 h-4" />}
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIReference;