# Railway Deployment Guide

## Required Environment Variables for Railway

Set these in your Railway project's environment variables:

### Essential - Database (Supabase)
```bash
# Use your Supabase PostgreSQL connection string
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Alternative: Set individual DB vars
POSTGRES_HOST=aws-0-us-east-1.pooler.supabase.com
POSTGRES_PORT=6543
POSTGRES_USER=postgres.[YOUR-PROJECT-REF]
POSTGRES_PASSWORD=[YOUR-SUPABASE-DB-PASSWORD]
POSTGRES_DB=postgres
```

### Essential - Authentication (Supabase)
```bash
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_KEY=[YOUR-ANON-KEY]
SUPABASE_JWT_SECRET=[YOUR-JWT-SECRET]

# JWT Config (use same secret as Supabase)
JWT_SECRET_KEY=[YOUR-JWT-SECRET]
JWT_ALGORITHM=HS256
```

### Optional - Services (will gracefully degrade if not available)
```bash
# Redis (recommended for caching) - use Railway's Redis addon or external service
REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]

# MinIO/S3 (optional) - only if you need file storage
MINIO_ENDPOINT=[your-s3-endpoint]
MINIO_ACCESS_KEY=[your-access-key]
MINIO_SECRET_KEY=[your-secret-key]
MINIO_SECURE=true

# Neo4j (optional) - only if you use knowledge graphs
NEO4J_URI=bolt://[host]:[port]
NEO4J_USER=[user]
NEO4J_PASSWORD=[password]

# TimescaleDB (optional) - only if you need time-series data
TIMESCALEDB_HOST=[host]
TIMESCALEDB_PORT=5432
TIMESCALEDB_USER=[user]
TIMESCALEDB_PASSWORD=[password]
TIMESCALEDB_DB=[database]
```

### Application Settings
```bash
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# CORS - Add your Railway frontend URL
CORS_ORIGINS=["https://your-app.up.railway.app", "https://dataflowhub.ai"]
```

## How to Find Your Supabase Credentials

1. **Supabase URL & API Key**:
   - Go to your Supabase project dashboard
   - Settings → API
   - Copy `Project URL` → `SUPABASE_URL`
   - Copy `anon public` key → `SUPABASE_KEY`

2. **JWT Secret**:
   - Same location (Settings → API)
   - Copy `JWT Secret` → `SUPABASE_JWT_SECRET` and `JWT_SECRET_KEY`

3. **Database Connection String**:
   - Settings → Database
   - Under "Connection String" → "URI" tab
   - Use the **Pooler** connection string for Railway (better performance)
   - Example: `postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

## Deployment Steps

1. **Push your code to GitHub** (already done)

2. **Create Railway project**:
   ```bash
   # Link to GitHub repo
   # Railway will auto-detect it's a Docker project
   ```

3. **Set environment variables** in Railway dashboard

4. **Deploy**:
   - Railway will automatically build and deploy
   - Your backend will be available at: `https://[your-service].up.railway.app`

5. **Update frontend**:
   - Update your Vite config to point to Railway backend
   - Or set `VITE_API_URL` environment variable

## Frontend Configuration

Update your frontend to use Railway backend:

```typescript
// In your frontend .env or Vite config
VITE_API_URL=https://[your-backend-service].up.railway.app/api
```

## Troubleshooting

### "Can't see data from Supabase"
- ✅ Fixed: Backend now gracefully handles missing services
- Verify `DATABASE_URL` points to your Supabase database
- Check Railway logs: `railway logs`

### "Connection refused to localhost:9000"
- ✅ Fixed: MinIO/Neo4j/Redis are now optional
- These services will be skipped if not available
- Backend will still function with just Supabase PostgreSQL

### Row Level Security (RLS)
If you can't see data, ensure your Supabase RLS policies allow access:
```sql
-- Check your RLS policies in Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'datasets';
```

## Minimal Working Configuration

For a basic deployment with just Supabase:

```bash
# These 4 are absolutely required:
DATABASE_URL=postgresql://[supabase-connection-string]
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_KEY=[anon-key]
SUPABASE_JWT_SECRET=[jwt-secret]

# Everything else is optional!
```
