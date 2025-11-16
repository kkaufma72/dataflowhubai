import React from 'react';
import { useDrag } from 'react-dnd';
import { Dataset } from '../../types';
import Card from '../common/Card';
import { Database, Trash2 } from 'lucide-react';

interface DraggableDatasetProps {
  dataset: Dataset;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onClick?: () => void;
  onDelete?: (id: string) => void;
}

const DraggableDataset: React.FC<DraggableDatasetProps> = ({
  dataset,
  onDragStart,
  onDragEnd,
  onClick,
  onDelete,
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'dataset',
    item: () => {
      onDragStart?.();
      return { id: dataset.id };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (_item, monitor) => {
      // Only call onDragEnd if the item was successfully dropped
      const didDrop = monitor.didDrop();
      if (didDrop && onDragEnd) {
        onDragEnd();
      }
    },
  }));

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick
    if (onDelete && window.confirm(`Are you sure you want to delete "${dataset.name}"?`)) {
      onDelete(dataset.id);
    }
  };

  return (
    <div
      ref={drag}
      className={`cursor-move transition-all ${isDragging ? 'opacity-50' : ''}`}
      onClick={onClick}
    >
      <Card className="hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
              <Database className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">{dataset.name ?? 'Untitled Dataset'}</h3>
              <p className="mt-1 text-xs text-gray-500">
                {dataset.rows?.toLocaleString() ?? '0'} rows • {dataset.columns ?? 0} columns
              </p>
            </div>
          </div>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete dataset"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DraggableDataset;