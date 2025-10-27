import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Database, 
  Sparkles, 
  Brain, 
  Zap, 
  Activity, 
  MessageSquare, 
  BarChart2, 
  Upload, 
  Settings, 
  Play,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  Shield,
  Target,
  Layers,
  GitBranch,
  Package,
  Cpu,
  Monitor,
  AlertTriangle,
  LineChart
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

// Impressive hardcoded demo data for investor presentations
const DEMO_DATASETS = [
  {
    id: 'customer-dataset',
    name: 'Customer Analytics Dataset',
    description: 'Customer behavior and purchase history',
    rows: 2500000, // Increased for investor appeal
    columns: 78, // More comprehensive dataset
    size: '1.2 GB', // Enterprise-scale data
    quality: 97, // Higher quality score
    lastModified: '15 minutes ago',
    status: 'active',
    preview: {
      columns: ['customer_id', 'age', 'income', 'purchase_amount', 'category', 'satisfaction_score'],
      data: [
        { customer_id: 'C001', age: 34, income: 75000, purchase_amount: 299.99, category: 'Electronics', satisfaction_score: 4.8 },
        { customer_id: 'C002', age: 28, income: 62000, purchase_amount: 149.99, category: 'Clothing', satisfaction_score: 4.2 },
        { customer_id: 'C003', age: 45, income: 95000, purchase_amount: 799.99, category: 'Home & Garden', satisfaction_score: 4.9 }
      ]
    }
  },
  {
    id: 'sales-dataset',
    name: 'Sales Performance Dataset',
    description: 'Global sales data across 47 countries and 12M+ transactions',
    rows: 12750000, // Massive enterprise scale
    columns: 156, // Comprehensive sales analytics
    size: '8.9 GB', // Big data scale
    quality: 99, // Near perfect quality
    lastModified: '5 minutes ago',
    status: 'active',
    preview: {
      columns: ['region', 'sales_rep', 'revenue', 'deals_closed', 'quarter', 'conversion_rate'],
      data: [
        { region: 'North America', sales_rep: 'John Smith', revenue: 47500000, deals_closed: 1247, quarter: 'Q4', conversion_rate: 0.34 },
        { region: 'Europe', sales_rep: 'Marie Dubois', revenue: 32800000, deals_closed: 892, quarter: 'Q4', conversion_rate: 0.31 },
        { region: 'Asia Pacific', sales_rep: 'Yuki Tanaka', revenue: 65200000, deals_closed: 1456, quarter: 'Q4', conversion_rate: 0.42 }
      ]
    }
  },
  {
    id: 'marketing-dataset',
    name: 'Omnichannel Marketing Intelligence',
    description: 'Real-time campaign data across 25+ channels, 50M+ touchpoints',
    rows: 50000000, // Massive scale for big enterprise appeal
    columns: 245, // Comprehensive marketing analytics
    size: '15.7 GB', // Big data enterprise scale
    quality: 96, // High quality for complex data
    lastModified: '2 minutes ago',
    status: 'active', // Changed from processing to active
    preview: {
      columns: ['campaign_id', 'channel', 'impressions', 'clicks', 'conversions', 'cost_per_click'],
      data: [
        { campaign_id: 'FB_Q4_001', channel: 'Facebook', impressions: 125000000, clicks: 4750000, conversions: 387000, cost_per_click: 0.89 },
        { campaign_id: 'GG_Q4_002', channel: 'Google Ads', impressions: 89000000, clicks: 3850000, conversions: 425000, cost_per_click: 1.12 },
        { campaign_id: 'LI_Q4_003', channel: 'LinkedIn', impressions: 45000000, clicks: 2100000, conversions: 156000, cost_per_click: 2.45 }
      ]
    }
  }
];

