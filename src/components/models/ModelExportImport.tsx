import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Download, Upload, FileJson, FileText, Package2, Check, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import { MLModel } from '../../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
// Lazy-load papaparse only when importing CSV to avoid bundling it by default

interface ModelExportImportProps {
  model: MLModel;
  onImport: (model: MLModel) => void;
}

const ModelExportImport: React.FC<ModelExportImportProps> = ({ model, onImport }) => {
  const [exportFormat, setExportFormat] = useState<'zip' | 'json' | 'onnx'>('zip');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  const handleExport = async () => {
    switch (exportFormat) {
      case 'zip':
        await exportAsZip();
        break;
      case 'json':
        exportAsJson();
        break;
      case 'onnx':
        exportAsOnnx();
        break;
    }
  };

  const exportAsZip = async () => {
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
    };

    zip.file('model-metadata.json', JSON.stringify(metadata, null, 2));

    // Add model configuration
    const config = {
      architecture: model.modelType,
      hyperparameters: model.hyperparameters,
      metrics: model.metrics
    };
    zip.file('model-config.json', JSON.stringify(config, null, 2));

    // Add example code files
    const pythonExample = `
import json
import numpy as np

def load_model(model_path):
    # In a real implementation, this would load the model weights
    # For this example, we'll just load the configuration
    with open(model_path + '/model-config.json', 'r') as f:
        config = json.load(f)
    return config

def predict(model, input_data):
    # This is a placeholder for actual prediction logic
    # In a real implementation, this would use the loaded model
    return [0.8, 0.2]  # Example prediction probabilities

# Example usage
model = load_model('./model')
input_data = [1.0, 2.0, 3.0, 4.0]  # Example features
prediction = predict(model, input_data)
print(f"Prediction: {prediction}")
`;

    const javascriptExample = `
async function loadModel(modelPath) {
  // In a real implementation, this would load the model weights
  // For this example, we'll just load the configuration
  const response = await fetch(modelPath + '/model-config.json');
  const config = await response.json();
  return config;
}

function predict(model, inputData) {
  // This is a placeholder for actual prediction logic
  // In a real implementation, this would use the loaded model
  return [0.8, 0.2];  // Example prediction probabilities
}

// Example usage
async function main() {
  const model = await loadModel('./model');
  const inputData = [1.0, 2.0, 3.0, 4.0];  // Example features
  const prediction = predict(model, inputData);
  console.log("Prediction:", prediction);
}

main();
`;

    zip.file('examples/python_example.py', pythonExample);
    zip.file('examples/javascript_example.js', javascriptExample);

    // Generate sample predictions
    const sampleData = [];
    for (let i = 0; i < 10; i++) {
      const features = Array.from({ length: 5 }, () => Math.random() * 10);
      const prediction = Math.random() > 0.5 ? 1 : 0;
      const probability = 0.5 + Math.random() * 0.5;
      
      sampleData.push({
        features,
        prediction,
        probability
      });
    }
    
    zip.file('sample_predictions.json', JSON.stringify(sampleData, null, 2));

    // Generate and download the zip file
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${model.name.toLowerCase().replace(/\s+/g, '-')}-export.zip`);
  };

  const exportAsJson = () => {
    const modelData = {
      id: model.id,
      name: model.name,
      description: model.description,
      type: model.modelType,
      metrics: model.metrics,
      hyperparameters: model.hyperparameters,
      createdAt: model.createdAt,
    };

    const blob = new Blob([JSON.stringify(modelData, null, 2)], { type: 'application/json' });
    saveAs(blob, `${model.name.toLowerCase().replace(/\s+/g, '-')}.json`);
  };

  const exportAsOnnx = () => {
    // In a real implementation, this would convert the model to ONNX format
    // For this example, we'll just create a placeholder file
    const onnxPlaceholder = {
      format: 'ONNX',
      version: '1.0.0',
      model_name: model.name,
      metadata: {
        description: model.description,
        created_at: model.createdAt,
      }
    };

    const blob = new Blob([JSON.stringify(onnxPlaceholder, null, 2)], { type: 'application/octet-stream' });
    saveAs(blob, `${model.name.toLowerCase().replace(/\s+/g, '-')}.onnx`);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('idle');
    setImportMessage('');

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'zip') {
      importZip(file);
    } else if (fileExtension === 'json') {
      importJson(file);
    } else if (fileExtension === 'csv') {
      importCsv(file);
    } else {
      setImportStatus('error');
      setImportMessage('Unsupported file format. Please upload a .zip, .json, or .csv file.');
    }
  };

  const importZip = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const zip = await JSZip.loadAsync(e.target?.result as ArrayBuffer);
          
          // Read metadata
          const metadataFile = await zip.file('model-metadata.json')?.async('string');
          if (!metadataFile) throw new Error('Invalid model file: missing metadata');
          
          const metadata = JSON.parse(metadataFile);
          onImport(metadata);
          
          setImportStatus('success');
          setImportMessage('Model imported successfully!');
        } catch (error) {
          console.error('Error importing model:', error);
          setImportStatus('error');
          setImportMessage('Failed to import model. Invalid file format.');
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setImportStatus('error');
      setImportMessage('Failed to read file.');
    }
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const modelData = JSON.parse(content);
        onImport(modelData);
        
        setImportStatus('success');
        setImportMessage('Model imported successfully!');
      } catch (error) {
        console.error('Error importing model:', error);
        setImportStatus('error');
        setImportMessage('Failed to import model. Invalid JSON format.');
      }
    };
    reader.readAsText(file);
  };

  const importCsv = async (file: File) => {
    const Papa = (await import('papaparse')).default;
    Papa.parse(file, {
      header: true,
      complete: () => {
        try {
          // Convert CSV data to model format
          // This is a simplified example - in a real app, you'd need more logic
          const modelData: MLModel = {
            id: `imported-${Date.now()}`,
            name: file.name.replace('.csv', ''),
            description: `Imported from ${file.name}`,
            status: 'trained',
            datasetId: model.datasetId,
            projectId: model.projectId,
            createdAt: new Date().toISOString(),
            metrics: {
              accuracy: 0.85,
              precision: 0.83,
              recall: 0.82,
              f1Score: 0.84,
              auc: 0.86
            },
            hyperparameters: {
              imported: true,
              source: 'csv'
            }
          };
          
          onImport(modelData);
          
          setImportStatus('success');
          setImportMessage('Model imported successfully from CSV!');
        } catch (error) {
          console.error('Error importing model from CSV:', error);
          setImportStatus('error');
          setImportMessage('Failed to import model from CSV.');
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setImportStatus('error');
        setImportMessage('Failed to parse CSV file.');
      }
    });
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
            <Package2 className="w-6 h-6 text-primary-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">Export & Import</h3>
            <p className="mt-1 text-xs text-gray-500">
              Share models or use them in other environments
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Export Model</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className={`p-4 border rounded-lg cursor-pointer ${
                exportFormat === 'zip' ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => setExportFormat('zip')}
            >
              <div className="flex items-center">
                <FileJson className="w-5 h-5 text-primary mr-2" />
                <span className="text-sm font-medium text-gray-900">Complete Package (.zip)</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Includes model, metadata, and example code
              </p>
            </div>
            
            <div 
              className={`p-4 border rounded-lg cursor-pointer ${
                exportFormat === 'json' ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => setExportFormat('json')}
            >
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-primary mr-2" />
                <span className="text-sm font-medium text-gray-900">Model Config (.json)</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Model configuration and metadata only
              </p>
            </div>
            
            <div 
              className={`p-4 border rounded-lg cursor-pointer ${
                exportFormat === 'onnx' ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => setExportFormat('onnx')}
            >
              <div className="flex items-center">
                <Package2 className="w-5 h-5 text-primary mr-2" />
                <span className="text-sm font-medium text-gray-900">ONNX Format (.onnx)</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Portable format for machine learning models
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <Button
              onClick={handleExport}
              icon={<Download className="w-4 h-4" />}
            >
              Export Model
            </Button>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Import Model</h4>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  ZIP, JSON, or CSV file
                </p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept=".zip,.json,.csv"
                onChange={handleImport}
              />
            </label>
          </div>
          
          {importStatus === 'success' && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <div className="flex">
                <Check className="w-5 h-5 text-green-400" />
                <p className="ml-3 text-sm text-green-700">{importMessage}</p>
              </div>
            </div>
          )}
          
          {importStatus === 'error' && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="ml-3 text-sm text-red-700">{importMessage}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ModelExportImport;