// src/utils/seedDatasets.ts

import { supabase } from '../lib/supabase';
import { generateEnhancedSampleDatasets } from '../lib/enhancedSampleData';

export const seedEnhancedDatasets = async (userId: string, projectId: string | null = null) => {
  console.log('⏱️ Starting sample data seed...');
  const startTime = Date.now();
  
  try {
    const datasets = generateEnhancedSampleDatasets();
    console.log(`📊 Generated ${datasets.length} sample datasets locally`);
    
    // Get or create project in a single efficient query
    let validProjectId = projectId;
    
    if (!validProjectId) {
      console.log('🔍 Looking for existing project...');
      const { data: projects, error: projError } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      if (projError) {
        console.error('Project query error:', projError);
      }
      
      if (projects && projects.length > 0) {
        validProjectId = projects[0].id;
        console.log('✅ Found existing project:', validProjectId);
      } else {
        console.log('📁 Creating new project...');
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert({
            name: 'My Workspace',
            description: 'Default workspace for datasets and models',
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
    
    // Prepare datasets with unique IDs to avoid conflicts
    const timestamp = Date.now();
    const datasetsToInsert = datasets.map((dataset, index) => ({
      id: `sample-${userId.slice(0, 8)}-${index}-${timestamp}`,
      name: dataset.name,
      description: dataset.description,
      file_type: dataset.file_type,
      file_size: dataset.file_size,
      row_count: dataset.row_count,
      column_count: dataset.column_count,
      preview_data: dataset.preview_data,
      user_id: userId,
      project_id: validProjectId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    console.log('💾 Inserting datasets into Supabase...');
    const { data, error } = await supabase
      .from('datasets')
      .insert(datasetsToInsert)
      .select();
    
    if (error) {
      console.error('Insert error:', error);
      throw error;
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Sample data loaded in ${duration}ms`);
    
    return data;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ Sample data failed after ${duration}ms:`, error);
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
};