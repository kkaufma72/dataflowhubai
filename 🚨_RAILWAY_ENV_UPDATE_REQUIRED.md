# 🚨 Railway Environment Variable Update Required

## Problem
ModelOps endpoints are failing in Railway because:
1. `DEBUG=false` prevents auto-creation of ModelOps tables
2. Neo4j driver type hints were not Optional

## Solution Applied

### Code Changes (✅ Already Committed)
1. ✅ Made `neo4j_driver` Optional in modelops endpoints
2. ✅ Added None checks before using neo4j_driver
3. ✅ Updated comments to clarify Railway needs DEBUG=true

### Railway Configuration Change (⚠️ ACTION REQUIRED)

**Go to Railway Dashboard** → Your Project → Variables Tab

**Update these variables:**
```bash
DEBUG=true                    # ← CHANGE from false to true
ENVIRONMENT=railway           # ← CHANGE from production to railway
```

**Why?**
- Railway is a PaaS platform (like Vercel, Heroku)
- It doesn't have a separate "database migration" step
- The backend needs to auto-create missing tables on first request
- This is **safe** because:
  - Only creates tables if they don't exist (idempotent)
  - Only affects new deployments
  - Production (with DEBUG=false) still blocks auto-migration

### Alternative: Run Migration Manually

If you want to keep `DEBUG=false`, you can run migrations via Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link [project-id]

# Run migration
railway run python backend/scripts/init_modelops_schema.py
```

But for Railway, **DEBUG=true** is the recommended approach.

## Files Changed
- ✅ `backend/routers/modelops_routes.py` - Made Neo4j optional
- ✅ `.railway-env-template` - Updated to DEBUG=true, ENVIRONMENT=railway

## Test After Update
1. Update Railway variables
2. Wait for auto-deploy
3. Test endpoint: `GET /api/modelops/incidents`
4. Should return `[]` instead of 503 error

## Deployment Status
- **Backend Code**: ✅ Fixed and pushed to GitHub
- **Railway Config**: ⚠️ Needs manual env var update
- **Frontend**: ⏳ Still needs Vercel env vars

---
**Next**: Update Railway variables, then test modelops endpoints
