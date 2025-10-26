import React, { memo } from 'react';
import { Dataset } from '../../types';
import { 
  Database, 
  Eye, 
  BarChart2, 
  MessageSquare, 
  Shield,
  Calendar,
  FileText,
  HardDrive
} from 'lucide-react';
import Button from '../common/Button';

interface DatasetCardProps {
  dataset: Dataset;
  onPreview: (dataset: Dataset) => void;
  onAnalyze: (dataset: Dataset) => void;
  onQualityCheck: (dataset: Dataset) => void;
  onChat: (dataset: Dataset) => void;
}

const DatasetCard: React.FC<DatasetCardProps> = ({
  dataset,
  onPreview,
  onAnalyze,
  onQualityCheck,
  onChat
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getUploadedDate = (): string => {
    // Support multiple dataset shapes: created_at, createdAt, dateUploaded
    const candidateDate =
      (dataset as any).created_at ||
      (dataset as any).createdAt ||
      (dataset as any).dateUploaded;

    return formatDate(candidateDate || new Date().toISOString());
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case 'csv':
        return '📊';
      case 'json':
        return '📋';
      case 'excel':
      case 'xlsx':
        return '📗';
      default:
        return '📄';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
              <span className="text-2xl">{getFileIcon((dataset as any).file_type || (dataset as any).fileType)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {dataset.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {dataset.description || 'No description provided'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Rows</p>
              <p className="text-sm font-semibold text-gray-900">
                {((dataset as any).row_count ?? (dataset as any).rows)?.toLocaleString?.() ||
                  ((dataset as any).rows != null ? (dataset as any).rows.toString() : 'N/A')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Columns</p>
              <p className="text-sm font-semibold text-gray-900">
                {((dataset as any).column_count ?? (dataset as any).columns) ?? 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Type</p>
              <p className="text-sm font-semibold text-gray-900 uppercase">
                {((dataset as any).file_type || (dataset as any).fileType) || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Size</p>
              <p className="text-sm font-semibold text-gray-900">
                {((dataset as any).file_size || (dataset as any).fileSize) || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
          <Calendar className="w-4 h-4 text-gray-400" />
          <p className="text-xs text-gray-500">Uploaded {getUploadedDate()}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 flex flex-wrap gap-2">
        <Button
          onClick={() => onPreview(dataset)}
          variant="outline"
          size="sm"
          icon={<Eye className="w-4 h-4" />}
          className="flex-1"
        >
          Preview
        </Button>
        <Button
          onClick={() => onQualityCheck(dataset)}
          variant="outline"
          size="sm"
          icon={<Shield className="w-4 h-4" />}
          className="flex-1"
        >
          Quality
        </Button>
      </div>

      <div className="px-6 pb-6 flex flex-wrap gap-2">
        <Button
          onClick={() => onAnalyze(dataset)}
          variant="outline"
          size="sm"
          icon={<BarChart2 className="w-4 h-4" />}
          className="flex-1"
        >
          Analyze
        </Button>
        <Button
          onClick={() => onChat(dataset)}
          variant="outline"
          size="sm"
          icon={<MessageSquare className="w-4 h-4" />}
          className="flex-1"
        >
          Ask AI
        </Button>
      </div>
    </div>
  );
};

// Memoize component with custom comparison function
export default memo(DatasetCard, (prevProps, nextProps) => {
  // Only re-render if dataset ID or updated_at changes
  return (
    prevProps.dataset.id === nextProps.dataset.id &&
    prevProps.dataset.updated_at === nextProps.dataset.updated_at
  );
});