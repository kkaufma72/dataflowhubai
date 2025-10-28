# 🔵 Neo4j Graph Database Setup with Docker

## 🎯 Why Neo4j?

**Perfect for:**
- 🔗 **Knowledge graphs** - Connect datasets, insights, users
- 🧠 **Relationship analysis** - Find connections in data
- 📊 **Graph visualization** - See data relationships
- 🤖 **AI context** - Enhanced RAG with graph memory

---

## 🐳 Quick Setup (5 Minutes)

### Step 1: Run Neo4j in Docker

```bash
# Create Neo4j container with persistent storage
docker run -d \
  --name neo4j \
  -p 7474:7474 \
  -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/your-password-here \
  -e NEO4J_PLUGINS='["apoc", "graph-data-science"]' \
  -v neo4j_data:/data \
  -v neo4j_logs:/logs \
  neo4j:latest

# Check it's running
docker ps | grep neo4j
```

**Ports:**
- `7474` - HTTP (Browser interface)
- `7687` - Bolt protocol (Application connection)

---

### Step 2: Access Neo4j Browser

**Open in browser:**
```
http://localhost:7474
```

**Login:**
- Username: `neo4j`
- Password: `your-password-here`

**You'll see Neo4j Browser** - A beautiful graph visualization tool!

---

### Step 3: Install Neo4j Driver for Your App

```bash
cd /Users/kyledev/dataflowhubai
npm install neo4j-driver
```

---

## 🔌 Integration with Your App

### Option 1: Client-Side Connection (Simple)

Create `src/lib/neo4j.ts`:

```typescript
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  import.meta.env.VITE_NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    import.meta.env.VITE_NEO4J_USER || 'neo4j',
    import.meta.env.VITE_NEO4J_PASSWORD || 'your-password'
  )
);

export const runQuery = async (cypher: string, params: any = {}) => {
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map(record => record.toObject());
  } finally {
    await session.close();
  }
};

export const createDatasetNode = async (dataset: any) => {
  const query = `
    CREATE (d:Dataset {
      id: $id,
      name: $name,
      rows: $rows,
      columns: $columns,
      created_at: $created_at
    })
    RETURN d
  `;
  
  return await runQuery(query, {
    id: dataset.id,
    name: dataset.name,
    rows: dataset.row_count,
    columns: dataset.column_count,
    created_at: dataset.created_at
  });
};

export const linkDatasetToUser = async (datasetId: string, userId: string) => {
  const query = `
    MATCH (d:Dataset {id: $datasetId})
    MATCH (u:User {id: $userId})
    MERGE (u)-[:OWNS]->(d)
  `;
  
  return await runQuery(query, { datasetId, userId });
};

export const findRelatedDatasets = async (datasetId: string) => {
  const query = `
    MATCH (d:Dataset {id: $datasetId})-[:SIMILAR_TO]-(related:Dataset)
    RETURN related
    LIMIT 5
  `;
  
  return await runQuery(query, { datasetId });
};

export default driver;
```

Add to `.env.local`:
```bash
VITE_NEO4J_URI=bolt://localhost:7687
VITE_NEO4J_USER=neo4j
VITE_NEO4J_PASSWORD=your-password-here
```

---

### Option 2: Secure Backend (Recommended for Production)

**Problem:** Neo4j credentials exposed in client

**Solution:** Create Supabase Edge Function

