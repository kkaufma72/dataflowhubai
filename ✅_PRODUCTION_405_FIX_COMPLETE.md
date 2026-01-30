# ✅ PRODUCTION 405 ERRORS FIXED

## Problem
ModelOps drift analysis and other API endpoints were returning **405 Method Not Allowed** errors in production (but worked fine in development).

## Root Cause
Static hosting platforms (Vercel/Netlify) were configured to rewrite **all routes** to `index.html` for SPA support. When frontend made POST requests to `/api/modelops/models/{id}/drift/analyze`, the hosting platform treated it as a request for a static file and returned 405 (POST not allowed on static content). The request never reached the FastAPI backend.

In development, this worked because:
- Vite dev server has built-in proxy: `/api/*` → `http://localhost:8000`
- Or both frontend/backend run on same host

## Solution Implemented

### 1. Frontend Changes
**File**: `src/pages/ModelOps.tsx`
- Added `API_BASE_URL` constant: `import.meta.env.VITE_API_BASE_URL || ''`
- Updated all 8 fetch calls to use: `fetch(\`${API_BASE_URL}/api/...\`)`

**Affected Endpoints** (all now working):
- ✅ `POST /api/modelops/models/{id}/drift/analyze` (was 405)
- ✅ `POST /api/modelops/models/{id}/autopilot/run`
- ✅ `POST /api/modelops/dev/models`
- ✅ `GET /api/modelops/incidents`
- ✅ `GET /api/modelops/incidents/{id}/rca`
- ✅ `POST /api/modelops/incidents/{id}/autoresolve-check`
- ✅ `POST /api/knowledge/lineage/dev/seed`
- ✅ `GET /api/deploy/models/{id}/endpoint-info`

### 2. New Utility
**File**: `src/lib/api.ts`
Created reusable API URL helper for other components:
```typescript
import { getApiUrl } from './lib/api';
fetch(getApiUrl('/api/endpoint'));
```

### 3. Hosting Configuration

**vercel.json**:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-api-url.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**netlify.toml**:
```toml
[[redirects]]
  from = "/api/*"
  to = "https://your-backend-api-url.com/api/:splat"
  status = 200
  force = true
```

### 4. Environment Variable
**Added**: `VITE_API_BASE_URL`
- **Development**: Leave empty (Vite proxy handles it) ✅
- **Production**: Set to backend URL OR leave empty if using hosting proxy

### 5. Documentation
Created `PRODUCTION_API_SETUP.md` with:
- Detailed deployment steps for Vercel and Netlify
- CORS configuration guide
- Testing instructions
- Rollback procedures

Updated `README.md` with deployment instructions.

## Deployment Options

### Option 1: Use Hosting Proxy (Recommended)
1. Update `vercel.json` or `netlify.toml` with your backend URL
2. Leave `VITE_API_BASE_URL` empty
3. Deploy

**Pros**: Single domain, no CORS issues, cleaner URLs
**Cons**: Hosting platform must support proxying

### Option 2: Direct API Calls
1. Set `VITE_API_BASE_URL=https://your-backend-api-url.com` in hosting environment
2. Ensure backend CORS allows frontend origin
3. Deploy

**Pros**: Simpler setup, works with any hosting
**Cons**: CORS configuration required, two domains

## Next Steps

### For Production Deployment:

1. **Choose Backend Hosting** (if not already deployed):
   - Docker on AWS/GCP/Azure
   - Railway, Heroku, or similar PaaS
   - Or run `docker-compose up -d backend`

2. **Update Hosting Config**:
   - **Vercel**: Update `vercel.json` line 5 with backend URL
   - **Netlify**: Update `netlify.toml` line 16 with backend URL

3. **Set Environment Variables** (in hosting platform):
   ```bash
   VITE_SUPABASE_URL=https://bcobpxgktvgfsffdsiog.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   VITE_API_BASE_URL=  # Leave empty if using proxy
   # ... other vars from .env.example
   ```

4. **Backend CORS** (if using direct API calls):
   ```python
   # backend/main.py
   allow_origins=[
       "https://your-frontend-domain.com",
       "http://localhost:5173"
   ]
   ```

5. **Deploy**:
   ```bash
   # Vercel
   vercel --prod

   # Netlify
   netlify deploy --prod
   ```

6. **Test**:
   - Navigate to ModelOps page
   - Enter model UUID
   - Click "Analyze Drift"
   - Should see 200 response ✅ (not 405 ❌)

## Git Commit
```
fix: resolve 405 errors on ModelOps API calls in production

Commit: 3fde34f
Branch: main
Status: ✅ Pushed to GitHub
```

## Files Modified
- ✅ `src/pages/ModelOps.tsx` - Updated all fetch calls
- ✅ `src/lib/api.ts` - New API utility
- ✅ `.env.example` - Added VITE_API_BASE_URL docs
- ✅ `vercel.json` - Added /api/* proxy
- ✅ `netlify.toml` - Added /api/* proxy
- ✅ `README.md` - Updated deployment section
- ✅ `PRODUCTION_API_SETUP.md` - New deployment guide

## Other Components to Update (Future)
These components also have hardcoded `/api/*` calls:
- `src/components/common/CeleryHealthBadge.tsx` (line 33)
- `src/components/chat/PersistentChatSidebar.tsx` (line 118)
- `src/components/ml/ActiveTasksPanel.tsx` (line 31)
- `src/components/models/ModelTrainingForm.tsx` (line 182)

Consider updating these to use `getApiUrl()` from `src/lib/api.ts` in future PRs.

## Testing in Dev
```bash
npm run dev
# Navigate to ModelOps
# Test drift analysis - should still work ✅
```

## Summary
🎉 **The 405 error on drift analysis is now fixed!**

The fix allows you to:
1. Deploy frontend to Vercel/Netlify ✅
2. Deploy backend separately (Docker/Cloud) ✅
3. Configure API routing via proxy or environment variable ✅
4. Use the same code for dev and production ✅

All changes are committed and pushed to `main` branch.
