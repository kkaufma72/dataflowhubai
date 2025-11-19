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
      console.log('ℹ️ User already has sample datasets, skipping seed');
      return existingDatasets;
    }
    
    console.log('Seeding enhanced sample datasets...');
    
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
        console.log('✅ Using existing project:', validProjectId);
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
        console.log('✅ Created new project:', validProjectId);
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