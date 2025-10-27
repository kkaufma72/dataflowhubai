# 🐳 Connect Your Docker TensorFlow to DataFlowHub

Since you already have TensorFlow running in Docker, here's how to connect it to your app.

---

## ✅ **What I Created**

Files ready to connect to your Docker TensorFlow:

- ✅ `src/lib/tensorflowDocker.ts` - API client
- ✅ `src/components/ml/DockerTensorFlowTrainer.tsx` - UI component
- ✅ Environment variable configuration

---

## 🔌 **Step 1: Configure Connection**

### Add to `.env.local`:

```bash
# Your Docker TensorFlow API URL
VITE_TENSORFLOW_API_URL=http://localhost:8000

# Optional: If your API requires auth
VITE_TENSORFLOW_API_KEY=your-api-key-here
```

### Common Docker URLs:

```bash
# Local Docker
VITE_TENSORFLOW_API_URL=http://localhost:8000

# Docker Compose with service name
VITE_TENSORFLOW_API_URL=http://tensorflow-api:8000

# Deployed Docker (Railway, GCP, AWS)
VITE_TENSORFLOW_API_URL=https://your-tf-api.railway.app
```

---

## 🚀 **Step 2: Add to Your App**

### Option A: Add to Model Training Page

Edit `src/pages/train/index.tsx`:

```tsx
import DockerTensorFlowTrainer from '../../components/ml/DockerTensorFlowTrainer';

const ModelTrainingPage = () => {
  const [selectedDataset, setSelectedDataset] = useState(null);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Train with Docker TensorFlow</h1>
      
      {selectedDataset && (
        <DockerTensorFlowTrainer dataset={selectedDataset} />
      )}
    </div>
  );
};
```

### Option B: Add to Dataset Card

In `src/components/data/DatasetCard.tsx`:

```tsx
import { useState } from 'react';
import DockerTensorFlowTrainer from '../ml/DockerTensorFlowTrainer';

// Add button
<Button
  onClick={() => setShowTrainer(true)}
  icon={<Brain className="w-4 h-4" />}
>
  Train with TensorFlow
</Button>

// Show trainer in modal
{showTrainer && (
  <Modal onClose={() => setShowTrainer(false)}>
    <DockerTensorFlowTrainer dataset={dataset} />
  </Modal>
)}
```

---

## 🧪 **Step 3: Test Connection**

```bash
# 1. Make sure your Docker TensorFlow is running
docker ps | grep tensorflow

# 2. Test the API directly
curl http://localhost:8000/health

# 3. Start your app
npm run dev

# 4. Open the page with DockerTensorFlowTrainer
# You should see: "Connected ✓"
```

---

## 📡 **Required API Endpoints**

Your Docker TensorFlow API needs these endpoints:

### 1. Health Check
```
GET /health
Response: { "status": "ok", "version": "2.15.0" }
```

### 2. Train Model
```
POST /train
Body: {
  "features": [[1.0, 2.0], [3.0, 4.0]],
  "targets": [0, 1],
  "model_type": "classification",
  "epochs": 50,
  "batch_size": 32,
  "learning_rate": 0.001
}
Response: {
  "model_id": "model_123",
  "status": "trained",
  "metrics": {
    "loss": 0.1234,
    "accuracy": 0.95
  }
}
```

### 3. Predict
```
POST /predict
Body: {
  "model_id": "model_123",
  "features": [[1.5, 2.5]]
}
Response: {
  "predictions": [[0.85]]
}
```

### 4. List Models (Optional)
```
GET /models
Response: {
  "models": ["model_1", "model_2"],
  "count": 2
}
```

---

## 🐳 **Docker API Examples**

### If you need an API template, here are examples:

<details>
<summary><strong>FastAPI Example (Python)</strong></summary>

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np

app = FastAPI()

# Allow your Vercel domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://your-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models = {}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": tf.__version__
    }

@app.post("/train")
async def train(request: dict):
    X = np.array(request["features"])
    y = np.array(request["targets"])
    
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(64, activation='relu', input_shape=(X.shape[1],)),
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])
    
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    history = model.fit(X, y, epochs=request.get("epochs", 50), batch_size=32, validation_split=0.2, verbose=0)
    
    model_id = f"model_{len(models)+1}"
    models[model_id] = model
    
    return {
        "model_id": model_id,
        "status": "trained",
        "metrics": {
            "loss": float(history.history['loss'][-1]),
            "accuracy": float(history.history['accuracy'][-1])
        }
    }

