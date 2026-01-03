# Backend Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended - Free Tier)

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Deploy:**
   ```bash
   railway init
   railway up
   ```

4. **Set environment variables:**
   ```bash
   railway variables set SUPABASE_JWT_SECRET=c9818af2-89cc-4315-a425-9cc1672b2a8d
   railway variables set SUPABASE_URL=https://bcobpxgktvgfsffdsiog.supabase.co
   railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjb2JweGdrdHZnZnNmZmRzaW9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NDE1NDQsImV4cCI6MjA3NjQxNzU0NH0.xI0sbMYLa7ln-XcbESHr4Y9tLNzg_LLkZAySj0O5a04
   railway variables set DATABASE_URL=postgresql://your-supabase-db-url
   ```

5. **Get your backend URL:**
   ```bash
   railway status
   ```
   Copy the URL (e.g., `https://your-app.railway.app`)

### Option 2: Render (Free Tier)

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo: `kkaufma72/dataflowhubai`
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (same as Railway)
6. Deploy!

### Option 3: Fly.io (Free Tier)

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Deploy:**
   ```bash
   cd backend
   fly launch --no-deploy
   # Edit fly.toml if needed
   fly deploy
   ```

### Option 4: Local Docker (for testing)

```bash
cd /workspaces/dataflowhubai
docker-compose up -d backend
```

Backend will be available at: http://localhost:8000

## After Deployment

### Update Frontend Configuration

Once you have your backend URL (e.g., `https://your-app.railway.app`):

#### Option A: Set Environment Variable (Recommended)
In Vercel/Netlify dashboard:
```
VITE_API_BASE_URL=https://your-app.railway.app
```

#### Option B: Update Proxy Config
Edit `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-app.railway.app/api/:path*"
    }
  ]
}
```

Then commit and push:
```bash
git add vercel.json
git commit -m "chore: configure backend API proxy"
git push origin main
```

## Environment Variables Required

```bash
# Supabase (REQUIRED)
SUPABASE_JWT_SECRET=c9818af2-89cc-4315-a425-9cc1672b2a8d
SUPABASE_URL=https://bcobpxgktvgfsffdsiog.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

# Database (Use Supabase connection string)
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/postgres

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379/0

# Optional: OpenAI for AI features
OPENAI_API_KEY=sk-...

# Optional: vLLM endpoint
VLLM_ENDPOINT=http://localhost:8000/v1/chat/completions
VLLM_MODEL=meta-llama/Meta-Llama-3-8B-Instruct
```

## Test Deployment

Once deployed, test your backend:

```bash
# Health check
curl https://your-backend-url.com/api/health

# Test with auth (replace with your token)
curl -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  https://your-backend-url.com/api/modelops/incidents
```

## Monitoring

- Railway: Built-in logs and metrics
- Render: Dashboard with logs
- Fly.io: `fly logs`
- Local: `docker-compose logs -f backend`

## Cost Estimates

- **Railway**: Free tier - $5/month credit (usually enough for small apps)
- **Render**: Free tier - 750 hours/month
- **Fly.io**: Free tier - 3 shared-cpu VMs
- **Vercel/Netlify**: Frontend stays free

## Troubleshooting

### CORS Errors
Ensure backend has your frontend domain in CORS settings (backend/main.py).

### 502/504 Errors
Backend might be cold-starting (free tiers sleep after inactivity). First request may be slow.

### Database Connection
Use Supabase direct connection string, not localhost.

## Next Steps

1. Choose deployment option (Railway recommended for beginners)
2. Deploy backend
3. Get backend URL
4. Update frontend config with backend URL
5. Test end-to-end
