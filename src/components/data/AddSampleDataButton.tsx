// src/components/data/AddSampleDataButton.tsx

import React, { useState } from 'react';
import { Download, Sparkles, Check } from 'lucide-react';
import Button from '../common/Button';
import { seedEnhancedDatasets, hasSampleDatasets } from '../../utils/seedDatasets';
import { useMLContext } from '../../context/MLContext';
import { useAuth } from '../auth/AuthProvider';
import toast from 'react-hot-toast';

const AddSampleDataButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const { currentProject, refreshData } = useMLContext();
  const { user } = useAuth();

  React.useEffect(() => {
    const checkData = async () => {
      if (currentProject?.id) {
        const exists = await hasSampleDatasets(currentProject.id);
        setHasData(exists);
      }
    };
    checkData();
  }, [currentProject]);

  const handleAddSampleData = async () => {
    if (!user || !currentProject) {
      toast.error('Please sign in and select a project first');
      return;
    }

    setIsLoading(true);
    try {
      await seedEnhancedDatasets(user.id, currentProject.id);
      setHasData(true);
      
      // Refresh the data context
      if (refreshData) {
        await refreshData();
      } else {
        // Fallback: reload the page
        window.location.reload();
      }
    } catch (error) {
      console.error('Error adding sample data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (hasData) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
        <Check className="w-4 h-4" />
        <span>Sample datasets loaded</span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleAddSampleData}
      variant="outline"
      disabled={isLoading}
      className="relative overflow-hidden group"
    >
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Adding Sample Data...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
            <span>Add 6 Sample Datasets</span>
          </>
        )}
      </div>
    </Button>
  );
};

export default AddSampleDataButton;