/**
 * CRM-Style Database Header
 * 
 * Professional search bar with filters and quick actions
 */

import React, { useState } from 'react';
import { Search, Upload, Filter, SlidersHorizontal, Download, Sparkles, X } from 'lucide-react';
import Button from '../common/Button';

interface CRMDatabaseHeaderProps {
  totalCount: number;
  onSearch: (query: string) => void;
  onUpload: () => void;
  onFilter: (filters: any) => void;
  onBulkAction?: (action: string) => void;
  searchQuery?: string;
}

const CRMDatabaseHeader: React.FC<CRMDatabaseHeaderProps> = ({
  totalCount,
  onSearch,
  onUpload,
  onFilter,
  onBulkAction,
  searchQuery = ''
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [selectedFilters, setSelectedFilters] = useState({
    fileType: '',
    dateRange: '',
    sizeRange: ''
  });

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    onSearch(value);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    onSearch('');
  };

  return (
    <div className="space-y-4">
      {/* Search Bar & Actions */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search datasets by name, description, or columns..."
            className="block w-full pl-12 pr-12 py-3.5 text-base border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 text-gray-900 placeholder-gray-500"
          />
          {localSearch && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Upload Button */}
        <Button
          onClick={onUpload}
          icon={<Upload className="w-4 h-4" />}
          className="bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 text-white shadow-lg hover:shadow-xl px-6 py-3.5"
        >
          <span className="hidden sm:inline">Upload</span>
        </Button>

        {/* Filters Button */}
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          icon={<SlidersHorizontal className="w-4 h-4" />}
          className="px-4 py-3.5 border-2"
        >
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </div>

      {/* Stats & Bulk Actions Bar */}
      <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-primary/5 rounded-xl px-4 py-3 border border-gray-200">
        <div className="flex items-center space-x-6">
          <div>
            <p className="text-sm text-gray-600">Total Datasets</p>
            <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
          </div>
          {localSearch && (
            <div className="border-l border-gray-300 pl-6">
              <p className="text-sm text-gray-600">Search Results</p>
              <p className="text-2xl font-bold text-primary-600">{totalCount}</p>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {onBulkAction && (
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => onBulkAction('export')}
              variant="outline"
              size="sm"
              icon={<Download className="w-4 h-4" />}
            >
              Export All
            </Button>
            <Button
              onClick={() => onBulkAction('ai-insights')}
              variant="outline"
              size="sm"
              icon={<Sparkles className="w-4 h-4" />}
            >
              AI Insights
            </Button>
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-lg animate-slide-down">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-gray-900">Advanced Filters</h4>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* File Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                File Type
              </label>
              <select
                value={selectedFilters.fileType}
                onChange={(e) => {
                  const newFilters = { ...selectedFilters, fileType: e.target.value };
                  setSelectedFilters(newFilters);
                  onFilter(newFilters);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">All Types</option>
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="json">JSON</option>
                <option value="txt">TXT</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Date
              </label>
              <select
                value={selectedFilters.dateRange}
                onChange={(e) => {
                  const newFilters = { ...selectedFilters, dateRange: e.target.value };
                  setSelectedFilters(newFilters);
                  onFilter(newFilters);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            {/* Size Range Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dataset Size
              </label>
              <select
                value={selectedFilters.sizeRange}
                onChange={(e) => {
                  const newFilters = { ...selectedFilters, sizeRange: e.target.value };
                  setSelectedFilters(newFilters);
                  onFilter(newFilters);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">All Sizes</option>
                <option value="small">Small (&lt;1k rows)</option>
                <option value="medium">Medium (1k-10k)</option>
                <option value="large">Large (10k-100k)</option>
                <option value="xlarge">X-Large (&gt;100k)</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => {
                setSelectedFilters({ fileType: '', dateRange: '', sizeRange: '' });
                onFilter({});
              }}
              variant="outline"
              size="sm"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMDatabaseHeader;

