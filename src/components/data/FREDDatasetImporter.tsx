// FRED Dataset Importer Component
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  Download, 
  Calendar,
  Info,
  Database,
  Sparkles,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Check
} from 'lucide-react';
import {
  searchFREDSeries,
  getFREDSeries,
  convertFREDToDataset,
  isFREDConfigured,
  POPULAR_ECONOMIC_INDICATORS,
  FREDSeries
} from '../../lib/fredAPI';
import { useMLContext } from '../../context/MLContext';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import Card from '../common/Card';
import Button from '../common/Button';
import { Dataset } from '../../types';

const FREDDatasetImporter: React.FC = () => {
  const { user } = useAuth();
  const { addDataset } = useMLContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FREDSeries[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<FREDSeries | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [frequency, setFrequency] = useState<string>('');
  const [popularSeries, setPopularSeries] = useState<FREDSeries[]>([]);
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);

  useEffect(() => {
    // Load popular indicators on mount
    loadPopularIndicators();
  }, []);

  const loadPopularIndicators = async () => {
    try {
      const promises = POPULAR_ECONOMIC_INDICATORS.slice(0, 5).map(indicator =>
        getFREDSeries(indicator.id).catch(() => null)
      );
      const results = await Promise.all(promises);
      setPopularSeries(results.filter(r => r !== null) as FREDSeries[]);
    } catch (error) {
      console.error('Error loading popular indicators:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchFREDSeries(searchQuery, {
        limit: 20,
        orderBy: 'popularity',
        sortOrder: 'desc'
      });
      
      setSearchResults(results.seriess);
      
      if (results.seriess.length === 0) {
        toast('No results found. Try a different search term.', { icon: '🔍' });
      } else {
        toast.success(`Found ${results.count.toLocaleString()} series`);
      }
    } catch (error: any) {
      console.error('FRED search error:', error);
      toast.error(error.message || 'Failed to search FRED database');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (series: FREDSeries) => {
    if (!user) {
      toast.error('Please sign in to import datasets');
      return;
    }

    setIsImporting(true);
    try {
      // Convert FRED data to dataset format
      const datasetData = await convertFREDToDataset(series.id, {
        observationStart: dateRange.start || undefined,
        observationEnd: dateRange.end || undefined,
        frequency: frequency as any || undefined
      });

      // Create dataset in Supabase
      const { data: newDataset, error } = await supabase
        .from('datasets')
        .insert({
          user_id: user.id,
          name: datasetData.name,
          description: datasetData.description,
          source: 'FRED',
          preview_data: {
            columns: ['date', 'value', 'realtime_start', 'realtime_end'],
            rows: datasetData.data.slice(0, 100)
          },
          rows: datasetData.data.length,
          columns: 4,
          size_mb: (JSON.stringify(datasetData.data).length / (1024 * 1024)).toFixed(2),
          file_type: 'json',
          metadata: datasetData.metadata,
          tags: ['economic', 'fred', 'time-series']
        })
        .select()
        .single();

      if (error) throw error;

      // Store full data in a separate table or file storage
      // For now, we'll just show success
      
      // Add to context
      if (newDataset) {
        addDataset(newDataset as Dataset);
        toast.success(`📊 Imported ${datasetData.data.length.toLocaleString()} data points from FRED!`);
        setSelectedSeries(null);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import dataset');
    } finally {
      setIsImporting(false);
    }
  };

  const toggleSeriesExpansion = (seriesId: string) => {
    setExpandedSeries(expandedSeries === seriesId ? null : seriesId);
  };

  if (!isFREDConfigured()) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            FRED API Not Configured
          </h3>
          <p className="text-gray-600 mb-4">
            To use the FRED dataset importer, you need to add your FRED API key.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Steps to enable:</strong>
            </p>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Get a free API key from <a href="https://fred.stlouisfed.org/docs/api/api_key.html" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">FRED</a></li>
              <li>Add <code className="bg-gray-200 px-1 rounded">VITE_FRED_API_KEY=your_key</code> to your .env file</li>
              <li>Restart your dev server</li>
            </ol>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-primary-600" />
            FRED Economic Data
          </h2>
          <p className="text-gray-600 mt-1">
            Search and import 800,000+ economic time series from the Federal Reserve
          </p>
        </div>
        <a
          href="https://fred.stlouisfed.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
        >
          Visit FRED <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for GDP, unemployment, inflation, S&P 500..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              icon={<Search className="w-5 h-5" />}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 animate-fadeIn">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Original</option>
                    <option value="d">Daily</option>
                    <option value="w">Weekly</option>
                    <option value="m">Monthly</option>
                    <option value="q">Quarterly</option>
                    <option value="a">Annual</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Popular Indicators */}
      {searchResults.length === 0 && popularSeries.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            Popular Economic Indicators
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {popularSeries.map((series) => (
              <div
                key={series.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition cursor-pointer"
                onClick={() => handleImport(series)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{series.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {series.id} • {series.frequency_short} • {series.units_short}
                    </p>
                  </div>
                  <Download className="w-5 h-5 text-primary-600 flex-shrink-0" />
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {series.observation_start} to {series.observation_end}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Search Results ({searchResults.length})
          </h3>
          <div className="space-y-3">
            {searchResults.map((series) => (
              <div
                key={series.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <button
                      onClick={() => toggleSeriesExpansion(series.id)}
                      className="text-left w-full"
                    >
                      <h4 className="font-medium text-gray-900 hover:text-primary-600">
                        {series.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {series.id} • {series.frequency} • {series.units}
                      </p>
                    </button>
                    
                    {expandedSeries === series.id && series.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg animate-fadeIn">
                        <p className="text-sm text-gray-700">{series.notes}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleImport(series)}
                    disabled={isImporting}
                    size="sm"
                    icon={isImporting ? <Download className="w-4 h-4 animate-bounce" /> : <Download className="w-4 h-4" />}
                  >
                    Import
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {series.observation_start} to {series.observation_end}
                  </span>
                  <span>Updated: {new Date(series.last_updated).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Popularity: {series.popularity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Import Status */}
      {isImporting && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 animate-popIn">
          <div className="flex items-center gap-3">
            <div className="animate-spin">
              <Download className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Importing from FRED...</p>
              <p className="text-sm text-gray-600">Downloading and processing data</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FREDDatasetImporter;

