# Making Visualizations Dynamic - Complete Guide

This guide explains how to replace mock data with real, dynamic data from your datasets and models.

## Table of Contents
1. [Data Flow Architecture](#data-flow-architecture)
2. [Connecting to Real Data](#connecting-to-real-data)
3. [Page-by-Page Examples](#page-by-page-examples)
4. [Best Practices](#best-practices)

---

## Data Flow Architecture

### Current Setup
```
Supabase Database (PostgreSQL)
    ↓
MLContext (src/context/MLContext.tsx)
    ↓
Page Components (consume via useMLContext)
    ↓
Visualizations (currently using mock data)
```

### Data Sources Available

1. **MLContext** (`useMLContext()`)
   - `datasets`: Array of Dataset objects with preview_data
   - `models`: Array of MLModel objects with metrics
   - `projects`: Array of Project objects
   - `currentProject`: Currently selected project

2. **Dataset Object**
   ```typescript
   {
     id: string;
     name: string;
     rows: number;
     columns: number;
     preview_data: {
       columns: string[];  // Column names
       rows: string[][];   // Data rows
     };
     quality: {
       score: number;
       issues: number;
     };
   }
   ```

3. **MLModel Object**
   ```typescript
   {
     id: string;
     name: string;
     type: string;
     status: 'training' | 'trained' | 'deployed' | 'failed';
     metrics: {
       accuracy?: number;
       precision?: number;
       recall?: number;
       f1Score?: number;
       loss?: number;
     };
     createdAt: string;
     trainedAt?: string;
   }
   ```

---

## Connecting to Real Data

### Step 1: Extract Real Data from Datasets

Instead of generating mock data, extract from actual datasets:

```typescript
// ❌ BEFORE (Mock Data)
const mockData = Array.from({ length: 30 }, (_, i) => ({
  epoch: i + 1,
  accuracy: 60 + (i * 1.2) + Math.random() * 5
}));

// ✅ AFTER (Real Data)
const realData = useMemo(() => {
  if (!selectedDataset?.preview_data) return [];
  
  const { columns, rows } = selectedDataset.preview_data;
  
  // Find numeric columns for analysis
  const numericCol = columns.find(col => {
    const sampleValue = rows[0]?.[columns.indexOf(col)];
    return !isNaN(parseFloat(sampleValue));
  });
  
  if (!numericCol) return [];
  const colIndex = columns.indexOf(numericCol);
  
  return rows.slice(0, 30).map((row, i) => ({
    index: i + 1,
    value: parseFloat(row[colIndex]) || 0
  }));
}, [selectedDataset]);
```

### Step 2: Calculate Real Statistics

```typescript
// ✅ Calculate from actual data
const statistics = useMemo(() => {
  if (!selectedDataset?.preview_data) return null;
  
  const { columns, rows } = selectedDataset.preview_data;
  
  return columns.map(col => {
    const colIndex = columns.indexOf(col);
    const values = rows
      .map(row => parseFloat(row[colIndex]))
      .filter(v => !isNaN(v));
    
    if (values.length === 0) return null;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    
    return {
      column: col,
      mean: mean.toFixed(2),
      std: Math.sqrt(variance).toFixed(2),
      min: sorted[0].toFixed(2),
      max: sorted[sorted.length - 1].toFixed(2),
      median: sorted[Math.floor(sorted.length / 2)].toFixed(2)
    };
  }).filter(Boolean);
}, [selectedDataset]);
```

### Step 3: Use Real Model Metrics

```typescript
// ✅ Use actual trained model metrics
const modelPerformance = useMemo(() => {
  return models
    .filter(m => m.status === 'trained' && m.metrics)
    .map(model => ({
      name: model.name,
      accuracy: (model.metrics.accuracy || 0) * 100,
      precision: (model.metrics.precision || 0) * 100,
      recall: (model.metrics.recall || 0) * 100,
      f1Score: (model.metrics.f1Score || 0) * 100,
      trainedAt: model.trainedAt
    }));
}, [models]);
```

---

## Page-by-Page Examples

### 1. ModelTraining.tsx

**Current Issue**: Uses mock `trainingMetricsData`
**Solution**: Track real training progress

```typescript
// Add to component state
const [trainingHistory, setTrainingHistory] = useState<{
  epochs: number[];
  accuracy: number[];
  loss: number[];
  speed: number[];
}>({
  epochs: [],
  accuracy: [],
  loss: [],
  speed: []
});

// Update during actual training
const handleTrainModel = async (config: any) => {
  // ... existing training code
  
  // Track metrics per epoch
  const onEpochComplete = (epoch: number, metrics: any) => {
    setTrainingHistory(prev => ({
      epochs: [...prev.epochs, epoch],
      accuracy: [...prev.accuracy, metrics.accuracy * 100],
      loss: [...prev.loss, metrics.loss],
      speed: [...prev.speed, metrics.samplesPerSecond]
    }));
  };
  
  // Pass callback to training function
  await trainModel(selectedDataset, config, { onEpochComplete });
};

// Use in charts
const accuracyChartData = {
  labels: trainingHistory.epochs.map(e => `E${e}`),
  datasets: [{
    label: 'Accuracy',
    data: trainingHistory.accuracy,
    // ... styling
  }]
};
```

### 2. DatasetInsights.tsx

**Already Dynamic!** ✅ This page correctly uses:
- `selectedDataset.preview_data` for visualizations
- Real column detection (numeric vs categorical)
- Actual data values in charts

**Key Pattern to Follow**:
```typescript
const visualizationData = useMemo(() => {
  if (!selectedDataset?.preview_data?.rows) return null;
  
  const { columns, rows } = selectedDataset.preview_data;
  
  // Analyze actual data structure
  const numericColumns = columns.filter(col => {
    const colIndex = columns.indexOf(col);
    return rows.some(row => !isNaN(parseFloat(row[colIndex])));
  });
  
  return { numericColumns, rows, columns };
}, [selectedDataset]);
```

### 3. FeatureEngineering.tsx

**Current Issue**: Mock feature importance data
**Solution**: Calculate from real dataset correlations

```typescript
// Replace generateFeatureImportanceData with real calculation
const featureImportance = useMemo(() => {
  if (!selectedDataset?.preview_data) return [];
  
  const { columns, rows } = selectedDataset.preview_data;
  
  // Calculate variance for each column (simple importance metric)
  return columns.map(col => {
    const colIndex = columns.indexOf(col);
    const values = rows
      .map(row => parseFloat(row[colIndex]))
      .filter(v => !isNaN(v));
    
    if (values.length === 0) return { feature: col, importance: 0 };
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => 
      sum + Math.pow(v - mean, 2), 0) / values.length;
    
    return {
      feature: col,
      importance: Math.sqrt(variance) / mean // Coefficient of variation
    };
  }).sort((a, b) => b.importance - a.importance);
}, [selectedDataset]);

// Calculate real correlations for heatmap
const correlationMatrix = useMemo(() => {
  if (!selectedDataset?.preview_data) return [];
  
  const { columns, rows } = selectedDataset.preview_data;
  const numericCols = columns.filter((col, idx) => {
    return rows.some(row => !isNaN(parseFloat(row[idx])));
  });
  
  // Calculate Pearson correlation between each pair
  return numericCols.map(col1 => {
    const col1Index = columns.indexOf(col1);
    
    return numericCols.map(col2 => {
      const col2Index = columns.indexOf(col2);
      
      const values1 = rows.map(r => parseFloat(r[col1Index])).filter(v => !isNaN(v));
      const values2 = rows.map(r => parseFloat(r[col2Index])).filter(v => !isNaN(v));
      
      // Simple Pearson correlation
      const mean1 = values1.reduce((a,b) => a+b) / values1.length;
      const mean2 = values2.reduce((a,b) => a+b) / values2.length;
      
      let num = 0, den1 = 0, den2 = 0;
      for (let i = 0; i < Math.min(values1.length, values2.length); i++) {
        const diff1 = values1[i] - mean1;
        const diff2 = values2[i] - mean2;
        num += diff1 * diff2;
        den1 += diff1 * diff1;
        den2 += diff2 * diff2;
      }
      
      return den1 === 0 || den2 === 0 ? 0 : num / Math.sqrt(den1 * den2);
    });
  });
}, [selectedDataset]);
```

### 4. DashboardKoyfin.tsx

**Current Issue**: Mock metrics calculations
**Solution**: Use real aggregated data

```typescript
// Replace mock calculations with real ones
const metrics = useMemo(() => {
  // Real dataset count
  const totalDatasets = datasets.length;
  
  // Real model counts
  const totalModels = models.length;
  const trainedModels = models.filter(m => 
    m.status === 'trained' || m.status === 'deployed'
  ).length;
  
  // Real average accuracy from trained models
  const trainedWithMetrics = models.filter(m => 
    m.status === 'trained' && m.metrics?.accuracy
  );
  const avgAccuracy = trainedWithMetrics.length > 0
    ? trainedWithMetrics.reduce((sum, m) => 
        sum + (m.metrics.accuracy || 0), 0) / trainedWithMetrics.length * 100
    : 0;
  
  // Real health score from datasets
  const datasetsWithQuality = datasets.filter(d => d.quality?.score);
  const avgHealthScore = datasetsWithQuality.length > 0
    ? datasetsWithQuality.reduce((sum, d) => 
        sum + (d.quality?.score || 0), 0) / datasetsWithQuality.length
    : 0;
  
  // Real storage calculation
  const totalStorage = datasets.reduce((sum, d) => {
    const sizeStr = d.fileSize || '0MB';
    const sizeNum = parseFloat(sizeStr);
    const unit = sizeStr.replace(/[0-9.]/g, '');
    const multiplier = unit === 'GB' ? 1024 : unit === 'KB' ? 0.001 : 1;
    return sum + (sizeNum * multiplier);
  }, 0);
  
  return {
    totalDatasets,
    totalModels,
    trainedModels,
    avgAccuracy,
    avgHealthScore,
    totalStorage
  };
}, [datasets, models]);
```

---

## Best Practices

### 1. Always Use useMemo for Calculations

```typescript
// ✅ GOOD - Recalculates only when dependencies change
const chartData = useMemo(() => {
  return calculateChartData(selectedDataset);
}, [selectedDataset]);

// ❌ BAD - Recalculates on every render
const chartData = calculateChartData(selectedDataset);
```

### 2. Handle Missing Data Gracefully

```typescript
// ✅ GOOD - Safe checks and fallbacks
const data = useMemo(() => {
  if (!selectedDataset?.preview_data?.rows?.length) {
    return { labels: [], values: [] };
  }
  
  const { columns, rows } = selectedDataset.preview_data;
  // ... process data
  
  return { labels, values };
}, [selectedDataset]);

// In component
{data.values.length > 0 ? (
  <Chart data={data} />
) : (
  <EmptyState message="No data available" />
)}
```

### 3. Provide Loading States

```typescript
const [isCalculating, setIsCalculating] = useState(false);

const expensiveCalculation = useMemo(() => {
  if (!data) return null;
  
  setIsCalculating(true);
  // ... heavy calculation
  setIsCalculating(false);
  
  return result;
}, [data]);

// In render
{isCalculating ? (
  <Loader />
) : (
  <Visualization data={expensiveCalculation} />
)}
```

### 4. Type Safety

```typescript
// Define clear interfaces
interface ChartDataPoint {
  label: string;
  value: number;
  timestamp?: string;
}

// Use typed returns
const chartData = useMemo((): ChartDataPoint[] => {
  // ... calculation
  return typedData;
}, [dependencies]);
```

### 5. Performance Optimization

```typescript
// ✅ GOOD - Process subset of data
const displayData = useMemo(() => {
  const rows = dataset.preview_data.rows.slice(0, 100); // Limit
  return processRows(rows);
}, [dataset]);

// ✅ GOOD - Debounce expensive updates
const [debouncedData, setDebouncedData] = useState(data);

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedData(data);
  }, 300);
  return () => clearTimeout(timer);
}, [data]);
```

---

## Implementation Checklist

### Phase 1: Dashboard & Overview Pages
- [ ] DashboardKoyfin.tsx - Use real metrics
- [ ] DatasetInsights.tsx - Already done ✅
- [ ] DataManagementHybrid.tsx - Use real dataset info

### Phase 2: ML Workflow Pages
- [ ] ModelTraining.tsx - Track real training progress
- [ ] FeatureEngineering.tsx - Calculate real correlations
- [ ] ModelEvaluation.tsx - Use actual model metrics

### Phase 3: Advanced Features
- [ ] Add WebSocket for real-time training updates
- [ ] Store training history in database
- [ ] Cache expensive calculations
- [ ] Add data export functionality

---

## Real-Time Updates (Advanced)

For truly dynamic visualizations that update during training:

```typescript
// 1. Set up WebSocket connection
const ws = useRef<WebSocket | null>(null);

useEffect(() => {
  ws.current = new WebSocket('ws://localhost:8000/ws/training');
  
  ws.current.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'epoch_complete') {
      setTrainingMetrics(prev => ({
        ...prev,
        accuracy: [...prev.accuracy, data.accuracy],
        loss: [...prev.loss, data.loss]
      }));
    }
  };
  
  return () => ws.current?.close();
}, []);

// 2. Backend sends updates
# In your FastAPI backend
@app.websocket("/ws/training")
async def training_websocket(websocket: WebSocket):
    await websocket.accept()
    
    async for epoch_data in train_model_async():
        await websocket.send_json({
            "type": "epoch_complete",
            "epoch": epoch_data.epoch,
            "accuracy": epoch_data.accuracy,
            "loss": epoch_data.loss
        })
```

---

## Next Steps

1. **Start with DashboardKoyfin.tsx** - Replace mock metrics with real calculations
2. **Update ModelTraining.tsx** - Implement training history tracking
3. **Enhance FeatureEngineering.tsx** - Add real correlation calculations
4. **Test with real datasets** - Ensure visualizations work with actual data
5. **Add database storage** - Persist training history and metrics
6. **Implement WebSockets** - For real-time updates during training

---

## Example: Complete Dynamic Component

```typescript
import { useMemo } from 'react';
import { useMLContext } from '../context/MLContext';

const DynamicChart: React.FC = () => {
  const { datasets, models } = useMLContext();
  
  // Calculate real metrics
  const chartData = useMemo(() => {
    if (datasets.length === 0) return null;
    
    return datasets.map(dataset => {
      // Find models trained on this dataset
      const datasetModels = models.filter(m => 
        m.datasetId === dataset.id && m.status === 'trained'
      );
      
      // Calculate average accuracy
      const avgAccuracy = datasetModels.length > 0
        ? datasetModels.reduce((sum, m) => 
            sum + (m.metrics?.accuracy || 0), 0
          ) / datasetModels.length
        : 0;
      
      return {
        name: dataset.name,
        accuracy: avgAccuracy * 100,
        modelCount: datasetModels.length,
        rows: dataset.rows
      };
    });
  }, [datasets, models]);
  
  if (!chartData) {
    return <EmptyState />;
  }
  
  return (
    <Chart
      data={{
        labels: chartData.map(d => d.name),
        datasets: [{
          label: 'Model Accuracy',
          data: chartData.map(d => d.accuracy)
        }]
      }}
    />
  );
};
```

---

This guide provides a complete roadmap for making all visualizations dynamic. Start with one page at a time and test thoroughly with real data!
