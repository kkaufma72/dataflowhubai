import React, { useState } from 'react';
import { X, Play, Code, Filter, SortAsc, Database } from 'lucide-react';
import { Dataset } from '../../types';

interface QueryBuilderModalProps {
  dataset: Dataset;
  onClose: () => void;
}

const QueryBuilderModal: React.FC<QueryBuilderModalProps> = ({ dataset, onClose }) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filterColumn, setFilterColumn] = useState('');
  const [filterOperator, setFilterOperator] = useState('=');
  const [filterValue, setFilterValue] = useState('');
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [limit, setLimit] = useState(100);

  // Get column names from dataset preview_data
  const columns = dataset.preview_data?.columns || [];

  // Toggle column selection
  const toggleColumn = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  // Build query string
  const buildQuery = () => {
    const cols = selectedColumns.length > 0 ? selectedColumns.join(', ') : '*';
    let query = `SELECT ${cols}\nFROM ${dataset.name}`;

    if (filterColumn && filterValue) {
      query += `\nWHERE ${filterColumn} ${filterOperator} '${filterValue}'`;
    }

    if (sortColumn) {
      query += `\nORDER BY ${sortColumn} ${sortDirection.toUpperCase()}`;
    }

    query += `\nLIMIT ${limit};`;

    return query;
  };

  const generatedQuery = buildQuery();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d1117] border border-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">Query Builder</h2>
              <p className="text-sm text-gray-400">Build custom queries for {dataset.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Column Selection */}
          <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Select Columns
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {columns.map((column: string) => (
                <button
                  key={column}
                  onClick={() => toggleColumn(column)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedColumns.includes(column)
                      ? 'bg-blue-600 text-white border border-blue-500'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {column}
                </button>
              ))}
            </div>
            {selectedColumns.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">No columns selected (defaults to SELECT *)</p>
            )}
          </div>

          {/* Filter */}
          <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Add Filter (WHERE clause)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={filterColumn}
                onChange={(e) => setFilterColumn(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-300 text-sm"
              >
                <option value="">Select column...</option>
                {columns.map((column: string) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
              <select
                value={filterOperator}
                onChange={(e) => setFilterOperator(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-300 text-sm"
              >
                <option value="=">=</option>
                <option value="!=">!=</option>
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value=">=">&gt;=</option>
                <option value="<=">&lt;=</option>
                <option value="LIKE">LIKE</option>
              </select>
              <input
                type="text"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="Value..."
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-300 text-sm"
              />
            </div>
          </div>

          {/* Sort & Limit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <SortAsc className="w-4 h-4" />
                Sort By
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={sortColumn}
                  onChange={(e) => setSortColumn(e.target.value)}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-300 text-sm"
                >
                  <option value="">No sorting</option>
                  {columns.map((column: string) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
                <select
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-300 text-sm"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>

            <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Limit Results</h3>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                min={1}
                max={10000}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-300 text-sm"
              />
            </div>
          </div>

          {/* Generated Query Preview */}
          <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Code className="w-4 h-4" />
              Generated Query
            </h3>
            <pre className="bg-gray-900 border border-gray-700 rounded-md p-4 text-sm text-gray-300 font-mono overflow-x-auto">
              {generatedQuery}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-800 bg-[#0d1117]">
          <div className="text-sm text-gray-400">
            <span className="font-medium text-gray-300">{columns.length}</span> columns available
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-md transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // In future: execute query and show results
                alert('Query execution coming soon! Query:\n\n' + generatedQuery);
                onClose();
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-md flex items-center gap-2 transition-all shadow-lg"
            >
              <Play className="w-4 h-4" />
              Execute Query
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryBuilderModal;
