// Quick Insights Panel for FRED Data
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  RefreshCw
} from 'lucide-react';
import { Dataset } from '../../types';

interface FREDQuickInsightsProps {
  dataset: Dataset;
  className?: string;
}

interface Insight {
  label: string;
  value: string;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
  description?: string;
}

const FREDQuickInsights: React.FC<FREDQuickInsightsProps> = ({ dataset, className = '' }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyzeDataset();
  }, [dataset]);

  const analyzeDataset = () => {
    setIsLoading(true);
    
    // Get data from preview
    const data = dataset.preview_data?.rows || [];
    const metadata = dataset.metadata || {};
    
    if (data.length === 0) {
      setInsights([]);
      setIsLoading(false);
      return;
    }

    // Extract values (assuming FRED format: date, value)
    const values = data
      .map((row: any) => parseFloat(row.value || row[1]))
      .filter((v: number) => !isNaN(v));

    if (values.length === 0) {
      setInsights([]);
      setIsLoading(false);
      return;
    }

    // Calculate statistics
    const latestValue = values[values.length - 1];
    const previousValue = values.length > 1 ? values[values.length - 2] : latestValue;
    const firstValue = values[0];
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const avgValue = values.reduce((a: number, b: number) => a + b, 0) / values.length;

    // Calculate changes
    const periodChange = ((latestValue - previousValue) / previousValue) * 100;
    const totalChange = ((latestValue - firstValue) / firstValue) * 100;

    // Determine trend
    const recentValues = values.slice(-5);
    const recentTrend = recentValues.length > 1 
      ? (recentValues[recentValues.length - 1] - recentValues[0]) / recentValues[0] * 100
      : 0;
    const trend: 'up' | 'down' | 'flat' = 
      Math.abs(recentTrend) < 0.5 ? 'flat' : recentTrend > 0 ? 'up' : 'down';

    // Format value based on magnitude
    const formatValue = (v: number): string => {
      if (Math.abs(v) >= 1000000000) return `${(v / 1000000000).toFixed(2)}B`;
      if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(2)}M`;
      if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(2)}K`;
      return v.toFixed(2);
    };

    // Generate insights
    const generatedInsights: Insight[] = [
      {
        label: 'Latest Value',
        value: formatValue(latestValue),
        change: periodChange,
        trend,
        description: `${metadata.units || 'units'}`
      },
      {
        label: 'Period Change',
        value: `${periodChange >= 0 ? '+' : ''}${periodChange.toFixed(2)}%`,
        trend: periodChange > 0.5 ? 'up' : periodChange < -0.5 ? 'down' : 'flat',
        description: 'vs previous period'
      },
      {
        label: 'All-Time High',
        value: formatValue(maxValue),
        description: latestValue >= maxValue * 0.95 ? '🔥 Near ATH!' : undefined
      },
      {
        label: 'All-Time Low',
        value: formatValue(minValue),
        description: latestValue <= minValue * 1.05 ? '📉 Near ATL' : undefined
      },
      {
        label: 'Average',
        value: formatValue(avgValue),
        description: latestValue > avgValue ? 'Above average' : 'Below average',
        trend: latestValue > avgValue ? 'up' : 'down'
      },
      {
        label: 'Total Change',
        value: `${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(1)}%`,
        trend: totalChange > 0 ? 'up' : totalChange < 0 ? 'down' : 'flat',
        description: 'Since first observation'
      }
    ];

    setInsights(generatedInsights);
    setIsLoading(false);
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'down': return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Check if this is FRED data
  const isFREDData = dataset.source === 'FRED' || dataset.metadata?.source === 'FRED';

  if (!isFREDData) return null;

  return (
    <div className={`bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Quick Insights</h3>
        </div>
        <button 
          onClick={analyzeDataset}
          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          title="Refresh insights"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-2 mb-4">
        {dataset.metadata?.frequency && (
          <span className="flex items-center gap-1 px-2 py-1 bg-white/60 rounded-full text-xs text-gray-600">
            <Calendar className="w-3 h-3" />
            {dataset.metadata.frequency}
          </span>
        )}
        {dataset.metadata?.units && (
          <span className="flex items-center gap-1 px-2 py-1 bg-white/60 rounded-full text-xs text-gray-600">
            <BarChart3 className="w-3 h-3" />
            {dataset.metadata.units}
          </span>
        )}
        {dataset.metadata?.fred_series_id && (
          <span className="flex items-center gap-1 px-2 py-1 bg-indigo-100 rounded-full text-xs text-indigo-700 font-mono">
            {dataset.metadata.fred_series_id}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/60 rounded-lg p-3 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {insights.map((insight, idx) => (
            <div 
              key={idx}
              className="bg-white/60 backdrop-blur-sm rounded-lg p-3 hover:bg-white/80 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{insight.label}</span>
                {getTrendIcon(insight.trend)}
              </div>
              <div className={`text-lg font-bold ${getTrendColor(insight.trend)}`}>
                {insight.value}
              </div>
              {insight.description && (
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {insight.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI Analysis CTA */}
      <div className="mt-4 p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg border border-indigo-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm text-indigo-800">
              Want deeper analysis?
            </span>
          </div>
          <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Ask AI Assistant →
          </button>
        </div>
      </div>
    </div>
  );
};

export default FREDQuickInsights;

