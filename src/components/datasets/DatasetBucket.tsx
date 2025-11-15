/**
 * Dataset Bucket - Drop Zone for Organizing Datasets
 * 
 * Draggable containers for categorizing datasets
 */

import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { Folder, FolderOpen, Plus } from 'lucide-react';
import { Dataset } from '../../types';
import DraggableDatasetCard from './DraggableDatasetCard';

interface DatasetBucketProps {
  bucket: {
    id: string;
    name: string;
    color: string;
    icon?: React.ComponentType<any>;
    description?: string;
  };
  datasets: Dataset[];
  onDrop: (datasetId: string, targetBucket: string) => void;
  onPreview?: (dataset: Dataset) => void;
  onDelete?: (dataset: Dataset) => void;
}

const DatasetBucket: React.FC<DatasetBucketProps> = ({
  bucket,
  datasets,
  onDrop,
  onPreview,
  onDelete
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Drop functionality
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'DATASET',
    drop: (item: { id: string; bucket: string }) => {
      if (item.bucket !== bucket.id) {
        onDrop(item.id, bucket.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  drop(ref);

  const BucketIcon = bucket.icon || Folder;
  const isActive = isOver && canDrop;

  return (
    <div
      ref={ref}
      className={`
        relative rounded-xl border-2 p-4 min-h-[200px] transition-all duration-200
        ${isActive 
          ? 'border-primary bg-primary/5 shadow-lg scale-105' 
          : canDrop
          ? 'border-gray-300 bg-gray-50'
          : 'border-gray-200 bg-white'
        }
      `}
    >
      {/* Bucket Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${bucket.color}15, ${bucket.color}30)` }}
          >
            <BucketIcon className="w-5 h-5" style={{ color: bucket.color }} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {bucket.name}
            </h3>
            {bucket.description && (
              <p className="text-xs text-gray-500 mt-0.5">
                {bucket.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
            {datasets.length}
          </span>
        </div>
      </div>

      {/* Drop Zone Message */}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-xl pointer-events-none">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg border-2 border-primary">
            <p className="text-sm font-semibold text-primary-600">
              Drop to move here
            </p>
          </div>
        </div>
      )}

      {/* Datasets in Bucket */}
      {datasets.length > 0 ? (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {datasets.map((dataset) => (
            <DraggableDatasetCard
              key={dataset.id}
              dataset={dataset}
              bucket={bucket.id}
              onMoveBucket={onDrop}
              onPreview={onPreview}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          {isActive ? (
            <FolderOpen className="w-12 h-12 text-primary-400 mb-2" />
          ) : (
            <Folder className="w-12 h-12 text-gray-300 mb-2" />
          )}
          <p className="text-sm text-gray-500">
            {isActive ? 'Drop dataset here' : 'No datasets'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Drag datasets here to organize
          </p>
        </div>
      )}
    </div>
  );
};

export default DatasetBucket;

