// QUICK CLEANUP - Run this in browser console while logged in
// Copy and paste this entire block into your browser console

(async function cleanupNow() {
  console.log('🧹 Starting quick cleanup...');
  
  try {
    // Check if supabase is available
    if (!window.supabase) {
      console.error('❌ Supabase client not found on window object.');
      console.log('💡 This should be available in dev mode. Try refreshing the page.');
      return;
    }
    
    // Get current user
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Not logged in or error getting user:', userError);
      return;
    }
    
    console.log(`👤 Cleaning datasets for user: ${user.id}`);
    
    // Fetch all datasets for this user
    const { data: allDatasets, error: fetchError } = await window.supabase
      .from('datasets')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    
    if (fetchError) {
      console.error('❌ Error fetching datasets:', fetchError);
      return;
    }
    
    if (!allDatasets || allDatasets.length === 0) {
      console.log('✅ No datasets found');
      return;
    }
    
    console.log(`📊 Found ${allDatasets.length} total datasets`);
    
    // Group by name
    const nameGroups = {};
    allDatasets.forEach(dataset => {
      if (!nameGroups[dataset.name]) {
        nameGroups[dataset.name] = [];
      }
      nameGroups[dataset.name].push(dataset);
    });
    
    let totalDeleted = 0;
    
    // Process each group
    for (const [name, datasets] of Object.entries(nameGroups)) {
      if (datasets.length > 1) {
        console.log(`🔍 Found ${datasets.length} duplicates of "${name}"`);
        
        // Sort by created date, keep oldest
        const sorted = datasets.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        const [keep, ...toDelete] = sorted;
        console.log(`✅ Keeping: ${keep.id} (${keep.created_at})`);
        
        // Delete the rest
        for (const dup of toDelete) {
          console.log(`🗑️  Deleting: ${dup.id} (${dup.created_at})`);
          
          const { error: deleteError } = await window.supabase
            .from('datasets')
            .delete()
            .eq('id', dup.id);
          
          if (deleteError) {
            console.error(`❌ Error deleting ${dup.id}:`, deleteError);
          } else {
            totalDeleted++;
          }
        }
      }
    }
    
    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Deleted: ${totalDeleted} duplicates`);
    
    // Get final count
    const { count: finalCount } = await window.supabase
      .from('datasets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    console.log(`   Remaining: ${finalCount || 0} datasets\n`);
    
    if (totalDeleted > 0) {
      console.log('🔄 Reloading page to reflect changes...');
      setTimeout(() => window.location.reload(), 2000);
    }
    
  } catch (error) {
    console.error('💥 Cleanup error:', error);
  }
})();
