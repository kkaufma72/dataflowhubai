# Celery Beat Scheduler - Setup Complete

## Overview
Celery Beat is now configured and running for automated scheduled tasks.

## Running Services
- **celery_worker_cpu**: Handles CPU-intensive tasks (queue: `cpu_tasks`)
- **celery_worker_gpu**: Handles GPU/ML tasks (queue: `gpu_tasks`)
- **celery_worker_io**: Handles I/O-intensive tasks (queue: `io_tasks`)
- **celery_beat**: Scheduler that dispatches periodic tasks
- **flower**: Monitoring UI at http://localhost:5555 (admin / floweradmin)

## Scheduled Tasks

### 1. Model Drift Monitoring
- **Task**: `tasks.monitoring_tasks.check_all_models_drift`
- **Schedule**: Every hour (at minute 0)
- **Queue**: `io_tasks`
- **Purpose**: Checks all active ML models for data drift

### 2. Prediction Cleanup
- **Task**: `tasks.monitoring_tasks.cleanup_old_predictions`
- **Schedule**: Daily at 2:00 AM UTC
- **Queue**: `io_tasks`
- **Purpose**: Deletes prediction logs older than 90 days

### 3. Daily Metrics Report
- **Task**: `tasks.monitoring_tasks.generate_daily_report`
- **Schedule**: Daily at 8:00 AM UTC
- **Queue**: `io_tasks`
- **Purpose**: Generates platform-wide metrics summary

### 4. Dataset Quality Checks
- **Task**: `tasks.data_tasks.check_all_datasets_quality`
- **Schedule**: Every 6 hours
- **Queue**: `cpu_tasks`
- **Purpose**: Runs quality checks on all active datasets

## Configuration

Schedule is defined in `backend/celery_app.py`:

```python
celery_app.conf.beat_schedule = {
    'check-model-drift': {
        'task': 'tasks.monitoring_tasks.check_all_models_drift',
        'schedule': crontab(minute=0),  # Every hour
    },
    'cleanup-old-predictions': {
        'task': 'tasks.monitoring_tasks.cleanup_old_predictions',
        'schedule': crontab(hour=2, minute=0),  # 2 AM daily
    },
    'daily-metrics-report': {
        'task': 'tasks.monitoring_tasks.generate_daily_report',
        'schedule': crontab(hour=8, minute=0),  # 8 AM daily
    },
    'check-data-quality': {
        'task': 'tasks.data_tasks.check_all_datasets_quality',
        'schedule': crontab(hour='*/6', minute=0),  # Every 6 hours
    },
}
```

## Management Commands

### Start/Stop Beat
```bash
docker-compose up -d celery_beat
docker-compose stop celery_beat
```

### View Beat Logs
```bash
docker-compose logs -f celery_beat
```

### Manually Trigger a Scheduled Task
```python
from celery import Celery
app = Celery('test', broker='redis://redis:6379/0', backend='redis://redis:6379/1')
result = app.send_task('tasks.monitoring_tasks.generate_daily_report')
print(f"Task ID: {result.id}")
```

### View Schedule
```bash
docker-compose exec backend python << 'EOF'
from celery_app import celery_app
for name, config in celery_app.conf.beat_schedule.items():
    print(f"{name}: {config['task']} → {config['schedule']}")
EOF
```

## Monitoring

1. **Flower UI**: http://localhost:5555
   - View scheduled tasks under "Tasks" tab
   - Monitor worker health under "Workers" tab
   - See task execution history

2. **Logs**: Check Beat scheduler activity
   ```bash
   docker-compose logs celery_beat | grep Scheduler
   ```

3. **Redis**: Task queue inspection
   ```bash
   docker-compose exec redis redis-cli
   > KEYS celery*
   > LLEN cpu_tasks
   > LLEN gpu_tasks
   > LLEN io_tasks
   ```

## Adding New Scheduled Tasks

1. **Define the task** in `backend/tasks/` (e.g., `monitoring_tasks.py`):
   ```python
   @celery_app.task(name='tasks.my_module.my_scheduled_task')
   def my_scheduled_task():
       # Your task logic
       return {'status': 'completed'}
   ```

2. **Add to beat_schedule** in `backend/celery_app.py`:
   ```python
   celery_app.conf.beat_schedule['my-task-name'] = {
       'task': 'tasks.my_module.my_scheduled_task',
       'schedule': crontab(minute=0, hour='*/4'),  # Every 4 hours
   }
   ```

3. **Restart Beat**:
   ```bash
   docker-compose restart celery_beat
   ```

## Crontab Schedule Examples

```python
from celery.schedules import crontab

# Every minute
crontab()

# Every 5 minutes
crontab(minute='*/5')

# Every hour
crontab(minute=0)

# Every day at 3:30 AM
crontab(hour=3, minute=30)

# Every Monday at 7:00 AM
crontab(hour=7, minute=0, day_of_week=1)

# First day of month at 1:00 AM
crontab(hour=1, minute=0, day_of_month=1)
```

## Troubleshooting

### Beat not dispatching tasks
1. Check Beat is running: `docker-compose ps celery_beat`
2. Check Beat logs: `docker-compose logs celery_beat`
3. Verify schedule is loaded: `docker-compose exec backend python -c "from celery_app import celery_app; print(celery_app.conf.beat_schedule)"`

### Tasks dispatched but not executing
1. Verify workers are running: `docker-compose ps | grep celery_worker`
2. Check worker logs: `docker-compose logs celery_worker_cpu celery_worker_gpu celery_worker_io`
3. Verify task routing matches worker queues

### Beat scheduler out of sync
1. Delete the beat schedule file and restart:
   ```bash
   docker-compose exec celery_beat rm -f /app/celerybeat-schedule
   docker-compose restart celery_beat
   ```

## Next Steps

- Monitor Flower UI to confirm scheduled tasks execute successfully
- Adjust schedules in `celery_app.py` based on your workload
- Add custom scheduled tasks for your specific monitoring/maintenance needs
- Configure alerting for failed scheduled tasks (via Flower API or task result backend)
