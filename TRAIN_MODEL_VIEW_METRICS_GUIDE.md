# 🎯 Step-by-Step: Train a Model and See Metrics in InfluxDB

## ✅ Status Check
- ✅ Dev Server: http://localhost:5173 (Running)
- ✅ InfluxDB: http://localhost:8086 (Running)
- ✅ Integration: Active (metrics will be logged automatically)

---

## 📋 Step-by-Step Instructions

### Step 1: Open the Training Page
1. Go to: http://localhost:5173/app/train
2. You should see the Model Training dashboard

### Step 2: Prepare for Training
**Before training, open these:**

#### A. Browser DevTools (to see console logs)
- Press `F12` or `Cmd+Option+I` (Mac)
- Click the **Console** tab
- You'll see real-time logs like: `✅ Logged metrics to InfluxDB: { ... }`

#### B. InfluxDB UI (to see metrics)
- Open: http://localhost:8086
- Login: `admin` / `dataflow_admin_2025`
- Click **Data Explorer** in left sidebar

### Step 3: Train a Model
1. **Select a Dataset**
   - Click on any dataset card (or "Select Dataset" button)
   - Choose from your uploaded datasets

2. **Configure Model**
   - Model Type: Classification or Regression
   - Algorithm: Random Forest, XGBoost, Neural Network, etc.
   - Click **"Train Model"** button

3. **Watch Training Progress**
   - Progress bar will show training status
   - Console logs will show: `✅ Logged metrics to InfluxDB`
   - Training completes in ~10-30 seconds

### Step 4: View Metrics in InfluxDB

#### Option A: Data Explorer (Visual)
1. In InfluxDB UI, go to **Data Explorer**
2. Select:
   - **Bucket**: `model_metrics`
   - **Measurement**: `model_metrics`
   - **Fields**: `accuracy`, `loss`, `epoch`
3. Click **Submit** to run query
4. You'll see a graph of your metrics!

#### Option B: Run a Query (Advanced)
1. In Data Explorer, click **Script Editor**
2. Paste this query:
   ```flux
   from(bucket: "model_metrics")
     |> range(start: -1h)
     |> filter(fn: (r) => r["_measurement"] == "model_metrics")
     |> filter(fn: (r) => r["_field"] == "accuracy" or r["_field"] == "loss")
     |> yield(name: "mean")
   ```
3. Click **Submit**
4. View results in table or graph format

---

## 🔍 What to Look For

### In Browser Console
You should see logs like:
```
✅ Logged metrics to InfluxDB: { 
  model: "Classification Model (Random Forest)", 
  accuracy: 0.6523, 
  epoch: 3 
}
✅ Logged metrics to InfluxDB: { 
  model: "Classification Model (Random Forest)", 
  accuracy: 0.7891, 
  epoch: 7 
}
```

### In InfluxDB Data Explorer
You should see:
- **Time-series graph** showing accuracy increasing over epochs
- **Loss decreasing** as training progresses
- **Tags**: model_id, model_name, user_id, dataset_id
- **Fields**: accuracy, loss, precision, recall, f1_score, epoch

---

## 📊 Sample Metrics

During training, you'll see metrics logged approximately every 500ms:

| Epoch | Accuracy | Loss | Timestamp |
|-------|----------|------|-----------|
| 1 | 0.52 | 1.35 | 2025-11-16 16:50:00 |
| 5 | 0.68 | 0.98 | 2025-11-16 16:50:05 |
| 10 | 0.85 | 0.45 | 2025-11-16 16:50:10 |
| 100 | 0.92 | 0.08 | 2025-11-16 16:50:50 |

**Final Metrics** (logged on completion):
- Accuracy: 0.85-0.95
- Precision: 0.75-0.90
- Recall: 0.70-0.90
- F1 Score: 0.75-0.90

---

## 🎨 InfluxDB Queries to Try