Create `supabase/functions/neo4j-query/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import neo4j from "npm:neo4j-driver@5.14.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const neo4jUri = Deno.env.get('NEO4J_URI') || 'bolt://localhost:7687';
    const neo4jUser = Deno.env.get('NEO4J_USER') || 'neo4j';
    const neo4jPassword = Deno.env.get('NEO4J_PASSWORD');

    if (!neo4jPassword) {
      throw new Error('NEO4J_PASSWORD not configured');
    }

    const driver = neo4j.driver(
      neo4jUri,
      neo4j.auth.basic(neo4jUser, neo4jPassword)
    );

    const { query, params } = await req.json();

    const session = driver.session();
    const result = await session.run(query, params);
    await session.close();
    await driver.close();

    const records = result.records.map(record => record.toObject());

    return new Response(
      JSON.stringify({ records }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

**Set Supabase secrets:**
```bash
npx supabase secrets set NEO4J_URI=bolt://your-neo4j-host:7687
npx supabase secrets set NEO4J_USER=neo4j
npx supabase secrets set NEO4J_PASSWORD=your-password
```

**Deploy:**
```bash
npx supabase functions deploy neo4j-query
```

---

## 🎯 Use Cases for Neo4j in DataFlowHub

### 1. **Dataset Relationships**

```cypher
// Link datasets by shared columns
MATCH (d1:Dataset)-[:HAS_COLUMN]->(c:Column)<-[:HAS_COLUMN]-(d2:Dataset)
WHERE d1.id <> d2.id
MERGE (d1)-[:SIMILAR_TO {shared_columns: count(c)}]->(d2)
```

**Use:** Recommend related datasets to users

### 2. **User Knowledge Graph**

```cypher
// Track what users have analyzed
CREATE (u:User {id: $userId})-[:ANALYZED]->(d:Dataset {id: $datasetId})
CREATE (d)-[:GENERATED_INSIGHT]->(i:Insight {text: $insight})
CREATE (u)-[:LEARNED]->(i)
```

**Use:** Personalized AI that remembers user preferences

### 3. **ML Model Lineage**

```cypher
// Track which datasets trained which models
MATCH (d:Dataset {id: $datasetId})
CREATE (m:Model {id: $modelId, name: $name})
CREATE (d)-[:TRAINED]->(m)
CREATE (m)-[:DEPLOYED_AT {timestamp: datetime()}]->(e:Endpoint)
```

**Use:** Model versioning and lineage tracking

### 4. **AI Context Graph**

```cypher
// Build knowledge graph for RAG
MATCH (d:Dataset)-[:CONTAINS]->(insight:Insight)
MATCH (insight)-[:RELATES_TO]->(topic:Topic)
RETURN topic, count(insight) as relevance
ORDER BY relevance DESC
```

**Use:** Enhanced AI context with graph retrieval

---

## 🚀 Deploy Neo4j (Production)

### Option A: Neo4j Aura (Managed Cloud - Easiest)

```
1. Go to: https://neo4j.com/cloud/aura/
2. Create free account
3. Create database (Free tier available)
4. Get connection URI: bolt+s://xxx.databases.neo4j.io
5. Save credentials

Add to Vercel:
VITE_NEO4J_URI=bolt+s://xxx.databases.neo4j.io
VITE_NEO4J_USER=neo4j
VITE_NEO4J_PASSWORD=your-password
```

**Pros:**
- ✅ Free tier (50K nodes, 175K relationships)
- ✅ Managed (no server maintenance)
- ✅ Auto-backups
- ✅ Production-ready

**Cons:**
- ⚠️ Limited free tier
- ⚠️ Costs scale with usage

---

### Option B: Self-Hosted Docker (Railway, Render, etc.)

**Railway.app:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy Neo4j
railway init
railway add

# Select "Neo4j" from templates
# Get connection URL from Railway dashboard
```

**Render.com:**
```yaml
# render.yaml
services:
  - type: web
    name: neo4j
    env: docker
    dockerfilePath: ./Dockerfile.neo4j
    envVars:
      - key: NEO4J_AUTH
        value: neo4j/your-password
```

---

### Option C: Docker Compose (Local Development)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  neo4j:
    image: neo4j:latest
    container_name: neo4j
    ports:
      - "7474:7474"  # HTTP
      - "7687:7687"  # Bolt
    environment:
      - NEO4J_AUTH=neo4j/your-password-here
      - NEO4J_PLUGINS=["apoc", "graph-data-science"]
      - NEO4J_dbms_memory_heap_max__size=1G
      - NEO4J_dbms_memory_pagecache_size=512M
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs
    restart: unless-stopped

volumes:
  neo4j_data:
  neo4j_logs:
```

**Run:**
```bash
docker-compose up -d
```

---

## 🎨 Example: Knowledge Graph for DataFlowHub

### Create Graph Schema:

```cypher
// Users
CREATE (u:User {
  id: 'user-123',
  email: 'user@example.com',
  name: 'Kyle'
})

// Datasets
CREATE (d1:Dataset {
  id: 'dataset-abc',
  name: 'Customer Data',
  rows: 1250,
  columns: 15
})

CREATE (d2:Dataset {
  id: 'dataset-def',
  name: 'Sales Data',
  rows: 850,
  columns: 8
})

// Relationships
CREATE (u)-[:OWNS]->(d1)
CREATE (u)-[:OWNS]->(d2)
CREATE (d1)-[:SIMILAR_TO {score: 0.85}]->(d2)

// Insights
CREATE (i:Insight {
  text: 'Customer churn rate is 15%',
  confidence: 0.92
})

CREATE (d1)-[:GENERATED_INSIGHT]->(i)
CREATE (u)-[:DISCOVERED]->(i)
```

### Query Graph:

```cypher
// Find all datasets user has analyzed
MATCH (u:User {id: $userId})-[:OWNS]->(d:Dataset)
RETURN d
ORDER BY d.created_at DESC

