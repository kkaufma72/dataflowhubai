# 🚨 CRITICAL SECURITY FIX REQUIRED

**Date:** $(date)
**Severity:** CRITICAL
**Status:** IMMEDIATE ACTION REQUIRED

---

## The Problem

Your **OpenAI API key is exposed** in client-side JavaScript code and committed to Git. This means:

- ❌ Anyone visiting your website can extract the API key
- ❌ Malicious actors can use your API key for unlimited OpenAI API calls
- ❌ You will be billed for all unauthorized usage
- ❌ Your API key could be used for spam, abuse, or illegal content generation
- ❌ OpenAI may suspend your account for key exposure

### Files Affected (44 total)

**Source Code (CRITICAL):**
- `src/lib/aiAgents.ts` ✅ FIXED
- `src/lib/agents/enhancedOrchestrator.ts` ⚠️ NEEDS FIX
- `src/lib/marketingBot.ts` ⚠️ NEEDS FIX
- `src/lib/agents/marketingAgent.ts` ⚠️ NEEDS FIX
- `src/components/data/PersonalizedDatasetChat.tsx` ⚠️ NEEDS FIX
- `src/components/data/DataTransformationStudio.tsx` ⚠️ NEEDS FIX
- `src/components/chat/PersistentChatSidebar.tsx` ⚠️ NEEDS FIX
- `src/components/ai/EnhancedAIChat.tsx` ⚠️ NEEDS FIX

**Documentation (contains actual API key):**
- `🚀_PRODUCTION_DEPLOYMENT_PACKAGE.md`
- `BLANK_SCREEN_FIX.md`
- `PERSONALIZED_CHAT_FEATURE.md`
- And 30+ other markdown files

---

## IMMEDIATE ACTIONS (Do These NOW)

### Step 1: Revoke the Exposed API Key (5 minutes)

1. Go to https://platform.openai.com/api-keys
2. Find the key starting with `sk-proj-bpKahJQYna...`
3. Click **Delete** or **Revoke**
4. Confirm deletion

⚠️ **Do this FIRST, before continuing!**

### Step 2: Create a New Secret API Key (2 minutes)

1. Still at https://platform.openai.com/api-keys
2. Click **+ Create new secret key**
3. Name it: `DataFlowHub-Production-Backend-Only`
4. Copy the key (you'll only see it once!)
5. **DO NOT commit this key to Git!**

### Step 3: Configure Supabase Edge Function (5 minutes)

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Edge Functions**
3. Add a new secret:
   - Name: `OPENAI_API_KEY`
   - Value: `<paste your new key>`
4. Click **Save**

Alternatively, use Supabase CLI:
```bash
supabase secrets set OPENAI_API_KEY=<your-new-key>
```

### Step 4: Deploy the Secure Edge Function (3 minutes)

```bash
# Deploy the new ai-chat Edge Function
supabase functions deploy ai-chat

# Verify it's working
supabase functions list
```

### Step 5: Remove VITE_OPENAI_API_KEY from Environment (2 minutes)

**Local development:**
1. Edit `.env.local` (create if doesn't exist)
2. **REMOVE** the line: `VITE_OPENAI_API_KEY=...`
3. Save the file

**Vercel/Netlify/Production:**
1. Go to your hosting dashboard
2. Navigate to **Environment Variables**
3. **DELETE** the `VITE_OPENAI_API_KEY` variable
4. Redeploy your application

**DO NOT** set the OpenAI key in production environment variables!

### Step 6: Clean Git History (OPTIONAL but recommended)

Since the API key was committed to Git, it's in your Git history:

```bash
# Install git-filter-repo if needed
# macOS: brew install git-filter-repo

# Remove the exposed key from all Git history
git filter-repo --replace-text <(echo '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==>***REMOVED***')

# Force push (WARNING: This rewrites history!)
git push --force --all
```

⚠️ **WARNING:** This rewrites Git history. Coordinate with your team first!

---

## How the Fix Works

### Before (INSECURE ❌)
```typescript
// Client-side code - ANYONE can see this!
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${apiKey}` // 🚨 API key exposed in browser!
  },
  body: JSON.stringify({...})
});
```

### After (SECURE ✅)
```typescript
// Client-side code - NO API key visible
import { secureAIChat } from './lib/secureAI';

const response = await secureAIChat({
  question: 'Analyze my data',
  dataset: myDataset,
  userProfile: userProfile
});

// API key is safely stored in Supabase Edge Function
// Only your backend can access it
```

### Architecture

```
┌─────────────────┐
│  Browser/Client │
│  (Public code)  │
└────────┬────────┘
         │
         │ HTTPS Request (no API key)
         │
         ▼
