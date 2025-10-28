import React from 'react';
import { Book, Code, FileText, PieChart, Rocket, Zap, ArrowRight } from 'lucide-react';
import Card from '../components/common/Card';
import PitchDeck from '../components/marketing/PitchDeck';
import { useState } from 'react';
import Button from '../components/common/Button';

const Documentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guides' | 'api' | 'help'>('guides');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section with High Contrast */}
      <div className="bg-white border-b-2 border-indigo-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <Book className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Documentation & Guides</h1>
          </div>
          <p className="text-lg text-gray-700 ml-11">
            Everything you need to master DataFlowHub AI
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Tab Navigation with Better Contrast */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="flex gap-0 border-b-2 border-gray-200">
            {[
              { id: 'guides', label: 'Learning Guides', icon: Book },
              { id: 'api', label: 'API Reference', icon: Code },
              { id: 'help', label: 'Help Center', icon: Zap }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-6 py-4 font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-b-4 border-indigo-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* GUIDES TAB */}
          {activeTab === 'guides' && (
            <div className="p-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: Book,
                    color: 'indigo',
                    title: 'Getting Started',
                    description: 'Learn the basics of our AutoML platform and how to train your first model.',
                    items: ['Platform Overview', 'Quick Start Guide', 'Basic Concepts']
                  },
                  {
                    icon: Code,
                    color: 'emerald',
                    title: 'API Reference',
                    description: 'Detailed documentation for our REST API endpoints and SDKs.',
                    items: ['Authentication', 'Endpoints', 'Code Examples']
                  },
                  {
                    icon: PieChart,
                    color: 'purple',
                    title: 'Model Training',
                    description: 'Learn about model training, optimization, and best practices.',
                    items: ['Training Process', 'Model Types', 'Hyperparameters']
                  },
                  {
                    icon: Rocket,
                    color: 'amber',
                    title: 'Deployment',
                    description: 'Guide to deploying and managing models in production.',
                    items: ['Deployment Options', 'Scaling', 'Monitoring']
                  },
                  {
                    icon: FileText,
                    color: 'rose',
                    title: 'Tutorials',
                    description: 'Step-by-step guides and examples for common use cases.',
                    items: ['Classification', 'Regression', 'Time Series']
                  },
                  {
                    icon: Zap,
                    color: 'blue',
                    title: 'Integration',
                    description: 'Learn how to integrate our platform with your existing systems.',
                    items: ['Data Sources', 'Webhooks', 'Security']
                  }
                ].map((guide, idx) => (
                  <div key={idx} className="p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-indigo-400 shadow-sm hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 bg-${guide.color}-100 rounded-lg`}>
                        <guide.icon className={`w-6 h-6 text-${guide.color}-600`} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{guide.title}</h3>
                    </div>
                    <p className="text-gray-700 font-medium mb-4 leading-relaxed">
                      {guide.description}
                    </p>
                    <ul className="space-y-2">
                      {guide.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-700">
                          <ArrowRight className="w-4 h-4 text-indigo-600" />
                          <span className="font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API TAB */}
          {activeTab === 'api' && (
            <div className="p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">REST API Documentation</h2>
                <p className="text-lg text-gray-700 mb-6">
                  Our RESTful API allows you to programmatically access and control all aspects of DataFlowHub AI.
                </p>
              </div>

              {/* Authentication Section */}
              <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-indigo-900 mb-3">🔐 Authentication</h3>
                <p className="text-indigo-800 font-medium mb-3">All API requests require authentication using an API key:</p>
                <pre className="bg-gray-800 text-green-300 p-4 rounded-lg font-mono text-sm overflow-x-auto">
Authorization: Bearer YOUR_API_KEY
                </pre>
              </div>

              {/* Endpoints */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">📍 Key Endpoints</h3>
                <div className="space-y-4">
                  {[
                    { method: 'GET', endpoint: '/v1/models', desc: 'List all models', color: 'green' },
                    { method: 'POST', endpoint: '/v1/models/predict', desc: 'Make predictions', color: 'blue' },
                    { method: 'POST', endpoint: '/v1/datasets', desc: 'Upload dataset', color: 'purple' }
                  ].map((ep, idx) => (
                    <div key={idx} className="border-2 border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="bg-gray-50 px-6 py-3 border-b-2 border-gray-200 flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-bold rounded-md bg-${ep.color}-100 text-${ep.color}-800`}>
                          {ep.method}
                        </span>
                        <span className="font-mono font-bold text-gray-900">{ep.endpoint}</span>
                      </div>
                      <div className="p-6">
                        <p className="text-gray-700 font-medium">{ep.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Examples */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">💻 Code Examples</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  {[
                    { lang: 'Python', code: `import requests\nAPI_KEY = "your_api_key"\nresponse = requests.get(\n  "https://api.dataflowhub.ai/v1/models",\n  headers={"Authorization": f"Bearer {API_KEY}"}\n)\nprint(response.json())` },
                    { lang: 'JavaScript', code: `const API_KEY = "your_api_key";\nfetch("https://api.dataflowhub.ai/v1/models", {\n  headers: {\n    "Authorization": \`Bearer \${API_KEY}\`\n  }\n})\n.then(r => r.json())\n.then(data => console.log(data));` }
                  ].map((ex, idx) => (
                    <div key={idx} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-800 px-4 py-2">
                        <p className="font-bold text-white">{ex.lang}</p>
                      </div>
                      <pre className="bg-gray-900 text-green-300 p-4 font-mono text-sm overflow-x-auto">
{ex.code}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* HELP CENTER TAB */}
          {activeTab === 'help' && (
            <div className="p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">❓ Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {[
                    {
                      q: 'How do I upload a dataset?',
                      a: 'Navigate to Data Management, click "Upload Dataset", drag & drop your file. Supported: CSV, Excel, JSON. Your data will be automatically analyzed.'
                    },
                    {
                      q: 'How do I train a model?',
                      a: 'Go to Model Training, select a dataset, choose your target variable, configure settings, and click "Start Training". The platform will find the best model.'
                    },
                    {
                      q: 'How do I deploy a model?',
                      a: 'After training, go to Deployment, select your model, configure settings, and click "Deploy". You\'ll get an API endpoint URL immediately.'
                    },
                    {
                      q: 'How do I monitor deployed models?',
                      a: 'Use the Model Monitoring page to track performance metrics, detect drift, set alerts, and retrain models as needed.'
                    }
                  ].map((faq, idx) => (
                    <div key={idx} className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b-2 border-gray-200">
                        <p className="font-bold text-lg text-gray-900">{faq.q}</p>
                      </div>
                      <div className="px-6 py-4">
                        <p className="text-gray-700 font-medium leading-relaxed">{faq.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Support CTA */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-white text-center">
                <h3 className="text-2xl font-bold mb-3">Still need help?</h3>
                <p className="text-lg mb-6 text-indigo-100">
                  Our support team is available 24/7 to assist you
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition">
                    Contact Support
                  </button>
                  <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white hover:text-indigo-600 transition">
                    Schedule Demo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documentation;