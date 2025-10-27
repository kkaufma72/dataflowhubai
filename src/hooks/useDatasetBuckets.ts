/**
 * Dataset Buckets Hook
 * 
 * Manage dataset organization with buckets/categories
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import toast from 'react-hot-toast';

export interface DatasetBucket {
  id: string;
  name: string;
  color: string;
  description?: string;
  icon?: string;
  order: number;
}

const DEFAULT_BUCKETS: DatasetBucket[] = [
  {
    id: 'recent',
    name: 'Recent',
    color: '#3B82F6', // blue
    description: 'Recently uploaded',
    icon: 'Clock',
    order: 0
  },
  {
    id: 'active',
    name: 'Active Projects',
    color: '#10B981', // green
    description: 'Currently working on',
    icon: 'Zap',
    order: 1
  },
  {
    id: 'training',
    name: 'For Training',
    color: '#8B5CF6', // purple
    description: 'Ready for ML models',
    icon: 'Brain',
    order: 2
  },
  {
    id: 'archive',
    name: 'Archive',
    color: '#6B7280', // gray
    description: 'Completed or old',
    icon: 'Archive',
    order: 3
  }
];

export const useDatasetBuckets = () => {
  const { user } = useAuth();
  const [buckets, setBuckets] = useState<DatasetBucket[]>(DEFAULT_BUCKETS);
  const [datasetBuckets, setDatasetBuckets] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load bucket assignments from localStorage (or could be Supabase)
  useEffect(() => {
    if (user) {
      loadBucketAssignments();
    }
  }, [user]);

  const loadBucketAssignments = () => {
    try {
      const saved = localStorage.getItem(`dataset_buckets_${user?.id}`);
      if (saved) {
        setDatasetBuckets(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading bucket assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBucketAssignments = (assignments: Record<string, string>) => {
    try {
      localStorage.setItem(`dataset_buckets_${user?.id}`, JSON.stringify(assignments));
      setDatasetBuckets(assignments);
    } catch (error) {
      console.error('Error saving bucket assignments:', error);
      toast.error('Failed to save organization');
    }
  };

  const moveDatasetToBucket = (datasetId: string, targetBucket: string) => {
    const newAssignments = {
      ...datasetBuckets,
      [datasetId]: targetBucket
    };
    saveBucketAssignments(newAssignments);
    toast.success('Dataset moved!', { duration: 1500 });
  };

  const getDatasetBucket = (datasetId: string): string => {
    return datasetBuckets[datasetId] || 'recent';
  };

  const getDatasetsByBucket = (datasets: any[]) => {
    const byBucket: Record<string, any[]> = {};
    
    buckets.forEach(bucket => {
      byBucket[bucket.id] = [];
    });

    datasets.forEach(dataset => {
      const bucketId = getDatasetBucket(dataset.id);
      if (byBucket[bucketId]) {
        byBucket[bucketId].push(dataset);
      } else {
        // Default to recent if bucket doesn't exist
        byBucket['recent'].push(dataset);
      }
    });

    return byBucket;
  };

  const createCustomBucket = (name: string, color: string, description?: string) => {
    const newBucket: DatasetBucket = {
      id: `custom_${Date.now()}`,
      name,
      color,
      description,
      order: buckets.length
    };
    setBuckets([...buckets, newBucket]);
    toast.success(`Created bucket: ${name}`);
  };

  const deleteBucket = (bucketId: string) => {
    // Don't allow deleting default buckets
    if (DEFAULT_BUCKETS.some(b => b.id === bucketId)) {
      toast.error('Cannot delete default buckets');
      return;
    }

    // Move datasets from deleted bucket to recent
    const newAssignments = { ...datasetBuckets };
    Object.keys(newAssignments).forEach(datasetId => {
      if (newAssignments[datasetId] === bucketId) {
        newAssignments[datasetId] = 'recent';
      }
    });
    saveBucketAssignments(newAssignments);

    // Remove bucket
    setBuckets(buckets.filter(b => b.id !== bucketId));
    toast.success('Bucket deleted');
  };

  return {
    buckets,
    datasetBuckets,
    isLoading,
    moveDatasetToBucket,
    getDatasetBucket,
    getDatasetsByBucket,
    createCustomBucket,
    deleteBucket
  };
};

