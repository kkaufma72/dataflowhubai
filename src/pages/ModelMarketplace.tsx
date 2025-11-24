import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Download, Rocket, TrendingUp, Filter, Search, Tag, ExternalLink } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

interface MarketplaceModel {
  id: string;
  name: string;
  description: string;
  creator: string;
  industry: string;
  accuracy: number;
  rating: number;
  reviews: number;
  downloads: number;
  price: 'free' | number;
  tags: string[];
  demoUrl?: string;
  featured: boolean;
}

const ModelMarketplace: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');

  // Mock marketplace models (in production, fetch from API)
  const marketplaceModels: MarketplaceModel[] = [
    {
      id: 'churn-predictor-v2',
      name: 'Customer Churn Predictor Pro',
      description: 'Predict customer churn with 95%+ accuracy. Trained on 100K+ e-commerce customers.',
      creator: 'DataFlowHub Labs',
      industry: 'Retail',
      accuracy: 0.953,
      rating: 4.8,
      reviews: 127,
      downloads: 1284,
      price: 'free',
      tags: ['churn', 'retention', 'e-commerce'],
      demoUrl: '/demos/churn-v2',
      featured: true
    },
    {
      id: 'fraud-detector-realtime',
      name: 'Real-Time Fraud Detection',
      description: 'Detect fraudulent transactions in <50ms. Trained on 500K+ payment records.',
      creator: 'FinTech AI',
      industry: 'Finance',
      accuracy: 0.967,
      rating: 4.9,
      reviews: 89,
      downloads: 543,
      price: 29,
      tags: ['fraud', 'payments', 'real-time'],
      featured: true
    },
    {
      id: 'ltv-predictor',
      name: 'Customer Lifetime Value Predictor',
      description: 'Predict customer LTV for better marketing ROI. Works with any CRM data.',
      creator: 'Marketing AI Co',
      industry: 'Marketing',
      accuracy: 0.891,
      rating: 4.6,
      reviews: 64,
      downloads: 892,
      price: 19,
      tags: ['ltv', 'marketing', 'roi'],
      featured: false
    },
    {
      id: 'readmission-risk',
      name: 'Patient Readmission Risk Scorer',
      description: 'HIPAA-compliant model for predicting 30-day hospital readmissions.',
      creator: 'HealthTech Solutions',
      industry: 'Healthcare',
      accuracy: 0.894,
      rating: 4.7,
      reviews: 45,
      downloads: 234,
      price: 49,
      tags: ['healthcare', 'hipaa', 'readmission'],
      featured: false
    },
    {
      id: 'demand-forecaster',
      name: 'Inventory Demand Forecaster',
      description: 'Predict product demand 7-30 days ahead. Reduces stockouts by 60%.',
      creator: 'Supply Chain Labs',
      industry: 'Retail',
      accuracy: 0.876,
      rating: 4.4,
      reviews: 78,
      downloads: 567,
      price: 'free',
      tags: ['forecasting', 'inventory', 'supply-chain'],
      featured: false
    }
  ];

  const industries = ['all', ...Array.from(new Set(marketplaceModels.map(m => m.industry)))];

  const filteredModels = marketplaceModels.filter(model => {
    const matchesSearch = searchQuery === '' ||
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesIndustry = selectedIndustry === 'all' || model.industry === selectedIndustry;
    
    const matchesPrice = selectedPrice === 'all' ||
      (selectedPrice === 'free' && model.price === 'free') ||
      (selectedPrice === 'paid' && model.price !== 'free');

    return matchesSearch && matchesIndustry && matchesPrice;
  });

  const featuredModels = filteredModels.filter(m => m.featured);

  const handleDeploy = async (model: MarketplaceModel) => {
    toast.loading(`Deploying ${model.name}...`, { id: 'deploy' });
    
    // Simulate deployment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success(`${model.name} deployed! API endpoint ready.`, { id: 'deploy' });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Model Marketplace</h1>
          <p className="text-xl text-gray-600">
            1,200+ pre-trained models ready to deploy • No training required
          </p>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Models', value: '1,284', icon: Rocket },
            { label: 'Total Downloads', value: '15.2K', icon: Download },
            { label: 'Avg Rating', value: '4.7★', icon: Star },
            { label: 'Industries', value: '12+', icon: TrendingUp }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl border-2 border-gray-200 p-4 text-center">
              <stat.icon className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Industry Filter */}
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
            >
              {industries.map(industry => (
                <option key={industry} value={industry}>
                  {industry === 'all' ? 'All Industries' : industry}
                </option>
              ))}
            </select>

            {/* Price Filter */}
            <select
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Prices</option>
              <option value="free">Free Only</option>
              <option value="paid">Paid Only</option>
            </select>
          </div>
        </div>

        {/* Featured Models */}
        {featuredModels.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">⭐ Featured Models</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredModels.map(model => (
                <MarketplaceModelCard
                  key={model.id}
                  model={model}
                  onDeploy={handleDeploy}
                  featured
                />
              ))}
            </div>
          </div>
        )}

        {/* All Models */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">All Models</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {filteredModels.map(model => (
              <MarketplaceModelCard
                key={model.id}
                model={model}
                onDeploy={handleDeploy}
              />
            ))}
          </div>
        </div>

        {filteredModels.length === 0 && (
          <EmptyState
            icon={Search}
            title="No models found"
            description="Try adjusting your filters or search query"
            actions={[
              {
                label: 'Clear Filters',
                onClick: () => {
                  setSearchQuery('');
                  setSelectedIndustry('all');
                  setSelectedPrice('all');
                },
                variant: 'secondary'
              }
            ]}
          />
        )}
      </div>
    </div>
  );
};

// Model Card Component
const MarketplaceModelCard: React.FC<{
  model: MarketplaceModel;
  onDeploy: (model: MarketplaceModel) => void;
  featured?: boolean;
}> = ({ model, onDeploy, featured = false }) => {
  return (
    <div className={`
      bg-white rounded-xl overflow-hidden border-2 hover:shadow-xl transition-all
      ${featured ? 'border-indigo-300' : 'border-gray-200'}
    `}>
      {/* Header */}
      <div className={`p-4 ${featured ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gray-50'}`}>
        <div className="flex items-start justify-between mb-2">
          <h3 className={`text-lg font-bold ${featured ? 'text-white' : 'text-gray-900'}`}>
            {model.name}
          </h3>
          {featured && (
            <span className="px-2 py-1 bg-white/20 text-white text-xs font-bold rounded">
              FEATURED
            </span>
          )}
        </div>
        <p className={`text-xs ${featured ? 'text-indigo-100' : 'text-gray-600'}`}>
          by {model.creator}
        </p>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-700 mb-4 line-clamp-3">{model.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${i < Math.floor(model.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">
              {model.rating} ({model.reviews})
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Download className="w-3 h-3" />
            {model.downloads.toLocaleString()} downloads
          </div>

          <div className="col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Accuracy</span>
              <span className="text-sm font-bold text-gray-900">
                {(model.accuracy * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${model.accuracy * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
            {model.industry}
          </span>
          {model.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onDeploy(model)}
            className="flex-1"
            size="sm"
          >
            <Rocket className="w-4 h-4 mr-1" />
            {model.price === 'free' ? 'Deploy Free' : `Deploy $${model.price}/mo`}
          </Button>
          {model.demoUrl && (
            <button
              onClick={() => window.open(model.demoUrl, '_blank')}
              className="p-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="View demo"
            >
              <ExternalLink className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelMarketplace;