// Find related datasets
MATCH (d:Dataset {id: $datasetId})-[:SIMILAR_TO]-(related:Dataset)
RETURN related, similarity
ORDER BY similarity DESC

// Get user's insights
MATCH (u:User {id: $userId})-[:DISCOVERED]->(i:Insight)
RETURN i
ORDER BY i.created_at DESC
```

---

## 💡 Integration Example

### Auto-Create Graph Nodes on Dataset Upload:

```typescript
// In DataManagement page, after upload:
import { createDatasetNode, linkDatasetToUser } from '../lib/neo4j';

const handleDatasetUpload = async (dataset: Dataset) => {
  // 1. Save to Supabase (existing)
  const { data } = await supabase.from('datasets').insert(dataset);
  
  // 2. Create Neo4j node (NEW!)
  await createDatasetNode(dataset);
  await linkDatasetToUser(dataset.id, user.id);
  
  // 3. Find similar datasets
  const similar = await findRelatedDatasets(dataset.id);
  
  if (similar.length > 0) {
    toast.success(
      `Upload complete! Found ${similar.length} related datasets`
    );
  }
};
```

---

## 📊 Visualize Graph in Your App

### Install Neovis (Graph Visualization):

```bash
npm install neovis.js
```

### Create Graph Viewer Component:

```typescript
import React, { useEffect, useRef } from 'react';
import Neovis from 'neovis.js';

const Neo4jGraphViewer = () => {
  const vizRef = useRef(null);

  useEffect(() => {
    const config = {
      containerId: vizRef.current?.id,
      neo4j: {
        serverUrl: 'bolt://localhost:7687',
        serverUser: 'neo4j',
        serverPassword: 'your-password',
      },
      labels: {
        Dataset: {
          label: 'name',
          size: 'rows',
          community: 'type'
        }
      },
      relationships: {
        SIMILAR_TO: {
          thickness: 'score',
          caption: false
        }
      },
      initialCypher: 'MATCH (d:Dataset) RETURN d LIMIT 25'
    };

    const viz = new Neovis(config);
    viz.render();
  }, []);

  return (
    <div 
      id="neo4j-viz"
      ref={vizRef}
      className="w-full h-[600px] bg-gray-900 rounded-lg"
    />
  );
};
```

---

## 🔧 Docker Commands Reference

```bash
# Start Neo4j
docker start neo4j

# Stop Neo4j
docker stop neo4j

# View logs
docker logs neo4j -f

# Restart Neo4j
docker restart neo4j

# Remove Neo4j (keeps data in volume)
docker rm neo4j

# Remove Neo4j AND data
docker rm neo4j
docker volume rm neo4j_data neo4j_logs

# Access Neo4j shell
docker exec -it neo4j cypher-shell -u neo4j -p your-password

# Backup database
docker exec neo4j neo4j-admin database dump neo4j --to=/backups/backup.dump

# Restore database
docker exec neo4j neo4j-admin database load neo4j --from=/backups/backup.dump
```

---

## 🎯 Advanced Configuration

### Custom `docker-compose.yml`:

```yaml
version: '3.8'

