// Clear and reseed datasets with proper UUIDs
// Run this with: npx tsx clear-and-reseed.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearAndReseed() {
  console.log('🧹 Starting database cleanup...\n');

  try {
    // 1. Delete all models (they reference datasets)
    console.log('Deleting all models...');
    const { error: modelsError } = await supabase
      .from('models')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (modelsError) {
      console.error('Error deleting models:', modelsError);
    } else {
      console.log('✅ All models deleted');
    }

    // 2. Delete all datasets
    console.log('Deleting all datasets...');
    const { error: datasetsError } = await supabase
      .from('datasets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (datasetsError) {
      console.error('Error deleting datasets:', datasetsError);
    } else {
      console.log('✅ All datasets deleted');
    }

    console.log('\n✨ Database cleaned successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Clear your browser localStorage: localStorage.clear()');
    console.log('2. Refresh the app (Ctrl+Shift+R / Cmd+Shift+R)');
    console.log('3. Sample datasets will be reseeded automatically with proper UUIDs');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

clearAndReseed();
