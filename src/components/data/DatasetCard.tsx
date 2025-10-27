import React, { memo, useMemo } from 'react';
import { Dataset } from '../../types';
import { 
  Database, 
  Eye, 
  BarChart2, 
  MessageSquare, 
  Shield,
  Calendar,
  FileText,
  HardDrive,
  Sparkles
} from 'lucide-react';
import Button from '../common/Button';
import { calculateDatasetHealth, getHealthBadgeProps } from '../../utils/datasetHealthScore';

interface DatasetCardProps {
  dataset: Dataset;
  onPreview: (dataset: Dataset) => void;
  onAnalyze: (dataset: Dataset) => void;
  onQualityCheck: (dataset: Dataset) => void;
  onChat: (dataset: Dataset) => void;
  onTransform?: (dataset: Dataset) => void;
}

const DatasetCard: React.FC<DatasetCardProps> = ({
  dataset,
  onPreview,
  onAnalyze,
  onQualityCheck,
  onChat,
  onTransform
}) => {
  // Calculate health score
  const healthResult = useMemo(() => calculateDatasetHealth(dataset), [dataset]);
  const badgeProps = useMemo(() => getHealthBadgeProps(healthResult.score), [healthResult.score]);

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 relative">
      {/* Health Score Badge */}
      <div className="absolute top-3 right-3 z-10">
        <div 
          className="px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 border-2"
          style={{ 
            backgroundColor: healthResult.color + '15',
            color: healthResult.color,
            borderColor: healthResult.color + '40'
          }}
          title={`Health Score: ${healthResult.score}/100 - ${badgeProps.label}`}
        >
          <span>{badgeProps.emoji}</span>
          <span>{healthResult.score}</span>
          <span className="font-extrabold text-sm">{healthResult.grade}</span>
        </div>
      </div>

      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 pr-16">
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
          data-tour="health-score"
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
          data-tour="ask-ai"
        >
          Ask AI
        </Button>
      </div>
      
      {onTransform && (
        <div className="px-6 pb-6">
          <Button
            onClick={() => onTransform(dataset)}
            variant="primary"
            size="sm"
            icon={<Sparkles className="w-4 h-4" />}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            data-tour="transform-studio"
          >
            ✨ Transform with AI
          </Button>
        </div>
      )}
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