services:
  neo4j:
    image: neo4j:5.13-community
    container_name: neo4j
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      # Auth
      - NEO4J_AUTH=neo4j/StrongPassword123!
      
      # Plugins
      - NEO4J_PLUGINS=["apoc", "graph-data-science"]
      
      # Memory (adjust based on your needs)
      - NEO4J_dbms_memory_heap_max__size=2G
      - NEO4J_dbms_memory_pagecache_size=1G
      
      # Performance
      - NEO4J_dbms_connector_bolt_thread__pool__max__size=400
      - NEO4J_dbms_threads_worker__count=4
      
      # Logging
      - NEO4J_dbms_logs_query_enabled=true
      - NEO4J_dbms_logs_query_threshold=1s
      
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs
      - neo4j_import:/var/lib/neo4j/import
      - neo4j_plugins:/plugins
    
    restart: unless-stopped
    
    healthcheck:
      test: ["CMD", "cypher-shell", "-u", "neo4j", "-p", "StrongPassword123!", "RETURN 1"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  neo4j_data:
  neo4j_logs:
  neo4j_import:
  neo4j_plugins:
```

---

## 💡 Use Cases for Your DataFlowHub

### 1. **Dataset Similarity Graph**

```cypher
// When user uploads dataset, find similar ones
MATCH (new:Dataset {id: $newDatasetId})
MATCH (existing:Dataset)
WHERE existing.id <> new.id
  AND abs(existing.columns - new.columns) <= 5
  AND abs(existing.rows - new.rows) / existing.rows < 0.5
CREATE (new)-[:SIMILAR_TO {score: 0.8}]->(existing)
```

### 2. **User Analysis History**

```cypher
// Track what users have analyzed
CREATE (u:User {id: $userId})
CREATE (d:Dataset {id: $datasetId})
CREATE (a:Analysis {
  type: 'correlation',
  results: $results,
  timestamp: datetime()
})
CREATE (u)-[:PERFORMED]->(a)-[:ON]->(d)
```

### 3. **AI Conversation Context**

```cypher
// Store AI conversations in graph
CREATE (conv:Conversation {id: $convId})
CREATE (u:User {id: $userId})-[:HAD]->(conv)
CREATE (d:Dataset {id: $datasetId})<-[:ABOUT]-(conv)
CREATE (insight:Insight {text: $aiResponse})
CREATE (conv)-[:DISCOVERED]->(insight)
```

### 4. **Model Lineage Tracking**

```cypher
// Track full ML pipeline
MATCH (d:Dataset {id: $datasetId})
CREATE (fe:FeatureEngineering {transformations: $transforms})
CREATE (m:Model {id: $modelId, accuracy: $accuracy})
CREATE (dep:Deployment {endpoint: $url})
CREATE (d)-[:PREPROCESSED_BY]->(fe)
CREATE (fe)-[:TRAINED]->(m)
CREATE (m)-[:DEPLOYED_AS]->(dep)
```

---

## 🚀 Quick Start Guide

```bash
# 1. Start Neo4j
docker run -d \
  --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/dataflowhub2024 \
  neo4j:latest

# 2. Install driver
npm install neo4j-driver

# 3. Test connection
curl http://localhost:7474
# Should show Neo4j Browser

# 4. Add to your app
# Copy src/lib/neo4j.ts from above

# 5. Create first nodes
# Visit http://localhost:7474
# Run: CREATE (:User {name: 'Test'})

# 6. Query from app
import { runQuery } from './lib/neo4j';
const users = await runQuery('MATCH (u:User) RETURN u');
```

---

## 🎨 Neo4j Browser Features

Once running at `http://localhost:7474`:

1. **Interactive Graph** - Beautiful visualization
2. **Cypher Console** - Run queries
3. **Database Info** - See nodes/relationships
4. **Guides** - Built-in tutorials

---

## 📚 Cypher Query Examples

```cypher
// Create dataset node
CREATE (d:Dataset {
  id: '123',
  name: 'Customer Data',
  rows: 1250
})

// Find all datasets
MATCH (d:Dataset)
RETURN d

// Create relationship
MATCH (u:User {id: 'user1'})
MATCH (d:Dataset {id: 'dataset1'})
CREATE (u)-[:OWNS]->(d)

// Find user's datasets
MATCH (u:User {id: $userId})-[:OWNS]->(d:Dataset)
RETURN d.name, d.rows
ORDER BY d.created_at DESC

// Delete dataset
MATCH (d:Dataset {id: $datasetId})
DETACH DELETE d
```

---

## 🔒 Security Best Practices

### Production Checklist:

- [ ] Change default password
- [ ] Use strong password (16+ chars)
- [ ] Enable TLS/SSL for Bolt
- [ ] Use Edge Function (not client-side)
- [ ] Store credentials in Supabase secrets
- [ ] Enable authentication
- [ ] Restrict network access
- [ ] Regular backups

---

## 💰 Cost Comparison

| Option | Setup | Cost | Maintenance |
|--------|-------|------|-------------|
| **Neo4j Aura** | 5 min | Free (limited) → $65/mo | None |
| **Railway** | 10 min | $5-20/mo | Low |
| **Self-hosted** | 30 min | Server costs | High |
| **Local Docker** | 5 min | Free | Manual |

**Recommendation for DataFlowHub:**
- **Development:** Local Docker (free, easy)
- **Production:** Neo4j Aura (managed, reliable)

---

## 🎊 Summary

**Quick Setup:**
```bash
# 1. Run Docker
docker run -d --name neo4j -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/dataflowhub2024 neo4j:latest

# 2. Install driver
npm install neo4j-driver

# 3. Access
open http://localhost:7474
```

**Integration:**
- Create `src/lib/neo4j.ts`
- Add connection code
- Query from your components
- Build knowledge graphs!

**Next Steps:**
- Create dataset nodes on upload
- Link users to datasets
- Build similarity graph
- Visualize relationships

**Your DataFlowHub now has graph database capabilities!** 🔵🚀

Need help integrating it? Let me know!

