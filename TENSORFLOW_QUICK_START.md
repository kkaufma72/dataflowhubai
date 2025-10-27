# 🤖 TensorFlow Quick Start

## ✅ What's Ready

TensorFlow.js is now **installed and ready to use** in your app!

```bash
✅ @tensorflow/tfjs@4.15.0 - Installed
✅ @tensorflow/tfjs-vis@1.5.1 - Installed
✅ src/lib/tensorflowClient.ts - Created
✅ src/components/ml/TensorFlowTrainer.tsx - Created
```

---

## 🚀 **2-Minute Setup**

### Step 1: Add TensorFlow Trainer to Your App

Open `src/pages/train/index.tsx` (or create it):

```tsx
import React, { useState } from 'react';
import { useDatasets } from '../../hooks/useDatasets';
import TensorFlowTrainer from '../../components/ml/TensorFlowTrainer';
import Card from '../../components/common/Card';

const ModelTrainingPage: React.FC = () => {
  const { datasets } = useDatasets();
  const [selectedDataset, setSelectedDataset] = useState(datasets[0]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Train ML Models</h1>
      
      {/* Dataset Selector */}
      <Card className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Select Dataset
        </label>
        <select 
          value={selectedDataset?.id}
          onChange={(e) => setSelectedDataset(datasets.find(d => d.id === e.target.value))}
          className="w-full px-4 py-2 border rounded-lg"
        >
          {datasets.map(ds => (
            <option key={ds.id} value={ds.id}>{ds.name}</option>
          ))}
        </select>
      </Card>

      {/* TensorFlow Trainer */}
      {selectedDataset && (
        <TensorFlowTrainer dataset={selectedDataset} />
      )}
    </div>
  );
};

export default ModelTrainingPage;
```

### Step 2: Test It

```bash
npm run dev
```

Navigate to `/train` (or wherever you added it)

### Step 3: Train Your First Model

1. Select a dataset
2. Choose feature columns (inputs)
3. Choose target column (output)
4. Click "Train Model"
5. Watch it train in real-time! 🚀

---

## 💡 **Usage Examples**

### Example 1: Simple Classification

```typescript
import { buildModel, trainModel, preprocessData } from '../lib/tensorflowClient';

// Your data
const data = [
  { age: 25, income: 50000, purchased: 1 },
  { age: 35, income: 70000, purchased: 0 },
  // ... more data
];

// Preprocess
const { X, y } = preprocessData(
  data,
  ['age', 'income'],  // features
  'purchased'         // target
);

// Build model
const model = buildModel(2, 1, 'classification');

// Train
await trainModel(model, X, y, {
  modelType: 'classification',
  epochs: 50,
  batchSize: 32,
  learningRate: 0.001,
  validationSplit: 0.2
}, (progress) => {
  console.log(`Epoch ${progress.epoch}: ${progress.accuracy}`);
});

// Make predictions
const predictions = await predict(model, [[30, 60000]]);
console.log('Will purchase:', predictions[0][0] > 0.5);
```

### Example 2: Regression

```typescript
// Predict house prices
const { X, y } = preprocessData(
  houseData,
  ['sqft', 'bedrooms', 'bathrooms'],  // features
  'price'                             // target
);

const model = buildModel(3, 1, 'regression');

await trainModel(model, X, y, {
  modelType: 'regression',
  epochs: 100,
  batchSize: 16,
  learningRate: 0.001,
  validationSplit: 0.2
});

// Predict price
const [predictedPrice] = await predict(model, [[2000, 3, 2]]);
console.log('Predicted price:', predictedPrice);
```

### Example 3: Save & Load Models

```typescript
// Save to browser
await saveModel(model, 'my-awesome-model', 'browser');

// Load later
const loadedModel = await loadModel('my-awesome-model');

// Or download to computer
await saveModel(model, 'my-model', 'download');
```

---

## 🎯 **What You Can Build**

### Built-in Use Cases in TensorFlowTrainer:

1. **Customer Churn Prediction**
   - Features: usage_frequency, support_tickets, account_age
   - Target: churned (yes/no)

2. **Sales Forecasting**
   - Features: month, marketing_spend, previous_sales
   - Target: next_month_sales

3. **Price Prediction**
   - Features: size, location, age, bedrooms
   - Target: price

4. **Sentiment Analysis**
   - Features: word_embeddings (preprocessed)
   - Target: sentiment (positive/negative)

5. **Anomaly Detection**
   - Features: transaction_amount, time, location
   - Target: is_fraud (yes/no)

---

## 📊 **Features**

### What TensorFlowTrainer Provides:

✅ **Real-time Training Progress**
- Live loss/accuracy metrics
- Training visualization
- Epoch-by-epoch updates

✅ **Auto Data Preprocessing**
- Normalization (min-max scaling)
- Type conversion
- Missing value handling

✅ **Model Architecture**
- 4-layer neural network
- Dropout layers (prevent overfitting)
- Configurable activation functions

✅ **Export Options**
- Download model file
- Save to browser storage
- Export predictions

✅ **Visualization**
- Training loss chart
- Accuracy progression
- Model summary

---

## 🔧 **Advanced Usage**

