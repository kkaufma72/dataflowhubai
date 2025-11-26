// Smart FRED Dataset Suggestions based on user's existing data
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Building2,
  ShoppingCart,
  Home,
  Fuel,
  CreditCard,
  LineChart,
  BarChart3,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Dataset } from '../../types';
import { POPULAR_ECONOMIC_INDICATORS } from '../../lib/fredAPI';

interface FREDSmartSuggestionsProps {
  userDatasets: Dataset[];
  onSuggestClick: (seriesId: string, seriesName: string) => void;
  compact?: boolean;
}

interface Suggestion {
  seriesId: string;
  name: string;
  reason: string;
  icon: React.ReactNode;
  category: 'correlation' | 'benchmark' | 'trending' | 'popular';
  priority: number;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  gdp: <TrendingUp className="w-4 h-4" />,
  unemployment: <Users className="w-4 h-4" />,
  inflation: <DollarSign className="w-4 h-4" />,
  interest: <CreditCard className="w-4 h-4" />,
  housing: <Home className="w-4 h-4" />,
  retail: <ShoppingCart className="w-4 h-4" />,
  industrial: <Building2 className="w-4 h-4" />,
  energy: <Fuel className="w-4 h-4" />,
  stocks: <LineChart className="w-4 h-4" />,
  default: <BarChart3 className="w-4 h-4" />
};

