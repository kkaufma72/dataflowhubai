// src/utils/seedDatasets.ts

import { supabase } from '../lib/supabase';
import { generateEnhancedSampleDatasets } from '../lib/enhancedSampleData';

export const seedEnhancedDatasets = async (userId: string, projectId: string | null = null) => {
  try {
    // IMPORTANT: Check if this user already has sample datasets to prevent duplicates
    const { data: existingDatasets, error: checkError } = await supabase
      .from('datasets')
      .select('id')
      .eq('user_id', userId)
      .like('id', 'sample-%')
      .limit(1);
    
    if (checkError) {
      console.warn('Could not check existing datasets:', checkError);
    }
    
    if (existingDatasets && existingDatasets.length > 0) {
      console.log('ℹ️ User already has sample datasets, skipping seed');
      return existingDatasets;
    }
    
    const datasets = generateEnhancedSampleDatasets();
    
    console.log('Seeding enhanced sample datasets...');
    
    // Delete existing sample datasets with matching IDs (cleanup safety)
    const { error: deleteError } = await supabase
      .from('datasets')
      .delete()
      .eq('user_id', userId)
      .in('id', datasets.map(d => d.id));
    
    if (deleteError) {
      console.warn('Could not delete existing samples:', deleteError);
    }
    
    // Insert all datasets
    const datasetsToInsert = datasets.map(dataset => ({
      id: dataset.id,
      name: dataset.name,
      description: dataset.description,
      file_type: dataset.file_type,
      file_size: dataset.file_size,
      row_count: dataset.row_count,
      column_count: dataset.column_count,
      preview_data: dataset.preview_data,
      user_id: userId,
      // Only include project_id if provided and valid
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
    
    console.log(`✅ Successfully seeded ${data?.length || 0} datasets for user ${userId}`);
    // Toast notification removed per user request
    
    return data;
  } catch (error) {
    console.error('Error in seedEnhancedDatasets:', error);
    // Toast notification removed per user request
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