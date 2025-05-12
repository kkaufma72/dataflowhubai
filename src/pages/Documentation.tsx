import React from 'react';
import { Book, Code, FileText, PieChart, Rocket, Zap } from 'lucide-react';
import Card from '../components/common/Card';
import PitchDeck from '../components/marketing/PitchDeck';

const Documentation: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Learn how to use and integrate with our AutoML platform
        </p>
      </div>

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