import React, { useState } from 'react';
import { Calculator, Users, Database, TrendingUp } from 'lucide-react';

interface PriceCalculatorProps {
  onSelectTier: (tier: string) => void;
}

export const PriceCalculator: React.FC<PriceCalculatorProps> = ({ onSelectTier }) => {
  const [datasetCount, setDatasetCount] = useState(10);
  const [userCount, setUserCount] = useState(1);
  const [modelCount, setModelCount] = useState(5);

  // Calculate recommended tier based on usage
  const getRecommendedTier = () => {
    if (userCount > 5 || datasetCount > 100 || modelCount > 50) {
      return { tier: 'enterprise', price: 'Custom', savings: 0 };
    } else if (datasetCount > 20 || modelCount > 20 || userCount > 1) {
      return { tier: 'professional', price: 50, savings: 0.17 };
    } else {
      return { tier: 'starter', price: 25, savings: 0.17 };
    }
  };

  const recommended = getRecommendedTier();

  return (
    <div className="card-improved p-8 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="icon-container-primary">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="section-title">Find Your Perfect Plan</h3>
          <p className="section-subtitle">Adjust sliders to see what fits your needs</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Dataset Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="form-label flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              Number of Datasets
            </label>
            <span className="stat-value text-2xl">{datasetCount}</span>
          </div>
          <input
            type="range"
            min="1"
            max="200"
            value={datasetCount}
            onChange={(e) => setDatasetCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>50</span>
            <span>100</span>
            <span>200+</span>
          </div>
        </div>

        {/* User Count Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="form-label flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Team Members
            </label>
            <span className="stat-value text-2xl">{userCount}</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={userCount}
            onChange={(e) => setUserCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>5</span>
            <span>10</span>
            <span>20+</span>
          </div>
        </div>

        {/* Model Count Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="form-label flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              ML Models per Month
            </label>
            <span className="stat-value text-2xl">{modelCount}</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={modelCount}
            onChange={(e) => setModelCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>25</span>
            <span>50</span>
            <span>100+</span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border-2 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="label-text text-gray-600 mb-1">Recommended Plan</p>
            <h4 className="card-title capitalize">{recommended.tier}</h4>
            <p className="text-sm text-gray-600 mt-1">
              Best fit for your usage patterns
            </p>
          </div>
          <div className="text-right">
            <div className="stat-value text-primary">
              ${recommended.price === 'Custom' ? '—' : recommended.price}
            </div>
            <span className="label-text text-gray-600">/month</span>
            {typeof recommended.price === 'number' && recommended.savings > 0 && (
              <div className="mt-2">
                <span className="badge-success text-xs">
                  Save ${Math.round(recommended.price * 12 * recommended.savings)} annually
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => onSelectTier(recommended.tier)}
          className="btn-primary-improved w-full mt-4"
        >
          Get Started with {recommended.tier}
        </button>
      </div>
    </div>
  );
};
