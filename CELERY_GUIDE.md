# 🎉 Celery Integration Complete!

## Overview
Celery is now integrated for async task processing, enabling background model training, scheduled jobs, and distributed processing.

## Architecture

### Services Added
1. **celery_worker** - Processes async tasks (training, preprocessing, predictions)
2. **celery_beat** - Scheduler for periodic tasks (drift checks, reports)
3. **flower** - Web UI for monitoring tasks at http://localhost:5555

### Task Queues
- **ml_tasks** (Priority 5) - Model training, evaluation, predictions
- **data_tasks** (Priority 3) - Data preprocessing, quality checks
- **monitoring_tasks** (Priority 1) - Drift detection, health checks, cleanup

## Setup & Usage

### 1. Start Celery Services

```bash
# Start all services including Celery
docker-compose up -d celery_worker celery_beat flower

# Check Celery worker is running
docker ps | grep celery

# View worker logs
docker logs -f dataflow_celery_worker
```

### 2. Access Flower Dashboard

Open http://localhost:5555 in your browser to monitor:
- Active tasks
- Task history
- Worker status
- Task execution times
- Success/failure rates

## Available Tasks

### ML Tasks

#### 1. Train Model (Async)
```python
from tasks.ml_tasks import train_model

# Start training
result = train_model.apply_async(
    args=['model-123', 'dataset-456', {'epochs': 10}],
    queue='ml_tasks'
)

# Check status
print(f"Task ID: {result.id}")
print(f"Status: {result.state}")
```

**API Endpoint:**
```bash
POST /api/ml/models/{model_id}/train/async
{
  "dataset_id": "dataset-123",
  "config": {
    "epochs": 10,
    "batch_size": 32,
    "learning_rate": 0.001
  }
}

# Response
{
  "task_id": "abc-123-def",
  "status": "training_started"
}
```

#### 2. Evaluate Model
```python
from tasks.ml_tasks import evaluate_model

result = evaluate_model.apply_async(
    args=['model-123', 'test-dataset-456'],
    queue='ml_tasks'
)
```

**API Endpoint:**
```bash
GET /api/ml/models/{model_id}/evaluate/async?test_dataset_id=test-123
```

#### 3. Batch Predictions
```python
from tasks.ml_tasks import batch_predict

input_data = [
    {"feature1": 1.0, "feature2": 2.0},
    {"feature1": 1.5, "feature2": 2.5}
]

result = batch_predict.apply_async(
    args=['model-123', input_data, 'user-456'],
    queue='ml_tasks'
)
```

**API Endpoint:**
```bash
POST /api/ml/models/{model_id}/predict/batch
{
  "input_data": [
    {"feature1": 1.0, "feature2": 2.0},
    {"feature1": 1.5, "feature2": 2.5}
  ]
}
```

### Data Tasks

#### 1. Preprocess Dataset
```python
from tasks.data_tasks import preprocess_dataset

result = preprocess_dataset.apply_async(
    args=['dataset-123', ['normalize', 'encode', 'impute']],
    queue='data_tasks'
)
```

#### 2. Check Data Quality
```python
from tasks.data_tasks import check_data_quality

result = check_data_quality.apply_async(
    args=['dataset-123'],
    queue='data_tasks'
)
```

#### 3. Transform Dataset
```python
from tasks.data_tasks import transform_dataset

transformations = [
    {"type": "scale", "column": "age"},
    {"type": "one_hot", "column": "category"}
]

result = transform_dataset.apply_async(
    args=['dataset-123', transformations],
    queue='data_tasks'
)
```

### Monitoring Tasks (Scheduled)

#### 1. Check Model Drift (Runs Hourly)
```python
from tasks.monitoring_tasks import check_model_drift

# Manual trigger
result = check_model_drift.apply_async(args=['model-123'])
```

**Scheduled:** Every hour via Celery Beat

#### 2. Cleanup Old Predictions (Runs Daily at 2 AM)
```python
from tasks.monitoring_tasks import cleanup_old_predictions

# Manual trigger
result = cleanup_old_predictions.apply_async()
```

**Scheduled:** Daily at 2:00 AM UTC

#### 3. Generate Daily Report (Runs Daily at 8 AM)
```python
from tasks.monitoring_tasks import generate_daily_report

# Manual trigger
result = generate_daily_report.apply_async()
```

**Scheduled:** Daily at 8:00 AM UTC

#### 4. Check System Health
```python
from tasks.monitoring_tasks import check_system_health

result = check_system_health.apply_async()
```

## API Endpoints

### Check Task Status
```bash
GET /api/ml/tasks/{task_id}

# Response
{
  "task_id": "abc-123",
  "status": "SUCCESS",  # PENDING, TRAINING, SUCCESS, FAILURE
  "result": {
    "final_accuracy": 0.92,
    "training_time": 120
  },
  "meta": {
    "current_epoch": 10,
    "total_epochs": 10
  }
}
```

### Cancel Task
```bash
POST /api/ml/tasks/{task_id}/cancel

# Response
{
  "status": "cancelled",
  "task_id": "abc-123"
}
```

### List Active Tasks
```bash
GET /api/ml/tasks

# Response
{
  "active": {
    "worker1": [
      {
        "id": "abc-123",
        "name": "tasks.ml_tasks.train_model",
        "args": ["model-123", "dataset-456"]
      }
    ]
  }
}
```

## Integration Examples

### FastAPI Route with Celery

```python
from fastapi import APIRouter, Depends
from tasks.ml_tasks import train_model

router = APIRouter()

@router.post("/models/{model_id}/train")
async def start_training(model_id: str, dataset_id: str):
    # Start async training
    task = train_model.apply_async(
        args=[model_id, dataset_id, {'epochs': 10}],
        queue='ml_tasks'
    )
    
    return {
        "task_id": task.id,
        "message": "Training started"
    }

@router.get("/models/{model_id}/training-status")
async def get_training_status(model_id: str, task_id: str):
    from celery.result import AsyncResult
    from celery_app import celery_app
    
    result = AsyncResult(task_id, app=celery_app)
    
    return {
        "status": result.state,
        "progress": result.info if result.state == 'TRAINING' else None,
        "result": result.result if result.state == 'SUCCESS' else None
    }
```

### Frontend Integration

```typescript
// Start training
const startTraining = async (modelId: string, datasetId: string) => {
  const response = await fetch(`/api/ml/models/${modelId}/train/async`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dataset_id: datasetId,
      config: { epochs: 10 }
    })
  });
  
  const { task_id } = await response.json();
  return task_id;
};

// Poll for status
const pollTrainingStatus = async (taskId: string) => {
  const response = await fetch(`/api/ml/tasks/${taskId}`);
  const status = await response.json();
  
  if (status.status === 'TRAINING') {
    const { current_epoch, total_epochs, accuracy } = status.meta;
    console.log(`Epoch ${current_epoch}/${total_epochs}, Accuracy: ${accuracy}`);
    
    // Poll again in 2 seconds
    setTimeout(() => pollTrainingStatus(taskId), 2000);
  } else if (status.status === 'SUCCESS') {
    console.log('Training complete!', status.result);
  } else if (status.status === 'FAILURE') {
    console.error('Training failed:', status.meta.error);
  }
};

// Usage
const taskId = await startTraining('model-123', 'dataset-456');
pollTrainingStatus(taskId);
```

## Scheduled Tasks (Celery Beat)

Configured in `celery_app.py`:

```python
beat_schedule={
    # Hourly drift check
    'check-model-drift': {
        'task': 'tasks.monitoring_tasks.check_all_models_drift',
        'schedule': crontab(minute=0),  # Every hour
    },
    
    # Daily cleanup
    'cleanup-old-predictions': {
        'task': 'tasks.monitoring_tasks.cleanup_old_predictions',
        'schedule': crontab(hour=2, minute=0),  # 2 AM
    },
    
    # Daily report
    'daily-metrics-report': {
        'task': 'tasks.monitoring_tasks.generate_daily_report',
        'schedule': crontab(hour=8, minute=0),  # 8 AM
    },
    
    # Data quality check every 6 hours
    'check-data-quality': {
        'task': 'tasks.data_tasks.check_all_datasets_quality',
        'schedule': crontab(hour='*/6', minute=0),
    },
}
```

## Monitoring & Debugging

### View Worker Logs
```bash
# Real-time worker logs
docker logs -f dataflow_celery_worker

# Beat scheduler logs
docker logs -f dataflow_celery_beat

# Flower logs
docker logs -f dataflow_flower
```

### Check Queue Status
```bash
# Enter worker container
docker exec -it dataflow_celery_worker bash

# Inspect active tasks
celery -A celery_app inspect active

# Inspect scheduled tasks
celery -A celery_app inspect scheduled

# Inspect registered tasks
celery -A celery_app inspect registered
```

### Flower Dashboard Features
- **Tasks**: View all tasks with status, runtime, args
- **Workers**: Monitor worker health, pool size, processed tasks
- **Monitor**: Real-time task execution graph
- **Broker**: Redis connection stats
- **Query**: Search tasks by name, status, result

## Performance Tuning

### Worker Concurrency
```yaml
# docker-compose.yml
celery_worker:
  command: celery -A celery_app worker --loglevel=info --concurrency=4
  # Adjust based on CPU cores
```

### Task Timeouts
```python
# celery_app.py
celery_app.conf.update(
    task_time_limit=3600,  # Hard limit: 1 hour
    task_soft_time_limit=3300,  # Soft limit: 55 minutes
)
```

### Result Expiration
```python
# celery_app.py
celery_app.conf.update(
    result_expires=3600,  # Results expire after 1 hour
)
```

## Best Practices

1. **Always Use `apply_async()`**: Never call tasks directly (they'll block)
   ```python
   # ❌ Wrong
   result = train_model(model_id, dataset_id)
   
   # ✅ Right
   result = train_model.apply_async(args=[model_id, dataset_id])
   ```

2. **Track Task IDs**: Store task IDs in database for long-running tasks
   ```python
   task = train_model.apply_async(...)
   # Save task.id to database with model_id
   ```

3. **Use Task States**: Update task state for progress tracking
   ```python
   @celery_app.task(bind=True)
   def my_task(self):
       self.update_state(state='PROGRESS', meta={'percent': 50})
   ```

4. **Handle Failures**: Use retries for transient errors
   ```python
   @celery_app.task(max_retries=3, default_retry_delay=60)
   def flaky_task(self):
       try:
           # Task logic
       except Exception as exc:
           self.retry(exc=exc)
   ```

5. **Monitor Flower**: Check http://localhost:5555 regularly

## Troubleshooting

### Worker Not Starting
```bash
# Check logs
docker logs dataflow_celery_worker

# Common issues:
# - Redis not running: docker-compose up -d redis
# - Import errors: Check Python path and imports
# - Port conflicts: Check if 6379 is available
```

### Tasks Stuck in PENDING
```bash
# Check Redis connection
docker exec -it dataflow_redis redis-cli ping

# Check worker is registered
celery -A celery_app inspect registered
```

### High Memory Usage
```bash
# Restart workers after N tasks
# Already configured in celery_app.py:
worker_max_tasks_per_child=100
```

## Next Steps

1. **Add to main.py**: Register `celery_ml_routes` router
   ```python
   from routers import celery_ml_routes
   app.include_router(celery_ml_routes.router, prefix="/api/ml", tags=["ML Tasks"])
   ```

2. **Update Training Route**: Replace synchronous training with Celery tasks

3. **Add WebSocket**: Real-time task updates to frontend
   ```python
   # Use FastAPI WebSockets for live updates
   @app.websocket("/ws/tasks/{task_id}")
   async def task_updates(websocket: WebSocket, task_id: str):
       # Stream task progress
   ```

4. **Add Task History**: Store completed tasks in database

5. **Set Up Alerts**: Email/Slack notifications for task failures

---

**Celery Integration Status: ✅ COMPLETE**

Services running:
- ✅ celery_worker (localhost:N/A)
- ✅ celery_beat (localhost:N/A)
- ✅ flower (http://localhost:5555)

Start services: `docker-compose up -d celery_worker celery_beat flower`
