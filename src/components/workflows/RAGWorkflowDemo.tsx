// RAG Workflow Demo - Complete example implementation
// Showcases all RAG features integrated with the existing DataFlowHub AI platform

import React, { useState, useEffect } from 'react';
import { Brain, Database, Search, MessageCircle, Book, Lightbulb, ArrowRight, CheckCircle, Settings, Zap } from 'lucide-react';
import { Dataset } from '../../types';
import { UserProfile } from '../../utils/personalizedPrompts';
import { useAuth } from '../auth/AuthProvider';
import useRAGSystem from '../../hooks/useRAGSystem';
import KnowledgeSearchPanel from '../ai/KnowledgeSearchPanel';
import EnhancedRAGChat from '../ai/EnhancedRAGChat';

interface RAGWorkflowDemoProps {
  className?: string;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  active: boolean;
}

export const RAGWorkflowDemo: React.FC<RAGWorkflowDemoProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const ragSystem = useRAGSystem();
  
  // Demo state
  const [activeTab, setActiveTab] = useState<'overview' | 'search' | 'chat' | 'workflow'>('overview');
  const [demoDataset, setDemoDataset] = useState<Dataset | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    {
      id: 'initialize',
      title: 'Initialize RAG System',
      description: 'Set up embedding service and document store',
      icon: Settings,
      completed: false,
      active: false
    },
    {
      id: 'index',
      title: 'Index Knowledge Base',
      description: 'Index datasets, analyses, and documentation',
      icon: Database,
      completed: false,
      active: false
    },
    {
      id: 'search',
      title: 'Search & Retrieve',
      description: 'Search knowledge base with semantic similarity',
      icon: Search,
      completed: false,
      active: false
    },
    {
      id: 'generate',
      title: 'Generate Enhanced Response',
      description: 'Use retrieved context to generate informed answers',
      icon: Brain,
      completed: false,
      active: false
    }
  ]);

  // Create demo dataset
  useEffect(() => {
    const demo: Dataset = {
      id: 'demo-rag-dataset',
      name: 'Customer Analytics Dataset',
      description: 'Sample customer data for RAG workflow demonstration',
      rows: 1000,
      columns: 8,
      dateUploaded: new Date().toISOString(),
      fileType: 'csv',
      fileSize: '500 KB',
      projectId: 'demo-project',
      preview_data: {
        columns: ['customer_id', 'age', 'income', 'purchase_amount', 'category', 'region', 'satisfaction', 'churn_risk'],
        rows: [
          ['C001', '34', '75000', '1200', 'Electronics', 'North', '4.2', 'false'],
          ['C002', '28', '45000', '800', 'Clothing', 'South', '3.8', 'true'],
          ['C003', '45', '95000', '2100', 'Home', 'East', '4.7', 'false']
        ]
      }
    };
    setDemoDataset(demo);

    // Create demo user profile
    const profile: UserProfile = {
      company: 'DataFlow Analytics Inc.',
      job_title: 'Data Scientist',
      use_case: 'customer-insights'
    };
    setUserProfile(profile);
  }, [user]);

  // Update workflow steps based on RAG system state
  useEffect(() => {
    setWorkflowSteps(prev => prev.map(step => {
      if (step.id === 'initialize') {
        return {
          ...step,
          completed: ragSystem.initialized,
          active: ragSystem.loading
        };
      }
      if (step.id === 'index' && ragSystem.initialized) {
        return {
          ...step,
          completed: true,
          active: false
        };
      }
      return step;
    }));
  }, [ragSystem.initialized, ragSystem.loading]);

  // Auto-index demo dataset when RAG system is ready
  useEffect(() => {
    const indexDemoDataset = async () => {
      if (ragSystem.initialized && demoDataset && !workflowSteps.find(s => s.id === 'index')?.completed) {
        try {
          await ragSystem.indexDataset(demoDataset);
          setWorkflowSteps(prev => prev.map(step => 
            step.id === 'index' ? { ...step, completed: true } : step
          ));
        } catch (error) {
          console.error('Failed to index demo dataset:', error);
        }
      }
    };

    indexDemoDataset();
  }, [ragSystem.initialized, demoDataset, ragSystem.indexDataset, workflowSteps]);

  const handleSearchDemo = () => {
    setWorkflowSteps(prev => prev.map(step => 
      step.id === 'search' ? { ...step, completed: true } : step
    ));
  };

  const handleChatDemo = () => {
    setWorkflowSteps(prev => prev.map(step => 
      step.id === 'generate' ? { ...step, completed: true } : step
    ));
  };

  const features = [
    {
      icon: Brain,
      title: 'Intelligent Knowledge Retrieval',
      description: 'Semantic search across datasets, analyses, and documentation using OpenAI embeddings',
      benefits: ['Context-aware responses', 'Similarity-based matching', 'Multi-source integration']
    },
    {
      icon: Database,
      title: 'Auto-Indexing System',
      description: 'Automatically indexes uploaded datasets and analysis results for future retrieval',
      benefits: ['Zero-setup knowledge base', 'Continuous learning', 'Persistent memory']
    },
    {
      icon: MessageCircle,
      title: 'Enhanced AI Chat',
      description: 'AI conversations enriched with relevant context from your knowledge base',
      benefits: ['Better answer quality', 'Source attribution', 'Suggested actions']
    },
    {
      icon: Search,
      title: 'Advanced Search Interface',
      description: 'Dedicated search panel with filtering, relevance scoring, and result categorization',
      benefits: ['Find past analyses', 'Discover patterns', 'Explore relationships']
    }
  ];

  const useCases = [
    {
      title: 'Data Scientist',
      scenario: 'Find similar analyses across multiple projects',
      example: '"What customer segmentation approaches have I used before?"'
    },
    {
      title: 'Business Analyst',
      scenario: 'Get contextual insights for decision making',
      example: '"How does this revenue trend compare to historical patterns?"'
    },
    {
      title: 'Marketing Manager',
      scenario: 'Leverage past campaign data for new strategies',
      example: '"What marketing strategies worked best for similar demographics?"'
    },
    {
      title: 'Product Manager',
      scenario: 'Understand feature usage across user segments',
      example: '"Show me analyses related to user engagement metrics"'
    }
  ];

  if (!demoDataset || !userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Initializing RAG Workflow Demo...</span>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Brain className="h-12 w-12 text-blue-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-900">RAG Workflow Demo</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Experience Retrieval-Augmented Generation integrated with DataFlowHub AI. 
          Smart knowledge retrieval that remembers your data, analyses, and insights.
        </p>
      </div>

      {/* Status Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Zap className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm ${
            ragSystem.initialized ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {ragSystem.initialized ? 'Ready' : ragSystem.loading ? 'Initializing...' : 'Not Ready'}
          </div>
        </div>
        
        {ragSystem.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {ragSystem.error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex items-center">
                <div className={`p-2 rounded-full ${
                  step.completed ? 'bg-green-100 text-green-600' : 
                  step.active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.completed ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-600">{step.description}</p>
                </div>
                {index < workflowSteps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-300 ml-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Book },
            { id: 'search', label: 'Knowledge Search', icon: Search },
            { id: 'chat', label: 'Enhanced Chat', icon: MessageCircle },
            { id: 'workflow', label: 'Use Cases', icon: Lightbulb }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Features Grid */}
            <div>
              <h2 className="text-2xl font-bold text-purple-600 mb-6">Key Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-4">
                        <Icon className="h-8 w-8 text-blue-600 mr-3" />
                        <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                      </div>
                      <p className="text-gray-600 mb-4">{feature.description}</p>
                      <ul className="space-y-2">
                        {feature.benefits.map((benefit, bIndex) => (
                          <li key={bIndex} className="flex items-center text-sm text-gray-700">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Demo Dataset Info */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Dataset: {demoDataset.name}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Rows:</span>
                  <span className="ml-2 font-medium">{demoDataset.rows?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Columns:</span>
                  <span className="ml-2 font-medium">{demoDataset.columns}</span>
                </div>
                <div>
                  <span className="text-gray-600">Size:</span>
                  <span className="ml-2 font-medium">{demoDataset.fileSize}</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium">Customer Analytics</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            <h2 className="text-2xl font-bold text-purple-600 mb-6">Knowledge Search</h2>
            <div className="bg-white rounded-lg border border-gray-200">
              <KnowledgeSearchPanel
                onResultClick={(result) => {
                  console.log('Result clicked:', result);
                  handleSearchDemo();
                }}
                datasetId={demoDataset.id}
              />
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div>
            <h2 className="text-2xl font-bold text-purple-600 mb-6">Enhanced AI Chat</h2>
            <div className="h-[600px]">
              <EnhancedRAGChat
                dataset={demoDataset}
                userProfile={userProfile}
                onAnalysisComplete={(analysis) => {
                  console.log('Analysis completed:', analysis);
                  handleChatDemo();
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'workflow' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-purple-600 mb-6">Use Cases & Workflows</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {useCases.map((useCase, index) => (
                <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{useCase.title}</h3>
                  <p className="text-gray-600 mb-4">{useCase.scenario}</p>
                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                    <p className="text-sm text-blue-900 font-medium">Example Query:</p>
                    <p className="text-sm text-blue-800 italic">{useCase.example}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Integration Steps */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Guide</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-indigo-100 text-indigo-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Import RAG Components</p>
                    <p className="text-sm text-gray-600">Add RAG agent, enhanced orchestrator, and UI components to your app</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-indigo-100 text-indigo-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Configure OpenAI API</p>
                    <p className="text-sm text-gray-600">Set up embedding service with your OpenAI API key</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-indigo-100 text-indigo-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Enable Auto-Indexing</p>
                    <p className="text-sm text-gray-600">Integrate dataset upload hooks to automatically index new data</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-indigo-100 text-indigo-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Replace Chat Components</p>
                    <p className="text-sm text-gray-600">Swap existing AI chat with RAG-enhanced version for better responses</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RAGWorkflowDemo;
