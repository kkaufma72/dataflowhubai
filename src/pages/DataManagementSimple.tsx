/**
 * Simplified Data Management Page
 * 
 * Clean, easy-to-use interface without overwhelming features
 */

import React, { useState, useMemo } from 'react';
import { useMLContext } from '../context/MLContext';
import { Dataset } from '../types';
import { Database, Upload, Search, Eye, BarChart2, Trash2 } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useAuth } from '../components/auth/AuthProvider';
import { useDatasetActions } from '../hooks/useDatasetActions';
import toast from 'react-hot-toast';

const DataManagementSimple: React.FC = () => {
  const { datasets, currentProject } = useMLContext();
  const { user } = useAuth();
  const { deleteDataset } = useDatasetActions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploader, setShowUploader] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  // Simple search - just by name
  const filteredDatasets = useMemo(() => {
    if (!searchQuery) return datasets;
    return datasets.filter(ds => 
      ds.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [datasets, searchQuery]);

  const handleDelete = async (dataset: Dataset) => {
    if (!confirm(`Delete "${dataset.name}"?`)) return;
    
    const result = await deleteDataset(dataset, user?.id || '');
    if (result.success) {
      toast.success('Dataset deleted');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Simple Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          My Datasets
        </h1>
        <p className="text-gray-600 mt-2">
          {datasets.length} {datasets.length === 1 ? 'dataset' : 'datasets'}
        </p>
      </div>

      {/* Search & Upload Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search datasets..."
            className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <Button
          onClick={() => setShowUploader(true)}
          icon={<Upload className="w-5 h-5" />}
          className="px-6 py-3"
        >
          Upload
        </Button>
      </div>

      {/* Empty State */}
      {datasets.length === 0 && (
        <Card className="text-center py-16">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-10 h-10 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No datasets yet
          </h3>
          <p className="text-gray-600 mb-6">
            Upload your first dataset to get started
          </p>
          <Button
            onClick={() => setShowUploader(true)}
            icon={<Upload className="w-5 h-5" />}
          >
            Upload Dataset
          </Button>
        </Card>
      )}

      {/* Dataset List - Simple Cards */}
      {filteredDatasets.length > 0 && (
        <div className="space-y-3">
          {filteredDatasets.map((dataset) => (
            <Card
              key={dataset.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedDataset(dataset)}
            >
              <div className="flex items-center justify-between p-4">
                {/* Left: Info */}
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {dataset.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {dataset.row_count?.toLocaleString() || 0} rows • {dataset.column_count || 0} columns
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDataset(dataset);
                    }}
                    variant="outline"
                    size="sm"
                    icon={<Eye className="w-4 h-4" />}
                  >
                    View
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(dataset);
                    }}
                    variant="outline"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No Search Results */}
      {searchQuery && filteredDatasets.length === 0 && (
        <Card className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            No datasets found matching "{searchQuery}"
          </p>
          <Button
            onClick={() => setSearchQuery('')}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            Clear Search
          </Button>
        </Card>
      )}

      {/* Simple Upload Modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Upload Dataset</h2>
              <button onClick={() => setShowUploader(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-primary-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900 font-semibold mb-2">
                Click or drag file to upload
              </p>
              <p className="text-sm text-gray-600">
                CSV, Excel, or JSON files
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                className="hidden"
                id="file-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    toast.success(`Uploading ${file.name}...`);
                    // Handle upload
                    setShowUploader(false);
                  }
                }}
              />
              <label
                htmlFor="file-upload"
                className="inline-block mt-4 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer"
              >
                Choose File
              </label>
            </div>
          </Card>
        </div>
      )}

      {/* Simple Dataset Preview */}
      {selectedDataset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedDataset.name}
                </h2>
                <p className="text-gray-600 mt-1">
                  {selectedDataset.row_count?.toLocaleString()} rows • {selectedDataset.column_count} columns
                </p>
              </div>
              <button onClick={() => setSelectedDataset(null)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Preview Table */}
            {selectedDataset.preview_data && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {selectedDataset.preview_data.columns?.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left text-sm font-bold text-gray-900"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedDataset.preview_data.rows?.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {(Array.isArray(row) ? row : Object.values(row)).map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap"
                          >
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default DataManagementSimple;

