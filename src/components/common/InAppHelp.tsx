import React, { useState } from 'react';
import { X, Book, Search, ArrowRight, MessageSquare } from 'lucide-react';
import Card from './Card';
import Button from './Button';

interface InAppHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const InAppHelp: React.FC<InAppHelpProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const helpCategories = [
    { id: 'getting-started', name: 'Getting Started', icon: Book },
    { id: 'data-management', name: 'Data Management', icon: Book },
    { id: 'model-training', name: 'Model Training', icon: Book },
    { id: 'deployment', name: 'Deployment', icon: Book },
    { id: 'monitoring', name: 'Monitoring', icon: Book },
  ];
  
  const helpArticles = {
    'getting-started': [
      { id: 'gs-1', title: 'Platform Overview', excerpt: 'Learn about the key features and capabilities of DataFlowHub AI.' },
      { id: 'gs-2', title: 'Creating Your First Project', excerpt: 'Step-by-step guide to creating and configuring your first project.' },
      { id: 'gs-3', title: 'Navigating the Interface', excerpt: 'Learn how to navigate the platform interface efficiently.' },
    ],
    'data-management': [
      { id: 'dm-1', title: 'Uploading Datasets', excerpt: 'How to upload and manage your datasets.' },
      { id: 'dm-2', title: 'Data Preprocessing', excerpt: 'Learn about data cleaning and preparation techniques.' },
      { id: 'dm-3', title: 'Feature Engineering', excerpt: 'Create and select features to improve model performance.' },
    ],
    'model-training': [
      { id: 'mt-1', title: 'Training Your First Model', excerpt: 'Step-by-step guide to training a machine learning model.' },
      { id: 'mt-2', title: 'Algorithm Selection', excerpt: 'How to choose the right algorithm for your use case.' },
      { id: 'mt-3', title: 'Hyperparameter Tuning', excerpt: 'Optimize your model parameters for better performance.' },
    ],
    'deployment': [
      { id: 'dp-1', title: 'Deploying Models', excerpt: 'How to deploy your trained models to production.' },
      { id: 'dp-2', title: 'API Integration', excerpt: 'Integrate your deployed models with other applications.' },
      { id: 'dp-3', title: 'Scaling and Performance', excerpt: 'Best practices for scaling your deployed models.' },
    ],
    'monitoring': [
      { id: 'mn-1', title: 'Model Monitoring Basics', excerpt: 'Learn how to monitor your deployed models.' },
      { id: 'mn-2', title: 'Drift Detection', excerpt: 'Detect and handle data drift in your models.' },
      { id: 'mn-3', title: 'Setting Up Alerts', excerpt: 'Configure alerts for model performance issues.' },
    ],
  };
  
  const filteredArticles = searchQuery 
    ? Object.values(helpArticles).flat().filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeCategory 
      ? helpArticles[activeCategory] 
      : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
      
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Help Center</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {!searchQuery && !activeCategory && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Help Categories</h3>
            <div className="grid grid-cols-2 gap-3">
              {helpCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    className="flex flex-col items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={() => setActiveCategory(category.id)}
                  >
                    <Icon className="w-6 h-6 text-primary-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        {(searchQuery || activeCategory) && (
          <div className="flex-1 overflow-y-auto p-4">
            {searchQuery && (
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Search Results for "{searchQuery}"
              </h3>
            )}
            
            {activeCategory && !searchQuery && (
              <div className="mb-4">
                <button
                  className="flex items-center text-sm text-primary-600 hover:text-primary"
                  onClick={() => setActiveCategory(null)}
                >
                  <ArrowRight className="w-4 h-4 mr-1 transform rotate-180" />
                  Back to Categories
                </button>
                <h3 className="text-sm font-medium text-gray-700 mt-2">
                  {helpCategories.find(c => c.id === activeCategory)?.name}
                </h3>
              </div>
            )}
            
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <h4 className="text-sm font-medium text-gray-900">{article.title}</h4>
                  <p className="mt-1 text-xs text-gray-500">{article.excerpt}</p>
                  <div className="mt-2 flex justify-end">
                    <button className="text-xs text-primary-600 hover:text-primary flex items-center">
                      Read more
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
              
              {filteredArticles.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-500">No articles found.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="p-4 bg-primary/5 border-t border-gray-200">
          <div className="flex items-center">
            <MessageSquare className="w-5 h-5 text-primary-600 mr-2" />
            <p className="text-sm text-primary-700">Need more help?</p>
          </div>
          <div className="mt-2 flex space-x-3">
            <Button size="sm" className="flex-1">
              Contact Support
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              View Documentation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InAppHelp;