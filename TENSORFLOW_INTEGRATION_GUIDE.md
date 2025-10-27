# 🤖 TensorFlow Integration Guide

This guide shows **3 ways** to add TensorFlow to your DataFlowHub app.

---

## ✅ **Option 1: TensorFlow.js (Recommended)**

**Best for:** Vercel + Supabase stack, browser-based ML

### Why This Approach?
- ✅ Works perfectly with Vercel (static hosting)
- ✅ No backend infrastructure needed
- ✅ Runs in the browser (client-side)
- ✅ No Docker required
- ✅ Free to run (no server costs)

### Installation

```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-vis
```

### Files Created

✅ `src/lib/tensorflowClient.ts` - TensorFlow.js utilities  
✅ `src/components/ml/TensorFlowTrainer.tsx` - Training UI component

### Usage

Add to your Model Training page:

```tsx
import TensorFlowTrainer from '../components/ml/TensorFlowTrainer';

// In your ModelTraining.tsx component:
<TensorFlowTrainer dataset={selectedDataset} />
```

### Features
- ✅ Train models in the browser
- ✅ Real-time training progress
- ✅ Download trained models
- ✅ Save models to localStorage
- ✅ Classification & Regression
- ✅ Auto data preprocessing

### Test It

```bash
npm run dev
# Navigate to Model Training page
# Select a dataset
# Choose features and target
# Click "Train Model"
```

---

## 🐳 **Option 2: Python TensorFlow API (Docker)**

**Best for:** Complex models, GPU training, Python ecosystem

### Architecture

```
Browser (React) 
  ↓ HTTP
Vercel (Frontend)
  ↓ API Call
TensorFlow API (Docker)
  ↓
Python TensorFlow
```

### Step 1: Create TensorFlow API

Create `tensorflow-api/` folder:

```bash
mkdir tensorflow-api
cd tensorflow-api
```

**`tensorflow-api/Dockerfile`:**
```dockerfile
FROM tensorflow/tensorflow:latest-gpu

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy code
COPY . .

# Expose port
EXPOSE 8000

# Run API
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**`tensorflow-api/requirements.txt`:**
```
tensorflow==2.15.0
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
numpy==1.24.3
pandas==2.1.4
scikit-learn==1.4.0
```

**`tensorflow-api/main.py`:**
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
import numpy as np
import pandas as pd
from typing import List, Dict, Any

app = FastAPI(title="TensorFlow API")

# CORS for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TrainingRequest(BaseModel):
    features: List[List[float]]
    targets: List[float]
    model_type: str  # 'classification' or 'regression'
    epochs: int = 50
    batch_size: int = 32

class PredictionRequest(BaseModel):
    model_id: str
    features: List[List[float]]

# Store models in memory (use Redis/DB in production)
models: Dict[str, tf.keras.Model] = {}

@app.get("/")
def read_root():
    return {
        "status": "TensorFlow API Running",
        "tensorflow_version": tf.__version__,
        "models_loaded": len(models)
    }

@app.post("/train")
async def train_model(request: TrainingRequest):
    try:
        # Convert to numpy arrays
        X = np.array(request.features)
        y = np.array(request.targets)
        
        # Build model
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(64, activation='relu', input_shape=(X.shape[1],)),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(16, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid' if request.model_type == 'classification' else 'linear')
        ])
        
        # Compile
        model.compile(
            optimizer='adam',
            loss='binary_crossentropy' if request.model_type == 'classification' else 'mse',
            metrics=['accuracy'] if request.model_type == 'classification' else ['mae']
        )
        
        # Train
        history = model.fit(
            X, y,
            epochs=request.epochs,
            batch_size=request.batch_size,
            validation_split=0.2,
            verbose=0
        )
        
        # Generate model ID
        model_id = f"model_{len(models) + 1}"
        models[model_id] = model
        
        # Get final metrics
        final_loss = float(history.history['loss'][-1])
        final_metrics = {
            'loss': final_loss,
            'val_loss': float(history.history['val_loss'][-1]) if 'val_loss' in history.history else None
        }
        
        if request.model_type == 'classification':
            final_metrics['accuracy'] = float(history.history['accuracy'][-1])
            final_metrics['val_accuracy'] = float(history.history['val_accuracy'][-1]) if 'val_accuracy' in history.history else None
        
        return {
            "model_id": model_id,
            "status": "trained",
            "metrics": final_metrics,
            "history": {
                key: [float(v) for v in values]
                for key, values in history.history.items()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
async def predict(request: PredictionRequest):
    try:
        if request.model_id not in models:
            raise HTTPException(status_code=404, detail="Model not found")
        
        model = models[request.model_id]
        X = np.array(request.features)
        
        predictions = model.predict(X, verbose=0)
        
        return {
            "predictions": predictions.tolist()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
def list_models():
    return {
        "models": list(models.keys()),
        "count": len(models)
    }

@app.delete("/models/{model_id}")
def delete_model(model_id: str):
    if model_id in models:
        del models[model_id]
        return {"status": "deleted", "model_id": model_id}
    raise HTTPException(status_code=404, detail="Model not found")
```

### Step 2: Build & Run Docker

```bash
# Build image
docker build -t tensorflow-api .

# Run container
docker run -d \
  --name tf-api \
  -p 8000:8000 \
  --gpus all \  # If you have GPU
  tensorflow-api

# Test
curl http://localhost:8000
```

### Step 3: Deploy Docker Container

