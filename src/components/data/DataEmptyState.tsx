// Enhanced Empty State for Data Management
// Provides clear direction with checklist and quick actions

import React from 'react';
import { Database, Upload, Sparkles, FileText, CheckSquare } from 'lucide-react';
import LoadSampleDataButton from './LoadSampleDataButton';

interface DataEmptyStateProps {
  onUploadClick: () => void;
  onGenerateSampleClick: () => void;
  onConnectClick?: () => void;
}

const DataEmptyState: React.FC<DataEmptyStateProps> = ({
  onUploadClick,
  onGenerateSampleClick,
  onConnectClick
}) => {
  return (
    <div className="text-center py-16 px-4">
      {/* Icon */}
      <div className="mb-6">
        <div className="inline-flex p-4 bg-gradient-to-br from-blue-500/10 to-green-500/10 rounded-2xl">
          <Database className="w-16 h-16 text-blue-500" />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-100 mb-3">
        Let's Get Your Data Connected
      </h2>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        Start by adding your first dataset. You can upload files, connect to databases, or generate sample data to explore.
      </p>

      {/* Checklist */}
      <div className="max-w-lg mx-auto mb-8 bg-gray-900 border border-gray-800 rounded-lg p-6 text-left">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-100 uppercase tracking-wide">
            Getting Started Checklist
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-white">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-100">Add your first dataset</p>
              <p className="text-xs text-gray-400 mt-1">Upload a CSV, Excel, or JSON file</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-gray-400">2</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">Review data quality</p>
              <p className="text-xs text-gray-500 mt-1">Check for missing values and outliers</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-gray-400">3</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">Train your first model</p>
              <p className="text-xs text-gray-500 mt-1">Select features and choose an algorithm</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-gray-400">4</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">Deploy and monitor</p>
              <p className="text-xs text-gray-500 mt-1">Go live and track performance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
        <LoadSampleDataButton />
        <button
          onClick={onUploadClick}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-lg shadow-blue-600/20"
        >
          <Upload className="w-5 h-5" />
          Upload Your Data
        </button>
        <button
          onClick={onGenerateSampleClick}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg font-medium transition border border-gray-700"
        >
          <Sparkles className="w-5 h-5" />
          Generate Synthetic Data
        </button>
      </div>

      {/* Connect Database (if provided) */}
      {onConnectClick && (
        <div className="mt-4">
          <button
            onClick={onConnectClick}
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mx-auto"
          >
            <FileText className="w-4 h-4" />
            Or connect to a database
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <p className="text-xs text-gray-500">
          Need help? Check out our{' '}
          <a href="/app/documentation" className="text-blue-400 hover:text-blue-300 underline">
            documentation
          </a>{' '}
          or{' '}
          <button className="text-blue-400 hover:text-blue-300 underline">
            watch a quick tutorial
          </button>
        </p>
      </div>
    </div>
  );
};

export default DataEmptyState;