const FREDSmartSuggestions: React.FC<FREDSmartSuggestionsProps> = ({
  userDatasets,
  onSuggestClick,
  compact = false
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Analyze user datasets and generate smart suggestions
  const analyzedSuggestions = useMemo(() => {
    const suggestions: Suggestion[] = [];
    
    // Analyze column names across all datasets
    const allColumns = userDatasets.flatMap(ds => 
      ds.preview_data?.columns || []
    ).map(col => col.toLowerCase());
    
    const allTags = userDatasets.flatMap(ds => ds.tags || []).map(t => t.toLowerCase());
    const datasetNames = userDatasets.map(ds => ds.name.toLowerCase());

    // Smart matching based on user data
    const hasColumn = (keywords: string[]) => 
      allColumns.some(col => keywords.some(kw => col.includes(kw)));
    const hasTag = (keywords: string[]) => 
      allTags.some(tag => keywords.some(kw => tag.includes(kw)));
    const hasName = (keywords: string[]) => 
      datasetNames.some(name => keywords.some(kw => name.includes(kw)));

    // Sales/Revenue data → suggest GDP, Retail Sales
    if (hasColumn(['sales', 'revenue', 'income', 'profit']) || hasTag(['sales', 'revenue'])) {
      suggestions.push({
        seriesId: 'GDP',
        name: 'Gross Domestic Product',
        reason: 'Correlate your sales with economic growth',
        icon: CATEGORY_ICONS.gdp,
        category: 'correlation',
        priority: 1
      });
      suggestions.push({
        seriesId: 'RSXFS',
        name: 'Retail Sales',
        reason: 'Compare your sales to national retail trends',
        icon: CATEGORY_ICONS.retail,
        category: 'benchmark',
        priority: 2
      });
    }

    // Price/Cost data → suggest CPI, PPI
    if (hasColumn(['price', 'cost', 'expense', 'rate']) || hasTag(['pricing'])) {
      suggestions.push({
        seriesId: 'CPIAUCSL',
        name: 'Consumer Price Index',
        reason: 'Track inflation impact on your prices',
        icon: CATEGORY_ICONS.inflation,
        category: 'correlation',
        priority: 1
      });
    }

    // Employee/HR data → suggest Unemployment, Payrolls
    if (hasColumn(['employee', 'staff', 'headcount', 'hire', 'salary', 'wage'])) {
      suggestions.push({
        seriesId: 'UNRATE',
        name: 'Unemployment Rate',
        reason: 'Understand labor market conditions',
        icon: CATEGORY_ICONS.unemployment,
        category: 'benchmark',
        priority: 1
      });
      suggestions.push({
        seriesId: 'PAYEMS',
        name: 'Nonfarm Payrolls',
        reason: 'Compare hiring trends nationally',
        icon: CATEGORY_ICONS.unemployment,
        category: 'correlation',
        priority: 2
      });
    }

    // Real estate data → suggest Housing, Mortgage rates
    if (hasColumn(['property', 'house', 'home', 'rent', 'mortgage']) || hasName(['real estate', 'property'])) {
      suggestions.push({
        seriesId: 'HOUST',
        name: 'Housing Starts',
        reason: 'Track housing market activity',
        icon: CATEGORY_ICONS.housing,
        category: 'correlation',
        priority: 1
      });
      suggestions.push({
        seriesId: 'MORTGAGE30US',
        name: '30-Year Mortgage Rate',
        reason: 'Monitor financing costs',
        icon: CATEGORY_ICONS.interest,
        category: 'correlation',
        priority: 2
      });
    }

    // Financial data → suggest Interest rates, VIX
    if (hasColumn(['interest', 'loan', 'debt', 'credit', 'investment'])) {
      suggestions.push({
        seriesId: 'FEDFUNDS',
        name: 'Federal Funds Rate',
        reason: 'Track central bank policy impact',
        icon: CATEGORY_ICONS.interest,
        category: 'benchmark',
        priority: 1
      });
      suggestions.push({
        seriesId: 'VIXCLS',
        name: 'VIX Volatility Index',
        reason: 'Monitor market uncertainty',
        icon: CATEGORY_ICONS.stocks,
        category: 'correlation',
        priority: 3
      });
    }

    // Stock/Market data → suggest S&P 500
    if (hasColumn(['stock', 'share', 'equity', 'market']) || hasTag(['finance', 'stocks'])) {
      suggestions.push({
        seriesId: 'SP500',
        name: 'S&P 500 Index',
        reason: 'Benchmark against market performance',
        icon: CATEGORY_ICONS.stocks,
        category: 'benchmark',
        priority: 1
      });
    }

    // Energy data → suggest Oil prices
    if (hasColumn(['energy', 'oil', 'gas', 'fuel', 'utility'])) {
      suggestions.push({
        seriesId: 'DCOILWTICO',
        name: 'Crude Oil Prices (WTI)',
        reason: 'Track energy cost drivers',
        icon: CATEGORY_ICONS.energy,
        category: 'correlation',
        priority: 1
      });
    }

    // Customer/Consumer data → suggest Consumer Sentiment
    if (hasColumn(['customer', 'consumer', 'satisfaction', 'nps'])) {
      suggestions.push({
        seriesId: 'UMCSENT',
        name: 'Consumer Sentiment',
        reason: 'Correlate with consumer confidence',
        icon: CATEGORY_ICONS.retail,
        category: 'correlation',
        priority: 2
      });
    }

    // Add popular indicators if no specific matches
    if (suggestions.length < 3) {
      const popular = [
        { id: 'GDP', name: 'Gross Domestic Product', reason: 'Essential economic growth indicator' },
        { id: 'UNRATE', name: 'Unemployment Rate', reason: 'Key labor market indicator' },
        { id: 'CPIAUCSL', name: 'Consumer Price Index', reason: 'Track inflation trends' }
      ];
      
      popular.forEach((p, i) => {
        if (!suggestions.find(s => s.seriesId === p.id)) {
          suggestions.push({
            seriesId: p.id,
            name: p.name,
            reason: p.reason,
            icon: CATEGORY_ICONS.default,
            category: 'popular',
            priority: 5 + i
          });
        }
      });
    }

    // Sort by priority and dedupe
    return suggestions
      .filter((s, i, arr) => arr.findIndex(x => x.seriesId === s.seriesId) === i)
      .sort((a, b) => a.priority - b.priority)
      .slice(0, compact ? 3 : 6);
  }, [userDatasets, compact]);

  useEffect(() => {
    setSuggestions(analyzedSuggestions);
  }, [analyzedSuggestions]);

  if (suggestions.length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s.seriesId}
            onClick={() => onSuggestClick(s.seriesId, s.name)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-full text-sm text-emerald-700 hover:from-emerald-100 hover:to-green-100 transition-all hover:shadow-sm"
          >
            {s.icon}
            <span>{s.name}</span>
            <Zap className="w-3 h-3 text-emerald-500" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-xl p-5 border border-emerald-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Smart Suggestions Based on Your Data
        </h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        We analyzed your datasets and found these FRED economic indicators that could provide valuable context:
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map((s) => (
          <button
            key={s.seriesId}
            onClick={() => onSuggestClick(s.seriesId, s.name)}
            className="group flex flex-col p-4 bg-white rounded-lg border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600">
                  {s.icon}
                </div>
                <span className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">
                  {s.name}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors transform group-hover:translate-x-1" />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              {s.reason}
            </p>
            <div className="mt-2 flex items-center gap-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                s.category === 'correlation' ? 'bg-blue-100 text-blue-700' :
                s.category === 'benchmark' ? 'bg-purple-100 text-purple-700' :
                s.category === 'trending' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {s.category === 'correlation' ? '📊 Correlate' :
                 s.category === 'benchmark' ? '📈 Benchmark' :
                 s.category === 'trending' ? '🔥 Trending' :
                 '⭐ Popular'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FREDSmartSuggestions;

