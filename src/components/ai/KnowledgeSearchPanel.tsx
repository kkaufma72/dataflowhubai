// Knowledge Search Panel - RAG-powered search interface
// Allows users to search their knowledge base (datasets, analyses, documentation)

import React, { useState, useEffect } from 'react';
import { Search, Book, Database, BarChart3, FileText, Bot, Clock, Star, Filter, X } from 'lucide-react';
import { getEnhancedOrchestrator } from '../../lib/agents/enhancedOrchestrator';
import { useAuth } from '../auth/AuthProvider';

interface SearchResult {
  title: string;
  content: string;
  type: string;
  created_at: string;
  relevance: number;
}

interface KnowledgeSearchPanelProps {
  className?: string;
  onResultClick?: (result: SearchResult) => void;
  datasetId?: string; // Filter to specific dataset
}

export const KnowledgeSearchPanel: React.FC<KnowledgeSearchPanelProps> = ({
  className = '',
  onResultClick,
  datasetId
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const documentTypes = {
    dataset: { icon: Database, label: 'Datasets', color: 'text-blue-600' },
    analysis: { icon: BarChart3, label: 'Analyses', color: 'text-green-600' },
    documentation: { icon: Book, label: 'Documentation', color: 'text-purple-600' },
    insight: { icon: Star, label: 'Insights', color: 'text-yellow-600' },
    model: { icon: Bot, label: 'Models', color: 'text-red-600' }
  };

  const searchKnowledgeBase = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const orchestrator = await getEnhancedOrchestrator();
      const searchResult = await orchestrator.searchKnowledgeBase(
        searchQuery,
        user?.id,
        datasetId
      );

      // Filter by selected types if any
      let filteredResults = searchResult.results;
      if (selectedFilters.length > 0) {
        filteredResults = searchResult.results.filter(result => 
          selectedFilters.includes(result.type)
        );
      }

      setResults(filteredResults);
      setTotal(filteredResults.length);
    } catch (error) {
      console.error('Knowledge search failed:', error);
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        searchKnowledgeBase(query);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, selectedFilters]);

  const toggleFilter = (type: string) => {
    setSelectedFilters(prev => 
      prev.includes(type) 
        ? prev.filter(f => f !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.8) return 'text-green-600';
    if (relevance >= 0.6) return 'text-yellow-600';
    return 'text-gray-500';
  };

  const getRelevanceLabel = (relevance: number) => {
    if (relevance >= 0.8) return 'High';
    if (relevance >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Search className="h-5 w-5 mr-2 text-blue-600" />
            Knowledge Search
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
            {selectedFilters.length > 0 && (
              <span className="ml-1 bg-blue-100 text-blue-800 text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {selectedFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search your datasets, analyses, and documentation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap gap-2">
              {Object.entries(documentTypes).map(([type, config]) => {
                const Icon = config.icon;
                const isSelected = selectedFilters.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleFilter(type)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                      isSelected
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {config.label}
                  </button>
                );
              })}
              {selectedFilters.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="p-4">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Searching knowledge base...</p>
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600">No results found for "{query}"</p>
            <p className="text-sm text-gray-500 mt-1">Try different keywords or check your filters</p>
          </div>
        )}

        {!loading && !query && (
          <div className="text-center py-8">
            <Book className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600">Start typing to search your knowledge base</p>
            <div className="mt-4 text-sm text-gray-500">
              <p>Search across:</p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {Object.entries(documentTypes).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <span key={type} className="inline-flex items-center text-xs">
                      <Icon className={`h-3 w-3 mr-1 ${config.color}`} />
                      {config.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Found {total} result{total !== 1 ? 's' : ''} for "{query}"
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result, index) => {
                const typeConfig = documentTypes[result.type as keyof typeof documentTypes];
                const Icon = typeConfig?.icon || FileText;
                
                return (
                  <div
                    key={index}
                    onClick={() => onResultClick?.(result)}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <Icon className={`h-4 w-4 mr-2 ${typeConfig?.color || 'text-gray-500'}`} />
                        <h4 className="font-medium text-gray-900 text-sm">{result.title}</h4>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <span className={`mr-2 ${getRelevanceColor(result.relevance)}`}>
                          {getRelevanceLabel(result.relevance)}
                        </span>
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(result.created_at)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{result.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${typeConfig?.color || 'text-gray-500'} bg-opacity-10`}>
                        {typeConfig?.label || 'Unknown'}
                      </span>
                      <div className="text-xs text-gray-400">
                        Relevance: {(result.relevance * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KnowledgeSearchPanel;
