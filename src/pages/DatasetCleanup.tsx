import { useState } from 'react';
import { Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { cleanupMyDuplicates } from '../scripts/cleanupDuplicates';
import toast from 'react-hot-toast';

export default function DatasetCleanup() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    deleted: number;
    deletedIds?: string[];
    remaining: number;
  } | null>(null);

  const handleCleanup = async () => {
    if (!confirm('This will delete all duplicate datasets (keeping the oldest copy of each). Continue?')) {
      return;
    }

    setIsRunning(true);
    setResults(null);

    try {
      toast.loading('Cleaning up duplicates...');
      const result = await cleanupMyDuplicates();
      
      if (result) {
        setResults(result);
        toast.dismiss();
        toast.success(`Deleted ${result.deleted} duplicate datasets!`);
      }
    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast.dismiss();
      toast.error(`Cleanup failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dataset Cleanup Tool
              </h1>
              <p className="text-gray-600 mt-1">
                Remove duplicate datasets from your account
              </p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">
                Important Information
              </h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• This will find all datasets with the same name</li>
                <li>• It will keep the <strong>oldest copy</strong> (first created)</li>
                <li>• All newer duplicates will be permanently deleted</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <button
            onClick={handleCleanup}
            disabled={isRunning}
            className={`
              w-full px-6 py-3 rounded-lg font-semibold text-white
              ${isRunning 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700'
              }
              transition-colors flex items-center justify-center gap-2
            `}
          >
            <Trash2 className="w-5 h-5" />
            {isRunning ? 'Cleaning up...' : 'Run Cleanup'}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900 text-lg mb-2">
                  Cleanup Complete!
                </h3>
                <div className="text-sm text-green-800 space-y-1">
                  <p>✅ Deleted <strong>{results.deleted}</strong> duplicate datasets</p>
                  <p>📊 Remaining datasets: <strong>{results.remaining}</strong></p>
                </div>

                {results.deletedIds && results.deletedIds.length > 0 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-green-900">
                      Show deleted IDs ({results.deletedIds.length})
                    </summary>
                    <div className="mt-2 p-3 bg-white rounded border border-green-200">
                      <ul className="text-xs text-gray-700 space-y-1 font-mono">
                        {results.deletedIds.map(id => (
                          <li key={id}>{id}</li>
                        ))}
                      </ul>
                    </div>
                  </details>
                )}
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Reload Page to See Changes
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">How it works:</h3>
          <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
            <li>Scans all your datasets and groups them by name</li>
            <li>For each group of duplicates, sorts by creation date</li>
            <li>Keeps the oldest dataset and deletes all newer copies</li>
            <li>Shows you a summary of what was deleted</li>
          </ol>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> After running cleanup, the root cause has been fixed - 
              sample datasets will no longer be created multiple times on login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
