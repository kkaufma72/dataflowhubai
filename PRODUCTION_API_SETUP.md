# Production API Setup Guide

## Problem Fixed
Fixed 405 errors on ModelOps drift analysis and other API endpoints in production. The issue occurred because static hosting platforms (Vercel/Netlify) were rewriting all routes to `index.html` for SPA support, causing POST requests to `/api/*` to return 405 (Method Not Allowed).

## Solution Implemented
Updated the frontend to use a configurable API base URL and configured hosting platforms to proxy `/api/*` requests to the FastAPI backend.

## Changes Made

### 1. Frontend (src/pages/ModelOps.tsx)
Added `API_BASE_URL` constant that reads from environment variable:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
```

All fetch calls now use:
```typescript
fetch(`${API_BASE_URL}/api/modelops/...`)
```

### 2. Environment Variable
Added `VITE_API_BASE_URL` to `.env.example`:
- **Development**: Leave empty (Vite proxy handles it)
- **Production**: Set to your FastAPI backend URL

### 3. Hosting Configuration

#### Option A: Using Vercel Proxy (vercel.json)
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

#### Option B: Using Netlify Proxy (netlify.toml)
```toml
[[redirects]]
  from = "/api/*"
  to = "https://your-backend-api-url.com/api/:splat"
  status = 200
  force = true
```

#### Option C: Using Environment Variable
Set `VITE_API_BASE_URL=https://your-backend-api-url.com` in your hosting platform's environment variables.

## Deployment Steps

### For Vercel Deployment
1. **Update vercel.json**: Replace `https://your-backend-api-url.com` with your actual FastAPI backend URL
2. **Option 1 - Use Proxy**: Leave `VITE_API_BASE_URL` empty (recommended)
3. **Option 2 - Direct API**: Set `VITE_API_BASE_URL=https://your-backend-api-url.com` in Vercel environment variables
4. Deploy: `vercel --prod`

### For Netlify Deployment
1. **Update netlify.toml**: Replace `https://your-backend-api-url.com` with your actual FastAPI backend URL
2. **Option 1 - Use Proxy**: Leave `VITE_API_BASE_URL` empty (recommended)
3. **Option 2 - Direct API**: Set `VITE_API_BASE_URL=https://your-backend-api-url.com` in Netlify environment variables
4. Deploy: `netlify deploy --prod`

### For Custom Hosting
1. Set `VITE_API_BASE_URL=https://your-backend-api-url.com` in your environment
2. Build: `npm run build`
3. Configure your reverse proxy (nginx/Apache) to proxy `/api/*` to your backend

## Backend CORS Configuration
Ensure your FastAPI backend allows requests from your frontend origin:

```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.com",
        "http://localhost:5173"  # for local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Affected Endpoints
The following ModelOps endpoints are now properly configured:
- `POST /api/modelops/models/{id}/drift/analyze` (was failing with 405)
- `POST /api/modelops/models/{id}/autopilot/run`
- `POST /api/modelops/dev/models`
- `GET /api/modelops/incidents`
- `GET /api/modelops/incidents/{id}/rca`
- `POST /api/modelops/incidents/{id}/autoresolve-check`
- `POST /api/knowledge/lineage/dev/seed`
- `GET /api/deploy/models/{id}/endpoint-info`

## Testing
1. **Local Dev**: `npm run dev` - Should work with Vite proxy (no changes needed)
2. **Production**: After deployment, test drift analysis:
   - Navigate to ModelOps page
   - Enter a model UUID
   - Click "Analyze Drift"
   - Should receive 200 response (not 405)

## Rollback
If issues occur, you can temporarily use direct API calls:
```bash
# In your hosting platform environment variables
VITE_API_BASE_URL=https://your-backend-api-url.com
```

This bypasses the proxy and makes direct API calls from the browser.
