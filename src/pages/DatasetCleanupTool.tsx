import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import { Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface DatasetInfo {
  id: string;
  name: string;
  created_at: string;
}

interface DuplicateGroup {
  name: string;
  datasets: DatasetInfo[];
}

export default function DatasetCleanupTool() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const analyzeDatasets = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('id, name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setTotalCount(data?.length || 0);

      // Group by name to find duplicates
      const nameGroups: { [key: string]: DatasetInfo[] } = {};
      
      (data || []).forEach((dataset: DatasetInfo) => {
        if (!nameGroups[dataset.name]) {
          nameGroups[dataset.name] = [];
        }
        nameGroups[dataset.name].push(dataset);
      });

      // Filter to only groups with duplicates
      const duplicateGroups = Object.entries(nameGroups)
        .filter(([_, group]) => group.length > 1)
        .map(([name, datasets]) => ({ name, datasets }))
        .sort((a, b) => b.datasets.length - a.datasets.length);

      setDuplicates(duplicateGroups);

      if (duplicateGroups.length === 0) {
        toast.success('No duplicates found!');
      } else {
        const totalDupes = duplicateGroups.reduce((sum, g) => sum + g.datasets.length - 1, 0);
        toast.success(`Found ${totalDupes} duplicate datasets across ${duplicateGroups.length} groups`);
      }
    } catch (error: any) {
      console.error('Error analyzing datasets:', error);
      toast.error(error.message || 'Failed to analyze datasets');
    } finally {
      setAnalyzing(false);
    }
  };

  const cleanupDuplicates = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    if (duplicates.length === 0) {
      toast.error('No duplicates to clean up. Run analysis first.');
      return;
    }

    const totalToDelete = duplicates.reduce((sum, g) => sum + g.datasets.length - 1, 0);
    
    if (!window.confirm(`This will delete ${totalToDelete} duplicate datasets. Continue?`)) {
      return;
    }

    setLoading(true);
    let deletedCount = 0;

    try {
      for (const group of duplicates) {
        // Keep the oldest (first), delete the rest
        const [keep, ...toDelete] = group.datasets;
        
        console.log(`Keeping: ${keep.id} (${keep.name})`);
        
        for (const dataset of toDelete) {
          console.log(`Deleting: ${dataset.id} (${dataset.name})`);
          
          const { error } = await supabase
            .from('datasets')
            .delete()
            .eq('id', dataset.id);

          if (error) {
            console.error(`Error deleting ${dataset.id}:`, error);
            toast.error(`Failed to delete ${dataset.name}`);
          } else {
            deletedCount++;
          }
        }
      }

      toast.success(`Successfully deleted ${deletedCount} duplicate datasets!`);
      
      // Re-analyze after cleanup
      await analyzeDatasets();
    } catch (error: any) {
      console.error('Error during cleanup:', error);
      toast.error(error.message || 'Failed to clean up duplicates');
    } finally {
      setLoading(false);
    }
  };

  const deleteAllDatasets = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    if (!window.confirm(`⚠️ WARNING: This will delete ALL ${totalCount} datasets. This cannot be undone! Continue?`)) {
      return;
    }

    if (!window.confirm(`Are you absolutely sure? This will permanently delete ${totalCount} datasets.`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('datasets')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(`Deleted all ${totalCount} datasets`);
      setDuplicates([]);
      setTotalCount(0);
    } catch (error: any) {
      console.error('Error deleting all datasets:', error);
      toast.error(error.message || 'Failed to delete datasets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dataset Cleanup Tool</h1>
          <p className="text-gray-600 mb-6">
            Analyze and remove duplicate datasets from your account
          </p>

          {!user && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-800">Not Logged In</p>
                  <p className="text-sm text-yellow-700">Please log in to use this tool</p>
                </div>
              </div>
            </div>
          )}

          {totalCount > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-lg font-semibold text-blue-900">
                Total Datasets: {totalCount}
              </p>
              {duplicates.length > 0 && (
                <p className="text-sm text-blue-700 mt-1">
                  Found {duplicates.reduce((sum, g) => sum + g.datasets.length - 1, 0)} duplicates 
                  across {duplicates.length} groups
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={analyzeDatasets}
              disabled={analyzing || !user}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${analyzing ? 'animate-spin' : ''}`} />
              {analyzing ? 'Analyzing...' : 'Analyze Datasets'}
            </button>

            {duplicates.length > 0 && (
              <button
                onClick={cleanupDuplicates}
                disabled={loading || !user}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                {loading ? 'Cleaning...' : 'Clean Up Duplicates'}
              </button>
            )}

            {totalCount > 0 && (
              <button
                onClick={deleteAllDatasets}
                disabled={loading || !user}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors ml-auto"
              >
                <Trash2 className="w-5 h-5" />
                Delete All Datasets
              </button>
            )}
          </div>
        </div>

        {duplicates.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Duplicate Groups</h2>
            <div className="space-y-4">
              {duplicates.map((group, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                      {group.datasets.length} copies
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.datasets.map((dataset, dIdx) => (
                      <div
                        key={dataset.id}
                        className={`flex items-center justify-between p-3 rounded ${
                          dIdx === 0 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-red-50 border border-red-200'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-mono text-gray-600">{dataset.id}</p>
                          <p className="text-xs text-gray-500">
                            Created: {new Date(dataset.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          dIdx === 0 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                        }`}>
                          {dIdx === 0 ? 'KEEP' : 'DELETE'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalCount > 0 && duplicates.length === 0 && !analyzing && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-green-600 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Duplicates Found!</h3>
            <p className="text-gray-600">Your datasets are clean</p>
          </div>
        )}
      </div>
    </div>
  );
}
