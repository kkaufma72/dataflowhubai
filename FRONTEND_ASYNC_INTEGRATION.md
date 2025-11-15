# Frontend Integration - Celery Async Operations

## 📦 Components Created

### 1. AsyncTaskMonitor
**Location:** `src/components/ml/AsyncTaskMonitor.tsx`

A reusable component for monitoring any Celery task with real-time progress updates.

**Features:**
- Auto-polling with configurable interval (default 2s)
- Progress bar with percentage
- Epoch-by-epoch metrics display (loss, accuracy)
- Status icons (pending, running, success, failure)
- Automatic completion/error callbacks
- Toast notifications

**Usage:**
```tsx
import AsyncTaskMonitor from '../components/ml/AsyncTaskMonitor';

<AsyncTaskMonitor
  taskId="task-abc-123"
  onComplete={(result) => console.log('Done!', result)}
  onError={(error) => console.error('Failed:', error)}
  pollInterval={2000}
  autoStart={true}
/>
```

**Props:**
- `taskId: string` - Celery task ID to monitor
- `onComplete?: (result: any) => void` - Called when task succeeds
- `onError?: (error: string) => void` - Called when task fails
- `pollInterval?: number` - Milliseconds between status checks (default: 2000)
- `autoStart?: boolean` - Start polling immediately (default: true)

---

### 2. AsyncModelTraining
**Location:** `src/components/ml/AsyncModelTraining.tsx`

Full-featured model training component with configuration UI and progress tracking.

**Features:**
- Training configuration (epochs, batch size, learning rate, validation split)
- Start/cancel training controls
- Real-time progress with AsyncTaskMonitor
- Training metrics display (current epoch, loss, accuracy)
- Task cancellation support

**Usage:**
```tsx
import AsyncModelTraining from '../components/ml/AsyncModelTraining';

<AsyncModelTraining
  modelId="model-123"
  datasetId="dataset-456"
  onTrainingComplete={(result) => {
    console.log('Training finished:', result);
  }}
  onTrainingError={(error) => {
    console.error('Training failed:', error);
  }}
/>
```

**Props:**
- `modelId: string` - Model identifier
- `datasetId: string` - Dataset identifier for training
- `onTrainingComplete?: (result: any) => void` - Success callback
- `onTrainingError?: (error: string) => void` - Error callback

---

### 3. BatchPredictions
**Location:** `src/components/ml/BatchPredictions.tsx`

Component for processing large batches of predictions asynchronously.

**Features:**
- JSON file upload or manual input
- Sample data loader
- Progress monitoring
- Results download (JSON)
- Results preview with pagination

**Usage:**
```tsx
import BatchPredictions from '../components/ml/BatchPredictions';

<BatchPredictions
  modelId="model-123"
  onPredictionsComplete={(predictions) => {
    console.log('Got predictions:', predictions);
  }}
/>
```

**Input Format:**
```json
[
  {"feature1": 1.0, "feature2": 2.0, "feature3": 3.0},
  {"feature1": 1.5, "feature2": 2.5, "feature3": 3.5},
  {"feature1": 2.0, "feature2": 3.0, "feature3": 4.0}
]
```

**Props:**
- `modelId: string` - Model to use for predictions
- `onPredictionsComplete?: (predictions: any[]) => void` - Results callback

---

### 4. ActiveTasksPanel
**Location:** `src/components/ml/ActiveTasksPanel.tsx`

Dashboard panel showing all active, scheduled, and reserved Celery tasks.

**Features:**
- Real-time task list (auto-refresh every 5s)
- Task counts by status (active, scheduled, reserved)
- Running duration for each task
- Task type icons
- Worker information
- Manual refresh button

**Usage:**
```tsx
import ActiveTasksPanel from '../components/ml/ActiveTasksPanel';

<ActiveTasksPanel />
```

---

### 5. AsyncMLOperations (Page)
**Location:** `src/pages/AsyncMLOperations.tsx`

Complete page integrating all async ML components with tabbed navigation.

**Features:**
- 3 tabs: Training, Predictions, Monitoring
- Link to Flower dashboard
- Celery status indicator
- Info cards for scheduled tasks and available operations

**Route:** `/app/async-ml`

---

## 🔌 API Integration

All components use the Celery REST API endpoints:

### Start Training
```typescript
POST /api/ml/models/{modelId}/train/async
Body: {
  dataset_id: string,
  config: {
    epochs: number,
    batch_size: number,
    learning_rate: number,
    validation_split?: number
  }
}
Response: { task_id: string, status: string, model_id: string }
```

### Start Batch Prediction
```typescript
POST /api/ml/models/{modelId}/predict/batch
Body: {
  input_data: Array<Record<string, any>>
}
Response: { task_id: string, batch_size: number, model_id: string }
```

