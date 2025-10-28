# 🐳 Install Docker on macOS

## ✅ Quick Install (5 Minutes)

### Option 1: Docker Desktop (Easiest - Recommended)

**Download & Install:**

1. **Download Docker Desktop:**
   ```
   https://www.docker.com/products/docker-desktop
   ```
   Or direct link:
   ```
   https://desktop.docker.com/mac/main/arm64/Docker.dmg  (Apple Silicon M1/M2/M3)
   https://desktop.docker.com/mac/main/amd64/Docker.dmg  (Intel Mac)
   ```

2. **Install:**
   - Open the downloaded `Docker.dmg`
   - Drag Docker icon to Applications folder
   - Open Docker from Applications
   - Click "Accept" on license agreement

3. **Wait for Docker to start:**
   - You'll see a whale icon in your menu bar
   - Wait until it says "Docker Desktop is running"

4. **Verify:**
   ```bash
   docker --version
   # Should show: Docker version 24.x.x
   
   docker ps
   # Should show: Empty list (no containers yet)
   ```

---

### Option 2: Homebrew (Command Line)

```bash
# Install Docker via Homebrew
brew install --cask docker

# Open Docker application
open /Applications/Docker.app

# Wait for it to start, then verify
docker --version
```

---

## 🚀 After Docker is Installed

### **Then run Neo4j:**

```bash
docker run -d \
  --name neo4j \
  -p 55000:7473 \
  -p 55001:7474 \
  -p 55002:7687 \
  -e NEO4J_AUTH=neo4j/dataflowhub2024 \
  -e NEO4J_PLUGINS='["apoc"]' \
  -v neo4j_data:/data \
  neo4j:latest
```

### **And PostgreSQL Warehouse:**

```bash
docker run -d \
  --name postgres-warehouse \
  -e POSTGRES_PASSWORD=warehouse2024 \
  -e POSTGRES_USER=analytics \
  -e POSTGRES_DB=datawarehouse \
  -p 5433:5432 \
  postgres:16-alpine
```

### **Initialize warehouse schema:**

```bash
docker exec -i postgres-warehouse psql -U analytics -d datawarehouse < warehouse-init.sql
```

---

## 🎯 **Alternative: Use Cloud Services (No Docker Needed!)**

If you don't want to install Docker:

### **Neo4j Cloud (Neo4j Aura):**

1. Go to: https://neo4j.com/cloud/aura/
2. Sign up (free)
3. Create database (Free tier - no credit card!)
4. Get connection URI: `bolt+s://xxxxx.databases.neo4j.io`
5. Get password

Add to `.env.local`:
```bash
VITE_NEO4J_URI=bolt+s://xxxxx.databases.neo4j.io
VITE_NEO4J_USER=neo4j
VITE_NEO4J_PASSWORD=your-password
```

**Pros:** No Docker, free tier, managed
**Cons:** Limited free tier (50K nodes)

---

### **PostgreSQL Cloud:**

**Option A: Supabase (You already have this!)**
- You can use Supabase for analytics too
- No separate warehouse needed
- Just query differently

**Option B: Railway.app:**
```
1. Go to: https://railway.app
2. Sign up
3. New Project → Add PostgreSQL
4. Get connection string
```

**Option C: Render.com:**
```
1. Go to: https://render.com
2. New → PostgreSQL
3. Free tier available
4. Get connection string
```

---

## 🤔 **Which Should You Use?**

### **Install Docker Desktop if:**
- ✅ You want full control
- ✅ You develop locally
- ✅ You need multiple databases
- ✅ You want TensorFlow Docker too
- ✅ You're okay with ~5GB disk space

### **Use Cloud Services if:**
- ✅ You don't want to manage Docker
- ✅ You want hosted/managed databases
- ✅ You prefer pay-as-you-go
- ✅ You want auto-backups
- ✅ You don't need local development

---

## 🎯 **My Recommendation**

**For you:**

1. **Install Docker Desktop** (5 min)
   - Download from link above
   - Install
   - Start Docker

2. **Run containers** (2 min)
   - Neo4j command
   - PostgreSQL warehouse command

3. **Test your app** (1 min)
   - Visit /app/insights
   - See all features working!

**Total time: 8 minutes**

---

## 🚀 **Quick Start After Docker Install**

```bash
# 1. Verify Docker installed
docker --version

# 2. Run Neo4j (your custom ports)
docker run -d --name neo4j \
  -p 55000:7473 -p 55001:7474 -p 55002:7687 \
  -e NEO4J_AUTH=neo4j/dataflowhub2024 \
  neo4j:latest

# 3. Run PostgreSQL Warehouse
docker run -d --name postgres-warehouse \
  -e POSTGRES_PASSWORD=warehouse2024 \
  -e POSTGRES_USER=analytics \
  -e POSTGRES_DB=datawarehouse \
  -p 5433:5432 \
  postgres:16-alpine

# 4. Initialize warehouse
docker exec -i postgres-warehouse psql -U analytics -d datawarehouse < warehouse-init.sql

# 5. Test
open http://localhost:55001  # Neo4j
npm run dev  # Your app
```

---

**Download Docker Desktop now:** https://www.docker.com/products/docker-desktop

**Or tell me if you'd prefer cloud services instead!** ☁️
