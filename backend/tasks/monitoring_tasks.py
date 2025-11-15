"""
Monitoring tasks for Celery.
Handles scheduled monitoring, drift detection, and reporting.
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any
from uuid import UUID

from celery_app import celery_app
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from services.timescale_service import TimescaleService
from utils.config import settings


# Create async engine
engine = create_async_engine(
    settings.timescaledb_url,
    echo=False,
    pool_size=5,
    max_overflow=10
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


@celery_app.task(name='tasks.monitoring_tasks.check_model_drift')
def check_model_drift(model_id: str) -> Dict[str, Any]:
    """
    Check for data drift in a model's predictions.
    
    Args:
        model_id: Model identifier
        
    Returns:
        Drift detection results
    """
    # Simulate drift detection
    import time
    time.sleep(2)
    
    drift_detected = False
    drift_score = 0.03  # Below threshold
    
    # Record drift metric
    async def record_drift():
        async with AsyncSessionLocal() as session:
            service = TimescaleService(session)
            await service.record_model_metric(
                model_id=UUID(model_id),
                metric_name='drift_score',
                metric_value=drift_score,
                metadata={'drift_detected': drift_detected}
            )
            await session.commit()
    
    asyncio.run(record_drift())
    
    return {
        'status': 'completed',
        'model_id': model_id,
        'drift_detected': drift_detected,
        'drift_score': drift_score,
        'checked_at': datetime.utcnow().isoformat()
    }


@celery_app.task(name='tasks.monitoring_tasks.check_all_models_drift')
def check_all_models_drift() -> Dict[str, Any]:
    """
    Scheduled task to check drift for all active models.
    Runs hourly via Celery Beat.
    
    Returns:
        Summary of drift checks
    """
    # In production, query database for active models
    active_models = ['model-1', 'model-2', 'model-3']
    
    tasks = []
    for model_id in active_models:
        task = check_model_drift.apply_async(args=[model_id])
        tasks.append(task.id)
    
    return {
        'status': 'scheduled',
        'total_models': len(active_models),
        'task_ids': tasks,
        'scheduled_at': datetime.utcnow().isoformat()
    }


@celery_app.task(name='tasks.monitoring_tasks.cleanup_old_predictions')
def cleanup_old_predictions() -> Dict[str, Any]:
    """
    Scheduled task to clean up old prediction logs.
    Runs daily at 2 AM via Celery Beat.
    
    Returns:
        Cleanup results
    """
    # In production, delete predictions older than retention period
    cutoff_date = datetime.utcnow() - timedelta(days=90)
    
    # Simulate cleanup
    import time
    time.sleep(1)
    
    deleted_count = 1250  # Simulated
    
    return {
        'status': 'completed',
        'cutoff_date': cutoff_date.isoformat(),
        'deleted_count': deleted_count,
        'cleaned_at': datetime.utcnow().isoformat()
    }


@celery_app.task(name='tasks.monitoring_tasks.generate_daily_report')
def generate_daily_report() -> Dict[str, Any]:
    """
    Scheduled task to generate daily metrics report.
    Runs daily at 8 AM via Celery Beat.
    
    Returns:
        Report generation results
    """
    yesterday = datetime.utcnow() - timedelta(days=1)
    
    # Get metrics from TimescaleDB
    async def get_daily_metrics():
        async with AsyncSessionLocal() as session:
            service = TimescaleService(session)
            
            # In production, query actual metrics
            # For now, return simulated data
            return {
                'total_predictions': 5000,
                'avg_response_time_ms': 45.2,
                'models_trained': 3,
                'datasets_processed': 8,
                'drift_alerts': 0,
                'quality_issues': 2
            }
    
    metrics = asyncio.run(get_daily_metrics())
    
    # Record system metrics
    async def record_system():
        async with AsyncSessionLocal() as session:
            service = TimescaleService(session)
            await service.record_system_metric(
                service_name='platform',
                metric_name='daily_predictions',
                metric_value=metrics['total_predictions']
            )
            await service.record_system_metric(
                service_name='platform',
                metric_name='daily_avg_response_time',
                metric_value=metrics['avg_response_time_ms']
            )
            await session.commit()
    
    asyncio.run(record_system())
    
    return {
        'status': 'completed',
        'report_date': yesterday.date().isoformat(),
        'metrics': metrics,
        'generated_at': datetime.utcnow().isoformat()
    }


@celery_app.task(name='tasks.monitoring_tasks.check_system_health')
def check_system_health() -> Dict[str, Any]:
    """
    Check overall system health and record metrics.
    
    Returns:
        System health status
    """
    import time
    import psutil
    
    # Get system metrics
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    health_status = {
        'cpu_usage': cpu_percent,
        'memory_usage': memory.percent,
        'disk_usage': disk.percent,
        'status': 'healthy' if cpu_percent < 80 else 'warning'
    }
    
    # Record system metrics
    async def record_health():
        async with AsyncSessionLocal() as session:
            service = TimescaleService(session)
            await service.record_system_metric(
                service_name='infrastructure',
                metric_name='cpu_usage',
                metric_value=cpu_percent
            )
            await service.record_system_metric(
                service_name='infrastructure',
                metric_name='memory_usage',
                metric_value=memory.percent
            )
            await service.record_system_metric(
                service_name='infrastructure',
                metric_name='disk_usage',
                metric_value=disk.percent
            )
            await session.commit()
    
    asyncio.run(record_health())
    
    return {
        'status': 'completed',
        'health': health_status,
        'checked_at': datetime.utcnow().isoformat()
    }


@celery_app.task(
    bind=True,
    name='tasks.monitoring_tasks.alert_on_anomaly',
    max_retries=2
)
def alert_on_anomaly(
    self,
    model_id: str,
    metric_name: str,
    metric_value: float,
    threshold: float
) -> Dict[str, Any]:
    """
    Send alert when metric exceeds threshold.
    
    Args:
        model_id: Model identifier
        metric_name: Metric that triggered alert
        metric_value: Current metric value
        threshold: Threshold value
        
    Returns:
        Alert results
    """
    try:
        # In production, send email/Slack notification
        alert = {
            'model_id': model_id,
            'metric': metric_name,
            'value': metric_value,
            'threshold': threshold,
            'severity': 'high' if metric_value > threshold * 1.5 else 'medium',
            'message': f'{metric_name} ({metric_value}) exceeded threshold ({threshold})'
        }
        
        # Log to TimescaleDB
        async def record_alert():
            async with AsyncSessionLocal() as session:
                service = TimescaleService(session)
                await service.record_model_metric(
                    model_id=UUID(model_id),
                    metric_name=f'alert_{metric_name}',
                    metric_value=metric_value,
                    metadata=alert
                )
                await session.commit()
        
        asyncio.run(record_alert())
        
        return {
            'status': 'alert_sent',
            **alert,
            'sent_at': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        self.retry(exc=e)