**Option A: Railway.app** (Easiest)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Option B: Google Cloud Run**
```bash
# Build and push
gcloud builds submit --tag gcr.io/YOUR-PROJECT/tensorflow-api

# Deploy
gcloud run deploy tensorflow-api \
  --image gcr.io/YOUR-PROJECT/tensorflow-api \
  --platform managed \
  --allow-unauthenticated
```

**Option C: AWS ECS**
```bash
# Push to ECR
aws ecr create-repository --repository-name tensorflow-api
docker tag tensorflow-api:latest YOUR-ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/tensorflow-api
docker push YOUR-ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/tensorflow-api

# Deploy via ECS console or Fargate
```

### Step 4: Connect Frontend to API

Create `src/lib/tensorflowAPI.ts`:

```typescript
const API_URL = process.env.VITE_TENSORFLOW_API_URL || 'http://localhost:8000';

export const trainTensorFlowModel = async (
  features: number[][],
  targets: number[],
  modelType: 'classification' | 'regression'
) => {
  const response = await fetch(`${API_URL}/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      features,
      targets,
      model_type: modelType,
      epochs: 50,
      batch_size: 32
    })
  });
  
  if (!response.ok) throw new Error('Training failed');
  return await response.json();
};

export const predictWithModel = async (
  modelId: string,
  features: number[][]
) => {
  const response = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model_id: modelId, features })
  });
  
  if (!response.ok) throw new Error('Prediction failed');
  return await response.json();
};
```

Add to Vercel environment variables:
```
VITE_TENSORFLOW_API_URL=https://your-tf-api.railway.app
```

---

## 🔧 **Option 3: TensorFlow in Supabase Edge Functions**

**Best for:** Server-side ML with Supabase stack

### Step 1: Create Edge Function with TensorFlow

```bash
npx supabase functions new ml-predict
```

**`supabase/functions/ml-predict/index.ts`:**
```typescript
// Note: TensorFlow.js in Deno (limited compared to Python)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { features, model_type } = await req.json();
    
    // Simple ML logic (or call Python API from here)
    // For complex ML, Option 2 (Python API) is better
    
    const predictions = features.map((row: number[]) => {
      // Simple linear prediction as example
      return row.reduce((a, b) => a + b, 0) / row.length;
    });
    
    return new Response(
      JSON.stringify({ predictions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

**Note:** Deno (Supabase Edge Functions) has limited TensorFlow support. For serious ML, use **Option 1 (TensorFlow.js in browser)** or **Option 2 (Python Docker API)**.

---

## 📊 **Comparison**

| Feature | TensorFlow.js | Python Docker API | Edge Functions |
|---------|---------------|-------------------|----------------|
| **Setup** | ✅ Easy (npm install) | ⚠️ Complex (Docker) | ⚠️ Limited |
| **Cost** | ✅ Free (client-side) | ⚠️ Server costs | ✅ Free tier |
| **Performance** | ⚠️ Slower (browser) | ✅ Fast (GPU support) | ⚠️ Slow |
| **Models** | ⚠️ Smaller models | ✅ Any size | ⚠️ Limited |
| **Vercel Compatible** | ✅ Yes | ✅ Yes (via API) | ✅ Yes |
| **Offline** | ✅ Yes | ❌ No | ❌ No |
| **GPU** | ⚠️ WebGL only | ✅ Full GPU | ❌ No |

---

## 🎯 **Recommendation**

### For Your Stack (Vercel + Supabase):

1. **Start with Option 1 (TensorFlow.js)** ✅
   - Already created for you!
   - Works immediately with your stack
   - No infrastructure needed
   - Good for most ML use cases

2. **Upgrade to Option 2 (Docker)** if you need:
   - Large/complex models
   - GPU training
   - Python ML ecosystem (scikit-learn, XGBoost, etc.)
   - High performance requirements

3. **Skip Option 3** (Edge Functions)
   - Limited TensorFlow support in Deno
   - Better to use Options 1 or 2

---

## 🚀 **Quick Start (TensorFlow.js)**

```bash
# 1. Install dependencies
npm install @tensorflow/tfjs @tensorflow/tfjs-vis

# 2. Files are already created:
# - src/lib/tensorflowClient.ts
# - src/components/ml/TensorFlowTrainer.tsx

# 3. Add to your app
# Edit src/pages/train/index.tsx (or wherever you want ML)

# 4. Test it
npm run dev
```

---

## 📚 **Resources**

- TensorFlow.js Docs: https://www.tensorflow.org/js
- TensorFlow.js Tutorials: https://www.tensorflow.org/js/tutorials
- TensorFlow Python: https://www.tensorflow.org/api_docs/python/tf
- FastAPI Docs: https://fastapi.tiangolo.com
- Docker TensorFlow Images: https://hub.docker.com/r/tensorflow/tensorflow

---

## 🐛 **Troubleshooting**

### TensorFlow.js Issues

```bash
# Memory errors
# Solution: Use smaller batch sizes or models

# WebGL errors
# Solution: Use CPU backend
import * as tf from '@tensorflow/tfjs';
tf.setBackend('cpu');
```

### Docker API Issues

```bash
# Container won't start
docker logs tf-api

# Out of memory
# Solution: Increase Docker memory limit
docker update --memory="4g" tf-api

# GPU not working
# Solution: Install nvidia-docker
# https://github.com/NVIDIA/nvidia-docker
```

---

**Ready to train ML models!** 🤖

Start with TensorFlow.js (Option 1) - it's already set up and ready to go!

