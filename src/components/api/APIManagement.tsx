import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, RefreshCw, Clock, Shield, Settings, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import LazySwaggerUI from '../common/LazySwaggerUI';
import { supabase } from '../../lib/supabase';
import { handleApiError } from '../../lib/errorHandling';
import Loading from '../common/Loading';
import ErrorBoundary from '../common/ErrorBoundary';
import toast from 'react-hot-toast';

interface APIKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  status: 'active' | 'expired' | 'revoked';
}

const APIManagement: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would fetch from the backend
      // For now, we'll use mock data
      const mockKeys = [
        {
          id: '1',
          name: 'Production API Key',
          key: 'sk_live_' + Math.random().toString(36).substring(2),
          created: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          status: 'active' as const
        }
      ];
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setApiKeys(mockKeys);
    } catch (err) {
      handleApiError(err, 'Failed to fetch API keys');
      setError('Failed to load API keys. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
      .then(() => {
        setCopiedKey(key);
        toast.success('API key copied to clipboard');
        setTimeout(() => setCopiedKey(null), 2000);
      })
      .catch(() => {
        toast.error('Failed to copy API key');
      });
  };

  const handleCreateKey = async () => {
    if (!newKeyName) {
      toast.error('Please provide a name for the API key');
      return;
    }

    try {
      // In a real implementation, this would call the backend
      const newKey: APIKey = {
        id: (apiKeys.length + 1).toString(),
        name: newKeyName,
        key: 'sk_live_' + Math.random().toString(36).substring(2),
        created: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        status: 'active'
      };

      setApiKeys([...apiKeys, newKey]);
      setNewKeyName('');
      setShowCreateKey(false);
      toast.success('API key created successfully');
    } catch (err) {
      handleApiError(err, 'Failed to create API key');
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      // In a real implementation, this would call the backend
      setApiKeys(apiKeys.map(key => 
        key.id === keyId ? { ...key, status: 'revoked' as const } : key
      ));
      toast.success('API key revoked successfully');
    } catch (err) {
      handleApiError(err, 'Failed to revoke API key');
    }
  };

  const swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'DataFlowHub AI API',
      version: '1.0.0',
      description: 'API documentation for the DataFlowHub AI Platform'
    },
    servers: [
      {
        url: 'https://api.dataflowhub.ai/v1',
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

  if (error) {
    return (
      <Card>
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchApiKeys}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">API Management</h2>
            <p className="mt-1 text-sm text-gray-500">Manage API keys and access controls</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              icon={<Settings className="w-4 h-4" />}
            >
              API Settings
            </Button>
            <Button
              size="sm"
              icon={<Key className="w-4 h-4" />}
              onClick={() => setShowCreateKey(true)}
            >
              Create API Key
            </Button>
          </div>
        </div>

        {showCreateKey && (
          <Card>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  API Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., Production API Key"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateKey(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateKey}
                  disabled={!newKeyName}
                >
                  Create Key
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <h3 className="text-sm font-medium text-gray-700">API Keys</h3>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loading size="md" text="Loading API keys..." />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {apiKeys.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <Key className="mx-auto h-10 w-10 text-gray-300" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No API keys</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create your first API key to access the platform programmatically.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowCreateKey(true)}
                  >
                    Create API Key
                  </Button>
                </div>
              ) : (
                apiKeys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{apiKey.name}</h4>
                        <div className="flex items-center mt-1">
                          <code className="px-2 py-1 text-sm font-mono text-indigo-600 bg-indigo-50 rounded">
                            {apiKey.key.slice(0, 10)}...
                          </code>
                          <button
                            onClick={() => handleCopyKey(apiKey.key)}
                            className="p-1 ml-2 text-gray-400 hover:text-gray-600"
                            aria-label="Copy API key"
                          >
                            {copiedKey === apiKey.key ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            Created {new Date(apiKey.created).toLocaleDateString()}
                          </p>
                          <p className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            Last used {new Date(apiKey.lastUsed).toLocaleTimeString()}
                          </p>
                        </div>
                        <div>
                          {apiKey.status === 'active' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Revoked
                            </span>
                          )}
                        </div>
                        {apiKey.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeKey(apiKey.id)}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Rate Limiting</h3>
            <Button
              variant="outline"
              size="sm"
              icon={<Settings className="w-4 h-4" />}
            >
              Configure Limits
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Requests / Minute</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">100</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Concurrent Requests</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">10</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Monthly Quota</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">100,000</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Security Settings</h3>
            <Button
              variant="outline"
              size="sm"
              icon={<Shield className="w-4 h-4" />}
            >
              Update Security
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">IP Whitelisting</p>
                <p className="mt-1 text-sm text-gray-500">Restrict API access to specific IP addresses</p>
              </div>
              <div className="flex items-center">
                <button className="relative inline-flex flex-shrink-0 h-6 transition-colors duration-200 ease-in-out border-2 border-transparent rounded-full cursor-pointer w-11 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 bg-indigo-600">
                  <span className="translate-x-5 inline-block w-5 h-5 transform bg-white rounded-full"></span>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Request Signing</p>
                <p className="mt-1 text-sm text-gray-500">Require signed requests for enhanced security</p>
              </div>
              <div className="flex items-center">
                <button className="relative inline-flex flex-shrink-0 h-6 transition-colors duration-200 ease-in-out border-2 border-transparent rounded-full cursor-pointer w-11 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 bg-gray-200">
                  <span className="translate-x-0 inline-block w-5 h-5 transform bg-white rounded-full"></span>
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-medium text-gray-700">API Documentation</h3>
          <div className="border border-gray-200 rounded-lg">
            <LazySwaggerUI spec={swaggerSpec} />
          </div>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default APIManagement;