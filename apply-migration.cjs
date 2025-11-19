#!/usr/bin/env node

const https = require('https');

const SUPABASE_URL = 'https://bcobpxgktvgfsffdsiog.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjb2JweGdrdHZnZnNmZmRzaW9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg0MTU0NCwiZXhwIjoyMDc2NDE3NTQ0fQ.xeZngmMwgslyh_upNSXB-Kc05y5CD_bFP0v-8wNEw6M';

const migrationSQL = `
-- Add onboarding fields to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS use_case TEXT,
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS objectives TEXT[],
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON user_profiles(onboarding_completed);
`;

console.log('🚀 Applying migration to Supabase...\n');

const data = JSON.stringify({ query: migrationSQL });

const options = {
  hostname: 'bcobpxgktvgfsffdsiog.supabase.co',
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Migration applied successfully!');
      console.log('\n📋 Columns added to user_profiles table:');
      console.log('  - use_case (TEXT)');
      console.log('  - profession (TEXT)');
      console.log('  - industry (TEXT)');
      console.log('  - objectives (TEXT[])');
      console.log('  - onboarding_completed (BOOLEAN)');
      console.log('  - onboarding_skipped (BOOLEAN)');
      console.log('  - onboarding_completed_at (TIMESTAMPTZ)');
      console.log('\n🔍 Index created: idx_user_profiles_onboarding');
      console.log('\n✨ Your onboarding flow is now ready to use!');
    } else {
      console.error(`❌ Migration failed with status ${res.statusCode}`);
      console.error('Response:', responseData);
      console.log('\n💡 Trying alternative method...');
      applyViaPostgREST();
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error applying migration:', error.message);
  console.log('\n💡 Trying alternative method...');
  applyViaPostgREST();
});

req.write(data);
req.end();

// Alternative method using direct SQL execution
function applyViaPostgREST() {
  const statements = [
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS use_case TEXT`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profession TEXT`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS industry TEXT`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS objectives TEXT[]`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ`,
    `CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON user_profiles(onboarding_completed)`
  ];

  console.log('\n📝 Please run these SQL statements manually in Supabase SQL Editor:');
  console.log('🔗 https://supabase.com/dashboard/project/bcobpxgktvgfsffdsiog/sql/new\n');
  statements.forEach((stmt, i) => {
    console.log(`${i + 1}. ${stmt};`);
  });
  console.log('\n✅ Safe to run - uses IF NOT EXISTS to prevent errors');
}
