"""
Metrics Ingestion API Routes - Batch endpoint for high-throughput writes
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import logging

from lib.metrics_batcher import get_batcher
from dependencies.database import timescaledb_engine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


class MetricPoint(BaseModel):
    """Single metric data point"""
    metric_name: str = Field(..., description="Name of the metric (e.g., model_accuracy, dataset_size)")
    value: float = Field(..., description="Metric value")
    timestamp: Optional[datetime] = Field(None, description="Timestamp (defaults to now)")
    model_id: Optional[str] = Field(None, description="Associated model ID")
    dataset_id: Optional[str] = Field(None, description="Associated dataset ID")
    tags: Dict[str, str] = Field(default_factory=dict, description="Additional tags/labels")


class BatchMetricsRequest(BaseModel):
    """Batch metrics ingestion request"""
    metrics: List[MetricPoint] = Field(..., description="List of metric points")


class BatchMetricsResponse(BaseModel):
    """Batch metrics response"""
    accepted: int
    message: str


@router.post("/batch", response_model=BatchMetricsResponse)
async def ingest_metrics_batch(request: BatchMetricsRequest):
    """
    Ingest a batch of metrics.
    
    Metrics are buffered in-memory and flushed to TimescaleDB periodically
    or when buffer reaches batch size. This reduces write IOPS by ~100x
    compared to individual inserts.
    
    **Performance:**
    - Non-blocking: returns immediately after buffering
    - Batches up to 1000 points per flush
    - Auto-flushes every 5 seconds
    
    **Usage:**
    ```python
    # Python client example
    import httpx
    
    metrics = [
        {"metric_name": "model_accuracy", "value": 0.95, "model_id": "model_123"},
        {"metric_name": "model_latency", "value": 45.2, "model_id": "model_123"},
    ]
    
    response = httpx.post("http://localhost:8000/api/metrics/batch", json={"metrics": metrics})
    ```
    """
    if not timescaledb_engine:
        raise HTTPException(
            status_code=503, 
            detail="Metrics ingestion unavailable (TimescaleDB not configured)"
        )
    
    batcher = get_batcher()
    
    if not batcher.running:
        raise HTTPException(status_code=503, detail="Metrics batcher not running")
    
    # Add all metrics to buffer (non-blocking)
    for metric in request.metrics:
        await batcher.add_metric(
            metric_name=metric.metric_name,
            value=metric.value,
            timestamp=metric.timestamp,
            model_id=metric.model_id,
            dataset_id=metric.dataset_id,
            tags=metric.tags
        )
    
    return BatchMetricsResponse(
        accepted=len(request.metrics),
        message=f"Accepted {len(request.metrics)} metrics for buffering"
    )


@router.get("/stats")
async def get_metrics_stats():
    """
    Get metrics batcher statistics.
    
    Returns:
    - Buffer sizes per metric type
    - Total received/flushed/dropped counts
    - Flush count
    """
    if not timescaledb_engine:
        raise HTTPException(
            status_code=503, 
            detail="Metrics unavailable (TimescaleDB not configured)"
        )
    batcher = get_batcher()
    return batcher.get_stats()


@router.post("/flush")
async def force_flush():
    """
    Force immediate flush of all metric buffers.
    
    Useful for testing or ensuring metrics are written before shutdown.
    """
    if not timescaledb_engine:
        raise HTTPException(
            status_code=503, 
            detail="Metrics unavailable (TimescaleDB not configured)"
        )
    batcher = get_batcher()
    await batcher.flush_all()
    return {"message": "Flushed all metric buffers", "stats": batcher.get_stats()}


# Legacy single-metric endpoint (for backward compatibility)
@router.post("/single")
async def ingest_single_metric(metric: MetricPoint):
    """
    Ingest a single metric point.
    
    **Note:** Prefer `/batch` endpoint for better performance.
    This endpoint exists for backward compatibility.
    """
    if not timescaledb_engine:
        raise HTTPException(
            status_code=503, 
            detail="Metrics ingestion unavailable (TimescaleDB not configured)"
        )
    
    batcher = get_batcher()
    
    if not batcher.running:
        raise HTTPException(status_code=503, detail="Metrics batcher not running")
    
    await batcher.add_metric(
        metric_name=metric.metric_name,
        value=metric.value,
        timestamp=metric.timestamp,
        model_id=metric.model_id,
        dataset_id=metric.dataset_id,
        tags=metric.tags
    )
    
    return {"message": "Metric accepted for buffering"}
