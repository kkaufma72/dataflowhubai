"""
Machine Learning tasks for Celery.
Handles async model training, evaluation, and predictions.
"""

import asyncio
from datetime import datetime
from typing import Dict, Any
from uuid import UUID

from celery import Task
from celery_app import celery_app
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from services.timescale_service import TimescaleService
from utils.config import settings


# Create async engine for database operations
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


class DatabaseTask(Task):
    """Base task with database session management."""
    
    _session = None
    
    @property
    def session(self):
        if self._session is None:
            self._session = AsyncSessionLocal()
        return self._session
    
    def after_return(self, *args, **kwargs):
        if self._session is not None:
            asyncio.run(self._session.close())
            self._session = None


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name='tasks.ml_tasks.train_model',
    max_retries=3,
    default_retry_delay=300  # 5 minutes
)
def train_model(self, model_id: str, dataset_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Train a machine learning model asynchronously.
    
    Args:
        model_id: Model identifier
        dataset_id: Dataset identifier
        config: Training configuration (epochs, batch_size, etc.)
        
    Returns:
        Training results with metrics
    """
    try:
        # Update task state
        self.update_state(
            state='TRAINING',
            meta={'current_epoch': 0, 'total_epochs': config.get('epochs', 10)}
        )
        
        # Simulate training (replace with actual ML training)
        import time
        epochs = config.get('epochs', 10)
        
        for epoch in range(epochs):
            # Simulate training epoch
            time.sleep(2)  # Replace with actual training
            
            # Record metrics
            loss = 0.5 - (epoch * 0.03)  # Simulated decreasing loss
            accuracy = 0.7 + (epoch * 0.02)  # Simulated increasing accuracy
            
            # Record to TimescaleDB
            async def record_metrics():
                async with AsyncSessionLocal() as session:
                    service = TimescaleService(session)
                    await service.record_training_metric(
                        model_id=UUID(model_id),
                        epoch=epoch,
                        metric_name='loss',
                        metric_value=loss
                    )
                    await service.record_training_metric(
                        model_id=UUID(model_id),
                        epoch=epoch,
                        metric_name='accuracy',
                        metric_value=accuracy
                    )
                    await session.commit()
            
            asyncio.run(record_metrics())
            
            # Update task progress
            self.update_state(
                state='TRAINING',
                meta={
                    'current_epoch': epoch + 1,
                    'total_epochs': epochs,
                    'loss': loss,
                    'accuracy': accuracy
                }
            )
        
        # Final metrics
        final_accuracy = 0.7 + (epochs * 0.02)
        
        async def record_final_metrics():
            async with AsyncSessionLocal() as session:
                service = TimescaleService(session)
                await service.record_model_metric(
                    model_id=UUID(model_id),
                    metric_name='final_accuracy',
                    metric_value=final_accuracy
                )
                await service.record_model_metric(
                    model_id=UUID(model_id),
                    metric_name='training_time',
                    metric_value=epochs * 2  # Simulated training time
                )
                await session.commit()
        
        asyncio.run(record_final_metrics())
        
        return {
            'status': 'completed',
            'model_id': model_id,
            'dataset_id': dataset_id,
            'epochs': epochs,
            'final_accuracy': final_accuracy,
            'training_time': epochs * 2,
            'completed_at': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        # Retry on failure
        self.retry(exc=e)


@celery_app.task(
    bind=True,
    name='tasks.ml_tasks.evaluate_model',
    max_retries=2
)
def evaluate_model(self, model_id: str, test_dataset_id: str) -> Dict[str, Any]:
    """
    Evaluate a trained model on test data.
    
    Args:
        model_id: Model identifier
        test_dataset_id: Test dataset identifier
        
    Returns:
        Evaluation metrics
    """
    try:
        self.update_state(state='EVALUATING')
        
        # Simulate evaluation
        import time
        time.sleep(3)
        
        # Simulated metrics
        metrics = {
            'accuracy': 0.92,
            'precision': 0.90,
            'recall': 0.88,
            'f1_score': 0.89,
            'auc_roc': 0.94
        }
        
        # Record to TimescaleDB
        async def record_metrics():
            async with AsyncSessionLocal() as session:
                service = TimescaleService(session)
                for metric_name, metric_value in metrics.items():
                    await service.record_model_metric(
                        model_id=UUID(model_id),
                        metric_name=f'eval_{metric_name}',
                        metric_value=metric_value
                    )
                await session.commit()
        
        asyncio.run(record_metrics())
        
        return {
            'status': 'completed',
            'model_id': model_id,
            'metrics': metrics,
            'evaluated_at': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        self.retry(exc=e)


@celery_app.task(
    bind=True,
    name='tasks.ml_tasks.batch_predict',
    max_retries=2
)
def batch_predict(
    self,
    model_id: str,
    input_data: list,
    user_id: str = None
) -> Dict[str, Any]:
    """
    Make batch predictions asynchronously.
    
    Args:
        model_id: Model identifier
        input_data: List of input samples
        user_id: Optional user identifier
        
    Returns:
        Prediction results
    """
    try:
        self.update_state(state='PREDICTING')
        
        predictions = []
        start_time = datetime.utcnow()
        
        # Process each input
        import time
        for i, sample in enumerate(input_data):
            # Simulate prediction
            time.sleep(0.1)
            
            prediction = {
                'input': sample,
                'prediction': 'A' if i % 2 == 0 else 'B',
                'confidence': 0.85 + (i % 10) * 0.01,
                'prediction_id': f'pred_{i}_{int(time.time())}'
            }
            predictions.append(prediction)
            
            # Update progress
            self.update_state(
                state='PREDICTING',
                meta={
                    'processed': i + 1,
                    'total': len(input_data),
                    'progress': ((i + 1) / len(input_data)) * 100
                }
            )
        
        end_time = datetime.utcnow()
        total_time_ms = (end_time - start_time).total_seconds() * 1000
        
        # Log predictions to TimescaleDB
        async def log_batch():
            async with AsyncSessionLocal() as session:
                service = TimescaleService(session)
                for pred in predictions:
                    await service.log_prediction(
                        model_id=UUID(model_id),
                        user_id=UUID(user_id) if user_id else None,
                        input_data=pred['input'],
                        prediction={'result': pred['prediction']},
                        confidence_score=pred['confidence'],
                        response_time_ms=total_time_ms / len(input_data)
                    )
                await session.commit()
        
        asyncio.run(log_batch())
        
        return {
            'status': 'completed',
            'model_id': model_id,
            'total_predictions': len(predictions),
            'predictions': predictions,
            'total_time_ms': total_time_ms,
            'avg_time_per_prediction_ms': total_time_ms / len(input_data),
            'completed_at': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        self.retry(exc=e)


@celery_app.task(name='tasks.ml_tasks.retrain_model')
def retrain_model(model_id: str, new_data_id: str = None) -> Dict[str, Any]:
    """
    Retrain an existing model with new data.
    
    Args:
        model_id: Model to retrain
        new_data_id: Optional new dataset to include
        
    Returns:
        Retraining results
    """
    # Trigger training task
    result = train_model.apply_async(
        args=[model_id, new_data_id or 'original_dataset'],
        kwargs={'config': {'epochs': 5, 'is_retrain': True}}
    )
    
    return {
        'status': 'retraining_started',
        'model_id': model_id,
        'task_id': result.id
    }
