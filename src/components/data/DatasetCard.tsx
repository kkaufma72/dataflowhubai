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
  Sparkles,
  Trash2,
  Archive,
  MoreVertical,
  FolderOpen
} from 'lucide-react';
import Button from '../common/Button';
import { calculateDatasetHealth, getHealthBadgeProps } from '../../utils/datasetHealthScore';
import KnowledgeInsightsBadge from '../common/KnowledgeInsightsBadge';

interface DatasetCardProps {
  dataset: Dataset;
  onPreview: (dataset: Dataset) => void;
  onAnalyze: (dataset: Dataset) => void;
  onQualityCheck: (dataset: Dataset) => void;
  onChat: (dataset: Dataset) => void;
  onTransform?: (dataset: Dataset) => void;
  onDelete?: (dataset: Dataset) => void;
  onArchive?: (dataset: Dataset) => void;
  onMove?: (dataset: Dataset) => void;
}

const DatasetCard: React.FC<DatasetCardProps> = ({
  dataset,
  onPreview,
  onAnalyze,
  onQualityCheck,
  onChat,
  onTransform,
  onDelete,
  onArchive,
  onMove
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  
  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);
  
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
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <span className="text-xl">{getFileIcon((dataset as any).file_type || (dataset as any).fileType)}</span>
          </div>
          
          {/* Title and Description */}
          <div className="flex-1 min-w-0 max-w-none">
            <h3 className="text-base font-semibold text-gray-900 break-words">
              {dataset.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
              {dataset.description || 'No description provided'}
            </p>
          </div>

          {/* Health Badge, Knowledge Badge, and Menu in a flex row */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {/* Knowledge Badge */}
            <KnowledgeInsightsBadge dataset={dataset} variant="inline" />
            
            {/* Health Score Badge */}
            <div 
              className="px-2 py-0.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 border-2"
              style={{ 
                backgroundColor: healthResult.color + '15',
                color: healthResult.color,
                borderColor: healthResult.color + '40'
              }}
              title={`Health Score: ${healthResult.score}/100 - ${badgeProps.label}`}
            >
              <span>{badgeProps.emoji}</span>
              <span>{healthResult.score}</span>
              <span className="font-extrabold">{healthResult.grade}</span>
            </div>

            {/* Actions Menu */}
            {(onMove || onDelete || onArchive) && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  title="More actions"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>
              
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-40">
                    {onMove && (
                      <button
                        onClick={() => {
                          onMove(dataset);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                      >
                        <FolderOpen className="w-4 h-4" />
                        Move to Project
                      </button>
                    )}
                    {onArchive && (
                      <button
                        onClick={() => {
                          onArchive(dataset);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                      >
                        <Archive className="w-4 h-4" />
                        Archive
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${dataset.name}"? It will be moved to trash for 30 days.`)) {
                            onDelete(dataset);
                            setShowMenu(false);
                          }
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-2.5">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <Database className="w-3.5 h-3.5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Rows</p>
              <p className="text-sm font-semibold text-gray-900">
                {((dataset as any).row_count ?? (dataset as any).rows)?.toLocaleString?.() ||
                  ((dataset as any).rows != null ? (dataset as any).rows.toString() : 'N/A')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-3.5 h-3.5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Columns</p>
              <p className="text-sm font-semibold text-gray-900">
                {((dataset as any).column_count ?? (dataset as any).columns) ?? 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Type</p>
              <p className="text-sm font-semibold text-gray-900 uppercase">
                {((dataset as any).file_type || (dataset as any).fileType) || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <HardDrive className="w-3.5 h-3.5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Size</p>
              <p className="text-sm font-semibold text-gray-900">
                {((dataset as any).file_size || (dataset as any).fileSize) || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-xs text-gray-500">Uploaded {getUploadedDate()}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        <Button
          onClick={() => onPreview(dataset)}
          variant="outline"
          size="sm"
          icon={<Eye className="w-3.5 h-3.5" />}
          className="flex-1 text-xs"
        >
          Preview
        </Button>
        <Button
          onClick={() => onQualityCheck(dataset)}
          variant="outline"
          size="sm"
          icon={<Shield className="w-3.5 h-3.5" />}
          className="flex-1 text-xs"
          data-tour="health-score"
        >
          Quality
        </Button>
      </div>

      <div className="px-4 pb-4 flex flex-wrap gap-2">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            console.log('Analyze clicked for:', dataset.name);
            onAnalyze(dataset);
          }}
          variant="outline"
          size="sm"
          icon={<BarChart2 className="w-3.5 h-3.5" />}
          className="flex-1 text-xs"
        >
          Analyze
        </Button>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            console.log('Chat clicked for:', dataset.name);
            onChat(dataset);
          }}
          variant="outline"
          size="sm"
          icon={<MessageSquare className="w-3.5 h-3.5" />}
          className="flex-1 text-xs"
          data-tour="ask-ai"
        >
          Ask AI
        </Button>
      </div>
      
      {onTransform && (
        <div className="px-4 pb-4">
          <Button
            onClick={() => onTransform(dataset)}
            variant="primary"
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5" />}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 text-xs"
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
  // Only re-render if dataset ID or dateUploaded changes
  return (
    prevProps.dataset.id === nextProps.dataset.id &&
    prevProps.dataset.dateUploaded === nextProps.dataset.dateUploaded
  );
});