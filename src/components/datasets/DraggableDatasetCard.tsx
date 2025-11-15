/**
 * Draggable Dataset Card - Compact & Moveable
 * 
 * Smaller cards that can be dragged into different buckets/categories
 */

import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Database, GripVertical, Calendar, BarChart3, Trash2 } from 'lucide-react';
import { Dataset } from '../../types';

interface DraggableDatasetCardProps {
  dataset: Dataset;
  bucket: string;
  onMoveBucket: (datasetId: string, targetBucket: string) => void;
  onPreview?: (dataset: Dataset) => void;
  onDelete?: (dataset: Dataset) => void;
}

const DraggableDatasetCard: React.FC<DraggableDatasetCardProps> = ({
  dataset,
  bucket,
  onMoveBucket,
  onPreview,
  onDelete
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Drag functionality
  const [{ isDragging }, drag] = useDrag({
    type: 'DATASET',
    item: { id: dataset.id, bucket },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Make the card draggable
  drag(ref);

  return (
    <div
      ref={ref}
      className={`
        group relative bg-white border-2 border-gray-200 rounded-lg p-3 
        transition-all duration-200 cursor-move
        hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5
        ${isDragging ? 'opacity-50 rotate-2 scale-95' : 'opacity-100'}
      `}
    >
      {/* Drag Handle */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete "${dataset.name}"?`)) {
              onDelete(dataset);
            }
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      )}

      {/* Content */}
      <div className="pl-6">
        {/* Icon & Title */}
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <h4 
            className="text-sm font-semibold text-gray-900 line-clamp-1 cursor-pointer hover:text-primary-600"
            onClick={() => onPreview?.(dataset)}
          >
            {dataset.name}
          </h4>
        </div>

        {/* Stats - Compact */}
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <BarChart3 className="w-3 h-3" />
            <span>{dataset.row_count?.toLocaleString() || 0} rows</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(dataset.created_at || dataset.dateUploaded || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* File info */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase">
            {dataset.file_type || 'CSV'}
          </span>
          <span className="text-xs text-gray-500">
            {dataset.file_size || 'Unknown size'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DraggableDatasetCard;