@app.post("/predict")
async def predict(request: dict):
    model_id = request["model_id"]
    model = models.get(model_id)
    if not model:
        return {"error": "Model not found"}, 404
    
    X = np.array(request["features"])
    predictions = model.predict(X, verbose=0)
    
    return {"predictions": predictions.tolist()}
```

Run with:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

</details>

<details>
<summary><strong>Dockerfile</strong></summary>

```dockerfile
FROM tensorflow/tensorflow:latest-gpu

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

requirements.txt:
```
tensorflow==2.15.0
fastapi==0.109.0
uvicorn[standard]==0.27.0
numpy==1.24.3
```

</details>

---

## 🌐 **Step 4: Deploy (Optional)**

If your Docker TensorFlow is running locally, you can deploy it:

### Option A: Railway (Easiest)
```bash
# Install CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Get URL
railway status
# Add to Vercel: VITE_TENSORFLOW_API_URL=https://xxx.railway.app
```

### Option B: Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/PROJECT/tensorflow-api
gcloud run deploy --image gcr.io/PROJECT/tensorflow-api --allow-unauthenticated
```

### Option C: AWS ECS/Fargate
```bash
# Push to ECR
aws ecr create-repository --repository-name tensorflow-api
docker tag tensorflow-api:latest ACCOUNT.dkr.ecr.REGION.amazonaws.com/tensorflow-api
docker push ACCOUNT.dkr.ecr.REGION.amazonaws.com/tensorflow-api
```

---

## 🔒 **Step 5: Add to Vercel Environment**

In Vercel dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add:
   - **Name:** `VITE_TENSORFLOW_API_URL`
   - **Value:** `https://your-docker-api.com`
3. Redeploy

---

## 💡 **Usage Example**

```typescript
import { createTensorFlowClient } from './lib/tensorflowDocker';

// Create client
const client = createTensorFlowClient();

// Check connection
const health = await client.healthCheck();
console.log('TensorFlow version:', health.version);

// Train model
const result = await client.train({
  features: [[1, 2], [3, 4], [5, 6]],
  targets: [0, 1, 1],
  modelType: 'classification',
  epochs: 50
});

console.log('Model ID:', result.modelId);
console.log('Accuracy:', result.metrics.accuracy);

// Make predictions
const predictions = await client.predict({
  modelId: result.modelId,
  features: [[2, 3]]
});

console.log('Prediction:', predictions.predictions[0]);
```

---

## 🐛 **Troubleshooting**

### "Cannot connect to TensorFlow API"

**Check Docker is running:**
```bash
docker ps
```

**Check API is accessible:**
```bash
curl http://localhost:8000/health
```

**Check CORS is configured:**
Make sure your Docker API allows requests from your Vercel domain.

### "Connection refused"

**If using Docker Desktop:**
```bash
# Use host.docker.internal instead of localhost
VITE_TENSORFLOW_API_URL=http://host.docker.internal:8000
```

**If using Docker Compose:**
```bash
# Use service name
VITE_TENSORFLOW_API_URL=http://tensorflow:8000
```

### "Model training fails"

**Check Docker logs:**
```bash
docker logs <container-id>
```

**Check data format:**
```typescript
// Features must be number[][]
const features = [[1.0, 2.0], [3.0, 4.0]]; // ✅
const features = ["1", "2"]; // ❌

// Targets must be number[]
const targets = [0, 1]; // ✅
const targets = ["yes", "no"]; // ❌
```

---

## ✅ **Verification Checklist**

- [ ] Docker TensorFlow container is running
- [ ] API responds to `/health` endpoint
- [ ] `.env.local` has `VITE_TENSORFLOW_API_URL`
- [ ] `DockerTensorFlowTrainer` component added to app
- [ ] Connection shows "Connected ✓"
- [ ] Can train a test model
- [ ] Can make predictions

---

## 🎉 **You're Connected!**

Your Docker TensorFlow is now integrated with DataFlowHub!

### What You Can Do:

✅ Train models with **GPU acceleration**  
✅ Use Python ML ecosystem (scikit-learn, XGBoost, etc.)  
✅ Handle **large datasets**  
✅ **Server-side** training (no browser limits)  
✅ Save models persistently  

### Next Steps:

1. Add authentication to your Docker API
2. Set up model persistence (save to disk/S3)
3. Add batch prediction endpoints
4. Monitor training jobs
5. Set up model versioning

---

**Your Docker TensorFlow + DataFlowHub setup is complete!** 🚀