┌─────────────────────────┐
│  Supabase Edge Function │
│  (Secure backend)       │
│                         │
│  ┌─────────────────┐   │
│  │ OPENAI_API_KEY  │   │ ← Stored securely, not in code
│  │ (Secret)        │   │
│  └─────────────────┘   │
└────────┬────────────────┘
         │
         │ OpenAI API call with key
         │
         ▼
┌─────────────────┐
│   OpenAI API    │
└─────────────────┘
```

---

## Verification

After completing the steps above, verify the fix:

### 1. Check Environment Variables
```bash
# This should NOT contain OPENAI_API_KEY or VITE_OPENAI_API_KEY
grep -r "VITE_OPENAI_API_KEY" .env* || echo "✅ Good - no client-side key"
```

### 2. Check Built JavaScript
```bash
# Build your app
npm run build

# Check if API key is in the bundle
grep -r "sk-proj-" dist/ || echo "✅ Good - no API key in build"
grep -r "OPENAI_API_KEY" dist/ || echo "✅ Good - no references in build"
```

### 3. Test the Edge Function
```bash
# Test locally
supabase functions serve ai-chat

# In another terminal, test the function
curl -X POST http://localhost:54321/functions/v1/ai-chat \
  -H "Authorization: Bearer <your-supabase-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Test",
    "dataset": {"id": "test", "name": "Test Dataset"},
    "userProfile": {"use_case": "general"},
    "conversationHistory": []
  }'
```

### 4. Check Browser DevTools
1. Open your app in Chrome/Firefox
2. Open DevTools (F12)
3. Go to Network tab
4. Use the AI chat feature
5. Inspect the requests - you should see calls to `supabase.co/functions/v1/ai-chat`
6. **You should NOT see any calls to `api.openai.com`**

---

## Files That Still Need Updates

These files still reference `VITE_OPENAI_API_KEY` and need to be updated:

1. **src/lib/agents/enhancedOrchestrator.ts**
   - Currently constructs RAGAgent with API key
   - Solution: Disable or refactor to use Edge Function

2. **src/lib/marketingBot.ts**
   - Multiple functions call OpenAI directly
   - Solution: Use `secureMarketingContent()` helper

3. **src/components/data/PersonalizedDatasetChat.tsx**
   - Calls OpenAI API directly
   - Solution: Use `secureAIChat()` helper

4. **All Documentation Files**
   - Replace exposed keys with `***REMOVED***`
   - Or delete the files if no longer needed

---

## Prevention for the Future

### 1. Add Pre-commit Hook

Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash

# Check for exposed API keys
if git diff --cached | grep -E 'sk-[a-zA-Z0-9]{20,}'; then
  echo "❌ ERROR: Detected API key in commit!"
  echo "Never commit API keys to Git."
  exit 1
fi

exit 0
```

```bash
chmod +x .git/hooks/pre-commit
```

### 2. Add to .gitignore

```
# Sensitive files
.env
.env.local
.env.*.local
**/*API*KEY*
**/*SECRET*
```

### 3. Use Environment Variable Naming Convention

- ❌ `VITE_*` = Bundled into client code (PUBLIC)
- ✅ `SECRET_*` = Server-only (PRIVATE)
- ✅ Store in Supabase secrets, not `.env`

### 4. Code Review Checklist

Before any PR is merged:
- [ ] No `sk-` prefixed strings in code
- [ ] No `import.meta.env.VITE_OPENAI_API_KEY` references
- [ ] All OpenAI calls go through Edge Functions
- [ ] No sensitive keys in markdown files

---

## Cost of This Vulnerability

If your exposed API key was used maliciously:

- **Scenario 1:** Moderate abuse (100,000 API calls)
  - Cost: $200 - $1,000+

- **Scenario 2:** Crypto mining prompts (1M calls)
  - Cost: $2,000 - $10,000+

- **Scenario 3:** Account suspension
  - Cost: Loss of service + reputation damage

**Fix this IMMEDIATELY to avoid these costs!**

---

## Questions?

If you run into issues:

1. Check Supabase Edge Function logs:
   ```bash
   supabase functions logs ai-chat
   ```

2. Verify environment variables:
   ```bash
   supabase secrets list
   ```

3. Test the Edge Function in isolation before updating client code

---

## Summary

- ✅ **Created secure Edge Function** (`supabase/functions/ai-chat/index.ts`)
- ✅ **Created secure wrapper** (`src/lib/secureAI.ts`)
- ✅ **Fixed aiAgents.ts** to use Edge Function
- ⚠️ **Still need to fix** 7+ other source files
- ⚠️ **Still need to clean** 40+ documentation files
- 🚨 **MUST revoke exposed key** at https://platform.openai.com/api-keys

**Estimated time to complete all fixes:** 30-60 minutes

**Priority:** CRITICAL - Do this before end of day!

