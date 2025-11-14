// src/utils/seedDatasets.ts

import { supabase } from '../lib/supabase';
import { generateEnhancedSampleDatasets } from '../lib/enhancedSampleData';
import toast from 'react-hot-toast';

export const seedEnhancedDatasets = async (userId: string, projectId: string | null = null) => {
  try {
    const datasets = generateEnhancedSampleDatasets();
    
    console.log('Seeding enhanced sample datasets...');
    
    // Delete existing sample datasets first (optional)
    const { error: deleteError } = await supabase
      .from('datasets')
      .delete()
      .in('id', datasets.map(d => d.id));
    
    if (deleteError) {
      console.warn('Could not delete existing samples:', deleteError);
    }
    
    // Insert all datasets
    const datasetsToInsert = datasets.map(dataset => ({
      ...dataset,
      user_id: userId,
      // Don't include project_id if it's null
      ...(projectId && { project_id: projectId }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { data, error } = await supabase
      .from('datasets')
      .insert(datasetsToInsert)
      .select();
    
    if (error) {
      console.error('Error seeding datasets:', error);
      throw error;
    }
    
    console.log(`Successfully seeded ${data?.length || 0} datasets`);
    toast.success(`Added ${data?.length || 0} sample datasets with working previews!`);
    
    return data;
  } catch (error) {
    console.error('Error in seedEnhancedDatasets:', error);
    toast.error('Failed to seed sample datasets');
    throw error;
  }
};

// Function to check if sample datasets exist
export const hasSampleDatasets = async (projectId: string) => {
  try {
    const { data, error } = await supabase
      .from('datasets')
      .select('id')
      .eq('project_id', projectId)
      .like('id', 'sample-%');
    
    if (error) throw error;
    
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking sample datasets:', error);
    return false;
  }
};