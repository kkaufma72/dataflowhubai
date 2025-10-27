# 🔧 Fix Conversations Table - Manual Steps

## Issue
The `conversations` table hasn't been applied to your Supabase database, causing 404 errors when the AI chat tries to save conversation history.

## Solution

You have two options:

### Option 1: Apply via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste this SQL:

```sql
-- Create conversations table for AI chat memory
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  dataset_id TEXT NOT NULL,
  dataset_name TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, dataset_id)
);

-- Add RLS policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations"
  ON conversations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own conversations
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
CREATE POLICY "Users can insert own conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
CREATE POLICY "Users can update own conversations"
  ON conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own conversations
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
CREATE POLICY "Users can delete own conversations"
  ON conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_dataset 
  ON conversations(user_id, dataset_id);

CREATE INDEX IF NOT EXISTS idx_conversations_updated_at 
  ON conversations(updated_at DESC);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_conversations_updated_at_trigger ON conversations;
CREATE TRIGGER update_conversations_updated_at_trigger
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();

COMMENT ON TABLE conversations IS 'Stores AI chat conversation history for context and personalization';
```

5. Click **Run** or press `Ctrl/Cmd + Enter`

### Option 2: Apply via Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link to your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
npx supabase db push
```

## What This Fixes

✅ **404 errors** when loading/saving conversations  
✅ **localStorage fallback** - conversations will save to database  
✅ **Conversation persistence** - chat history will be saved across sessions  
✅ **Multi-device sync** - conversations accessible from any device  

## After Applying

Refresh your app and you should see:
- ✅ No more 404 errors in console
- ✅ "💾 Conversation saved to database" instead of localStorage messages
- ✅ Chat history persists after page refresh

## Current Status

- ✅ JavaScript error **FIXED** - `isMarketingUser` now has safety wrapper
- ⏳ Database migration **PENDING** - needs manual application
- ✅ Migration file exists at: `supabase/migrations/20251026_conversations_table.sql`

