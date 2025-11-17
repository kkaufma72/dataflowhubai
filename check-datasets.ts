import { supabase } from './src/lib/supabase';

async function checkDatasets() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log('Not logged in');
    return;
  }
  
  const { data, error } = await supabase
    .from('datasets')
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Total datasets:', data?.length || 0);
  console.log('Sample datasets (sample-*):', data?.filter(d => d.id.startsWith('sample-')).length || 0);
  console.log('User datasets:', data?.filter(d => !d.id.startsWith('sample-')).length || 0);
  
  // Show first 20
  console.log('\n📊 First 20 datasets:');
  data?.slice(0, 20).forEach((d, i) => {
    console.log(`${i + 1}. ${d.name} (${d.id}) - ${d.created_at}`);
  });
  
  // Group by name to find duplicates
  const nameGroups = data?.reduce((acc, d) => {
    acc[d.name] = (acc[d.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\n🔍 Duplicate dataset names:');
  Object.entries(nameGroups || {})
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      console.log(`  ${name}: ${count} copies`);
    });
}

checkDatasets();
