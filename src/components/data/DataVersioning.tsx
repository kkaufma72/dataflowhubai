import React, { useState } from 'react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import { 
  GitBranch, 
  GitCommit, 
  GitMerge, 
  Clock, 
  Check, 
  X, 
  Plus, 
  ArrowRight, 
  Download, 
  Upload,
  Tag,
  History,
  RefreshCw
} from 'lucide-react';
import { Dataset } from '../../types';
import toast from 'react-hot-toast';

interface DataVersion {
  id: string;
  datasetId: string;
  version: string;
  createdAt: string;
  createdBy: string;
  description: string;
  changes: string[];
  metadata: {
    rowCount: number;
    columnCount: number;
    fileSize: string;
    hash: string;
  };
  tags: string[];
}

interface DataVersioningProps {
  dataset: Dataset;
  onCreateVersion: (description: string) => Promise<void>;
  onRestoreVersion: (versionId: string) => Promise<void>;
  onCompareVersions: (versionId1: string, versionId2: string) => void;
}

const DataVersioning: React.FC<DataVersioningProps> = ({
  dataset,
  onCreateVersion,
  onRestoreVersion,
  onCompareVersions
}) => {
  const [versions, setVersions] = useState<DataVersion[]>([
    {
      id: 'v1',
      datasetId: dataset.id,
      version: '1.0.0',
      createdAt: dataset.dateUploaded,
      createdBy: 'Current User',
      description: 'Initial version',
      changes: ['Initial dataset upload'],
      metadata: {
        rowCount: dataset.rows,
        columnCount: dataset.columns,
        fileSize: dataset.fileSize,
        hash: 'a1b2c3d4e5f6g7h8i9j0'
      },
      tags: ['initial', 'raw']
    }
  ]);
  
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [versionDescription, setVersionDescription] = useState('');
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [compareVersions, setCompareVersions] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const handleCreateVersion = async () => {
    if (!versionDescription) {
      toast.error('Please provide a description for the new version');
      return;
    }
    
    setIsCreatingVersion(true);
    
    try {
      await onCreateVersion(versionDescription);
      
      // Simulate creating a new version
      const newVersion: DataVersion = {
        id: `v${versions.length + 1}`,
        datasetId: dataset.id,
        version: `1.0.${versions.length}`,
        createdAt: new Date().toISOString(),
        createdBy: 'Current User',
        description: versionDescription,
        changes: [versionDescription],
        metadata: {
          rowCount: dataset.rows + Math.floor(Math.random() * 10),
          columnCount: dataset.columns + (Math.random() > 0.7 ? 1 : 0),
          fileSize: `${parseFloat(dataset.fileSize) + 0.1} KB`,
          hash: Math.random().toString(36).substring(2, 15)
        },
        tags: []
      };
      
      setVersions([newVersion, ...versions]);
      setVersionDescription('');
      setShowCreateVersion(false);
      toast.success('New version created successfully');
    } catch (error) {
      toast.error('Failed to create new version');
      console.error('Error creating version:', error);
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      await onRestoreVersion(versionId);
      toast.success(`Restored to version ${versions.find(v => v.id === versionId)?.version}`);
    } catch (error) {
      toast.error('Failed to restore version');
      console.error('Error restoring version:', error);
    }
  };

  const handleCompareSelect = (versionId: string) => {
    if (compareVersions.includes(versionId)) {
      setCompareVersions(compareVersions.filter(id => id !== versionId));
    } else {
      if (compareVersions.length < 2) {
        setCompareVersions([...compareVersions, versionId]);
      } else {
        setCompareVersions([compareVersions[1], versionId]);
      }
    }
  };

  const handleCompareVersions = () => {
    if (compareVersions.length !== 2) {
      toast.error('Please select exactly 2 versions to compare');
      return;
    }
    
    setShowCompare(true);
    onCompareVersions(compareVersions[0], compareVersions[1]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
            <GitBranch className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">Data Versioning</h3>
            <p className="mt-1 text-xs text-gray-500">
              Track changes and manage versions of your dataset
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateVersion(!showCreateVersion)}
            icon={showCreateVersion ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          >
            {showCreateVersion ? 'Cancel' : 'Create Version'}
          </Button>
          {compareVersions.length > 0 && (
            <Button
              size="sm"
              onClick={handleCompareVersions}
              disabled={compareVersions.length !== 2}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Compare ({compareVersions.length}/2)
            </Button>
          )}
        </div>
      </div>

      {showCreateVersion && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Create New Version</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                rows={3}
                value={versionDescription}
                onChange={(e) => setVersionDescription(e.target.value)}
                placeholder="Describe the changes in this version"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleCreateVersion}
                disabled={isCreatingVersion || !versionDescription}
                icon={isCreatingVersion ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitCommit className="w-4 h-4" />}
              >
                {isCreatingVersion ? 'Creating...' : 'Create Version'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {versions.map((version, index) => (
          <div
            key={version.id}
            className={`p-4 border rounded-lg ${
              selectedVersion === version.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'
            } ${index === 0 ? 'bg-green-50 border-green-200' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {index === 0 ? (
                  <GitCommit className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <GitMerge className="w-5 h-5 text-indigo-600 mr-2" />
                )}
                <div>
                  <div className="flex items-center">
                    <h4 className="text-sm font-medium text-gray-900">
                      {version.version}
                    </h4>
                    {index === 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Current
                      </span>
                    )}
                    {version.tags.map(tag => (
                      <span key={tag} className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Created on {formatDate(version.createdAt)} by {version.createdBy}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={compareVersions.includes(version.id)}
                  onChange={() => handleCompareSelect(version.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                {index !== 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreVersion(version.id)}
                  >
                    Restore
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedVersion(selectedVersion === version.id ? null : version.id)}
                >
                  {selectedVersion === version.id ? 'Hide Details' : 'View Details'}
                </Button>
              </div>
            </div>

            {selectedVersion === version.id && (
              <div className="mt-4 pl-7">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h5 className="text-xs font-medium text-gray-700 mb-2">Description</h5>
                    <p className="text-sm text-gray-600">{version.description}</p>
                    
                    {version.changes.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-xs font-medium text-gray-700 mb-2">Changes</h5>
                        <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
                          {version.changes.map((change, i) => (
                            <li key={i}>{change}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h5 className="text-xs font-medium text-gray-700 mb-2">Metadata</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rows:</span>
                        <span className="font-medium text-gray-900">{version.metadata.rowCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Columns:</span>
                        <span className="font-medium text-gray-900">{version.metadata.columnCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Size:</span>
                        <span className="font-medium text-gray-900">{version.metadata.fileSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Hash:</span>
                        <span className="font-mono text-xs text-gray-900">{version.metadata.hash}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Tag className="w-4 h-4" />}
                  >
                    Add Tag
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<History className="w-4 h-4" />}
                  >
                    View History
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                  >
                    Download
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showCompare && compareVersions.length === 2 && (
        <div className="mt-6 p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">Version Comparison</h4>
            <button
              onClick={() => setShowCompare(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {compareVersions.map(versionId => {
              const version = versions.find(v => v.id === versionId);
              if (!version) return null;
              
              return (
                <div key={versionId} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-3">
                    <GitCommit className="w-5 h-5 text-indigo-600 mr-2" />
                    <h5 className="text-sm font-medium text-gray-900">Version {version.version}</h5>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span className="text-gray-900">{formatDate(version.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rows:</span>
                      <span className="text-gray-900">{version.metadata.rowCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Columns:</span>
                      <span className="text-gray-900">{version.metadata.columnCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Size:</span>
                      <span className="text-gray-900">{version.metadata.fileSize}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Changes Summary</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Row count changed: {Math.abs(versions.find(v => v.id === compareVersions[0])?.metadata.rowCount! - versions.find(v => v.id === compareVersions[1])?.metadata.rowCount!)} rows</li>
                    <li>Column count changed: {Math.abs(versions.find(v => v.id === compareVersions[0])?.metadata.columnCount! - versions.find(v => v.id === compareVersions[1])?.metadata.columnCount!)} columns</li>
                    <li>File size changed: {versions.find(v => v.id === compareVersions[0])?.metadata.fileSize} → {versions.find(v => v.id === compareVersions[1])?.metadata.fileSize}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default DataVersioning;