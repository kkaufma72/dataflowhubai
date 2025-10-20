import React, { useState, useMemo } from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { Dataset } from '../../types';
import { useDebouncedValue } from '../../lib/performance';
import Button from '../common/Button';

interface DatasetSearchFilterProps {
  datasets: Dataset[];
  onFilteredDatasetsChange: (datasets: Dataset[]) => void;
}

const DatasetSearchFilter: React.FC<DatasetSearchFilterProps> = ({
  datasets,
  onFilteredDatasetsChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    fileType: 'all',
    minRows: 0,
    maxRows: Infinity,
    sortBy: 'newest' as 'newest' | 'oldest' | 'name' | 'size',
  });

  // Debounce search term to avoid filtering on every keystroke
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // Memoize filtered datasets to avoid recalculation on every render
  const filteredDatasets = useMemo(() => {
    let result = [...datasets];

    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      result = result.filter(
        (dataset) =>
          dataset.name.toLowerCase().includes(searchLower) ||
          dataset.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply file type filter
    if (filters.fileType !== 'all') {
      result = result.filter(
        (dataset) => dataset.file_type?.toLowerCase() === filters.fileType
      );
    }

    // Apply row count filters
    result = result.filter(
      (dataset) =>
        (dataset.row_count || 0) >= filters.minRows &&
        (dataset.row_count || 0) <= filters.maxRows
    );

    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        result.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        );
        break;
      case 'oldest':
        result.sort(
          (a, b) =>
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime()
        );
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'size':
        result.sort((a, b) => (b.row_count || 0) - (a.row_count || 0));
        break;
    }

    return result;
  }, [datasets, debouncedSearchTerm, filters]);

  // Update parent component when filtered datasets change
  React.useEffect(() => {
    onFilteredDatasetsChange(filteredDatasets);
  }, [filteredDatasets, onFilteredDatasetsChange]);

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleClearFilters = () => {
    setFilters({
      fileType: 'all',
      minRows: 0,
      maxRows: Infinity,
      sortBy: 'newest',
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.fileType !== 'all') count++;
    if (filters.minRows > 0) count++;
    if (filters.maxRows < Infinity) count++;
    if (filters.sortBy !== 'newest') count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search datasets by name or description..."
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          icon={<SlidersHorizontal className="w-4 h-4" />}
        >
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-600">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredDatasets.length} of {datasets.length} datasets
        </span>
        {(debouncedSearchTerm || activeFilterCount > 0) && (
          <button
            onClick={() => {
              handleClearSearch();
              handleClearFilters();
            }}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filter Options</h3>
            <button
              onClick={handleClearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Reset filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* File Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Type
              </label>
              <select
                value={filters.fileType}
                onChange={(e) =>
                  setFilters({ ...filters, fileType: e.target.value })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">All Types</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="excel">Excel</option>
                <option value="xlsx">XLSX</option>
              </select>
            </div>

            {/* Min Rows Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Rows
              </label>
              <input
                type="number"
                value={filters.minRows || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    minRows: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Max Rows Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Rows
              </label>
              <input
                type="number"
                value={filters.maxRows === Infinity ? '' : filters.maxRows}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    maxRows: e.target.value
                      ? parseInt(e.target.value)
                      : Infinity,
                  })
                }
                placeholder="No limit"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Sort By Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    sortBy: e.target.value as any,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="size">Size (Largest)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetSearchFilter;