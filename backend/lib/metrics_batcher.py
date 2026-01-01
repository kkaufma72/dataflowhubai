"""
Metrics Batching Service - High-throughput TimescaleDB ingestion
Reduces write IOPS by ~100x via batch inserts (COPY or execute_values)
"""
import asyncio
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from collections import defaultdict
import psycopg2
from psycopg2.extras import execute_values
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)


@dataclass
class MetricPoint:
    """Single metric data point"""
    metric_name: str
    value: float
    timestamp: datetime
    model_id: Optional[str] = None
    dataset_id: Optional[str] = None
    tags: Dict[str, str] = field(default_factory=dict)


class MetricsBatcher:
    """
    Batching service for high-throughput metrics ingestion.
    
    Features:
    - In-memory buffering with automatic flushing
    - Batch inserts via execute_values (10-100x faster than individual inserts)
    - Separate buffers per metric table
    - Graceful shutdown with buffer flush
    """
    
    def __init__(
        self,
        timescale_dsn: str,
        batch_size: int = 1000,
        flush_interval: float = 5.0,  # seconds
        max_buffer_size: int = 10000
    ):
        self.timescale_dsn = timescale_dsn
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self.max_buffer_size = max_buffer_size
        
        # Separate buffers per metric type
        self.buffers: Dict[str, List[MetricPoint]] = defaultdict(list)
        self.lock = asyncio.Lock()
        self.flush_task: Optional[asyncio.Task] = None
        self.running = False
        
        # Stats
        self.total_received = 0
        self.total_flushed = 0
        self.flush_count = 0
        self.dropped_count = 0
    
    async def start(self):
        """Start the background flush task"""
        if self.running:
            return
        
        self.running = True
        self.flush_task = asyncio.create_task(self._flush_loop())
        logger.info(f"MetricsBatcher started: batch_size={self.batch_size}, flush_interval={self.flush_interval}s")
    
    async def stop(self):
        """Stop and flush all remaining metrics"""
        if not self.running:
            return
        
        self.running = False
        if self.flush_task:
            self.flush_task.cancel()
            try:
                await self.flush_task
            except asyncio.CancelledError:
                pass
        
        # Final flush
        await self.flush_all()
        logger.info(f"MetricsBatcher stopped: received={self.total_received}, flushed={self.total_flushed}, dropped={self.dropped_count}")
    
    async def add_metric(
        self,
        metric_name: str,
        value: float,
        timestamp: Optional[datetime] = None,
        model_id: Optional[str] = None,
        dataset_id: Optional[str] = None,
        tags: Optional[Dict[str, str]] = None
    ):
        """
        Add a metric point to the buffer.
        
        Non-blocking: returns immediately after buffering.
        Metrics are flushed periodically or when buffer is full.
        """
        if not self.running:
            logger.warning("MetricsBatcher not running, dropping metric")
            self.dropped_count += 1
            return
        
        point = MetricPoint(
            metric_name=metric_name,
            value=value,
            timestamp=timestamp or datetime.utcnow(),
            model_id=model_id,
            dataset_id=dataset_id,
            tags=tags or {}
        )
        
        async with self.lock:
            buffer = self.buffers[metric_name]
            
            # Drop oldest if buffer full (backpressure)
            if len(buffer) >= self.max_buffer_size:
                logger.warning(f"Buffer full for {metric_name}, dropping oldest metric")
                buffer.pop(0)
                self.dropped_count += 1
            
            buffer.append(point)
            self.total_received += 1
            
            # Force flush if batch size reached
            if len(buffer) >= self.batch_size:
                asyncio.create_task(self._flush_metric(metric_name))
    
    async def _flush_loop(self):
        """Background task that flushes buffers periodically"""
        try:
            while self.running:
                await asyncio.sleep(self.flush_interval)
                await self.flush_all()
        except asyncio.CancelledError:
            pass
    
    async def flush_all(self):
        """Flush all metric buffers"""
        async with self.lock:
            metric_names = list(self.buffers.keys())
        
        for metric_name in metric_names:
            await self._flush_metric(metric_name)
    
    async def _flush_metric(self, metric_name: str):
        """Flush a single metric buffer to TimescaleDB"""
        async with self.lock:
            points = self.buffers.get(metric_name, [])
            if not points:
                return
            
            # Take batch from buffer
            batch = points[:self.batch_size]
            self.buffers[metric_name] = points[self.batch_size:]
        
        # Flush to DB (outside lock to avoid blocking other metrics)
        try:
            await asyncio.to_thread(self._write_batch, metric_name, batch)
            self.total_flushed += len(batch)
            self.flush_count += 1
            logger.debug(f"Flushed {len(batch)} points for {metric_name}")
        except Exception as e:
            logger.error(f"Failed to flush {metric_name}: {e}")
            # Re-add failed batch to buffer (retry)
            async with self.lock:
                self.buffers[metric_name] = batch + self.buffers[metric_name]
    
    def _write_batch(self, metric_name: str, points: List[MetricPoint]):
        """Write batch to TimescaleDB using execute_values (blocking call)"""
        # Use unified metrics table
        rows = [
            (
                p.timestamp,
                p.model_id or p.dataset_id,  # Use whichever is set
                p.metric_name,
                p.value,
                psycopg2.extras.Json(p.tags),
                psycopg2.extras.Json({})  # empty metadata
            )
            for p in points
        ]
        
        insert_sql = """
            INSERT INTO metrics (time, model_id, metric_name, metric_value, tags, metadata)
            VALUES %s
            ON CONFLICT DO NOTHING
        """
        
        # Batch insert with execute_values (10-100x faster than executemany)
        conn = psycopg2.connect(self.timescale_dsn)
        try:
            with conn.cursor() as cur:
                execute_values(
                    cur,
                    insert_sql,
                    rows,
                    template=None,
                    page_size=1000
                )
            conn.commit()
        finally:
            conn.close()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get current buffer stats"""
        return {
            "running": self.running,
            "total_received": self.total_received,
            "total_flushed": self.total_flushed,
            "flush_count": self.flush_count,
            "dropped_count": self.dropped_count,
            "buffer_sizes": {
                name: len(buffer) 
                for name, buffer in self.buffers.items()
            },
            "total_buffered": sum(len(b) for b in self.buffers.values())
        }


# Global singleton instance
_batcher: Optional[MetricsBatcher] = None


def get_batcher() -> MetricsBatcher:
    """Get or create the global batcher instance"""
    global _batcher
    if _batcher is None:
        import os
        user = os.getenv('TIMESCALEDB_USER', 'postgres')
        password = os.getenv('TIMESCALEDB_PASSWORD', 'timescale_secure_password')
        host = os.getenv('TIMESCALEDB_HOST', 'timescaledb')
        port = os.getenv('TIMESCALEDB_PORT', '5432')
        db = os.getenv('TIMESCALEDB_DB', 'timescale')
        
        dsn = f"postgresql://{user}:{password}@{host}:{port}/{db}"
        logger.info(f"MetricsBatcher DSN: postgresql://{user}:***@{host}:{port}/{db}")
        
        _batcher = MetricsBatcher(
            timescale_dsn=dsn,
            batch_size=int(os.getenv('METRICS_BATCH_SIZE', '1000')),
            flush_interval=float(os.getenv('METRICS_FLUSH_INTERVAL', '5.0')),
            max_buffer_size=int(os.getenv('METRICS_MAX_BUFFER_SIZE', '10000'))
        )
    return _batcher


@asynccontextmanager
async def batcher_lifespan():
    """Context manager for batcher lifecycle"""
    batcher = get_batcher()
    await batcher.start()
    try:
        yield batcher
    finally:
        await batcher.stop()
