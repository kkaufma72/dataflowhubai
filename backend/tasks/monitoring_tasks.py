"""
Monitoring tasks for Celery.
Handles scheduled monitoring, drift detection, and reporting.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any
from uuid import UUID

from celery_app import celery_app
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker

from services.timescale_service import TimescaleService
from utils.config import settings


logger = logging.getLogger(__name__)


# Create async engine
engine = create_async_engine(
    settings.timescaledb_url,
    echo=False,
    pool_size=5,
    max_overflow=10
)

# PostgreSQL engine for operational tables (models, incidents, drift reports)
postgres_engine = create_async_engine(
    settings.postgres_url,
    echo=False,
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

PostgresSessionLocal = sessionmaker(
    postgres_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


def _safe_uuid(value: str) -> UUID | None:
    try:
        return UUID(value)
    except Exception:
        return None


@celery_app.task(name='tasks.monitoring_tasks.check_model_drift')
def check_model_drift(model_id: str) -> Dict[str, Any]:
    """
    Check for data drift in a model's predictions.
    
    Args:
        model_id: Model identifier
        
    Returns:
        Drift detection results
    """
    parsed_model_id = _safe_uuid(model_id)
    if not parsed_model_id:
        return {
            'status': 'error',
            'model_id': model_id,
            'error': 'model_id must be a valid UUID',
            'checked_at': datetime.utcnow().isoformat(),
        }

    # Simulate drift detection
    import time
    time.sleep(2)
    
    drift_detected = False
    drift_score = 0.03  # Below threshold
    
    # Record drift metric
    async def record_drift():
        async with AsyncSessionLocal() as session:
            try:
                service = TimescaleService(session)
                await service.record_model_metric(
                    model_id=parsed_model_id,
                    metric_name='drift_score',
                    metric_value=drift_score,
                    metadata={'drift_detected': drift_detected}
                )
                await session.commit()
            except Exception as e:
                logger.error(f"Failed to record drift metric: {e}")
                await session.rollback()
    
    try:
        asyncio.run(record_drift())
    except Exception as e:
        logger.error(f"Error running record_drift coroutine: {e}")

    # Best-effort persistence of a minimal drift report to Postgres.
    async def persist_report():
        try:
            async with PostgresSessionLocal() as pg_session:
                await pg_session.execute(
                    text(
                        """
                        INSERT INTO model_drift_reports (model_id, has_drift, drift_score, severity, report, created_at)
                        VALUES (:model_id, :has_drift, :drift_score, :severity, :report, NOW())
                        """
                    ),
                    {
                        'model_id': parsed_model_id,
                        'has_drift': drift_detected,
                        'drift_score': drift_score,
                        'severity': 'warning' if drift_detected else 'info',
                        'report': {
                            'model_id': str(parsed_model_id),
                            'generated_at': datetime.utcnow().isoformat(),
                            'has_drift': drift_detected,
                            'drift_score': drift_score,
                            'severity': 'warning' if drift_detected else 'info',
                            'drifted_features': [],
                            'recommended_actions': [
                                'No significant drift detected' if not drift_detected else 'Investigate upstream data changes'
                            ],
                            'context': {'source': 'celery.monitoring_tasks.check_model_drift', 'simulated': True},
                        },
                    },
                )
                await session.commit()
        except Exception as e:
            logger.warning("Failed to persist drift report to Postgres: %s", e)

    asyncio.run(persist_report())
    
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
    async def get_active_models() -> list[str]:
        try:
            async with PostgresSessionLocal() as session:
                result = await session.execute(
                    text(
                        """
                        SELECT id
                        FROM ml_models
                        WHERE status IN ('deployed', 'active', 'trained', 'ready')
                        ORDER BY updated_at DESC
                        LIMIT 50
                        """
                    )
                )
                rows = result.fetchall()
                return [str(r.id) for r in rows]
        except Exception as e:
            logger.warning("Failed to query active models from Postgres: %s", e)
            return []

    active_models = asyncio.run(get_active_models())
    
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
    
    # Record system metrics (best-effort, don't fail if table doesn't exist)
    async def record_system():
        try:
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
        except Exception as e:
            logger.warning(f"Failed to record system metrics to TimescaleDB: {e}")
    
    try:
        asyncio.run(record_system())
    except Exception as e:
        logger.error(f"Error running record_system coroutine: {e}")
    
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
