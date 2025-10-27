# 🔧 Blank Screen Fix - Production Issue

## 🐛 **Issue: Blank Screen on dataflowhub.ai**

Common causes and fixes:

---

## ✅ **Quick Fixes (Try in Order):**

### **Fix 1: Check Environment Variables (MOST COMMON!)**

**In Vercel Dashboard:**

1. Go to: https://vercel.com/dashboard
2. Find your project
3. Settings → Environment Variables
4. **Make sure these exist:**

```bash
VITE_SUPABASE_URL=https://bcobpxgktvgfsffdsiog.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjb2JweGdrdHZnZnNmZmRzaW9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NDE1NDQsImV4cCI6MjA3NjQxNzU0NH0.xI0sbMYLa7ln-XcbESHr4Y9tLNzg_LLkZAySj0O5a04
VITE_OPENAI_API_KEY=***REVOKED-KEY-DO-NOT-USE***
```

**Important:** Set for **ALL environments** (Production, Preview, Development)

5. **If you added variables → REDEPLOY:**
   - Go to Deployments
   - Click "..." on latest
   - Click "Redeploy"

---

### **Fix 2: Check Build Logs**

**In Vercel Dashboard:**

1. Deployments tab
2. Click latest deployment
3. Click "View Build Logs"
4. Look for errors

**Common errors:**
```
❌ "Module not found" → Missing dependency
❌ "Environment variable undefined" → Missing env var
❌ "Build failed" → TypeScript error
❌ "Out of memory" → Need bigger instance
```

---

### **Fix 3: Check Browser Console**

**On dataflowhub.ai:**

1. Press **F12** (open DevTools)
2. Go to **Console** tab
3. Look for **red errors**

**Common errors:**
```
❌ "Failed to fetch" → CORS or API issue
❌ "Uncaught ReferenceError" → Missing env variable
❌ "ChunkLoadError" → Build/deploy issue
❌ Supabase errors → Wrong URL/key
```

**Share what you see!**

---

### **Fix 4: Test Simple HTML**

Check if it's a React issue or deploy issue:

```
1. Visit: https://dataflowhub.ai/index.html
2. Check source
3. See if basic HTML loads
```

If you see HTML but blank screen → React app issue  
If you see 404 → Deploy issue

---

## 🔍 **Debug Checklist:**

### **Vercel Settings:**

- [ ] Build command: `npm run build` ✓
- [ ] Output directory: `dist` ✓
- [ ] Node version: 18 or 20 ✓
- [ ] Environment variables set ❓
- [ ] Install command: `npm install` ✓

### **Environment Variables (Critical!):**

- [ ] `VITE_SUPABASE_URL` set ❓
- [ ] `VITE_SUPABASE_ANON_KEY` set ❓  
- [ ] `VITE_OPENAI_API_KEY` set ❓
- [ ] Applied to Production environment ❓
- [ ] Redeployed after adding ❓

---

## 🚨 **Most Likely Issue:**

**90% of blank screens = Missing environment variables**

**Why:**
```javascript
// In your code:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// If not set in Vercel:
supabaseUrl = undefined

// App crashes with blank screen
```

**Fix:**
1. Add all `VITE_*` variables in Vercel
2. Redeploy
3. Works! ✅

---

## 🎯 **Share This Info:**

**To help me debug, share:**

1. **Browser console errors** (F12 → Console tab)
   - Copy/paste any red errors

2. **Vercel build logs**
   - Go to deployment
   - Check if build succeeded
   - Share any errors

3. **Environment variables status**
   - Are they set in Vercel?
   - Which ones?

**Then I can give you exact fix!** 🔧

---

## ⚡ **Quick Fix (Try This First):**

### **In Vercel Dashboard:**

```
1. Settings → Environment Variables
2. Add missing VITE_* variables
3. Deployments → Latest → "..." → Redeploy
4. Wait 2 minutes
5. Visit dataflowhub.ai again
6. Should work! ✅
```

---

**What errors do you see in browser console?** (F12 → Console)

Share that and I'll fix it immediately! 🔧

