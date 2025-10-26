import React from 'react';
import { useDrag } from 'react-dnd';
import { Dataset } from '../../types';
import Card from '../common/Card';
import { Database } from 'lucide-react';

interface DraggableDatasetProps {
  dataset: Dataset;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onClick?: () => void;
}

const DraggableDataset: React.FC<DraggableDatasetProps> = ({
  dataset,
  onDragStart,
  onDragEnd,
  onClick,
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
    end: (item, monitor) => {
      // Only call onDragEnd if the item was successfully dropped
      const didDrop = monitor.didDrop();
      if (didDrop && onDragEnd) {
        onDragEnd();
      }
    },
  }));

  return (
    <div
      ref={drag}
      className={`cursor-move transition-all ${isDragging ? 'opacity-50' : ''}`}
      onClick={onClick}
    >
      <Card className="hover:shadow-md">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
            <Database className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">{dataset.name ?? 'Untitled Dataset'}</h3>
            <p className="mt-1 text-xs text-gray-500">
              {dataset.rows?.toLocaleString() ?? '0'} rows • {dataset.columns ?? 0} columns
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DraggableDataset;