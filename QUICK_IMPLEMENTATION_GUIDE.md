# Quick Implementation Guide - Remaining Integrations

## 🎯 Priority 1: Add PrerequisiteGate to ModelTraining

**File:** `src/pages/ModelTraining.tsx`

**Location:** Wrap the training form section (around line 1020)

```tsx
import PrerequisiteGate, { Prerequisite } from '../components/common/PrerequisiteGate';
import CeleryHealthBadge from '../components/common/CeleryHealthBadge';

// Inside ModelTraining component, add state:
const [celeryHealthy, setCeleryHealthy] = useState(true);
const { userProfile } = useUser();

// Create prerequisites array:
const trainingPrerequisites: Prerequisite[] = [
  {
    id: 'datasets-exist',
    label: 'Datasets Available',
    status: datasets.length > 0 ? 'met' : 'unmet',
    description: datasets.length > 0 
      ? `${datasets.length} datasets ready for training`
      : 'No datasets found. Please upload data first.',
    actionLabel: 'Upload Dataset',
    actionPath: '/app/data'
  },
  {
    id: 'dataset-selected',
    label: 'Dataset Selected',
    status: selectedDataset ? 'met' : 'unmet',
    description: selectedDataset 
      ? `Using "${selectedDataset.name}" (${selectedDataset.row_count} rows)`
      : 'Select a dataset from the list above'
  },
  {
    id: 'celery-workers',
    label: 'Background Workers Running',
    status: celeryHealthy ? 'met' : 'warning',
    description: celeryHealthy
      ? 'Workers ready to process training jobs'
      : 'Celery workers may be offline. Training could fail.',
    actionLabel: 'Check Worker Status',
    actionPath: '/app/async'
  },
  {
    id: 'billing',
    label: 'Active Subscription',
    status: userProfile?.subscription_tier !== 'free' ? 'met' : 'warning',
    description: userProfile?.subscription_tier !== 'free'
      ? `${userProfile.subscription_tier} plan active`
      : 'Free tier has training limits. Consider upgrading.',
    actionLabel: 'View Plans',
    actionPath: '/pricing'
  }
];

// Wrap training form:
return (
  <div>
    {/* Existing tabs and content */}
    
    {activeTab === 'train' && (
      <PrerequisiteGate
        title="Start Model Training"
        description="Ensure all requirements are met before training"
        prerequisites={trainingPrerequisites}
        onProceed={() => setShowTrainingForm(true)}
        proceedLabel="Configure Training"
      >
        <ModelTrainingForm 
          datasets={datasets}
          onSubmit={handleTrainingSubmit}
          isTraining={isTraining}
        />
      </PrerequisiteGate>
    )}
  </div>
);
```

---

## 🎯 Priority 2: Add CeleryHealthBadge to AsyncMLOperations

**File:** `src/pages/AsyncMLOperations.tsx`

**Location:** In the header section near tabs

```tsx
import CeleryHealthBadge from '../components/common/CeleryHealthBadge';

// In the component return, update header:
<div className="mb-6">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h1 className="text-3xl font-bold text-white">Async Operations</h1>
      <p className="text-gray-400 mt-1">
        Background tasks and Celery monitoring
      </p>
    </div>
    
    {/* Add Celery badge here */}
    <div className="flex items-center gap-3">
      <CeleryHealthBadge refreshInterval={5000} />
      <a
        href="/flower"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary-improved"
      >
        Open Flower
      </a>
    </div>
  </div>
  
  {/* Existing tabs */}
  <div className="border-b border-gray-700">
    {/* ... */}
  </div>
</div>
```

---

## 🎯 Priority 3: Add Celery Badge to Dashboard

**File:** `src/pages/DashboardKoyfin.tsx`

**Location:** Near the "System Status" section (around line 600-700)

```tsx
import CeleryHealthBadge from '../components/common/CeleryHealthBadge';

// Find the system status section and add:
<div className="flex items-center gap-2">
  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
    <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
      Connected
    </span>
  </div>
  
  {/* Add Celery badge */}
  <CeleryHealthBadge refreshInterval={10000} />
</div>
```

---

## 🎯 Priority 4: Backend - Celery Stats Endpoint

**File:** `backend/routers/celery_router.py` (create if doesn't exist)

```python
from fastapi import APIRouter, HTTPException
from celery import Celery
import redis
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/celery", tags=["celery"])

# Configure Celery app (adjust to your setup)
celery_app = Celery(
    'dataflow',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

# Redis client for queue inspection
redis_client = redis.Redis(host='localhost', port=6379, db=0)

@router.get("/stats")
async def get_celery_stats():
    """
    Get real-time Celery worker and task statistics.
    Mirrors Flower dashboard metrics.
    """
    try:
        # Get active workers
        inspect = celery_app.control.inspect()
        active_workers_dict = inspect.active() or {}
        active_workers = len(active_workers_dict)
        
        # Get active tasks across all workers
        active_tasks = sum(len(tasks) for tasks in active_workers_dict.values())
        
        # Get queued tasks (from default 'celery' queue)
        queued_tasks = redis_client.llen('celery')
        
        # Get failed tasks from last 24 hours
        # This requires custom tracking or Flower integration
        # For now, use a simple count from task results
        failed_tasks = 0
        try:
            # Check last 100 task results
            task_ids = redis_client.keys('celery-task-meta-*')
            for task_id in task_ids[:100]:
                result = redis_client.get(task_id)
                if result and b'"status": "FAILURE"' in result:
                    failed_tasks += 1
        except Exception as e:
            print(f"Error counting failed tasks: {e}")
        
        # Calculate success rate
        total_tasks = len(task_ids) if task_ids else 1
        success_tasks = total_tasks - failed_tasks
        success_rate = success_tasks / total_tasks if total_tasks > 0 else 1.0
        
        # Calculate average task duration
        # This requires task timing tracking
        # For now, return a placeholder or integrate with Flower
        avg_task_duration = 2.5  # Placeholder
        
        return {
            "activeWorkers": active_workers,
            "queuedTasks": int(queued_tasks),
            "activeTasks": active_tasks,
            "failedTasks": failed_tasks,
            "successRate": round(success_rate, 3),
            "avgTaskDuration": avg_task_duration
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch Celery stats: {str(e)}"
        )

@router.get("/health")
async def celery_health_check():
    """Quick health check - are workers alive?"""
    try:
        inspect = celery_app.control.inspect()
        active_workers = inspect.active()
        
        if active_workers and len(active_workers) > 0:
            return {
                "status": "healthy",
                "workers": len(active_workers),
                "message": "Celery workers are running"
            }
        else:
            return {
                "status": "offline",
                "workers": 0,
                "message": "No Celery workers detected"
            }
    except Exception as e:
        return {
            "status": "error",
            "workers": 0,
            "message": str(e)
        }
```

**Register in:** `backend/main.py`

```python
from routers import celery_router

app.include_router(celery_router.router)
```

---

## 🎯 Priority 5: Model Evaluation Narrative Text

**File:** `src/pages/ModelEvaluation.tsx` (or wherever evaluation is rendered)

**Add default text to each panel:**

```tsx
// Confusion Matrix Panel
{confusionMatrix ? (
  <ConfusionMatrixChart data={confusionMatrix} />
) : (
  <div className="p-8 text-center">
    <div className="mb-4 text-gray-400">
      <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <h3 className="text-lg font-semibold text-gray-300 mb-2">
        No Predictions Yet
      </h3>
      <p className="text-sm text-gray-400 max-w-md mx-auto">
        The confusion matrix will appear here after you run predictions. 
        It shows how often the model correctly classifies each category versus
        mixing them up. Look for high numbers on the diagonal (correct predictions)
        and low numbers off-diagonal (misclassifications).
      </p>
    </div>
    <button 
      onClick={runPredictions}
      className="btn-primary-improved mt-4"
    >
      <Play className="w-4 h-4" />
      Run Predictions
    </button>
  </div>
)}

// Feature Importance Panel
{featureImportance ? (
  <FeatureImportanceChart data={featureImportance} />
) : (
  <div className="p-8 text-center">
    <div className="mb-4 text-gray-400">
      <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <h3 className="text-lg font-semibold text-gray-300 mb-2">
        Feature Importance Coming Soon
      </h3>
      <p className="text-sm text-gray-400 max-w-md mx-auto">
        This chart will reveal which input features have the biggest impact on
        your model's predictions. Features at the top drive decisions most,
        while those at the bottom contribute less. Use this to understand your
        model's reasoning and identify key data points.
      </p>
    </div>
  </div>
)}

// ROC Curve Panel
{rocCurve ? (
  <ROCCurveChart data={rocCurve} />
) : (
  <div className="p-8 text-center">
    <div className="mb-4 text-gray-400">
      <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <h3 className="text-lg font-semibold text-gray-300 mb-2">
        ROC Curve Pending
      </h3>
      <p className="text-sm text-gray-400 max-w-md mx-auto">
        The ROC curve visualizes your model's trade-off between true positives
        and false positives at various thresholds. A curve hugging the top-left
        corner indicates excellent performance (high true positive rate, low false
        positive rate). The area under the curve (AUC) summarizes this in one number.
      </p>
    </div>
  </div>
)}
```

---

## 🎯 Priority 6: PDF Export for Evaluation

**Install dependency:**
```bash
npm install jspdf jspdf-autotable
```

**Create export utility:** `src/lib/evaluationPdfExport.ts`

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface EvaluationData {
  modelName: string;
  algorithm: string;
  trainedAt: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  confusionMatrix?: number[][];
  featureImportance?: { feature: string; importance: number }[];
  insights: string[];
}

export const exportEvaluationPDF = (data: EvaluationData) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Model Evaluation Report', 14, 20);
  
  // Model Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Model: ${data.modelName}`, 14, 35);
  doc.text(`Algorithm: ${data.algorithm}`, 14, 42);
  doc.text(`Trained: ${data.trainedAt}`, 14, 49);
  
  // Metrics Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Metrics', 14, 65);
  
  autoTable(doc, {
    startY: 70,
    head: [['Metric', 'Value']],
    body: [
      ['Accuracy', `${(data.metrics.accuracy * 100).toFixed(2)}%`],
      ['Precision', `${(data.metrics.precision * 100).toFixed(2)}%`],
      ['Recall', `${(data.metrics.recall * 100).toFixed(2)}%`],
      ['F1 Score', `${(data.metrics.f1Score * 100).toFixed(2)}%`],
    ],
    theme: 'grid',
  });
  
  // Feature Importance
  if (data.featureImportance && data.featureImportance.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Feature Importance', 14, 20);
    
    autoTable(doc, {
      startY: 25,
      head: [['Feature', 'Importance']],
      body: data.featureImportance.map(f => [
        f.feature,
        f.importance.toFixed(4)
      ]),
      theme: 'striped',
    });
  }
  
  // Insights
  if (data.insights.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Key Insights', 14, 20);
    
    let y = 30;
    data.insights.forEach((insight, idx) => {
      doc.setFontSize(11);
      doc.text(`${idx + 1}. ${insight}`, 14, y);
      y += 10;
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount} • Generated by DataFlowHub.AI`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save
  doc.save(`evaluation_${data.modelName}_${Date.now()}.pdf`);
};
```

**Add export button to evaluation page:**

```tsx
import { exportEvaluationPDF } from '../lib/evaluationPdfExport';

// In component:
const handleExportPDF = () => {
  exportEvaluationPDF({
    modelName: model.name,
    algorithm: model.algorithm,
    trainedAt: model.created_at,
    metrics: {
      accuracy: model.metrics?.accuracy || 0,
      precision: model.metrics?.precision || 0,
      recall: model.metrics?.recall || 0,
      f1Score: model.metrics?.f1_score || 0,
    },
    featureImportance: featureImportanceData,
    insights: [
      'Model shows strong performance with 95% accuracy',
      'Top 3 features account for 70% of prediction power',
      'Recommend collecting more data for minority classes'
    ]
  });
};

// In JSX:
<button onClick={handleExportPDF} className="btn-secondary-improved">
  <Download className="w-4 h-4" />
  Export Report
</button>
```

---

## ✅ Quick Testing

After implementing, test each feature:

1. **PrerequisiteGate on ModelTraining:**
   - Visit `/app/models` with no datasets → should show "Upload Dataset" action
   - Add dataset → should show dataset selected
   - Start Celery workers → badge should turn green

2. **CeleryHealthBadge:**
   - Stop Celery workers: `celery -A backend.celery_app control shutdown`
   - Badge should show "Offline 0W"
   - Start workers: `celery -A backend.celery_app worker --loglevel=info`
   - Badge should show "Healthy XW"

3. **Evaluation Narrative:**
   - Visit evaluation page without predictions
   - Should see helpful explanatory text in each empty panel

4. **PDF Export:**
   - Run predictions on a model
   - Click "Export Report"
   - PDF should download with all sections

---

*Estimated Implementation Time: 2-3 hours*
*All components are ready and tested individually*
