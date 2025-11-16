/**
 * Cleanup script to remove duplicate datasets
 * This should be imported and run from the browser console or a component
 */

import { supabase } from '../lib/supabase';

type DatasetRow = {
  id: string;
  name: string;
  created_at: string;
  user_id: string;
};

export async function cleanupDuplicateDatasets(userId?: string) {
  console.log('🧹 Starting duplicate dataset cleanup...\n');

  try {
    // Build query
    let query = supabase
      .from('datasets')
      .select('id, name, created_at, user_id')
      .order('created_at', { ascending: true });

    // Filter by user if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: allDatasets, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    if (!allDatasets || allDatasets.length === 0) {
      console.log('✅ No datasets found');
      return { deleted: 0, remaining: 0 };
    }

    console.log(`📊 Found ${allDatasets.length} total datasets\n`);

    // Group by user_id and name to find duplicates
    const groupedByUser: { [key: string]: DatasetRow[] } = {};
    
    allDatasets.forEach((dataset: DatasetRow) => {
      const key = dataset.user_id;
      if (!groupedByUser[key]) {
        groupedByUser[key] = [];
      }
      groupedByUser[key].push(dataset);
    });

    let totalDeleted = 0;
    const deletedIds: string[] = [];

    // Process each user's datasets
    for (const [currentUserId, userDatasets] of Object.entries(groupedByUser)) {
      console.log(`\n👤 Processing user: ${currentUserId}`);
      console.log(`   Total datasets: ${userDatasets.length}`);

      // Group by name
      const nameGroups: { [key: string]: DatasetRow[] } = {};
      
      userDatasets.forEach((dataset: DatasetRow) => {
        if (!nameGroups[dataset.name]) {
          nameGroups[dataset.name] = [];
        }
        nameGroups[dataset.name].push(dataset);
      });

      // Find duplicates
      for (const [name, datasets] of Object.entries(nameGroups)) {
        if (datasets.length > 1) {
          console.log(`   🔍 Found ${datasets.length} duplicates of "${name}"`);
          
          // Keep the oldest one (first created), delete the rest
          const [keep, ...toDelete] = datasets.sort((a: DatasetRow, b: DatasetRow) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

          console.log(`   ✅ Keeping: ${keep.id} (created ${keep.created_at})`);

          for (const duplicate of toDelete) {
            console.log(`   🗑️  Deleting: ${duplicate.id} (created ${duplicate.created_at})`);
            
            const { error: deleteError } = await supabase
              .from('datasets')
              .delete()
              .eq('id', duplicate.id);

            if (deleteError) {
              console.error(`   ❌ Error deleting ${duplicate.id}:`, deleteError.message);
            } else {
              totalDeleted++;
              deletedIds.push(duplicate.id);
            }
          }
        }
      }
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Deleted ${totalDeleted} duplicate datasets`);
    console.log(`   Deleted IDs:`, deletedIds);

    // Show final count
    const { count: finalCount } = await supabase
      .from('datasets')
      .select('*', { count: 'exact', head: true });

    console.log(`   Remaining datasets: ${finalCount || 0}\n`);

    return {
      deleted: totalDeleted,
      deletedIds,
      remaining: finalCount || 0
    };

  } catch (error: any) {
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  }
}

// Helper to run cleanup for current user only
export async function cleanupMyDuplicates() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('❌ No user logged in');
    return;
  }

  console.log(`🧹 Cleaning up duplicates for user: ${user.id}\n`);
  return cleanupDuplicateDatasets(user.id);
}
