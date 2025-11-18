#!/bin/bash
# Apply onboarding migration to Supabase

echo "🔄 Applying onboarding fields migration..."
echo ""
echo "📋 SQL to run:"
echo "─────────────────────────────────────────────────"
cat supabase/migrations/20251118000000_add_onboarding_fields.sql
echo "─────────────────────────────────────────────────"
echo ""
echo "✅ To apply this migration, do ONE of the following:"
echo ""
echo "OPTION 1: Via Supabase Dashboard (Recommended)"
echo "  1. Go to: https://supabase.com/dashboard/project/bcobpxgktvgfsffdsiog/editor"
echo "  2. Click 'New Query' in SQL Editor"
echo "  3. Copy and paste the SQL above"
echo "  4. Click 'Run' (or press Cmd/Ctrl + Enter)"
echo ""
echo "OPTION 2: Via Supabase CLI"
echo "  1. Login: supabase login"
echo "  2. Link project: supabase link --project-ref bcobpxgktvgfsffdsiog"
echo "  3. Push migration: supabase db push"
echo ""
echo "Press Enter to copy the SQL to clipboard..."
read

# Copy to clipboard
cat supabase/migrations/20251118000000_add_onboarding_fields.sql | pbcopy
echo "✅ SQL copied to clipboard! Now paste it in Supabase Dashboard SQL Editor."
