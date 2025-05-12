import React from 'react';
import { Book, Code, FileText, PieChart, Rocket, Zap } from 'lucide-react';
import Card from '../components/common/Card';
import PitchDeck from '../components/marketing/PitchDeck';
import { useState } from 'react';
import Button from '../components/common/Button';

const Documentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guides' | 'api' | 'help'>('guides');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Learn how to use and integrate with our AutoML platform
        </p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('guides')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'guides'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Guides
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'api'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              API Documentation
            </button>
            <button
              onClick={() => setActiveTab('help')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'help'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Help Center
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'guides' && (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-all hover:shadow-md">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
              <Book className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="ml-3 text-lg font-medium text-gray-900">Getting Started</h2>
          </div>
          <p className="text-sm text-gray-500">
            Learn the basics of our AutoML platform and how to train your first model.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>• Platform Overview</li>
            <li>• Quick Start Guide</li>
            <li>• Basic Concepts</li>
          </ul>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-lg">
              <Code className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="ml-3 text-lg font-medium text-gray-900">API Reference</h2>
          </div>
          <p className="text-sm text-gray-500">
            Detailed documentation for our REST API endpoints and SDKs.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>• Authentication</li>
            <li>• Endpoints</li>
            <li>• Code Examples</li>
          </ul>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="ml-3 text-lg font-medium text-gray-900">Model Training</h2>
          </div>
          <p className="text-sm text-gray-500">
            Learn about model training, optimization, and best practices.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>• Training Process</li>
            <li>• Model Types</li>
            <li>• Hyperparameters</li>
          </ul>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-amber-100 rounded-lg">
              <Rocket className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="ml-3 text-lg font-medium text-gray-900">Deployment</h2>
          </div>
          <p className="text-sm text-gray-500">
            Guide to deploying and managing models in production.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>• Deployment Options</li>
            <li>• Scaling</li>
            <li>• Monitoring</li>
          </ul>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-rose-100 rounded-lg">
              <FileText className="w-6 h-6 text-rose-600" />
            </div>
            <h2 className="ml-3 text-lg font-medium text-gray-900">Tutorials</h2>
          </div>
          <p className="text-sm text-gray-500">
            Step-by-step guides and examples for common use cases.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>• Classification</li>
            <li>• Regression</li>
            <li>• Time Series</li>
          </ul>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="ml-3 text-lg font-medium text-gray-900">Integration</h2>
          </div>
          <p className="text-sm text-gray-500">
            Learn how to integrate our platform with your existing systems.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>• Data Sources</li>
            <li>• Webhooks</li>
            <li>• Security</li>
          </ul>
        </Card>
      </div>
      )}

      {activeTab === 'api' && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-medium text-gray-900 mb-4">API Reference</h2>
            <p className="text-gray-600 mb-6">
              Our RESTful API allows you to programmatically access and control all aspects of the DataFlowHub AI platform.
            </p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-2">Authentication</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-700 mb-2">All API requests require authentication using an API key in the Authorization header:</p>
                  <pre className="bg-gray-800 text-gray-200 p-3 rounded-md overflow-x-auto text-sm">
                    Authorization: Bearer YOUR_API_KEY
                  </pre>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-2">Endpoints</h3>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-md">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <div className="flex items-center">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md mr-2">GET</span>
                        <span className="font-mono text-sm">/v1/models</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-700 mb-2">List all models</p>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mt-4 mb-2">Parameters</h4>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">status</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">string</td>
                            <td className="px-3 py-2 text-sm text-gray-500">Filter models by status (trained, deployed, all)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <div className="flex items-center">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md mr-2">POST</span>
                        <span className="font-mono text-sm">/v1/models/predict</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-700 mb-2">Make predictions using a deployed model</p>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mt-4 mb-2">Request Body</h4>
                      <pre className="bg-gray-800 text-gray-200 p-3 rounded-md overflow-x-auto text-sm">
{`{
  "model_id": "model_123456",
  "data": {
    "feature1": 0.5,
    "feature2": "category",
    "feature3": 42
  }
}`}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <div className="flex items-center">
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-md mr-2">POST</span>
                        <span className="font-mono text-sm">/v1/datasets</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-700 mb-2">Upload a new dataset</p>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mt-4 mb-2">Request Body</h4>
                      <p className="text-sm text-gray-600 mb-2">Multipart form data with:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>file: The dataset file (CSV, JSON, etc.)</li>
                        <li>name: Dataset name</li>
                        <li>description: (Optional) Dataset description</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-2">Code Examples</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Python</h4>
                    <pre className="bg-gray-800 text-gray-200 p-3 rounded-md overflow-x-auto text-sm">
{`import requests

API_KEY = "your_api_key_here"
API_URL = "https://api.dataflowhub.ai/v1"

# Make a prediction
def predict(model_id, data):
    url = f"{API_URL}/models/predict"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model_id": model_id,
        "data": data
    }
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# Example usage
result = predict("model_123456", {
    "feature1": 0.5,
    "feature2": "category",
    "feature3": 42
})
print(result)`}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">JavaScript</h4>
                    <pre className="bg-gray-800 text-gray-200 p-3 rounded-md overflow-x-auto text-sm">
{`const API_KEY = "your_api_key_here";
const API_URL = "https://api.dataflowhub.ai/v1";

// Make a prediction
async function predict(modelId, data) {
  const response = await fetch(\`\${API_URL}/models/predict\`, {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${API_KEY}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model_id: modelId,
      data: data
    })
  });
  return response.json();
}

// Example usage
predict("model_123456", {
  feature1: 0.5,
  feature2: "category",
  feature3: 42
}).then(result => console.log(result))
  .catch(error => console.error(error));`}
                    </pre>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => window.open('/api-reference', '_blank')}
                >
                  View Full API Documentation
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'help' && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Help Center</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-2">Frequently Asked Questions</h3>
                <div className="space-y-4 mt-4">
                  <div className="border border-gray-200 rounded-md">
                    <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 focus:outline-none">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">How do I upload a dataset?</span>
                        <span className="text-indigo-600">+</span>
                      </div>
                    </button>
                    <div className="px-4 py-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        To upload a dataset, navigate to the Data Management page and click the "Upload Dataset" button. 
                        You can drag and drop your file or click to browse your files. Supported formats include CSV, 
                        Excel, JSON, and more. After uploading, your dataset will be automatically processed and analyzed.
                      </p>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md">
                    <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 focus:outline-none">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">How do I train a model?</span>
                        <span className="text-indigo-600">+</span>
                      </div>
                    </button>
                    <div className="px-4 py-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        To train a model, go to the Model Training page, select a dataset, and choose your target variable. 
                        Configure your model settings including the type of model (classification or regression) and select 
                        the algorithms you want to use. Click "Start Training" and the platform will automatically find the 
                        best model for your data.
                      </p>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md">
                    <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 focus:outline-none">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">How do I deploy a model?</span>
                        <span className="text-indigo-600">+</span>
                      </div>
                    </button>
                    <div className="px-4 py-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        After training a model, navigate to the Deployment page, select your trained model, and configure 
                        deployment settings like scaling options and authentication method. Click "Deploy Model" to make 
                        your model available as an API endpoint. Once deployed, you'll receive an API endpoint URL and 
                        example code to integrate with your applications.
                      </p>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md">
                    <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 focus:outline-none">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">How do I monitor my deployed models?</span>
                        <span className="text-indigo-600">+</span>
                      </div>
                    </button>
                    <div className="px-4 py-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        The Model Monitoring page provides real-time insights into your deployed models. You can track 
                        performance metrics, detect data drift, and set up alerts for critical issues. The dashboard 
                        shows accuracy, latency, and request volume over time. If performance degrades, you can retrain 
                        your model directly from the monitoring interface.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-2">Video Tutorials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <div className="text-gray-400">Video: Getting Started with DataFlowHub AI</div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-gray-900">Getting Started</h4>
                      <p className="text-sm text-gray-600 mt-1">Learn the basics of the platform in 5 minutes</p>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <div className="text-gray-400">Video: Data Preprocessing Tutorial</div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-gray-900">Data Preprocessing</h4>
                      <p className="text-sm text-gray-600 mt-1">Learn how to clean and prepare your data</p>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <div className="text-gray-400">Video: Model Training Deep Dive</div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-gray-900">Model Training</h4>
                      <p className="text-sm text-gray-600 mt-1">Advanced techniques for model optimization</p>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <div className="text-gray-400">Video: Deployment Best Practices</div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-gray-900">Deployment</h4>
                      <p className="text-sm text-gray-600 mt-1">Securely deploy and scale your models</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-2">Contact Support</h3>
                <div className="bg-indigo-50 p-4 rounded-md mt-4">
                  <p className="text-sm text-indigo-700 mb-4">
                    Need additional help? Our support team is available 24/7 to assist you with any questions or issues.
                  </p>
                  <div className="flex space-x-4">
                    <Button>
                      Contact Support
                    </Button>
                    <Button variant="outline">
                      Schedule a Demo
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card>
        <h2 className="text-lg font-medium text-gray-900">Investment Overview</h2>
        <p className="mt-1 mb-6 text-sm text-gray-500">
          Learn about our business model, market opportunity, and growth trajectory
        </p>
        <PitchDeck />
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-medium text-gray-900">Latest Updates</h2>
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">New Feature: AutoML Pipeline</p>
              <p className="mt-1 text-sm text-gray-500">
                Automated end-to-end machine learning pipeline with advanced feature engineering
              </p>
              <p className="mt-2 text-xs text-gray-400">Released on April 15, 2024</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">Enhanced Model Monitoring</p>
              <p className="mt-1 text-sm text-gray-500">
                Real-time monitoring and drift detection for deployed models
              </p>
              <p className="mt-2 text-xs text-gray-400">Released on April 1, 2024</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">New Integration: Snowflake</p>
              <p className="mt-1 text-sm text-gray-500">
                Direct connection to Snowflake data warehouse for model training
              </p>
              <p className="mt-2 text-xs text-gray-400">Released on March 15, 2024</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-medium text-gray-900">Support Resources</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-lg">
                  <Book className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Documentation</p>
                <p className="mt-1 text-sm text-gray-500">
                  Comprehensive guides and API reference
                </p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                  <Code className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Code Examples</p>
                <p className="mt-1 text-sm text-gray-500">
                  Sample code and integration examples
                </p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Tutorials</p>
                <p className="mt-1 text-sm text-gray-500">
                  Step-by-step implementation guides
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Use Cases</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <PieChart className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Churn Prediction</h3>
            <p className="text-gray-600 mb-4">
              Identify customers at risk of leaving and take proactive measures to retain them.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Predict churn probability for each customer</li>
              <li>• Identify key factors contributing to churn</li>
              <li>• Segment customers by risk level</li>
              <li>• Automate intervention campaigns</li>
            </ul>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Rocket className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Fraud Detection</h3>
            <p className="text-gray-600 mb-4">
              Identify suspicious transactions and activities in real-time to prevent fraud.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Real-time transaction scoring</li>
              <li>• Anomaly detection in user behavior</li>
              <li>• Adaptive learning from new patterns</li>
              <li>• Reduce false positives with ensemble models</li>
            </ul>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Demand Forecasting</h3>
            <p className="text-gray-600 mb-4">
              Predict future demand for products and services to optimize inventory and staffing.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Multi-variable time series forecasting</li>
              <li>• Seasonal pattern recognition</li>
              <li>• External factor integration (weather, events)</li>
              <li>• Confidence intervals for planning</li>
            </ul>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Document Classification</h3>
            <p className="text-gray-600 mb-4">
              Automatically categorize and route documents based on their content.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Multi-label document classification</li>
              <li>• Extract key information from documents</li>
              <li>• Process multiple document formats</li>
              <li>• Integrate with existing document workflows</li>
            </ul>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <Code className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Predictive Maintenance</h3>
            <p className="text-gray-600 mb-4">
              Predict equipment failures before they happen to reduce downtime and maintenance costs.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Sensor data analysis for failure prediction</li>
              <li>• Maintenance schedule optimization</li>
              <li>• Component lifetime estimation</li>
              <li>• Anomaly detection in equipment behavior</li>
            </ul>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Book className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Recommendation Systems</h3>
            <p className="text-gray-600 mb-4">
              Personalize user experiences with tailored product and content recommendations.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Collaborative filtering algorithms</li>
              <li>• Content-based recommendation</li>
              <li>• Real-time personalization</li>
              <li>• A/B testing framework for recommendations</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Industry Solutions</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Financial Services</h3>
            <ul className="space-y-2 text-blue-800">
              <li>• Credit risk assessment and scoring</li>
              <li>• Fraud detection and prevention</li>
              <li>• Customer segmentation and targeting</li>
              <li>• Portfolio optimization and management</li>
              <li>• Algorithmic trading strategies</li>
            </ul>
          </div>

          <div className="p-6 bg-green-50 rounded-lg">
            <h3 className="text-lg font-medium text-green-900 mb-3">Healthcare</h3>
            <ul className="space-y-2 text-green-800">
              <li>• Disease prediction and risk assessment</li>
              <li>• Medical image analysis and diagnosis</li>
              <li>• Patient readmission prediction</li>
              <li>• Treatment effectiveness analysis</li>
              <li>• Healthcare resource optimization</li>
            </ul>
          </div>

          <div className="p-6 bg-purple-50 rounded-lg">
            <h3 className="text-lg font-medium text-purple-900 mb-3">Retail</h3>
            <ul className="space-y-2 text-purple-800">
              <li>• Demand forecasting and inventory management</li>
              <li>• Customer lifetime value prediction</li>
              <li>• Personalized marketing and recommendations</li>
              <li>• Price optimization strategies</li>
              <li>• Store layout and product placement analysis</li>
            </ul>
          </div>

          <div className="p-6 bg-amber-50 rounded-lg">
            <h3 className="text-lg font-medium text-amber-900 mb-3">Manufacturing</h3>
            <ul className="space-y-2 text-amber-800">
              <li>• Predictive maintenance and equipment monitoring</li>
              <li>• Quality control and defect detection</li>
              <li>• Supply chain optimization</li>
              <li>• Production planning and scheduling</li>
              <li>• Energy consumption optimization</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Documentation;