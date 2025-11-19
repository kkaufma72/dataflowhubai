import React, { useState } from 'react';
import { Sparkles, Loader } from 'lucide-react';
import { seedEnhancedDatasets } from '../../utils/seedDatasets';
import { useAuth } from '../auth/AuthProvider';
import toast from 'react-hot-toast';

interface LoadSampleDataButtonProps {
  onSuccess?: () => void;
}

const LoadSampleDataButton: React.FC<LoadSampleDataButtonProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadSampleData = async () => {
    if (!user?.id) {
      toast.error('You must be signed in to load sample data');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🚀 Manually loading sample data...');
      await seedEnhancedDatasets(user.id, null);
      
      toast.success('Sample data loaded successfully! Refresh the page to see it.');
      
      // Set the flag so auto-load doesn't run again
      localStorage.setItem(`hasSeededDatasets_${user.id}`, 'true');
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reload the page to show the new data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error loading sample data:', error);
      toast.error('Failed to load sample data. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLoadSampleData}
      disabled={isLoading}
      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-lg font-medium transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Loader className="w-5 h-5 animate-spin" />
          Loading Sample Data...
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5" />
          Load 6 Sample Datasets
        </>
      )}
    </button>
  );
};

export default LoadSampleDataButton;
