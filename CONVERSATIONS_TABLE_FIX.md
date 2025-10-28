# 🔧 Fix: Conversations Table 404 Error

## ❌ The Error

```
404 Not Found: /rest/v1/conversations
Could not save to database, using localStorage
```

## ✅ The Fix

The `conversations` table migration exists but hasn't been applied to your Supabase database yet.

### Quick Fix (2 minutes):

```bash
# Apply the conversations table migration
npx supabase db push

# OR manually run the migration:
npx supabase migration up
```

### Alternative - SQL Dashboard:

1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Paste and run this:

```sql
-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  dataset_name TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, dataset_id)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON public.conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX conversations_user_dataset_idx ON public.conversations(user_id, dataset_id);
```

4. Click **Run**
5. ✅ Done!

---

## Why This Happens

The conversations table stores AI chat history. Without it:
- ❌ 404 errors when saving chats
- ✅ Falls back to localStorage (works, but not ideal)

With it:
- ✅ Chat history saved to database
- ✅ Syncs across devices
- ✅ Better persistence

---

## Already Works (Fallback)

**Good news:** Your app already handles this gracefully!

- If table doesn't exist → Uses localStorage
- No user-facing errors
- Chat history still saved (locally)
- App continues working

---

## Quick Deploy Commands

```bash
# Option 1: Push all pending migrations
npx supabase db push

# Option 2: Just this migration
cd supabase/migrations
npx supabase migration up --file 20251026_conversations_table.sql

# Option 3: Reset and reapply all
npx supabase db reset
```

---

**The app works fine with localStorage fallback, but run the migration for better persistence!**