const DEMO_MODELS = [
  {
    id: 'customer-churn-model',
    name: 'Enterprise Churn Prediction AI',
    type: 'Multi-Class Classification',
    algorithm: 'Advanced Ensemble (XGBoost + Neural Networks)',
    status: 'deployed',
    accuracy: 0.967, // Industry-leading accuracy
    precision: 0.952,
    recall: 0.961,
    f1Score: 0.956,
    trainingTime: '4 minutes', // Faster training shows efficiency
    createdAt: '2 days ago',
    predictions: 12750000, // Massive enterprise scale
    features: ['behavioral_patterns', 'engagement_metrics', 'transaction_history', 'predictive_indicators', 'satisfaction_trends']
  },
  {
    id: 'sales-forecasting-model',
    name: 'Global Revenue Intelligence',
    type: 'Time Series + Regression',
    algorithm: 'Transformer-based Deep Learning',
    status: 'deployed', // Changed from training to deployed
    accuracy: 0.943, // Very high accuracy for sales forecasting
    precision: 0.931,
    recall: 0.948,
    f1Score: 0.939,
    trainingTime: '6 minutes', // Fast training on large data
    createdAt: '12 hours ago',
    predictions: 8950000, // High volume production use
    features: ['market_dynamics', 'seasonal_patterns', 'economic_indicators', 'competitive_landscape', 'customer_segmentation']
  },
  {
    id: 'recommendation-model',
    name: 'Personalized AI Recommendation Engine',
    type: 'Deep Collaborative Filtering + Content-Based',
    algorithm: 'Advanced Transformer Architecture',
    status: 'deployed', // All models deployed for investor appeal
    accuracy: 0.934, // Higher accuracy
    precision: 0.925,
    recall: 0.941,
    f1Score: 0.933,
    trainingTime: '18 minutes', // Reasonable for complex model
    createdAt: '6 hours ago',
    predictions: 45600000, // Massive scale real-time recommendations
    features: ['user_embeddings', 'item_features', 'contextual_signals', 'behavioral_sequences', 'real_time_interactions']
  },
  {
    id: 'fraud-detection-model',
    name: 'Real-Time Fraud Detection AI',
    type: 'Anomaly Detection + Classification',
    algorithm: 'Hybrid Neural Architecture',
    status: 'deployed',
    accuracy: 0.987, // Critical for fraud detection
    precision: 0.978,
    recall: 0.983,
    f1Score: 0.980,
    trainingTime: '8 minutes',
    createdAt: '3 days ago',
    predictions: 127000000, // High-frequency financial transactions
    features: ['transaction_patterns', 'device_fingerprinting', 'geolocation_analysis', 'behavioral_biometrics', 'network_analysis']
  },
  {
    id: 'price-optimization-model',
    name: 'Dynamic Price Optimization Engine',
    type: 'Reinforcement Learning + Regression',
    algorithm: 'Multi-Agent Deep Q-Network',
    status: 'deployed',
    accuracy: 0.921, // Strong pricing accuracy
    precision: 0.908,
    recall: 0.932,
    f1Score: 0.920,
    trainingTime: '15 minutes',
    createdAt: '1 day ago',
    predictions: 23400000, // High-volume pricing decisions
    features: ['demand_elasticity', 'competitor_pricing', 'inventory_levels', 'market_conditions', 'customer_sensitivity']
  }
];

const DEMO_CHAT_CONVERSATIONS = [
  {
    id: 1,
    question: "What's the average customer satisfaction score by age group?",
    answer: "Based on your Customer Analytics Dataset:\n\n• Ages 18-25: 4.2/5.0 avg satisfaction\n• Ages 26-35: 4.6/5.0 avg satisfaction  \n• Ages 36-45: 4.8/5.0 avg satisfaction\n• Ages 46+: 4.9/5.0 avg satisfaction\n\nOlder customers show higher satisfaction scores, likely due to clearer expectations and brand loyalty.",
    chart: "age_satisfaction_chart"
  },
  {
    id: 2,
    question: "Which marketing channels have the best ROI?",
    answer: "From your Marketing Campaign Dataset:\n\n1. **LinkedIn**: $4.23 ROI per $1 spent\n2. **Google Ads**: $3.87 ROI per $1 spent\n3. **Facebook**: $2.91 ROI per $1 spent\n\nLinkedB2B campaigns show highest conversion rates despite higher CPC.",
    chart: "roi_comparison_chart"
  }
];

interface TourStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  icon: React.ComponentType<any>;
}

const ProductTourDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(DEMO_DATASETS[0]);
  const [selectedModel, setSelectedModel] = useState(DEMO_MODELS[0]);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // Auto-advance tour steps
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % tourSteps.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { type: 'user', content: chatInput };
    setChatMessages([...chatMessages, userMessage]);
    
    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on your data, I found 3 key insights about customer behavior patterns...",
        "Let me analyze your sales data. I see a 23% increase in Q4 performance across all regions...",
        "Your conversion rates show strong seasonality. Here's what I recommend for optimization..."
      ];
      const aiMessage = { 
        type: 'ai', 
        content: responses[Math.floor(Math.random() * responses.length)]
      };
      setChatMessages(prev => [...prev, aiMessage]);
    }, 1500);
    
    setChatInput('');
  };

  const tourSteps: TourStep[] = [
    {
      id: 'dashboard',
      title: 'Intelligent Dashboard',
      description: 'Get a complete overview of your ML operations with real-time insights',
      icon: BarChart2,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Datasets</p>
                  <p className="text-3xl font-bold text-blue-600">{DEMO_DATASETS.length}</p>
                </div>
                <Database className="w-10 h-10 text-blue-500" />
              </div>
              <p className="text-sm text-green-600 mt-2">↗ +47 enterprise datasets this month</p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Models</p>
                  <p className="text-3xl font-bold text-purple-600">{DEMO_MODELS.length}</p>
                </div>
                <Brain className="w-10 h-10 text-purple-500" />
              </div>
              <p className="text-sm text-green-600 mt-2">{DEMO_MODELS.length} deployed in production</p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Daily Predictions</p>
                  <p className="text-3xl font-bold text-green-600">2.4B</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500" />
              </div>
              <p className="text-sm text-green-600 mt-2">Enterprise-scale real-time AI</p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Accuracy</p>
                  <p className="text-3xl font-bold text-indigo-600">96.7%</p>
                </div>
                <Target className="w-10 h-10 text-indigo-500" />
              </div>
              <p className="text-sm text-green-600 mt-2">Industry-leading AI performance</p>
            </Card>
          </div>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">ML Workflow Progress</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Enterprise Data Pipeline</p>
                  <p className="text-sm text-gray-600">127 datasets • 25.6GB processed • 99.7% quality</p>
                </div>
                <span className="text-green-600 font-medium">Production Ready</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Advanced Feature Engineering</p>
                  <p className="text-sm text-gray-600">1,247 features • Auto-generated insights • Real-time optimization</p>
                </div>
                <span className="text-green-600 font-medium">Complete</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">AI Model Deployment</p>
                  <p className="text-sm text-gray-600">{DEMO_MODELS.length} models • 96.7% avg accuracy • 2.4B daily predictions</p>
                </div>
                <span className="text-green-600 font-medium">Production Scale</span>
              </div>
            </div>
          </Card>
        </div>
      )
    },
    
    {
      id: 'data-management',
      title: 'Smart Data Management',
      description: 'Upload, validate, and manage datasets with AI-powered quality checks',
      icon: Database,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center text-gray-900">
                <Upload className="w-5 h-5 mr-2" />
                Data Sources
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-gray-900" />
                    </div>
                    <span className="font-medium text-gray-900">CSV Upload</span>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-gray-900" />
                    </div>
                    <span className="font-medium text-gray-900">API Connections</span>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-gray-900" />
                    </div>
                    <span className="font-medium text-gray-900">Database Sync</span>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Data Quality Score
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completeness</span>
                    <span className="text-sm text-gray-600">96%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '96%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Consistency</span>
                    <span className="text-sm text-gray-600">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '94%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Accuracy</span>
                    <span className="text-sm text-gray-600">98%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{width: '98%'}}></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  ✓ Dataset ready for ML training
                </p>
              </div>
            </Card>
          </div>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Available Datasets</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DEMO_DATASETS.map((dataset) => (
                <div 
                  key={dataset.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedDataset.id === dataset.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedDataset(dataset)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{dataset.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      dataset.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {dataset.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{dataset.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                    <div>Rows: {dataset.rows.toLocaleString()}</div>
                    <div>Cols: {dataset.columns}</div>
                    <div>Size: {dataset.size}</div>
                    <div>Quality: {dataset.quality}%</div>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedDataset && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2 text-gray-900">Data Preview - {selectedDataset.name}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        {selectedDataset.preview.columns.map((col) => (
                          <th key={col} className="px-3 py-2 text-left font-medium text-gray-900">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDataset.preview.data.map((row, idx) => (
                        <tr key={idx} className="border-t">
                          {selectedDataset.preview.columns.map((col) => (
                            <td key={col} className="px-3 py-2 text-gray-600">{(row as any)[col]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </div>
      )
    },
    
    {
      id: 'ai-chat',
      title: 'AI Data Assistant',
      description: 'Ask questions about your data in natural language and get instant insights',
      icon: MessageSquare,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Chat with Your Data
              </h3>
              
              <div className="h-64 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4">
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-700 mt-16">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Ask me anything about your datasets!</p>
                  </div>
                )}
                
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`mb-4 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-3 rounded-lg max-w-xs ${
                      msg.type === 'user' 
                        ? 'bg-blue-500 text-gray-900' 
                        : 'bg-white border border-gray-200'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              
              <form onSubmit={handleChatSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about your data..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-300"
                />
                <Button type="submit" variant="primary">
                  Send
                </Button>
              </form>
              
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Try asking:</p>
                <div className="space-y-1">
                  {[
                    "What's the average purchase amount by age group?",
                    "Show me sales trends by region",
                    "Which marketing channels perform best?"
                  ].map((question) => (
                    <button
                      key={question}
                      onClick={() => setChatInput(question)}
                      className="block text-left text-sm text-blue-600 hover:text-blue-800"
                    >
                      "{question}"
                    </button>
                  ))}
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Insights</h3>
              <div className="space-y-4">
                {DEMO_CHAT_CONVERSATIONS.map((conv) => (
                  <div key={conv.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-900">Q: {conv.question}</p>
                    </div>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {conv.answer}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">AI Capabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <BarChart2 className="w-8 h-8 text-blue-600 mb-2" />
                <h4 className="font-medium mb-1">Smart Analytics</h4>
                <p className="text-sm text-gray-600">Automatically discover patterns and correlations in your data</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <Brain className="w-8 h-8 text-purple-600 mb-2" />
                <h4 className="font-medium mb-1">ML Recommendations</h4>
                <p className="text-sm text-gray-600">Get suggestions for feature engineering and model selection</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <Sparkles className="w-8 h-8 text-green-600 mb-2" />
                <h4 className="font-medium mb-1">Auto Insights</h4>
                <p className="text-sm text-gray-600">Receive proactive insights and anomaly detection</p>
              </div>
            </div>
          </Card>
        </div>
      )
    },
    
    {
      id: 'feature-engineering',
      title: 'Feature Engineering Studio',
      description: 'Transform and prepare your data with advanced feature engineering tools',
      icon: Sparkles,
      component: (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Feature Transformation Pipeline
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Available Transformations</h4>
                <div className="space-y-2">
                  {[
                    { name: 'Normalization', description: 'Scale features to 0-1 range', applied: true },
                    { name: 'One-Hot Encoding', description: 'Convert categorical to binary', applied: true },
                    { name: 'Feature Interaction', description: 'Create feature combinations', applied: false },
                    { name: 'Time-based Features', description: 'Extract temporal patterns', applied: true },
                    { name: 'Polynomial Features', description: 'Generate polynomial combinations', applied: false }
                  ].map((transform) => (
                    <div 
                      key={transform.name} 
                      className={`p-3 rounded-lg border-2 ${
                        transform.applied 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{transform.name}</p>
                          <p className="text-xs text-gray-600">{transform.description}</p>
                        </div>
                        {transform.applied && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Feature Impact Analysis</h4>
                <div className="space-y-3">
                  {[
                    { name: 'customer_age_normalized', importance: 0.87, change: '+12%' },
                    { name: 'purchase_frequency_log', importance: 0.92, change: '+8%' },
                    { name: 'satisfaction_interaction', importance: 0.78, change: '+15%' },
                    { name: 'seasonal_patterns', importance: 0.84, change: '+6%' }
                  ].map((feature) => (
                    <div key={feature.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{feature.name}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{width: `${feature.importance * 100}%`}}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-green-600 font-medium ml-3">{feature.change}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Automated Feature Selection</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Correlation Analysis</h4>
                  <p className="text-sm text-blue-800">Removed 8 highly correlated features (&gt;0.95 correlation)</p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Variance Threshold</h4>
                  <p className="text-sm text-purple-800">Filtered out 3 low-variance features (&lt;0.01 variance)</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Feature Importance</h4>
                  <p className="text-sm text-green-800">Selected top 24 features based on Random Forest importance</p>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Final feature count: <span className="font-bold text-green-600">24 features</span>
                </p>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Data Preprocessing</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Missing Value Imputation</span>
                  </div>
                  <span className="text-sm text-gray-600">2.3% filled</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Outlier Detection</span>
                  </div>
                  <span className="text-sm text-gray-600">0.8% flagged</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Data Type Validation</span>
                  </div>
                  <span className="text-sm text-gray-600">100% valid</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Duplicate Removal</span>
                  </div>
                  <span className="text-sm text-gray-600">45 removed</span>
                </div>
              </div>
              
              <Button variant="primary" className="w-full mt-4">
                Apply Transformations
              </Button>
            </Card>
          </div>
        </div>
      )
    },
    
    {
      id: 'model-training',
      title: 'AutoML Training',
      description: 'Train state-of-the-art ML models with automated hyperparameter optimization',
      icon: Brain,
      component: (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              Model Training Dashboard
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {DEMO_MODELS.map((model) => (
                <div 
                  key={model.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedModel.id === model.id 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                  onClick={() => setSelectedModel(model)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{model.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      model.status === 'deployed' 
                        ? 'bg-green-100 text-green-800'
                        : model.status === 'training'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {model.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>Type: {model.type}</div>
                    <div>Algorithm: {model.algorithm}</div>
                    <div>Accuracy: {(model.accuracy * 100).toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedModel && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-3">{selectedModel.name} - Detailed Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{(selectedModel.accuracy * 100).toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Accuracy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{(selectedModel.precision * 100).toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Precision</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{(selectedModel.recall * 100).toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Recall</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600">{(selectedModel.f1Score * 100).toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">F1 Score</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Training Details</h5>
                    <div className="space-y-1 text-sm">
                      <div>Training Time: {selectedModel.trainingTime}</div>
                      <div>Created: {selectedModel.createdAt}</div>
                      <div>Predictions Made: {selectedModel.predictions.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Key Features</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedModel.features.map((feature) => (
                        <span 
                          key={feature}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Algorithm Comparison</h3>
              <div className="space-y-4">
                {[
                  { name: 'XGBoost', accuracy: 92.4, speed: 'Fast', complexity: 'Medium' },
                  { name: 'Random Forest', accuracy: 89.1, speed: 'Medium', complexity: 'Low' },
                  { name: 'Neural Network', accuracy: 94.7, speed: 'Slow', complexity: 'High' },
                  { name: 'SVM', accuracy: 87.2, speed: 'Fast', complexity: 'Medium' }
                ].map((algo) => (
                  <div key={algo.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{algo.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>Speed: {algo.speed}</span>
                        <span>Complexity: {algo.complexity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{algo.accuracy}%</p>
                      <p className="text-sm text-gray-600">Accuracy</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Training Progress</h3>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">Sales Forecasting Model</span>
                    <span className="text-sm text-yellow-700">Training...</span>
                  </div>
                  <div className="w-full bg-yellow-200 rounded-full h-2 mb-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{width: '73%'}}></div>
                  </div>
                  <div className="flex justify-between text-sm text-yellow-700">
                    <span>Epoch 73/100</span>
                    <span>ETA: 3m 42s</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Data Validation</span>
                    </div>
                    <span className="text-sm text-green-600">Complete</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Feature Engineering</span>
                    </div>
                    <span className="text-sm text-green-600">Complete</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm">Model Training</span>
                    </div>
                    <span className="text-sm text-yellow-600">In Progress</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">Model Evaluation</span>
                    </div>
                    <span className="text-sm text-gray-400">Pending</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    },
    
    {
      id: 'deployment',
      title: 'Model Deployment',
      description: 'Deploy your models to production with one-click scaling and monitoring',
      icon: Zap,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Global API Endpoints</h3>
              <p className="text-3xl font-bold text-green-600 mb-1">{DEMO_MODELS.length}</p>
              <p className="text-sm text-gray-600">Production-ready models</p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Predictions/sec</h3>
              <p className="text-3xl font-bold text-blue-600 mb-1">47K</p>
              <p className="text-sm text-gray-600">Enterprise-scale traffic</p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Global Latency</h3>
              <p className="text-3xl font-bold text-purple-600 mb-1">8ms</p>
              <p className="text-sm text-gray-600">Edge-optimized response</p>
            </Card>
          </div>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Deployed Models</h3>
            <div className="space-y-4">
              {DEMO_MODELS.filter(m => m.status === 'deployed' || m.status === 'trained').map((model) => (
                <div key={model.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{model.name}</h4>
                      <p className="text-sm text-gray-600">{model.algorithm} • {model.type}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      model.status === 'deployed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {model.status}
                    </span>
                  </div>
                  
                  {model.status === 'deployed' && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Endpoint URL</p>
                          <p className="font-mono text-xs bg-white p-2 rounded border">
                            https://api.dataflow.ai/v1/predict/{model.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Requests Today</p>
                          <p className="font-bold text-lg">{model.predictions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Uptime</p>
                          <p className="font-bold text-lg text-green-600">99.97%</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    {model.status === 'trained' && (
                      <Button variant="primary" size="sm">
                        Deploy to Production
                      </Button>
                    )}
                    {model.status === 'deployed' && (
                      <>
                        <Button variant="outline" size="sm">
                          View Monitoring
                        </Button>
                        <Button variant="outline" size="sm">
                          Scale Resources
                        </Button>
                        <Button variant="outline" size="sm">
                          API Documentation
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Deployment Options</h3>
              <div className="space-y-3">
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-center space-x-3 mb-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">REST API</span>
                    <span className="px-2 py-1 bg-blue-600 text-gray-900 text-xs rounded">Recommended</span>
                  </div>
                  <p className="text-sm text-blue-800">High-performance REST endpoints with auto-scaling</p>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <Database className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Batch Processing</span>
                  </div>
                  <p className="text-sm text-gray-600">Process large datasets on schedule</p>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <Activity className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Real-time Streaming</span>
                  </div>
                  <p className="text-sm text-gray-600">Process data streams in real-time</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Infrastructure</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Auto-scaling</span>
                  </div>
                  <span className="text-sm text-green-600">Active</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Load Balancer</span>
                  </div>
                  <span className="text-sm text-green-600">Healthy</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">CDN Cache</span>
                  </div>
                  <span className="text-sm text-green-600">Optimized</span>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1">Current Usage</h4>
                  <div className="text-sm text-blue-800">
                    <div>CPU: 45% avg</div>
                    <div>Memory: 62% avg</div>
                    <div>Instances: 3 active</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    },
    
    {
      id: 'monitoring',
      title: 'Real-time Monitoring',
      description: 'Monitor model performance, detect drift, and receive intelligent alerts',
      icon: Activity,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">99.99%</p>
              <p className="text-sm text-gray-600">Enterprise SLA Uptime</p>
            </Card>
            
            <Card className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">96.7%</p>
              <p className="text-sm text-gray-600">Platform-wide Accuracy</p>
            </Card>
            
            <Card className="p-4 text-center">
              <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">8ms</p>
              <p className="text-sm text-gray-600">Global Edge Latency</p>
            </Card>
            
            <Card className="p-4 text-center">
              <BarChart2 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">47K</p>
              <p className="text-sm text-gray-600">Predictions/sec</p>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Model Performance Trends</h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">Enterprise Churn Prediction</span>
                    <span className="text-green-600 text-sm">↗ +3.2%</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Accuracy: 94.1% → 96.7%</div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '96.7%'}}></div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">Global Revenue Intelligence</span>
                    <span className="text-green-600 text-sm">↗ +2.8%</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Accuracy: 91.2% → 94.3%</div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '94.3%'}}></div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">AI Recommendation Engine</span>
                    <span className="text-green-600 text-sm">↗ +4.1%</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Accuracy: 89.8% → 93.4%</div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '93.4%'}}></div>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Data Drift Detection</h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-900">Feature Distribution</span>
                    </div>
                    <span className="text-green-600 text-sm">Stable</span>
                  </div>
                  <p className="text-sm text-green-800">All features within expected ranges</p>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-gray-900">Age Distribution</span>
                    </div>
                    <span className="text-yellow-600 text-sm">Minor Drift</span>
                  </div>
                  <p className="text-sm text-yellow-800">5% shift in customer age distribution detected</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">Target Variable</span>
                    </div>
                    <span className="text-blue-600 text-sm">Normal</span>
                  </div>
                  <p className="text-sm text-blue-800">Prediction targets remain consistent</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Automatic Actions</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>✓ Triggered model retraining for age drift</div>
                  <div>✓ Updated feature importance weights</div>
                  <div>✓ Sent alert to data team</div>
                </div>
              </div>
            </Card>
          </div>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Alerts & Actions</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900">High Latency Detected</p>
                  <p className="text-sm text-red-800">Customer Churn API response time exceeded 100ms threshold</p>
                  <p className="text-xs text-red-700 mt-1">2 hours ago • Auto-scaled to 5 instances</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-900">Model Retraining Scheduled</p>
                  <p className="text-sm text-yellow-800">Data drift detected in Sales Forecasting model features</p>
                  <p className="text-xs text-yellow-700 mt-1">4 hours ago • Retraining initiated automatically</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">Performance Improvement</p>
                  <p className="text-sm text-green-800">Recommendation Engine accuracy improved to 90.8%</p>
                  <p className="text-xs text-green-700 mt-1">1 day ago • New model version deployed</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )
    }
  ];

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % tourSteps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + tourSteps.length) % tourSteps.length);
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const currentTourStep = tourSteps[currentStep];
  const StepIcon = currentTourStep.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating Signup CTA - Sticky */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href="/signin"
          className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-gray-900 font-semibold rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transform transition-all duration-300"
        >
          <Zap className="w-5 h-5" />
          Start Free Trial
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <StepIcon className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DataFlow Hub AI</h1>
                <p className="text-sm text-gray-600">Interactive Product Tour</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Step {currentStep + 1} of {tourSteps.length}
              </div>
              <Button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                variant={isAutoPlaying ? "primary" : "outline"}
                size="sm"
              >
                <Play className="w-4 h-4 mr-1" />
                {isAutoPlaying ? 'Stop' : 'Auto Play'}
              </Button>
              
              {/* Sign Up Button */}
              <a
                href="/signin"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-gray-900 font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Zap className="w-4 h-4" />
                Sign Up Free
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 py-3 overflow-x-auto">
            {tourSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  index === currentStep
                    ? 'bg-indigo-600 text-gray-900'
                    : index < currentStep
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step.title
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Step Header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <StepIcon className="w-8 h-8 text-gray-900" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentTourStep.title}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{currentTourStep.description}</p>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {currentTourStep.component}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={prevStep}
            variant="outline"
            className="flex items-center"
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="flex space-x-2">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-indigo-600'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={nextStep}
            variant="primary"
            className="flex items-center"
          >
            {currentStep === tourSteps.length - 1 ? 'Start Over' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Sign Up CTA Section */}
        <div className="mt-16 mb-16">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center text-gray-900 shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 rounded-full text-sm font-semibold backdrop-blur-sm">
                  <CheckCircle className="w-4 h-4" />
                  Tour Complete
                </span>
              </div>
              
              <h2 className="text-4xl font-bold mb-4">
                Ready to Transform Your Data?
              </h2>
              <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto leading-relaxed">
                You've just seen our enterprise-scale platform with <strong>96.7% AI accuracy</strong>, 
                <strong> 2.4B daily predictions</strong>, and <strong>8ms global latency</strong>. 
                Start your AI journey today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <a
                  href="/signin"
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-indigo-600 font-bold text-lg rounded-xl hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Zap className="w-6 h-6" />
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                
                <a
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white border-opacity-30 text-gray-900 font-medium rounded-lg hover:border-opacity-50 hover:bg-white hover:bg-opacity-10 transition-all backdrop-blur-sm"
                >
                  View Pricing
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="flex items-center justify-center gap-2 bg-white bg-opacity-10 rounded-lg p-3 backdrop-blur-sm">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center justify-center gap-2 bg-white bg-opacity-10 rounded-lg p-3 backdrop-blur-sm">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  <span>Enterprise security</span>
                </div>
                <div className="flex items-center justify-center gap-2 bg-white bg-opacity-10 rounded-lg p-3 backdrop-blur-sm">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  <span>24/7 expert support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Feature Highlights */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Why DataFlow Hub AI?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2">AI-Powered Automation</h4>
              <p className="text-gray-600">Automate complex ML workflows with intelligent feature engineering and model selection</p>
            </div>
            
            <div className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Production Ready</h4>
              <p className="text-gray-600">Deploy models instantly with auto-scaling infrastructure and monitoring</p>
            </div>
            
            <div className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Natural Language</h4>
              <p className="text-gray-600">Query your data and train models using simple natural language commands</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTourDemo;
