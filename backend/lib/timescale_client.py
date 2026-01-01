"""
TimescaleDB Client - Unified time-series metrics storage
Replaces InfluxDB with TimescaleDB hypertables
"""
import os
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import execute_values, RealDictCursor
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)


class TimescaleClient:
    """Client for writing and querying time-series metrics in TimescaleDB"""
    
    def __init__(self):
        self.host = os.getenv('TIMESCALEDB_HOST', 'timescaledb')
        self.port = int(os.getenv('TIMESCALEDB_PORT', '5432'))
        self.database = os.getenv('TIMESCALEDB_DB', 'timescale')
        self.user = os.getenv('TIMESCALEDB_USER', 'postgres')
        self.password = os.getenv('TIMESCALEDB_PASSWORD', 'timescale_secure_password')
        
    @contextmanager
    def get_connection(self):
        """Get a connection from the pool"""
        conn = psycopg2.connect(
            host=self.host,
            port=self.port,
            database=self.database,
            user=self.user,
            password=self.password
        )
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"Database error: {e}")
            raise
        finally:
            conn.close()
    
    def write_metric(
        self,
        metric_name: str,
        value: float,
        model_id: Optional[str] = None,
        tags: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None
    ):
        """
        Write a single metric point.
        
        DEPRECATED: Use metrics batching API instead for better performance.
        This method is kept for backward compatibility but should be avoided
        in production (high write IOPS).
        
        Prefer: POST /api/metrics/batch
        """
        logger.warning("write_metric() is deprecated. Use /api/metrics/batch for better performance.")
        
        if timestamp is None:
            timestamp = datetime.utcnow()
        
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO metrics (time, model_id, metric_name, metric_value, tags, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (timestamp, model_id, metric_name, value, 
                     psycopg2.extras.Json(tags or {}),
                     psycopg2.extras.Json(metadata or {}))
                )
    
    def write_metrics_batch(
        self,
        metrics: List[Dict[str, Any]]
    ):
        """Write multiple metrics efficiently"""
        if not metrics:
            return
        
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                execute_values(
                    cur,
                    """
                    INSERT INTO metrics (time, model_id, metric_name, metric_value, tags, metadata)
                    VALUES %s
                    """,
                    [
                        (
                            m.get('timestamp', datetime.utcnow()),
                            m.get('model_id'),
                            m['metric_name'],
                            m['value'],
                            psycopg2.extras.Json(m.get('tags', {})),
                            psycopg2.extras.Json(m.get('metadata', {}))
                        )
                        for m in metrics
                    ]
                )
    
    def write_model_performance(
        self,
        model_id: str,
        accuracy: Optional[float] = None,
        precision: Optional[float] = None,
        recall: Optional[float] = None,
        f1_score: Optional[float] = None,
        auc_roc: Optional[float] = None,
        inference_time_ms: Optional[float] = None,
        throughput_qps: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None
    ):
        """Write model performance metrics"""
        if timestamp is None:
            timestamp = datetime.utcnow()
        
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO model_performance 
                    (time, model_id, accuracy, precision_score, recall, f1_score, 
                     auc_roc, inference_time_ms, throughput_qps, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (timestamp, model_id, accuracy, precision, recall, f1_score,
                     auc_roc, inference_time_ms, throughput_qps,
                     psycopg2.extras.Json(metadata or {}))
                )
    
    def write_training_metric(
        self,
        experiment_id: str,
        model_id: Optional[str] = None,
        epoch: Optional[int] = None,
        step: Optional[int] = None,
        loss: Optional[float] = None,
        validation_loss: Optional[float] = None,
        learning_rate: Optional[float] = None,
        batch_size: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None
    ):
        """Write training metrics"""
        if timestamp is None:
            timestamp = datetime.utcnow()
        
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO training_metrics 
                    (time, experiment_id, model_id, epoch, step, loss, 
                     validation_loss, learning_rate, batch_size, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (timestamp, experiment_id, model_id, epoch, step, loss,
                     validation_loss, learning_rate, batch_size,
                     psycopg2.extras.Json(metadata or {}))
                )
    
    def write_data_quality(
        self,
        dataset_id: str,
        completeness: Optional[float] = None,
        validity: Optional[float] = None,
        consistency: Optional[float] = None,
        uniqueness: Optional[float] = None,
        timeliness: Optional[float] = None,
        row_count: Optional[int] = None,
        null_count: Optional[int] = None,
        duplicate_count: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None
    ):
        """Write data quality metrics"""
        if timestamp is None:
            timestamp = datetime.utcnow()
        
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO data_quality_metrics 
                    (time, dataset_id, completeness, validity, consistency, 
                     uniqueness, timeliness, row_count, null_count, 
                     duplicate_count, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (timestamp, dataset_id, completeness, validity, consistency,
                     uniqueness, timeliness, row_count, null_count,
                     duplicate_count, psycopg2.extras.Json(metadata or {}))
                )
    
    def query_metrics(
        self,
        metric_name: str,
        model_id: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        tags: Optional[Dict[str, Any]] = None,
        limit: int = 1000
    ) -> List[Dict[str, Any]]:
        """Query metrics with filters"""
        if end_time is None:
            end_time = datetime.utcnow()
        if start_time is None:
            start_time = end_time - timedelta(hours=24)
        
        query = """
            SELECT time, model_id, metric_name, metric_value, tags, metadata
            FROM metrics
            WHERE metric_name = %s
              AND time >= %s AND time <= %s
        """
        params = [metric_name, start_time, end_time]
        
        if model_id:
            query += " AND model_id = %s"
            params.append(model_id)
        
        if tags:
            query += " AND tags @> %s"
            params.append(psycopg2.extras.Json(tags))
        
        query += " ORDER BY time DESC LIMIT %s"
        params.append(limit)
        
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                return [dict(row) for row in cur.fetchall()]
    
    def query_model_performance(
        self,
        model_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Query model performance metrics"""
        if end_time is None:
            end_time = datetime.utcnow()
        if start_time is None:
            start_time = end_time - timedelta(days=7)
        
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT * FROM model_performance
                    WHERE model_id = %s
                      AND time >= %s AND time <= %s
                    ORDER BY time DESC
                    LIMIT 1000
                    """,
                    (model_id, start_time, end_time)
                )
                return [dict(row) for row in cur.fetchall()]
    
    def query_training_metrics(
        self,
        experiment_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Query training metrics for an experiment"""
        if end_time is None:
            end_time = datetime.utcnow()
        if start_time is None:
            start_time = end_time - timedelta(days=7)
        
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT * FROM training_metrics
                    WHERE experiment_id = %s
                      AND time >= %s AND time <= %s
                    ORDER BY time ASC
                    """,
                    (experiment_id, start_time, end_time)
                )
                return [dict(row) for row in cur.fetchall()]
    
    def get_latest_model_performance(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get the most recent performance metrics for a model"""
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT * FROM model_performance
                    WHERE model_id = %s
                    ORDER BY time DESC
                    LIMIT 1
                    """,
                    (model_id,)
                )
                row = cur.fetchone()
                return dict(row) if row else None
    
    def get_aggregated_metrics(
        self,
        metric_name: str,
        model_id: Optional[str] = None,
        interval: str = '1 hour',
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get aggregated metrics using time_bucket"""
        if end_time is None:
            end_time = datetime.utcnow()
        if start_time is None:
            start_time = end_time - timedelta(days=7)
        
        query = f"""
            SELECT 
                time_bucket(%s, time) AS bucket,
                model_id,
                AVG(metric_value) AS avg_value,
                MIN(metric_value) AS min_value,
                MAX(metric_value) AS max_value,
                COUNT(*) AS count
            FROM metrics
            WHERE metric_name = %s
              AND time >= %s AND time <= %s
        """
        params = [interval, metric_name, start_time, end_time]
        
        if model_id:
            query += " AND model_id = %s"
            params.append(model_id)
        
        query += " GROUP BY bucket, model_id ORDER BY bucket DESC"
        
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                return [dict(row) for row in cur.fetchall()]


# Global client instance
_timescale_client = None

def get_timescale_client() -> TimescaleClient:
    """Get or create the global TimescaleDB client"""
    global _timescale_client
    if _timescale_client is None:
        _timescale_client = TimescaleClient()
    return _timescale_client
