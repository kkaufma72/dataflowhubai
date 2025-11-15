/**
 * Dataset Organizer - Drag and Drop Interface
 * 
 * Organize datasets into buckets with drag and drop
 */

import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Dataset } from '../../types';
import { useDatasetBuckets } from '../../hooks/useDatasetBuckets';
import DatasetBucket from './DatasetBucket';
import { Folder, Brain, Zap, Clock, Archive, LayoutGrid, List, Plus } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';

interface DatasetOrganizerProps {
  datasets: Dataset[];
  onPreview?: (dataset: Dataset) => void;
  onDelete?: (dataset: Dataset) => void;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  Clock,
  Zap,
  Brain,
  Archive,
  Folder
};

const DatasetOrganizer: React.FC<DatasetOrganizerProps> = ({
  datasets,
  onPreview,
  onDelete
}) => {
  const {
    buckets,
    moveDatasetToBucket,
    getDatasetsByBucket,
    createCustomBucket
  } = useDatasetBuckets();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewBucket, setShowNewBucket] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');

  const datasetsByBucket = getDatasetsByBucket(datasets);

  const handleCreateBucket = () => {
    if (newBucketName.trim()) {
      createCustomBucket(
        newBucketName,
        '#6366F1', // indigo
        'Custom bucket'
      );
      setNewBucketName('');
      setShowNewBucket(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                📁 Organize Your Datasets
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Drag and drop datasets into buckets to organize your workflow
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-white rounded-lg border border-gray-300 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary/10 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary/10 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Add Custom Bucket */}
              <Button
                onClick={() => setShowNewBucket(!showNewBucket)}
                variant="outline"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
              >
                New Bucket
              </Button>
            </div>
          </div>

          {/* New Bucket Form */}
          {showNewBucket && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  placeholder="Bucket name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateBucket()}
                />
                <Button onClick={handleCreateBucket} size="sm">
                  Create
                </Button>
                <Button onClick={() => setShowNewBucket(false)} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Buckets Grid */}
        <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' 
            : 'space-y-4'
          }
        `}>
          {buckets.map((bucket) => {
            const Icon = bucket.icon ? iconMap[bucket.icon] : Folder;
            return (
              <DatasetBucket
                key={bucket.id}
                bucket={{
                  ...bucket,
                  icon: Icon
                }}
                datasets={datasetsByBucket[bucket.id] || []}
                onDrop={moveDatasetToBucket}
                onPreview={onPreview}
                onDelete={onDelete}
              />
            );
          })}
        </div>

        {/* Help Text */}
        {datasets.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600">💡</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  How to use buckets:
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Drag</strong> dataset cards to move them between buckets</li>
                  <li>• <strong>Click</strong> dataset name to preview data</li>
                  <li>• <strong>Organize</strong> by project phase, data type, or workflow</li>
                  <li>• <strong>Create custom buckets</strong> for your specific needs</li>
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DndProvider>
  );
};

export default DatasetOrganizer;

