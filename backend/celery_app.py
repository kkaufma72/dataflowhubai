"""
Celery application configuration for DataFlowHub AI.
Handles async tasks for model training, data processing, and monitoring.
"""

from celery import Celery
from celery.schedules import crontab
from kombu import Exchange, Queue

from utils.config import settings


# Initialize Celery app
celery_app = Celery(
    'dataflow_tasks',
    broker=settings.redis_url,  # Using Redis Streams
    backend=settings.redis_url.replace('/0', '/1'),  # Use different DB for results
    include=[
        'tasks.ml_tasks',
        'tasks.data_tasks',
        'tasks.monitoring_tasks',
    ]
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Task execution settings
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max per task
    task_soft_time_limit=3300,  # 55 minutes soft limit
    task_acks_late=True,  # Acknowledge after task completion
    worker_prefetch_multiplier=1,  # One task at a time per worker
    
    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    result_extended=True,
    
    # Broker options: Redis Streams for backpressure and ordering
    broker_transport_options={
        'visibility_timeout': 3600,
        'stream_options': {
            'maxlen': 10000,
            'approximate': True,
        },
    },

    # Task routes - send tasks to specific queues (workload sharding)
    task_routes={
        'tasks.ml_tasks.*': {'queue': 'gpu_tasks'},          # GPU/CPU heavy
        'tasks.data_tasks.*': {'queue': 'cpu_tasks'},        # CPU/IO mixed
        'tasks.monitoring_tasks.*': {'queue': 'io_tasks'},   # IO/light CPU
    },
    
    # Queue configuration per workload
    task_queues=(
        Queue('cpu_tasks', Exchange('cpu_tasks'), routing_key='cpu.#'),
        Queue('gpu_tasks', Exchange('gpu_tasks'), routing_key='gpu.#'),
        Queue('io_tasks', Exchange('io_tasks'), routing_key='io.#'),
    ),
    
    # Retry configuration
    task_default_max_retries=3,
    task_default_retry_delay=60,  # 1 minute between retries
    
    # Worker settings
    worker_max_tasks_per_child=100,  # Restart worker after 100 tasks to prevent memory leaks
    worker_disable_rate_limits=False,
    
    # Beat schedule for periodic tasks
    beat_schedule={
        # Check for model drift every hour
        'check-model-drift': {
            'task': 'tasks.monitoring_tasks.check_all_models_drift',
            'schedule': crontab(minute=0),  # Every hour
        },
        # Clean up old predictions every day
        'cleanup-old-predictions': {
            'task': 'tasks.monitoring_tasks.cleanup_old_predictions',
            'schedule': crontab(hour=2, minute=0),  # 2 AM daily
        },
        # Generate daily metrics report
        'daily-metrics-report': {
            'task': 'tasks.monitoring_tasks.generate_daily_report',
            'schedule': crontab(hour=8, minute=0),  # 8 AM daily
        },
        # Check data quality for all datasets
        'check-data-quality': {
            'task': 'tasks.data_tasks.check_all_datasets_quality',
            'schedule': crontab(hour='*/6', minute=0),  # Every 6 hours
        },
    },
)


# Event handlers for monitoring
@celery_app.task(bind=True)
def debug_task(self):
    """Debug task to test Celery is working."""
    print(f'Request: {self.request!r}')
    return 'Celery is working!'


if __name__ == '__main__':
    celery_app.start()
