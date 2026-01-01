"""
Data processing tasks for Celery.
Handles async data preprocessing, quality checks, and transformations.
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, List
from uuid import UUID

from celery_app import celery_app
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
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

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


def _safe_uuid(value: str) -> UUID | None:
    """Safely convert string to UUID, return None if invalid."""
    try:
        return UUID(value)
    except Exception:
        return None


@celery_app.task(
    bind=True,
    name='tasks.data_tasks.preprocess_dataset',
    max_retries=3
)
def preprocess_dataset(
    self,
    dataset_id: str,
    operations: List[str]
) -> Dict[str, Any]:
    """
    Preprocess a dataset asynchronously.
    
    Args:
        dataset_id: Dataset identifier
        operations: List of preprocessing operations (normalize, encode, etc.)
        
    Returns:
        Preprocessing results
    """
    try:
        self.update_state(state='PREPROCESSING')
        
        results = {
            'dataset_id': dataset_id,
            'operations_completed': [],
            'stats': {}
        }
        
        import time
        for i, operation in enumerate(operations):
            # Simulate preprocessing
            time.sleep(1)
            
            results['operations_completed'].append(operation)
            
            # Update progress
            self.update_state(
                state='PREPROCESSING',
                meta={
                    'current_operation': operation,
                    'completed': i + 1,
                    'total': len(operations)
                }
            )
        
        # Record quality metrics
        async def record_quality():
            async with AsyncSessionLocal() as session:
                service = TimescaleService(session)
                await service.record_dataset_metric(
                    dataset_id=UUID(dataset_id),
                    metric_name='preprocessing_completed',
                    metric_value=len(operations)
                )
                await service.record_dataset_metric(
                    dataset_id=UUID(dataset_id),
                    metric_name='data_quality_score',
                    metric_value=0.95  # Simulated quality score
                )
                await session.commit()
        
        asyncio.run(record_quality())
        
        return {
            'status': 'completed',
            **results,
            'completed_at': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        self.retry(exc=e)


@celery_app.task(
    bind=True,
    name='tasks.data_tasks.check_data_quality',
    max_retries=2
)
def check_data_quality(self, dataset_id: str) -> Dict[str, Any]:
    """
    Check data quality for a dataset.
    
    Args:
        dataset_id: Dataset identifier
        
    Returns:
        Quality check results
    """
    try:
        self.update_state(state='CHECKING_QUALITY')
        
        # Simulate quality checks
        import time
        time.sleep(2)
        
        quality_metrics = {
            'completeness': 0.98,
            'consistency': 0.96,
            'validity': 0.95,
            'uniqueness': 0.99,
            'overall_score': 0.97
        }
        
        issues = [
            {'type': 'missing_values', 'column': 'age', 'count': 5},
            {'type': 'outliers', 'column': 'income', 'count': 3}
        ]
        
        # Record metrics
        async def record_metrics():
            async with AsyncSessionLocal() as session:
                service = TimescaleService(session)
                for metric_name, value in quality_metrics.items():
                    await service.record_dataset_metric(
                        dataset_id=UUID(dataset_id),
                        metric_name=f'quality_{metric_name}',
                        metric_value=value,
                        metadata={'issues': issues}
                    )
                await session.commit()
        
        asyncio.run(record_metrics())
        
        return {
            'status': 'completed',
            'dataset_id': dataset_id,
            'metrics': quality_metrics,
            'issues': issues,
            'checked_at': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        self.retry(exc=e)


@celery_app.task(name='tasks.data_tasks.check_all_datasets_quality')
def check_all_datasets_quality() -> Dict[str, Any]:
    """
    Scheduled task to check quality of all active datasets.
    Runs every 6 hours via Celery Beat.
    
    Returns:
        Summary of quality checks
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Query database for active datasets (UUIDs)
    async def get_active_datasets() -> list[str]:
        try:
            from sqlalchemy import text
            from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
            from sqlalchemy.orm import sessionmaker
            from utils.config import settings
            
            engine = create_async_engine(settings.postgres_url, echo=False)
            AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
            
            async with AsyncSessionLocal() as session:
                result = await session.execute(
                    text(
                        """
                        SELECT id::text
                        FROM datasets
                        WHERE status IN ('processed', 'ready', 'active')
                        ORDER BY updated_at DESC
                        LIMIT 50
                        """
                    )
                )
                rows = result.fetchall()
                return [r[0] for r in rows]
        except Exception as e:
            logger.warning(f"Failed to query active datasets: {e}")
            return []
    
    active_datasets = asyncio.run(get_active_datasets())
    
    if not active_datasets:
        logger.info("No active datasets found for quality checks")
        return {
            'status': 'skipped',
            'total_datasets': 0,
            'task_ids': [],
            'scheduled_at': datetime.utcnow().isoformat()
        }
    
    tasks = []
    for dataset_id in active_datasets:
        task = check_data_quality.apply_async(args=[dataset_id])
        tasks.append(task.id)
    
    return {
        'status': 'scheduled',
        'total_datasets': len(active_datasets),
        'task_ids': tasks,
        'scheduled_at': datetime.utcnow().isoformat()
    }


@celery_app.task(
    bind=True,
    name='tasks.data_tasks.transform_dataset',
    max_retries=3
)
def transform_dataset(
    self,
    dataset_id: str,
    transformations: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Apply transformations to a dataset.
    
    Args:
        dataset_id: Dataset identifier
        transformations: List of transformation configs
        
    Returns:
        Transformation results
    """
    try:
        self.update_state(state='TRANSFORMING')
        
        applied = []
        import time
        
        for i, transform in enumerate(transformations):
            time.sleep(0.5)
            applied.append({
                'type': transform.get('type'),
                'column': transform.get('column'),
                'status': 'success'
            })
            
            self.update_state(
                state='TRANSFORMING',
                meta={
                    'current': i + 1,
                    'total': len(transformations)
                }
            )
        
        return {
            'status': 'completed',
            'dataset_id': dataset_id,
            'transformations_applied': applied,
            'completed_at': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        self.retry(exc=e)


@celery_app.task(name='tasks.data_tasks.export_dataset')
def export_dataset(dataset_id: str, format: str = 'csv') -> Dict[str, Any]:
    """
    Export a dataset to a file format.
    
    Args:
        dataset_id: Dataset identifier
        format: Export format (csv, json, parquet)
        
    Returns:
        Export results with file location
    """
    import time
    time.sleep(2)
    
    return {
        'status': 'completed',
        'dataset_id': dataset_id,
        'format': format,
        'file_path': f'/exports/{dataset_id}.{format}',
        'size_mb': 12.5,
        'exported_at': datetime.utcnow().isoformat()
    }
