import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Check, X, Search, Info, ArrowUpDown, Filter } from 'lucide-react';
import Button from '../common/Button';
import { Dataset } from '../../types';

interface FeatureSelectionTableProps {
  dataset: Dataset;
  selectedFeatures: string[];
  onFeatureToggle: (feature: string) => void;
  featureImportance: {feature: string; importance: number}[];
}

interface FeatureMetadata {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'text' | 'unknown';
  uniqueValues: number;
  missingValues: number;
  stats: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    mode?: string;
    std?: number;
  };
}

const FeatureSelectionTable: React.FC<FeatureSelectionTableProps> = ({
  dataset,
  selectedFeatures,
  onFeatureToggle,
  featureImportance
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'importance' | 'missing'>('importance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [featureMetadata, setFeatureMetadata] = useState<FeatureMetadata[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'numeric' | 'categorical' | 'datetime' | 'text'>('all');

  useEffect(() => {
    if (dataset && dataset.previewData) {
      analyzeFeatures();
    }
  }, [dataset]);

  const analyzeFeatures = () => {
    if (!dataset.previewData) return;

    const { columns, rows } = dataset.previewData;
    const metadata: FeatureMetadata[] = [];

    columns.forEach((column, colIndex) => {
      const values = rows.map(row => row[colIndex]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      
      // Determine feature type
      let type: FeatureMetadata['type'] = 'unknown';
      const numericCount = nonNullValues.filter(v => !isNaN(Number(v))).length;
      const dateCount = nonNullValues.filter(v => !isNaN(Date.parse(v))).length;
      
      if (numericCount / nonNullValues.length > 0.8) {
        type = 'numeric';
      } else if (dateCount / nonNullValues.length > 0.8) {
        type = 'datetime';
      } else {
        // Check if it's categorical (few unique values relative to total)
        const uniqueValues = new Set(nonNullValues);
        if (uniqueValues.size <= Math.min(10, nonNullValues.length * 0.2)) {
          type = 'categorical';
        } else {
          type = 'text';
        }
      }
      
      // Calculate statistics
      const stats: FeatureMetadata['stats'] = {};
      
      if (type === 'numeric') {
        const numericValues = nonNullValues.map(v => Number(v));
        stats.min = Math.min(...numericValues);
        stats.max = Math.max(...numericValues);
        stats.mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
        
        // Calculate median
        const sorted = [...numericValues].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        stats.median = sorted.length % 2 === 0 
          ? (sorted[mid - 1] + sorted[mid]) / 2 
          : sorted[mid];
        
        // Calculate standard deviation
        const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - stats.mean!, 2), 0) / numericValues.length;
        stats.std = Math.sqrt(variance);
      } else {
        // Calculate mode for categorical features
        const valueCounts: Record<string, number> = {};
        nonNullValues.forEach(val => {
          valueCounts[val] = (valueCounts[val] || 0) + 1;
        });
        
        let maxCount = 0;
        let mode = '';
        
        Object.entries(valueCounts).forEach(([val, count]) => {
          if (count > maxCount) {
            maxCount = count;
            mode = val;
          }
        });
        
        stats.mode = mode;
      }
      
      metadata.push({
        name: column,
        type,
        uniqueValues: new Set(nonNullValues).size,
        missingValues: values.length - nonNullValues.length,
        stats
      });
    });
    
    setFeatureMetadata(metadata);
  };

  const getFeatureImportance = (feature: string) => {
    const found = featureImportance.find(f => f.feature === feature);
    return found ? found.importance : 0;
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const sortedAndFilteredFeatures = () => {
    if (!dataset.previewData) return [];
    
    let features = featureMetadata;
    
    // Apply type filter
    if (filterType !== 'all') {
      features = features.filter(f => f.type === filterType);
    }
    
    // Apply search filter
    if (searchTerm) {
      features = features.filter(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    return [...features].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'type') {
        comparison = a.type.localeCompare(b.type);
      } else if (sortBy === 'importance') {
        comparison = getFeatureImportance(b.name) - getFeatureImportance(a.name);
      } else if (sortBy === 'missing') {
        comparison = b.missingValues - a.missingValues;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const getTypeColor = (type: FeatureMetadata['type']) => {
    switch (type) {
      case 'numeric':
        return 'bg-blue-100 text-blue-800';
      case 'categorical':
        return 'bg-green-100 text-green-800';
      case 'datetime':
        return 'bg-purple-100 text-purple-800';
      case 'text':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectAllFeatures = () => {
    const allFeatures = featureMetadata.map(f => f.name);
    onFeatureToggle('__all__'); // Special case to toggle all
  };

  return (
    <Card>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search features..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-3">
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
            >
              <option value="all">All Types</option>
              <option value="numeric">Numeric</option>
              <option value="categorical">Categorical</option>
              <option value="datetime">Datetime</option>
              <option value="text">Text</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={selectAllFeatures}
          >
            {selectedFeatures.length === featureMetadata.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Select
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Feature Name
                  {sortBy === 'name' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center">
                  Type
                  {sortBy === 'type' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('importance')}
              >
                <div className="flex items-center">
                  Importance
                  {sortBy === 'importance' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('missing')}
              >
                <div className="flex items-center">
                  Missing Values
                  {sortBy === 'missing' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statistics
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredFeatures().map((feature) => (
              <tr key={feature.name} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={selectedFeatures.includes(feature.name)}
                    onChange={() => onFeatureToggle(feature.name)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{feature.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(feature.type)}`}>
                    {feature.type.charAt(0).toUpperCase() + feature.type.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full" 
                        style={{ width: `${getFeatureImportance(feature.name) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      {(getFeatureImportance(feature.name) * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-900">{feature.missingValues}</span>
                    <span className="ml-1 text-sm text-gray-500">
                      ({((feature.missingValues / dataset.previewData!.rows.length) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {feature.type === 'numeric' ? (
                    <div className="flex space-x-2">
                      <span>Min: {feature.stats.min?.toFixed(2)}</span>
                      <span>Max: {feature.stats.max?.toFixed(2)}</span>
                      <span>Mean: {feature.stats.mean?.toFixed(2)}</span>
                    </div>
                  ) : feature.type === 'categorical' ? (
                    <div>
                      <span>Unique: {feature.uniqueValues}</span>
                      {feature.stats.mode && <span className="ml-2">Mode: {feature.stats.mode}</span>}
                    </div>
                  ) : feature.type === 'datetime' ? (
                    <span>Temporal feature</span>
                  ) : (
                    <span>Text feature</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {selectedFeatures.length} of {featureMetadata.length} features selected
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Reset to initial selection
              analyzeFeatures();
            }}
          >
            Reset
          </Button>
          <Button
            size="sm"
            onClick={() => onFeatureToggle('__apply__')} // Special case to apply changes
          >
            Apply Selection
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default FeatureSelectionTable;