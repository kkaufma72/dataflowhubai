import React, { useState } from 'react';
import { Card } from '../common/Card';
import { BarChart2, Info, Download, Filter, ArrowUpDown } from 'lucide-react';
import Button from '../common/Button';
import { Bar } from 'react-chartjs-2';
import * as d3 from 'd3';

interface FeatureImportanceChartProps {
  featureImportance: {feature: string; importance: number}[];
  selectedFeatures: string[];
  onFeatureToggle: (feature: string) => void;
}

const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({
  featureImportance,
  selectedFeatures,
  onFeatureToggle
}) => {
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState<'importance' | 'name'>('importance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [threshold, setThreshold] = useState<number>(0.1); // 10% importance threshold

  const handleSort = (by: 'importance' | 'name') => {
    if (sortBy === by) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(by);
      setSortDirection('desc');
    }
  };

  const sortedFeatures = [...featureImportance].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'importance') {
      comparison = b.importance - a.importance;
    } else {
      comparison = a.feature.localeCompare(b.feature);
    }
    
    return sortDirection === 'asc' ? -comparison : comparison;
  });

  const displayedFeatures = showAll 
    ? sortedFeatures 
    : sortedFeatures.filter(f => f.importance >= threshold);

  const chartData = {
    labels: displayedFeatures.map(f => f.feature),
    datasets: [
      {
        label: 'Feature Importance',
        data: displayedFeatures.map(f => f.importance * 100), // Convert to percentage
        backgroundColor: displayedFeatures.map(f => 
          selectedFeatures.includes(f.feature) 
            ? 'rgba(79, 70, 229, 0.8)' 
            : 'rgba(156, 163, 175, 0.5)'
        ),
        borderWidth: 1,
      }
    ]
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Importance: ${context.raw.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Importance (%)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Feature'
        }
      }
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        onFeatureToggle(displayedFeatures[index].feature);
      }
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      'Feature,Importance',
      ...sortedFeatures.map(f => `${f.feature},${f.importance.toFixed(4)}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'feature_importance.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThreshold(parseFloat(e.target.value) / 100);
  };

  const handleSelectTopFeatures = () => {
    // Select top features based on importance threshold
    const topFeatures = sortedFeatures
      .filter(f => f.importance >= threshold)
      .map(f => f.feature);
    
    // Update selected features
    topFeatures.forEach(feature => {
      if (!selectedFeatures.includes(feature)) {
        onFeatureToggle(feature);
      }
    });
    
    // Deselect features below threshold
    selectedFeatures.forEach(feature => {
      const importance = featureImportance.find(f => f.feature === feature)?.importance || 0;
      if (importance < threshold && selectedFeatures.includes(feature)) {
        onFeatureToggle(feature);
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
              <BarChart2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Feature Importance Analysis</h3>
              <p className="mt-1 text-xs text-gray-500">
                Understand which features contribute most to your model's predictions
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Filter className="w-4 h-4" />}
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Important' : 'Show All'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExportCSV}
            >
              Export
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleSort('importance')}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600"
            >
              Sort by Importance
              {sortBy === 'importance' && (
                <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
              )}
            </button>
            <button
              onClick={() => handleSort('name')}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600"
            >
              Sort by Name
              {sortBy === 'name' && (
                <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
              )}
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="threshold" className="block text-sm font-medium text-gray-700">
                Importance Threshold: {(threshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                id="threshold"
                min="0"
                max="50"
                value={threshold * 100}
                onChange={handleThresholdChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <Button
              size="sm"
              onClick={handleSelectTopFeatures}
            >
              Select Features Above Threshold
            </Button>
          </div>
        </div>

        <div className="h-[500px]">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </Card>

      <Card>
        <div className="flex items-center mb-4">
          <Info className="w-5 h-5 text-indigo-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">Understanding Feature Importance</h3>
        </div>
        
        <div className="space-y-4 text-sm text-gray-600">
          <p>
            Feature importance helps you understand which features have the most influence on your model's predictions.
            Higher importance values indicate features that contribute more to the model's accuracy.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h4 className="font-medium text-indigo-900 mb-2">Benefits of Feature Selection</h4>
              <ul className="list-disc list-inside space-y-1 text-indigo-800">
                <li>Reduces model complexity</li>
                <li>Prevents overfitting</li>
                <li>Improves training speed</li>
                <li>Enhances model interpretability</li>
                <li>Reduces computational resources needed</li>
              </ul>
            </div>
            
            <div className="p-4 bg-amber-50 rounded-lg">
              <h4 className="font-medium text-amber-900 mb-2">Best Practices</h4>
              <ul className="list-disc list-inside space-y-1 text-amber-800">
                <li>Remove features with near-zero importance</li>
                <li>Check for highly correlated features</li>
                <li>Consider domain knowledge when selecting features</li>
                <li>Validate feature selection with cross-validation</li>
                <li>Experiment with different feature subsets</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FeatureImportanceChart;