### 1. View All Models' Latest Accuracy
```flux
from(bucket: "model_metrics")
  |> range(start: -24h)
  |> filter(fn: (r) => r._field == "accuracy")
  |> last()
  |> group(columns: ["model_name"])
```

### 2. Calculate Average Accuracy
```flux
from(bucket: "model_metrics")
  |> range(start: -1h)
  |> filter(fn: (r) => r._field == "accuracy")
  |> mean()
```

### 3. Track Training Progress for Specific Model
```flux
from(bucket: "model_metrics")
  |> range(start: -1h)
  |> filter(fn: (r) => r.model_name == "Classification Model (Random Forest)")
  |> filter(fn: (r) => r._field == "accuracy" or r._field == "loss")
  |> sort(columns: ["_time"])
```

### 4. Find Best Performing Models
```flux
from(bucket: "model_metrics")
  |> range(start: -7d)
  |> filter(fn: (r) => r._field == "accuracy")
  |> max()
  |> group(columns: ["model_name"])
  |> sort(columns: ["_value"], desc: true)
  |> limit(n: 5)
```

---

## 🐛 Troubleshooting

### "No data available" in InfluxDB?
**Solution:**
1. Check browser console for errors
2. Verify InfluxDB token in `.env`:
   ```bash
   VITE_INFLUXDB_TOKEN=dataflow-influx-token-2025
   ```
3. Check Docker logs:
   ```bash
   /Applications/Docker.app/Contents/Resources/bin/docker logs dataflow_influxdb --tail 50
   ```

### Metrics not appearing during training?
**Solution:**
1. Open browser DevTools (F12)
2. Look for console logs: `✅ Logged metrics to InfluxDB`
3. If you see errors, check InfluxDB connection
4. Restart dev server: `npm run dev`

### InfluxDB UI shows "Token is invalid"?
**Solution:**
1. Restart InfluxDB container:
   ```bash
   /Applications/Docker.app/Contents/Resources/bin/docker restart dataflow_influxdb
   ```
2. Wait 10 seconds for initialization
3. Login again: `admin` / `dataflow_admin_2025`

---

## 📚 Quick Reference

### URLs
- **Training Page**: http://localhost:5173/app/train
- **InfluxDB UI**: http://localhost:8086
- **Dev Server**: http://localhost:5173

### Credentials
- **InfluxDB Login**: `admin` / `dataflow_admin_2025`
- **Token**: `dataflow-influx-token-2025`
- **Organization**: `dataflowhub`
- **Bucket**: `model_metrics`

### Test Script
```bash
./test-influxdb-metrics.sh
```

### Docker Commands
```bash
# Check status
/Applications/Docker.app/Contents/Resources/bin/docker ps | grep influxdb

# View logs
/Applications/Docker.app/Contents/Resources/bin/docker logs dataflow_influxdb -f

# Restart
/Applications/Docker.app/Contents/Resources/bin/docker restart dataflow_influxdb

# Query from CLI
/Applications/Docker.app/Contents/Resources/bin/docker exec dataflow_influxdb \
  influx query 'from(bucket:"model_metrics") |> range(start:-1h)' \
  -t dataflow-influx-token-2025 -o dataflowhub
```

---

## 🎉 Success Checklist

After training a model, verify:

- [ ] ✅ Browser console shows: "✅ Logged metrics to InfluxDB"
- [ ] ✅ InfluxDB Data Explorer shows data in `model_metrics` bucket
- [ ] ✅ Graphs display accuracy/loss trends
- [ ] ✅ Model details show in tags (model_id, model_name)
- [ ] ✅ Final metrics include precision, recall, F1 score
- [ ] ✅ Timestamp matches training time

---

## 🚀 Ready to Train!

**Current Status:**
- ✅ Dev Server: Running
- ✅ InfluxDB: Running  
- ✅ Integration: Active

**Your Actions:**
1. Open http://localhost:5173/app/train
2. Open DevTools (F12) → Console tab
3. Select a dataset and click "Train Model"
4. Watch metrics appear in console and InfluxDB!

**Happy Training! 🎯📊**
