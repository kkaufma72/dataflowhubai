# 🔵 Knowledge Graph Auto-Sync

## ✅ Feature: Automatic Neo4j Synchronization

**When users upload datasets, the app now:**

1. ✅ **Uploads to Supabase** (operational database)
2. ✅ **Syncs to Neo4j** (knowledge graph)
3. ✅ **Auto-detects similarities** (finds related datasets)
4. ✅ **Creates relationships** (builds connections)
5. ✅ **Updates graph** (visualizes automatically)

---

## 🔄 **How It Works**

### **Upload Flow:**

```
User uploads CSV/Excel file
  ↓
File processed and saved to Supabase
  ↓
syncDatasetToNeo4j() called
  ↓
Creates Dataset node in Neo4j
  ↓
Links to User node
  ↓
Auto-detects similar datasets
  (based on column count, row count)
  ↓
Creates SIMILAR_TO relationships
  ↓
Knowledge graph updated!
  ↓
User sees new connections in graph
```

---

## 🤖 **Auto-Detection Algorithm**

### **Similarity Criteria:**

**Two datasets are marked similar if:**
- Column count difference ≤ 5
- Row count difference ≤ 50%
- Combined difference score < 0.3

**Example:**
```
Dataset A: 1000 rows, 15 columns
Dataset B: 1200 rows, 12 columns

Column diff: |15 - 12| = 3 ✅
Row diff: |1200 - 1000| / 1000 = 0.2 (20%) ✅
Score: 1.0 - (0.03 + 0.2) = 0.77 (77% similar)

Result: Creates relationship with score 0.77
```

---

## 📊 **Relationship Types**

### **Auto-Created:**

1. **SIMILAR_TO**
   - Created when datasets have similar structure
   - Includes similarity score (0-1)
   - Reason: "Auto-detected similarity"

2. **OWNS**
   - Links user to their datasets
   - Shows ownership in graph

### **Future (Can Add):**

3. **DERIVED_FROM** - When dataset is transformed
4. **TRAINED_MODEL** - Links to ML models
5. **CONTAINS_COLUMN** - Shared column names
6. **SAME_PROJECT** - Same project datasets

---

## 🎯 **User Experience**

### **Before (Manual):**
```
1. Upload dataset
2. Go to Neo4j Browser
3. Manually create nodes
4. Manually create relationships
5. Refresh knowledge graph
```

### **After (Automatic):**
```
1. Upload dataset
2. Done! ✅

(Everything else happens automatically)
```

**Knowledge graph builds itself!**

---

## 💡 **Features**

### **1. Auto-Sync on Upload**

```typescript
// Happens automatically after upload
await syncDatasetToNeo4j(dataset, user.id);

// Creates:
// - Dataset node
// - User → OWNS → Dataset
// - Dataset → SIMILAR_TO → Other datasets
```

### **2. Similarity Detection**

```cypher
// Finds similar datasets
MATCH (new:Dataset)
MATCH (existing:Dataset)
WHERE existing.id <> new.id
  AND abs(existing.columns - new.columns) <= 5
  AND row_similarity < 0.5
CREATE (new)-[:SIMILAR_TO {score: 0.85}]->(existing)
```

### **3. Graceful Fallback**

```typescript
// If Neo4j is offline:
// - Upload still works
// - Saves to Supabase
// - Neo4j sync skipped silently
// - No errors for users
```

---

## 🧪 **Test It**

### **1. Upload a Dataset**

Go to: http://localhost:5173/app/data

Click "Upload" → Choose a CSV file

### **2. Check Console**

Should see:
```
🔵 Syncing dataset to Neo4j: your-file.csv
✅ Dataset synced to knowledge graph
🔗 Created 2 similarity relationships
```

### **3. View Knowledge Graph**

Go to: Insights → Knowledge Graph → Refresh

**You should see:**
- New node for your dataset
- Arrows to similar datasets
- Auto-built graph!

---

## 🔧 **Technical Details**

### **Code Files:**

**1. `src/lib/neo4jSync.ts`** - Auto-sync service
   - syncDatasetToNeo4j()
   - autoDetectSimilarities()
   - bulkSyncDatasetsToNeo4j()
   - removeDatasetFromNeo4j()

**2. `src/pages/DataManagementDark.tsx`** - Upload integration
   - Calls syncDatasetToNeo4j after upload
   - Shows success message
   - Handles errors gracefully

### **Similarity Algorithm:**

```typescript
const similarity_score = 1.0 - (column_difference + row_difference)

where:
  column_difference = abs(cols1 - cols2) / max(cols1, cols2)
  row_difference = abs(rows1 - rows2) / max(rows1, rows2)

If similarity_score > 0.7:
  Create SIMILAR_TO relationship
```

---

## 📈 **Benefits**

### **For Users:**
- 🚀 **Automatic** - No manual work
- 🔍 **Discovery** - Finds related datasets
- 📊 **Visualization** - See connections immediately
- 💡 **Insights** - Understand data relationships

### **For Your Platform:**
- 🎯 **Differentiation** - Unique knowledge graph
- 🤖 **AI Enhancement** - Better context
- 📈 **Value** - Advanced feature
- 💎 **Premium** - Can be Pro-only feature

---

## 🎊 **What You Have Now**

**Knowledge Graph That:**
- ✅ Builds automatically on upload
- ✅ Detects similarities
- ✅ Creates relationships
- ✅ Updates in real-time
- ✅ Works seamlessly

**No manual Neo4j work needed!**

---

## 🚀 **Next Upload:**

When you upload your next dataset:
1. It will auto-create a Neo4j node
2. Find similar datasets (if any)
3. Create connections
4. Update knowledge graph

**Self-building knowledge graph!** 🔵✨

---

**Your knowledge graph now syncs automatically!** 🎉