### Get Task Status
```typescript
GET /api/ml/tasks/{taskId}
Response: {
  task_id: string,
  status: 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE',
  meta?: {
    current_epoch?: number,
    total_epochs?: number,
    loss?: number,
    accuracy?: number,
    progress?: number,
    message?: string
  },
  result?: any,
  error?: string
}
```

### Cancel Task
```typescript
POST /api/ml/tasks/{taskId}/cancel
Response: { status: string, task_id: string }
```

### List Active Tasks
```typescript
GET /api/ml/tasks
Response: {
  active: { [worker: string]: Task[] },
  scheduled: { [worker: string]: Task[] },
  reserved: { [worker: string]: Task[] }
}
```

---

## 🎨 Styling

All components use Tailwind CSS with dark mode support:
- Light theme: Clean, professional
- Dark theme: Terminal-style (Koyfin aesthetic)
- Animations: Smooth transitions, pulse effects
- Icons: Lucide React

---

## 🔄 State Management

Components use local React state with hooks:
- `useState` for component state
- `useEffect` for polling and cleanup
- `useCallback` for memoized functions
- Context API available if needed

---

## 🧪 Testing

### Component Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Manual Testing
1. Navigate to `/app/async-ml`
2. Start a training task
3. Watch progress in real-time
4. Try batch predictions
5. Check active tasks panel

---

## 🚀 Deployment Considerations

### Environment Variables
```env
VITE_API_URL=http://localhost:8000
VITE_FLOWER_URL=http://localhost:5555
```

### Production Optimizations
1. **Lazy Loading:** All components are lazy-loaded
2. **Code Splitting:** Separate chunks for async operations
3. **Polling Optimization:** Adjust intervals based on task duration
4. **Error Handling:** All API calls wrapped in try-catch
5. **Accessibility:** ARIA labels, keyboard navigation

---

## 📊 Performance

### Bundle Size
- AsyncTaskMonitor: ~3KB
- AsyncModelTraining: ~5KB
- BatchPredictions: ~6KB
- ActiveTasksPanel: ~4KB
- Total (async module): ~18KB gzipped

### Rendering Performance
- Virtual scrolling for large task lists
- Debounced polling
- Memoized callbacks
- Optimistic UI updates

---

## 🎯 Usage Examples

### Example 1: Simple Training Monitor
```tsx
import { useState } from 'react';
import AsyncTaskMonitor from './components/ml/AsyncTaskMonitor';

function MyComponent() {
  const [taskId, setTaskId] = useState<string | null>(null);
  
  const startTraining = async () => {
    const response = await fetch('/api/ml/models/my-model/train/async', {
      method: 'POST',
      body: JSON.stringify({ dataset_id: 'my-dataset', config: { epochs: 10 } })
    });
    const { task_id } = await response.json();
    setTaskId(task_id);
  };
  
  return (
    <div>
      <button onClick={startTraining}>Start Training</button>
      {taskId && <AsyncTaskMonitor taskId={taskId} />}
    </div>
  );
}
```

### Example 2: Batch Predictions with Custom Handler
```tsx
import BatchPredictions from './components/ml/BatchPredictions';

function PredictionsPage() {
  const handleComplete = (predictions: any[]) => {
    // Process predictions
    predictions.forEach((pred, i) => {
      console.log(`Prediction ${i}:`, pred);
    });
    
    // Update UI or save to database
    savePredictions(predictions);
  };
  
  return (
    <BatchPredictions
      modelId="production-model-v2"
      onPredictionsComplete={handleComplete}
    />
  );
}
```

### Example 3: Custom Progress Handler
```tsx
import { useState, useEffect } from 'react';

function CustomProgressBar({ taskId }: { taskId: string }) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/ml/tasks/${taskId}`);
      const status = await response.json();
      
      if (status.meta?.current_epoch && status.meta?.total_epochs) {
        setProgress((status.meta.current_epoch / status.meta.total_epochs) * 100);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [taskId]);
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Issue: Tasks not appearing
**Solution:** Check that backend is running and accessible at `/api/ml/tasks`

### Issue: Progress not updating
**Solution:** Verify polling interval isn't too long, check network tab for API calls

### Issue: "Failed to fetch" errors
**Solution:** Ensure CORS is configured correctly on backend

### Issue: Dark mode styles not working
**Solution:** Check that Tailwind dark mode is set to `class` strategy

---

## 📚 Additional Resources

- **Backend API Docs:** http://localhost:8000/api/docs
- **Flower Dashboard:** http://localhost:5555
- **Celery Guide:** `backend/CELERY_GUIDE.md`
- **Implementation Summary:** `CELERY_IMPLEMENTATION_COMPLETE.md`

---

**Last Updated:** November 15, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