### Custom Model Architecture

```typescript
import * as tf from '@tensorflow/tfjs';

const model = tf.sequential({
  layers: [
    tf.layers.dense({ inputShape: [10], units: 128, activation: 'relu' }),
    tf.layers.batchNormalization(),
    tf.layers.dropout({ rate: 0.3 }),
    tf.layers.dense({ units: 64, activation: 'relu' }),
    tf.layers.dropout({ rate: 0.2 }),
    tf.layers.dense({ units: 32, activation: 'relu' }),
    tf.layers.dense({ units: 1, activation: 'sigmoid' })
  ]
});
```

### Custom Training Callbacks

```typescript
await model.fit(xTensor, yTensor, {
  epochs: 100,
  callbacks: {
    onEpochBegin: (epoch) => {
      console.log(`Starting epoch ${epoch}`);
    },
    onEpochEnd: (epoch, logs) => {
      console.log(`Epoch ${epoch}: loss = ${logs.loss}`);
      
      // Early stopping
      if (logs.loss < 0.01) {
        model.stopTraining = true;
      }
    },
    onTrainBegin: () => {
      console.log('Training started');
    },
    onTrainEnd: () => {
      console.log('Training complete!');
    }
  }
});
```

### Transfer Learning

```typescript
// Load pre-trained MobileNet
const mobilenet = await tf.loadLayersModel(
  'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
);

// Remove top layer
const layer = mobilenet.getLayer('conv_pw_13_relu');
const truncatedModel = tf.model({
  inputs: mobilenet.inputs,
  outputs: layer.output
});

// Add custom layers
const model = tf.sequential({
  layers: [
    truncatedModel,
    tf.layers.flatten(),
    tf.layers.dense({ units: 128, activation: 'relu' }),
    tf.layers.dense({ units: numClasses, activation: 'softmax' })
  ]
});
```

---

## 🐛 **Troubleshooting**

### Issue: "Out of memory" error

```typescript
// Solution 1: Use smaller batch size
trainModel(model, X, y, { batchSize: 16 }); // instead of 32

// Solution 2: Dispose tensors
tf.tidy(() => {
  const result = model.predict(input);
  // Tensors auto-cleaned up
  return result;
});

// Solution 3: Use CPU backend
tf.setBackend('cpu');
```

### Issue: Model trains but predictions are bad

```typescript
// Check data normalization
console.log('Min:', Math.min(...X.flat()));
console.log('Max:', Math.max(...X.flat()));
// Should be between 0 and 1

// Try different learning rate
trainModel(model, X, y, { learningRate: 0.0001 }); // slower

// Increase epochs
trainModel(model, X, y, { epochs: 200 }); // more training
```

### Issue: Training is too slow

```typescript
// Use WebGL backend (default, should be automatic)
await tf.setBackend('webgl');

// Check backend
console.log('Backend:', tf.getBackend());

// Increase batch size
trainModel(model, X, y, { batchSize: 64 }); // faster but more memory
```

---

## 📚 **Next Steps**

### 1. Integrate with Your Existing Pages

Add the TensorFlow Trainer to:
- Data Management page (train on uploaded data)
- Model Training page (dedicated ML workflow)
- Analytics dashboard (auto-predictions)

### 2. Add More ML Features

- **AutoML**: Automatically select best model
- **Hyperparameter tuning**: Grid search
- **Model comparison**: Compare multiple models
- **Feature importance**: SHAP values
- **Model explainability**: LIME

### 3. Connect to Your Dataset Flow

```typescript
// In your DatasetCard component
<Button onClick={() => {
  setSelectedDataset(dataset);
  navigate('/train');
}}>
  Train ML Model
</Button>
```

---

## 🎓 **Learn More**

### TensorFlow.js Tutorials
- Image Classification: https://www.tensorflow.org/js/tutorials/training/image_classification
- Text Classification: https://www.tensorflow.org/js/tutorials/training/sentiment_analysis
- Time Series: https://www.tensorflow.org/js/tutorials/training/time_series

### Example Projects
- **Pac-Man AI**: https://storage.googleapis.com/tfjs-examples/webcam-transfer-learning/dist/index.html
- **Teachable Machine**: https://teachablemachine.withgoogle.com/
- **TensorFlow.js Examples**: https://github.com/tensorflow/tfjs-examples

---

## 💰 **Cost: $0**

✅ Runs entirely in the browser  
✅ No server costs  
✅ No API fees  
✅ No cloud infrastructure needed

Works perfectly with Vercel's static hosting!

---

## ✅ **Summary**

You now have **production-ready machine learning** in your app!

**Files ready to use:**
- `src/lib/tensorflowClient.ts` - ML utilities
- `src/components/ml/TensorFlowTrainer.tsx` - Training UI

**Just add to your page and start training models!** 🚀

---

## 🐳 **Need Python TensorFlow + Docker?**

See `TENSORFLOW_INTEGRATION_GUIDE.md` for:
- Python TensorFlow API (FastAPI + Docker)
- GPU training setup
- Deployment to Railway/GCP/AWS
- Advanced model architectures

But for most use cases, **TensorFlow.js is perfect!** ✨

