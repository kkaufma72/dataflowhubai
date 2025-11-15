"""
Service layer for interacting with TimescaleDB.
Provides methods for recording and querying time-series metrics.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.timescale_models import (
    DatasetMetric,
    ModelMetric,
    PredictionLog,
    SystemMetric,
    TrainingMetric,
)


class TimescaleService:
    """Service for TimescaleDB operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    # Model Metrics
    
    async def record_model_metric(
        self,
        model_id: UUID,
        metric_name: str,
        metric_value: float,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
    ) -> ModelMetric:
        """Record a single model metric."""
        metric = ModelMetric(
            time=timestamp or datetime.utcnow(),
            model_id=model_id,
            metric_name=metric_name,
            metric_value=metric_value,
            meta_data=metadata or {},
        )
        self.session.add(metric)
        await self.session.commit()
        return metric
    
    async def get_model_metrics(
        self,
        model_id: UUID,
        metric_name: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 1000,
    ) -> List[ModelMetric]:
        """Retrieve model metrics for a time range."""
        query = select(ModelMetric).where(ModelMetric.model_id == model_id)
        
        if metric_name:
            query = query.where(ModelMetric.metric_name == metric_name)
        
        if start_time:
            query = query.where(ModelMetric.time >= start_time)
        
        if end_time:
            query = query.where(ModelMetric.time <= end_time)
        
        query = query.order_by(desc(ModelMetric.time)).limit(limit)
        
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_model_metrics_aggregated(
        self,
        model_id: UUID,
        metric_name: str,
        start_time: datetime,
        end_time: datetime,
        interval: str = "1 hour",  # PostgreSQL interval syntax
    ) -> List[Dict[str, Any]]:
        """Get aggregated model metrics over time buckets."""
        query = select(
            func.time_bucket(interval, ModelMetric.time).label("bucket"),
            func.avg(ModelMetric.metric_value).label("avg_value"),
            func.min(ModelMetric.metric_value).label("min_value"),
            func.max(ModelMetric.metric_value).label("max_value"),
            func.count(ModelMetric.metric_value).label("count"),
        ).where(
            and_(
                ModelMetric.model_id == model_id,
                ModelMetric.metric_name == metric_name,
                ModelMetric.time >= start_time,
                ModelMetric.time <= end_time,
            )
        ).group_by("bucket").order_by("bucket")
        
        result = await self.session.execute(query)
        return [
            {
                "time": row.bucket,
                "avg": float(row.avg_value),
                "min": float(row.min_value),
                "max": float(row.max_value),
                "count": row.count,
            }
            for row in result
        ]
    
    # Prediction Logs
    
    async def log_prediction(
        self,
        prediction_id: UUID,
        model_id: UUID,
        user_id: Optional[UUID],
        input_data: Dict[str, Any],
        prediction: Dict[str, Any],
        confidence_score: Optional[float],
        response_time_ms: float,
        error: Optional[str] = None,
        timestamp: Optional[datetime] = None,
    ) -> PredictionLog:
        """Log a model prediction."""
        log = PredictionLog(
            time=timestamp or datetime.utcnow(),
            prediction_id=prediction_id,
            model_id=model_id,
            user_id=user_id,
            input_data=input_data,
            prediction=prediction,
            confidence_score=confidence_score,
            response_time_ms=response_time_ms,
            error=error,
        )
        self.session.add(log)
        await self.session.commit()
        return log
    
    async def get_prediction_logs(
        self,
        model_id: UUID,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[PredictionLog]:
        """Retrieve prediction logs."""
        query = select(PredictionLog).where(PredictionLog.model_id == model_id)
        
        if start_time:
            query = query.where(PredictionLog.time >= start_time)
        
        if end_time:
            query = query.where(PredictionLog.time <= end_time)
        
        query = query.order_by(desc(PredictionLog.time)).limit(limit)
        
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_prediction_stats(
        self,
        model_id: UUID,
        start_time: datetime,
        end_time: datetime,
    ) -> Dict[str, Any]:
        """Get aggregated prediction statistics."""
        query = select(
            func.count(PredictionLog.prediction_id).label("total_predictions"),
            func.avg(PredictionLog.response_time_ms).label("avg_response_time"),
            func.avg(PredictionLog.confidence_score).label("avg_confidence"),
            func.count(PredictionLog.error).label("error_count"),
        ).where(
            and_(
                PredictionLog.model_id == model_id,
                PredictionLog.time >= start_time,
                PredictionLog.time <= end_time,
            )
        )
        
        result = await self.session.execute(query)
        row = result.first()
        
        return {
            "total_predictions": row.total_predictions or 0,
            "avg_response_time_ms": float(row.avg_response_time) if row.avg_response_time else 0,
            "avg_confidence": float(row.avg_confidence) if row.avg_confidence else 0,
            "error_count": row.error_count or 0,
        }
    
    # Dataset Metrics
    
    async def record_dataset_metric(
        self,
        dataset_id: UUID,
        metric_name: str,
        metric_value: float,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
    ) -> DatasetMetric:
        """Record a dataset metric."""
        metric = DatasetMetric(
            time=timestamp or datetime.utcnow(),
            dataset_id=dataset_id,
            metric_name=metric_name,
            metric_value=metric_value,
            meta_data=metadata or {},
        )
        self.session.add(metric)
        await self.session.commit()
        return metric
    
    # Training Metrics
    
    async def record_training_metric(
        self,
        model_id: UUID,
        epoch: int,
        metric_name: str,
        metric_value: float,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
    ) -> TrainingMetric:
        """Record a training metric."""
        metric = TrainingMetric(
            time=timestamp or datetime.utcnow(),
            model_id=model_id,
            epoch=epoch,
            metric_name=metric_name,
            metric_value=metric_value,
            meta_data=metadata or {},
        )
        self.session.add(metric)
        await self.session.commit()
        return metric
    
    async def get_training_history(
        self,
        model_id: UUID,
        metric_name: Optional[str] = None,
    ) -> List[TrainingMetric]:
        """Get training history for a model."""
        query = select(TrainingMetric).where(TrainingMetric.model_id == model_id)
        
        if metric_name:
            query = query.where(TrainingMetric.metric_name == metric_name)
        
        query = query.order_by(TrainingMetric.epoch)
        
        result = await self.session.execute(query)
        return result.scalars().all()
    
    # System Metrics
    
    async def record_system_metric(
        self,
        service_name: str,
        metric_name: str,
        metric_value: float,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
    ) -> SystemMetric:
        """Record a system-level metric."""
        metric = SystemMetric(
            time=timestamp or datetime.utcnow(),
            service_name=service_name,
            metric_name=metric_name,
            metric_value=metric_value,
            meta_data=metadata or {},
        )
        self.session.add(metric)
        await self.session.commit()
        return metric
    
    async def get_system_metrics(
        self,
        service_name: Optional[str] = None,
        metric_name: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 1000,
    ) -> List[SystemMetric]:
        """Retrieve system metrics."""
        query = select(SystemMetric)
        
        if service_name:
            query = query.where(SystemMetric.service_name == service_name)
        
        if metric_name:
            query = query.where(SystemMetric.metric_name == metric_name)
        
        if start_time:
            query = query.where(SystemMetric.time >= start_time)
        
        if end_time:
            query = query.where(SystemMetric.time <= end_time)
        
        query = query.order_by(desc(SystemMetric.time)).limit(limit)
        
        result = await self.session.execute(query)
        return result.scalars().all()
