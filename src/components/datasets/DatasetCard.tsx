import React from 'react';
import { Database, Calendar, FileText, BarChart3, Eye, Download } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

interface DatasetCardProps {
  dataset: {
    id: string;
    name: string;
    description?: string;
    row_count?: number;
    column_count?: number;
    file_size?: string;
    dateUploaded?: string;
    preview_data?: {
      columns?: string[];
      rows?: any[][];
    };
  };
  onPreview: (dataset: any) => void;
  onAnalyze: (dataset: any) => void;
}

const DatasetCard: React.FC<DatasetCardProps> = ({ dataset, onPreview, onAnalyze }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    return num.toLocaleString();
  };

  return (
    <Card className="h-full transition-all hover:shadow-xl hover:-translate-y-1 border-2 border-transparent hover:border-indigo-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {dataset.name}
            </h3>
            {dataset.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                {dataset.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase">Rows</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {formatNumber(dataset.row_count)}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase">Columns</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {dataset.column_count || dataset.preview_data?.columns?.length || 0}
          </p>
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Uploaded
          </span>
          <span className="text-gray-900 font-medium">
            {formatDate(dataset.dateUploaded)}
          </span>
        </div>
        
        {dataset.file_size && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center">
              <Download className="w-4 h-4 mr-1" />
              Size
            </span>
            <span className="text-gray-900 font-medium">
              {dataset.file_size}
            </span>
          </div>
        )}
      </div>

      {/* Column Preview */}
      {dataset.preview_data?.columns && dataset.preview_data.columns.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Columns</p>
          <div className="flex flex-wrap gap-1">
            {dataset.preview_data.columns.slice(0, 4).map((col, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium"
              >
                {col}
              </span>
            ))}
            {dataset.preview_data.columns.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                +{dataset.preview_data.columns.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPreview(dataset)}
          className="flex-1"
        >
          <Eye className="w-4 h-4 mr-1" />
          Preview
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onAnalyze(dataset)}
          className="flex-1"
        >
          <BarChart3 className="w-4 h-4 mr-1" />
          Analyze
        </Button>
      </div>
    </Card>
  );
};

export default DatasetCard;