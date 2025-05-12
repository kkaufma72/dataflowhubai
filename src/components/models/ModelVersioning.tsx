import React, { useState } from 'react';
import { Card } from '../common/Card';
import { GitBranch, GitCommit, GitMerge, Download, Upload } from 'lucide-react';
import Button from '../common/Button';
import { MLModel } from '../../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ModelVersion {
  id: string;
  version: string;
  createdAt: string;
  metrics: Record<string, number>;
  hyperparameters: Record<string, any>;
  changes: string[];
}

interface ModelVersioningProps {
  model: MLModel;
  onVersionSelect: (version: ModelVersion) => void;
  onImport: (model: MLModel) => void;
}

const ModelVersioning: React.FC<ModelVersioningProps> = ({
  model,
  onVersionSelect,
  onImport
}) => {
  const [versions] = useState<ModelVersion[]>([
    {
      id: model.id,
      version: 'v1.0.0',
      createdAt: model.createdAt,
      metrics: model.metrics || {},
      hyperparameters: model.hyperparameters || {},
      changes: ['Initial model training']
    }
  ]);

  const handleExport = async () => {
    const zip = new JSZip();

    // Add model metadata
    const metadata = {
      id: model.id,
      name: model.name,
      description: model.description,
      type: model.modelType,
      metrics: model.metrics,
      hyperparameters: model.hyperparameters,
      createdAt: model.createdAt,
      versions: versions
    };

    zip.file('model-metadata.json', JSON.stringify(metadata, null, 2));

    // Add version history
    zip.file('version-history.json', JSON.stringify(versions, null, 2));

    // Add model configuration
    const config = {
      architecture: model.modelType,
      hyperparameters: model.hyperparameters,
      metrics: model.metrics
    };
    zip.file('model-config.json', JSON.stringify(config, null, 2));

    // Generate and download the zip file
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${model.name.toLowerCase().replace(/\s+/g, '-')}-${versions[0].version}.zip`);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const zip = await JSZip.loadAsync(e.target?.result as ArrayBuffer);
        
        // Read metadata
        const metadataFile = await zip.file('model-metadata.json')?.async('string');
        if (!metadataFile) throw new Error('Invalid model file: missing metadata');
        
        const metadata = JSON.parse(metadataFile);
        onImport(metadata);
      } catch (error) {
        console.error('Error importing model:', error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
            <GitBranch className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">Version Control</h3>
            <p className="mt-1 text-xs text-gray-500">
              Manage model versions and track changes
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            icon={<Download className="w-4 h-4" />}
          >
            Export
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".zip"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button
              variant="outline"
              size="sm"
              icon={<Upload className="w-4 h-4" />}
            >
              Import
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {versions.map((version, index) => (
          <div
            key={version.id}
            className={`p-4 border rounded-lg ${
              index === 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {index === 0 ? (
                  <GitCommit className="w-5 h-5 text-indigo-600 mr-2" />
                ) : (
                  <GitMerge className="w-5 h-5 text-gray-400 mr-2" />
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {version.version}
                    {index === 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                        Current
                      </span>
                    )}
                  </h4>
                  <p className="mt-1 text-xs text-gray-500">
                    Created on {new Date(version.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVersionSelect(version)}
                disabled={index === 0}
              >
                View
              </Button>
            </div>

            {version.changes.length > 0 && (
              <div className="mt-3 pl-7">
                <p className="text-xs font-medium text-gray-700">Changes:</p>
                <ul className="mt-1 space-y-1 text-xs text-gray-600 list-disc list-inside">
                  {version.changes.map((change, i) => (
                    <li key={i}>{change}</li>
                  ))}
                </ul>
              </div>
            )}

            {Object.keys(version.metrics).length > 0 && (
              <div className="mt-3 pl-7 grid grid-cols-2 gap-2">
                {Object.entries(version.metrics).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs font-medium text-gray-700">
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                    </p>
                    <p className="text-xs text-gray-900">
                      {typeof value === 'number' ? (value * 100).toFixed(2) + '%' : value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ModelVersioning;