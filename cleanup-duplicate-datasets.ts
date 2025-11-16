#!/usr/bin/env ts-node
/**
 * Cleanup script to remove duplicate datasets
 * Run with: npx ts-node cleanup-duplicate-datasets.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
  console.log('🧹 Starting duplicate dataset cleanup...\n');

  try {
    // Fetch all datasets
    const { data: allDatasets, error: fetchError } = await supabase
      .from('datasets')
      .select('id, name, created_at, user_id')
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    if (!allDatasets || allDatasets.length === 0) {
      console.log('✅ No datasets found');
      return;
    }

    console.log(`📊 Found ${allDatasets.length} total datasets\n`);

    // Group by user_id and name to find duplicates
    const groupedByUser: { [key: string]: typeof allDatasets } = {};
    
    allDatasets.forEach(dataset => {
      const key = dataset.user_id;
      if (!groupedByUser[key]) {
        groupedByUser[key] = [];
      }
      groupedByUser[key].push(dataset);
    });

    let totalDeleted = 0;

    // Process each user's datasets
    for (const [userId, userDatasets] of Object.entries(groupedByUser)) {
      console.log(`\n👤 Processing user: ${userId}`);
      console.log(`   Total datasets: ${userDatasets.length}`);

      // Group by name
      const nameGroups: { [key: string]: typeof userDatasets } = {};
      
      userDatasets.forEach(dataset => {
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
          const [keep, ...toDelete] = datasets.sort((a, b) => 
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
            }
          }
        }
      }
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Deleted ${totalDeleted} duplicate datasets`);

    // Show final count
    const { count: finalCount } = await supabase
      .from('datasets')
      .select('*', { count: 'exact', head: true });

    console.log(`   Remaining datasets: ${finalCount || 0}\n`);

  } catch (error: any) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
cleanupDuplicates().then(() => {
  console.log('🎉 Done!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
