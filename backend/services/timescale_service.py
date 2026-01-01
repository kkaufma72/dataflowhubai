"""
Service layer for interacting with TimescaleDB.
Provides methods for recording and querying time-series metrics using unified schema.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID
from uuid import uuid4

from sqlalchemy import text, and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession


class TimescaleService:
    """
    Service for TimescaleDB operations using unified metrics schema.
    
    Schema: unified_metrics(time, entity_type, entity_id, metric_name, metric_value, tags)
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    # ===== Model Metrics =====
    
    async def record_model_metric(
        self,
        model_id: UUID,
        metric_name: str,
        metric_value: float,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
    ) -> None:
        """Record a single model metric to unified_metrics table."""
        await self.session.execute(
            text("""
                INSERT INTO unified_metrics (time, entity_type, entity_id, metric_name, metric_value, tags)
                VALUES (:time, 'model', :entity_id, :metric_name, :metric_value, :tags::jsonb)
            """),
            {
                'time': timestamp or datetime.utcnow(),
                'entity_id': model_id,
                'metric_name': metric_name,
                'metric_value': metric_value,
                'tags': metadata or {},
            }
        )
        await self.session.commit()
    
    async def get_model_metrics(
        self,
        model_id: UUID,
        metric_name: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 1000,
    ) -> List[Dict[str, Any]]:
        """Retrieve model metrics for a time range."""
        query = """
            SELECT time, metric_name, metric_value, tags
            FROM unified_metrics
            WHERE entity_type = 'model' AND entity_id = :model_id
        """
        params = {'model_id': model_id}
        
        if metric_name:
            query += " AND metric_name = :metric_name"
            params['metric_name'] = metric_name
        
        if start_time:
            query += " AND time >= :start_time"
            params['start_time'] = start_time
        
        if end_time:
            query += " AND time <= :end_time"
            params['end_time'] = end_time
        
        query += " ORDER BY time DESC LIMIT :limit"
        params['limit'] = limit
        
        result = await self.session.execute(text(query), params)
        return [
            {
                'time': row[0],
                'metric_name': row[1],
                'metric_value': float(row[2]),
                'tags': row[3] or {},
            }
            for row in result.fetchall()
        ]
    
    async def get_model_metrics_aggregated(
        self,
        model_id: UUID,
        metric_name: str,
        start_time: datetime,
        end_time: datetime,
        interval: str = "1 hour",
    ) -> List[Dict[str, Any]]:
        """Get aggregated model metrics over time buckets using continuous aggregate."""
        result = await self.session.execute(
            text("""
                SELECT bucket, avg_value, min_value, max_value, count
                FROM model_metrics_hourly
                WHERE model_id = :model_id
                  AND metric_name = :metric_name
                  AND bucket >= :start_time
                  AND bucket <= :end_time
                ORDER BY bucket
            """),
            {
                'model_id': model_id,
                'metric_name': metric_name,
                'start_time': start_time,
                'end_time': end_time,
            }
        )
        
        return [
            {
                'bucket': row[0],
                'avg_value': float(row[1]) if row[1] is not None else None,
                'min_value': float(row[2]) if row[2] is not None else None,
                'max_value': float(row[3]) if row[3] is not None else None,
                'count': int(row[4]),
            }
            for row in result.fetchall()
        ]
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
    
    # ===== Dataset Metrics =====
    
    async def record_dataset_metric(
        self,
        dataset_id: UUID,
        metric_name: str,
        metric_value: float,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
    ) -> None:
        """Record a dataset metric to unified_metrics table."""
        await self.session.execute(
            text("""
                INSERT INTO unified_metrics (time, entity_type, entity_id, metric_name, metric_value, tags)
                VALUES (:time, 'dataset', :entity_id, :metric_name, :metric_value, :tags::jsonb)
            """),
            {
                'time': timestamp or datetime.utcnow(),
                'entity_id': dataset_id,
                'metric_name': metric_name,
                'metric_value': metric_value,
                'tags': metadata or {},
            }
        )
        await self.session.commit()
    
    async def get_dataset_metrics(
        self,
        dataset_id: UUID,
        metric_name: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 1000,
    ) -> List[Dict[str, Any]]:
        """Retrieve dataset metrics."""
        query = """
            SELECT time, metric_name, metric_value, tags
            FROM unified_metrics
            WHERE entity_type = 'dataset' AND entity_id = :dataset_id
        """
        params = {'dataset_id': dataset_id}
        
        if metric_name:
            query += " AND metric_name = :metric_name"
            params['metric_name'] = metric_name
        
        if start_time:
            query += " AND time >= :start_time"
            params['start_time'] = start_time
        
        if end_time:
            query += " AND time <= :end_time"
            params['end_time'] = end_time
        
        query += " ORDER BY time DESC LIMIT :limit"
        params['limit'] = limit
        
        result = await self.session.execute(text(query), params)
        return [
            {
                'time': row[0],
                'metric_name': row[1],
                'metric_value': float(row[2]),
                'tags': row[3] or {},
            }
            for row in result.fetchall()
        ]
    
    # ===== Training Metrics =====
    
    async def record_training_metric(
        self,
        model_id: UUID,
        epoch: int,
        metric_name: str,
        metric_value: float,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
    ) -> None:
        """Record a training metric with epoch info in tags."""
        tags = metadata or {}
        tags['epoch'] = epoch
        
        await self.session.execute(
            text("""
                INSERT INTO unified_metrics (time, entity_type, entity_id, metric_name, metric_value, tags)
                VALUES (:time, 'training', :entity_id, :metric_name, :metric_value, :tags::jsonb)
            """),
            {
                'time': timestamp or datetime.utcnow(),
                'entity_id': model_id,
                'metric_name': metric_name,
                'metric_value': metric_value,
                'tags': tags,
            }
        )
        await self.session.commit()
    
    async def get_training_history(
        self,
        model_id: UUID,
        metric_name: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get training history for a model."""
        query = """
            SELECT time, metric_name, metric_value, tags
            FROM unified_metrics
            WHERE entity_type = 'training' AND entity_id = :model_id
        """
        params = {'model_id': model_id}
        
        if metric_name:
            query += " AND metric_name = :metric_name"
            params['metric_name'] = metric_name
        
        query += " ORDER BY (tags->>'epoch')::int, time"
        
        result = await self.session.execute(text(query), params)
        return [
            {
                'time': row[0],
                'metric_name': row[1],
                'metric_value': float(row[2]),
                'epoch': row[3].get('epoch') if row[3] else None,
                'tags': row[3] or {},
            }
            for row in result.fetchall()
        ]
    
    # ===== System Metrics =====
    
    async def record_system_metric(
        self,
        service_name: str,
        metric_name: str,
        metric_value: float,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
    ) -> None:
        """Record a system metric (use service_name hash as entity_id)."""
        import hashlib
        # Use deterministic UUID from service name
        entity_id = UUID(hashlib.md5(service_name.encode()).hexdigest())
        
        tags = metadata or {}
        tags['service_name'] = service_name
        
        await self.session.execute(
            text("""
                INSERT INTO unified_metrics (time, entity_type, entity_id, metric_name, metric_value, tags)
                VALUES (:time, 'system', :entity_id, :metric_name, :metric_value, :tags::jsonb)
            """),
            {
                'time': timestamp or datetime.utcnow(),
                'entity_id': entity_id,
                'metric_name': metric_name,
                'metric_value': metric_value,
                'tags': tags,
            }
        )
        await self.session.commit()
    
    async def get_system_metrics(
        self,
        service_name: str,
        metric_name: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 1000,
    ) -> List[Dict[str, Any]]:
        """Retrieve system metrics for a service."""
        query = """
            SELECT time, metric_name, metric_value, tags
            FROM unified_metrics
            WHERE entity_type = 'system' AND tags->>'service_name' = :service_name
        """
        params = {'service_name': service_name}
        
        if metric_name:
            query += " AND metric_name = :metric_name"
            params['metric_name'] = metric_name
        
        if start_time:
            query += " AND time >= :start_time"
            params['start_time'] = start_time
        
        if end_time:
            query += " AND time <= :end_time"
            params['end_time'] = end_time
        
        query += " ORDER BY time DESC LIMIT :limit"
        params['limit'] = limit
        
        result = await self.session.execute(text(query), params)
        return [
            {
                'time': row[0],
                'metric_name': row[1],
                'metric_value': float(row[2]),
                'tags': row[3] or {},
            }
            for row in result.fetchall()
        ]
    
    # ===== Prediction Logs =====
    
    async def log_prediction(
        self,
        model_id: UUID,
        user_id: Optional[UUID],
        input_data: Dict[str, Any],
        prediction: Dict[str, Any],
        confidence_score: Optional[float],
        response_time_ms: float,
        error: Optional[str] = None,
        timestamp: Optional[datetime] = None,
        prediction_id: Optional[UUID] = None,
        tags: Optional[Dict[str, Any]] = None,
    ) -> UUID:
        """Log a model prediction to prediction_logs table."""
        pred_id = prediction_id or uuid4()
        
        await self.session.execute(
            text("""
                INSERT INTO prediction_logs 
                (time, prediction_id, model_id, user_id, input_data, prediction, 
                 confidence_score, response_time_ms, error, tags)
                VALUES (:time, :prediction_id, :model_id, :user_id, :input_data::jsonb, 
                        :prediction::jsonb, :confidence_score, :response_time_ms, :error, :tags::jsonb)
            """),
            {
                'time': timestamp or datetime.utcnow(),
                'prediction_id': pred_id,
                'model_id': model_id,
                'user_id': user_id,
                'input_data': input_data,
                'prediction': prediction,
                'confidence_score': confidence_score,
                'response_time_ms': response_time_ms,
                'error': error,
                'tags': tags or {},
            }
        )
        await self.session.commit()
        return pred_id
    
    async def get_prediction_logs(
        self,
        model_id: UUID,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Retrieve prediction logs."""
        query = "SELECT * FROM prediction_logs WHERE model_id = :model_id"
        params = {'model_id': model_id}
        
        if start_time:
            query += " AND time >= :start_time"
            params['start_time'] = start_time
        
        if end_time:
            query += " AND time <= :end_time"
            params['end_time'] = end_time
        
        query += " ORDER BY time DESC LIMIT :limit"
        params['limit'] = limit
        
        result = await self.session.execute(text(query), params)
        return [dict(row._mapping) for row in result.fetchall()]
    
    async def get_prediction_stats(
        self,
        model_id: UUID,
        start_time: datetime,
        end_time: datetime,
    ) -> Dict[str, Any]:
        """Get aggregated prediction statistics."""
        result = await self.session.execute(
            text("""
                SELECT 
                    COUNT(*) as total_predictions,
                    AVG(response_time_ms) as avg_response_time,
                    AVG(confidence_score) as avg_confidence,
                    COUNT(error) as error_count
                FROM prediction_logs
                WHERE model_id = :model_id
                  AND time >= :start_time
                  AND time <= :end_time
            """),
            {
                'model_id': model_id,
                'start_time': start_time,
                'end_time': end_time,
            }
        )
        
        row = result.first()
        return {
            'total_predictions': row[0] or 0,
            'avg_response_time_ms': float(row[1]) if row[1] else 0,
            'avg_confidence': float(row[2]) if row[2] else 0,
            'error_count': row[3] or 0,
        }

