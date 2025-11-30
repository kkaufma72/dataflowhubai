// src/utils/seedDatasets.ts

import { supabase } from '../lib/supabase';
import { generateEnhancedSampleDatasets } from '../lib/enhancedSampleData';

export const seedEnhancedDatasets = async (userId: string, projectId: string | null = null) => {
  try {
    const datasets = generateEnhancedSampleDatasets();
    
    // Check if these specific sample datasets already exist for this user
    const sampleIds = datasets.map(d => d.id);
    const { data: existingDatasets, error: checkError } = await supabase
      .from('datasets')
      .select('id')
      .eq('user_id', userId)
      .in('id', sampleIds);
    
    if (checkError) {
      console.warn('Could not check existing datasets:', checkError);
    }
    
    if (existingDatasets && existingDatasets.length > 0) {
      // User already has sample datasets - skip silently
      return existingDatasets;
    }
    
    // Ensure we have a valid project_id (database requires it)
    let validProjectId = projectId;
    
    if (!validProjectId) {
      // Try to get user's default project or create one
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      if (projects && projects.length > 0) {
        validProjectId = projects[0].id;
      } else {
        // Create a default project
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert({
            name: 'Sample Workspace',
            description: 'Sample datasets and models',
            user_id: userId,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();
        
        if (createError) {
          console.error('Failed to create project:', createError);
          throw new Error('Could not create default project');
        }
        
        validProjectId = newProject.id;
      }
    }
    
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
      project_id: validProjectId, // Always include project_id (required by database)
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { data, error } = await supabase
      .from('datasets')
      .insert(datasetsToInsert)
      .select();
    
    if (error) {
      // Silently handle conflict errors (datasets already exist)
      if (error.code === '23505') {
        return [];
      }
      throw error;
    }
    
    return data;
  } catch (error: any) {
    // Silently handle conflict errors
    if (error?.code === '23505') {
      return [];
    }
    throw error;
  }
};

// Function to check if sample datasets exist
export const hasSampleDatasets = async (projectId: string) => {
  try {
    const datasets = generateEnhancedSampleDatasets();
    const sampleIds = datasets.map(d => d.id);
    
    const { data, error } = await supabase
      .from('datasets')
      .select('id')
      .eq('project_id', projectId)
      .in('id', sampleIds);
    
    if (error) throw error;
    
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking sample datasets:', error);
    return false;
  }
};