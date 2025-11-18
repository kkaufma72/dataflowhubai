# 🚀 Apply Onboarding Migration - DO THIS NOW

## Quick Steps (2 minutes)

### 1. Open Supabase SQL Editor
Click this link: **https://supabase.com/dashboard/project/bcobpxgktvgfsffdsiog/editor**

### 2. Run This SQL
Copy and paste this into the SQL editor:

```sql
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
```

### 3. Click "Run" (or press Cmd+Enter)

### 4. Verify Success
You should see: **"Success. No rows returned"**

---

## ✅ Then Test The Feature

1. Open http://localhost:5173/ in **incognito mode**
2. Sign up with a new test account (use fake email like test123@test.com)
3. After login → Onboarding modal should appear!
4. Complete the 4 steps or click "Skip"
5. Open AI chat → See personalized message

---

## 🔍 Verify It Worked

Run this query in Supabase SQL Editor:

```sql
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN ('use_case', 'profession', 'industry', 'objectives', 'onboarding_completed')
ORDER BY column_name;
```

Should return 5 rows showing the new columns.

---

**Migration must be applied before the onboarding feature will work!**
