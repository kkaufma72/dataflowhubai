# 🔧 FRED CORS Fix - Deploy Edge Function

## 🎯 Problem Solved

FRED API blocks direct browser requests due to CORS. Solution: Proxy requests through Supabase Edge Function!

---

## ✅ What I Created

### 1. Supabase Edge Function
**File:** `supabase/functions/fred-proxy/index.ts`
- Proxies all FRED API requests
- Handles CORS headers
- Secures API key on server-side

### 2. Updated FRED API Client
**File:** `src/lib/fredAPI.ts`
- Now uses Edge Function proxy
- Automatic CORS bypass
- No code changes needed in components!

---

## 🚀 Deploy Instructions

### Step 1: Deploy the Edge Function

```bash
cd /Users/kyle/.cursor/worktrees/dataflowhubai/kmg

# Login to Supabase (if not already)
npx supabase login

# Link to your project (if not already)
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy the fred-proxy function
npx supabase functions deploy fred-proxy
```

### Step 2: Set Environment Variable in Supabase

```bash
# Set FRED API key as secret
npx supabase secrets set FRED_API_KEY=a7f7593ec7adef12ff34d21b3eacc970
```

**Or via Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Edge Functions** → **Secrets**
4. Add secret:
   - Name: `FRED_API_KEY`
   - Value: `a7f7593ec7adef12ff34d21b3eacc970`

### Step 3: Test It!

Refresh your browser and try searching for FRED data again!

---

## 🔧 Alternative: Quick Test Without Deployment

If you want to test immediately without deploying, you can use a CORS proxy temporarily:

### Option A: Use CORS Anywhere (Development Only)

Update `src/lib/fredAPI.ts`:

```typescript
const USE_PROXY = false; // Temporarily disable
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
// Then prefix API calls with CORS_PROXY
```

### Option B: Disable CORS in Browser (Development Only)

**Chrome:**
```bash
# macOS
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security

# Then open http://localhost:5173/
```

**⚠️ Warning:** Only for development! Never use in production!

---

## 📝 Deployment Commands (Quick Reference)

```bash
cd /Users/kyle/.cursor/worktrees/dataflowhubai/kmg

# 1. Install Supabase CLI (if needed)
npm install -g supabase

# 2. Login
npx supabase login

# 3. Link project (replace with your project ref)
npx supabase link --project-ref YOUR_PROJECT_REF

# 4. Deploy function
npx supabase functions deploy fred-proxy

# 5. Set API key secret
npx supabase secrets set FRED_API_KEY=a7f7593ec7adef12ff34d21b3eacc970

# 6. Test
# Open http://localhost:5173/ and try FRED search!
```

---

## 🔍 How to Find Your Project Ref

### Method 1: Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Click your project
3. Go to **Settings** → **General**
4. Find **Reference ID** (looks like: `bcobpxgktvgfsffdsiog`)

### Method 2: From Your Code
Check your `.env` file:
```
VITE_SUPABASE_URL=https://bcobpxgktvgfsffdsiog.supabase.co
                           ^^^^^^^^^^^^^^^^^^
                           This is your project ref!
```

---

## ✅ Verification

After deployment, test the Edge Function:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/fred-proxy \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"endpoint":"/series","params":{"series_id":"GDP"}}'
```

Should return GDP series data!

---

## 🎊 What Happens Now

1. User searches for "GDP" in your app
2. Frontend calls `searchFREDSeries('GDP')`
3. Request goes to Supabase Edge Function (not FRED directly)
4. Edge Function adds API key and calls FRED
5. Edge Function returns data with CORS headers
6. Frontend receives data - no CORS error! ✅

---

## 📊 Files Modified

```
supabase/functions/
  ├── fred-proxy/
  │   └── index.ts          ← NEW: Edge Function
  └── _shared/
      └── cors.ts           ← NEW: CORS headers

src/lib/
  └── fredAPI.ts            ← UPDATED: Uses proxy
```

---

## 🚀 Quick Deploy Now!

```bash
# One command to rule them all:
cd /Users/kyle/.cursor/worktrees/dataflowhubai/kmg && \
npx supabase functions deploy fred-proxy && \
npx supabase secrets set FRED_API_KEY=a7f7593ec7adef12ff34d21b3eacc970 && \
echo "✅ Deployed! Refresh browser and try FRED search!"
```

---

## 💡 Pro Tips

1. **Keep API key secret** - Never commit to git
2. **Monitor usage** - Check Supabase Edge Function logs
3. **Rate limiting** - FRED allows 120 requests/minute
4. **Caching** - Consider caching popular series in Supabase

---

## 🐛 Troubleshooting

### "Function not found"
- Run: `npx supabase functions deploy fred-proxy`

### "FRED_API_KEY not configured"
- Run: `npx supabase secrets set FRED_API_KEY=a7f7593ec7adef12ff34d21b3eacc970`

### "Unauthorized"
- Check your Supabase anon key in `.env`
- Ensure Edge Functions are enabled in your project

### Still getting CORS?
- Clear browser cache
- Hard refresh (Cmd+Shift+R)
- Check browser console for new errors

---

**Deploy the Edge Function and your FRED integration will work perfectly!** 🎉


