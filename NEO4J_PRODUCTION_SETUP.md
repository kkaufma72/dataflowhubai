# 🔵 Neo4j Knowledge Graph in Production

## 🎯 **Setup Neo4j Aura for Production**

You already have a Neo4j Aura instance!
- **ID:** bcc33cfd
- **URI:** neo4j+s://bcc33cfd.databases.neo4j.io
- **Type:** Professional (4GB, Vector optimized)

**Just need to get it working!**

---

## ✅ **Step-by-Step Setup (10 Minutes)**

### **Step 1: Reset Neo4j Aura Password**

**1. Go to:** https://console.neo4j.io

**2. Login** (use GitHub if that's what you used)

**3. Click your database:** bcc33cfd

**4. Find "Reset Password" button:**
   - Look in Settings ⚙️
   - Or Connection Details
   - Or three dots menu ⋮

**5. Click "Reset Password"**

**6. COPY THE NEW PASSWORD!** (shown only once)
   - Something like: `AbCd1234XyZ5678`
   - **Write it down or save it!**

---

### **Step 2: Test Connection**

**In Neo4j Aura Console:**

**1. Click "Query" button** on your database

**2. It will ask for password** - use the one you just reset

**3. Run this test:**
```cypher
MATCH (n) RETURN count(n) as total
```

**Should work!** ✅

---

### **Step 3: Add to Vercel**

**Go to:** https://vercel.com/dashboard → dataflowhubai → Settings → Environment Variables

**Add 3 new variables:**

#### **Variable 1:**
```
Name:  VITE_NEO4J_URI
Value: neo4j+s://bcc33cfd.databases.neo4j.io
Environments: ✅ Production ✅ Preview
```

#### **Variable 2:**
```
Name:  VITE_NEO4J_USER
Value: neo4j
Environments: ✅ Production ✅ Preview
```

#### **Variable 3:**
```
Name:  VITE_NEO4J_PASSWORD
Value: [THE PASSWORD YOU JUST RESET]
Environments: ✅ Production ✅ Preview
```

**Note:** DON'T check Development - keep using local Neo4j Desktop there

---

### **Step 4: Add Test Data to Neo4j Aura**

**In Neo4j Aura Query console:**

```cypher
// Clear any old data
MATCH (n) DETACH DELETE n;

// Create test datasets
CREATE (d1:Dataset {
  id: 'prod-1',
  name: 'Customer Analytics',
  rows: 1250,
  columns: 15,
  file_type: 'csv'
})
CREATE (d2:Dataset {
  id: 'prod-2',
  name: 'Sales Dashboard',
  rows: 850,
  columns: 8,
  file_type: 'excel'
})
CREATE (d3:Dataset {
  id: 'prod-3',
  name: 'Marketing Metrics',
  rows: 3200,
  columns: 22,
  file_type: 'json'
})

// Create relationships
CREATE (d1)-[:SIMILAR_TO {score: 0.85}]->(d2)
CREATE (d2)-[:SIMILAR_TO {score: 0.72}]->(d3)
CREATE (d1)-[:RELATED_TO]->(d3)

RETURN d1, d2, d3;
```

---

### **Step 5: Redeploy Vercel**

**After adding the 3 environment variables:**

**1. Go to Deployments tab**

**2. Click "Redeploy"** on latest

**3. ✅ Check "Skip Build Cache"**

**4. Wait 2-3 minutes**

---

### **Step 6: Test Production**

**Visit your Vercel URL:**

**1. Go to Insights page**

**2. Click "Knowledge Graph" tab**

**3. You should see the 3 datasets with relationships!** 🔵

**In production!**

---

## 🔄 **Auto-Sync Will Work Too!**

**When users upload datasets in production:**
- Saves to Supabase ✅
- Syncs to Neo4j Aura ✅
- Creates relationships ✅
- Updates knowledge graph ✅

**Self-building graph in production!** 🎉

---

## 💰 **Cost:**

**Neo4j Aura Professional:**
- You already have it (4GB instance)
- Check your Neo4j billing
- Might have free credits
- Or ~$65/month after trial

**Neo4j Aura Free Tier (Alternative):**
- Create a smaller free instance
- 50K nodes, 175K relationships
- Perfect for starting out
- $0/month

---

## 🎯 **Quick Checklist:**

- [ ] Reset password at console.neo4j.io
- [ ] Copy the new password
- [ ] Add 3 variables to Vercel (NEO4J_URI, USER, PASSWORD)
- [ ] Add test data to Neo4j Aura
- [ ] Redeploy Vercel (skip cache)
- [ ] Test production site
- [ ] See knowledge graph! 🔵

**Total time: 10 minutes**

---

**Go reset your Neo4j Aura password and give me the new password!**

I'll help you add it to Vercel! 🔵🚀

