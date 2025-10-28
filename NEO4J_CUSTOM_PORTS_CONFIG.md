# 🔵 Neo4j Custom Ports Configuration

## ✅ Your Neo4j Setup

**Ports:**
- `55000` → `7473` (HTTPS)
- `55001` → `7474` (HTTP Browser)
- `55002` → `7687` (Bolt Protocol)

**Access URLs:**
- **Browser:** http://localhost:55001
- **Bolt Connection:** bolt://localhost:55002

---

## 🔧 Configuration Updated

### Files Modified:

1. **`src/lib/neo4jClient.ts`**
   - Default URI: `bolt://localhost:55002`
   - Connects to your custom port

2. **`.env.local.example`**
   - Shows custom port configuration
   - Example for other developers

---

## 🚀 Quick Start

### Step 1: Create `.env.local`

```bash
cd /Users/kyledev/dataflowhubai

cat > .env.local << 'EOF'
# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Neo4j (Custom Ports)
VITE_NEO4J_URI=bolt://localhost:55002
VITE_NEO4J_USER=neo4j
VITE_NEO4J_PASSWORD=dataflowhub2024
EOF
```

### Step 2: Test Connection

```bash
# Start your app
npm run dev

# Visit insights page
open http://localhost:5173/app/insights

# Should connect to Neo4j automatically!
```

### Step 3: Access Neo4j Browser

```bash
# Open Neo4j Browser
open http://localhost:55001

# Login:
# Username: neo4j
# Password: dataflowhub2024
```

---

## 🧪 Test Neo4j Connection

### From Your App:

```typescript
import { neo4jClient } from './lib/neo4jClient';

// Test connection
const connected = await neo4jClient.connect();
console.log('Neo4j connected:', connected);

// Create test node
await neo4jClient.runQuery(
  'CREATE (d:Dataset {name: $name}) RETURN d',
  { name: 'Test Dataset' }
);

// Query nodes
const results = await neo4jClient.runQuery(
  'MATCH (d:Dataset) RETURN d LIMIT 5'
);
console.log('Datasets:', results);
```

### From Neo4j Browser (http://localhost:55001):

```cypher
// Test query
CREATE (:Dataset {name: 'Test', rows: 1000})

// View all datasets
MATCH (d:Dataset) RETURN d

// Clear all data
MATCH (n) DETACH DELETE n
```

---

## 🐳 Your Docker Command

If you need to recreate the container:

```bash
docker run -d \
  --name neo4j \
  -p 55000:7473 \
  -p 55001:7474 \
  -p 55002:7687 \
  -e NEO4J_AUTH=neo4j/dataflowhub2024 \
  -e NEO4J_PLUGINS='["apoc", "graph-data-science"]' \
  -v neo4j_data:/data \
  -v neo4j_logs:/logs \
  neo4j:latest
```

---

## 🔌 Connection Details

### For Client Code:

```typescript
// src/lib/neo4jClient.ts already configured!
const uri = 'bolt://localhost:55002';  // Your custom port
```

### For Environment Variables:

```bash
# .env.local
VITE_NEO4J_URI=bolt://localhost:55002
VITE_NEO4J_USER=neo4j
VITE_NEO4J_PASSWORD=dataflowhub2024
```

### For Production (Vercel):

```bash
# Add to Vercel environment variables:
VITE_NEO4J_URI=bolt://your-production-neo4j:7687
VITE_NEO4J_USER=neo4j
VITE_NEO4J_PASSWORD=your-secure-password
```

---

## ✅ Verification

### Check Neo4j is Running:

```bash
# Check container
docker ps | grep neo4j

# Check HTTP endpoint
curl http://localhost:55001

# Check Bolt connection
# Visit: http://localhost:55001
# Login and run: RETURN "Connected!"
```

---

## 🎯 What's Configured

✅ **Neo4j Client** - Uses port 55002  
✅ **Graph Visualization** - Connects automatically  
✅ **Error Handling** - Shows helpful messages  
✅ **Environment Variables** - Custom ports supported  

**Your Neo4j is ready to use with custom ports!** 🔵✨

---

## 🚀 Next Steps

```bash
# 1. Create .env.local with your ports
# (already done above)

# 2. Start your app
npm run dev

# 3. Visit insights page
# http://localhost:5173/app/insights

# 4. See knowledge graph!
# (will show setup instructions if not connected)
```

**Neo4j will connect to port 55002 automatically!** 🎉

