"""
Metrics Helper - Simple client for sending metrics to the batching API
Use this instead of direct TimescaleDB writes for better performance
"""
import httpx
from typing import Optional, Dict, List
from datetime import datetime
import logging
import os

logger = logging.getLogger(__name__)


class MetricsClient:
    """
    Client for sending metrics to the batching API.
    
    Usage:
    ```python
    from backend.lib.metrics_helper import metrics_client
    
    # Single metric
    await metrics_client.record("model_accuracy", 0.95, model_id="model_123")
    
    # Batch metrics
    await metrics_client.record_batch([
        {"metric_name": "model_accuracy", "value": 0.95, "model_id": "model_123"},
        {"metric_name": "model_latency", "value": 45.2, "model_id": "model_123"},
    ])
    ```
    """
    
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or os.getenv("METRICS_API_URL", "http://localhost:8000")
        self.batch_endpoint = f"{self.base_url}/api/metrics/batch"
        self.single_endpoint = f"{self.base_url}/api/metrics/single"
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=5.0)
        return self._client
    
    async def close(self):
        """Close HTTP client"""
        if self._client:
            await self._client.aclose()
            self._client = None
    
    async def record(
        self,
        metric_name: str,
        value: float,
        model_id: Optional[str] = None,
        dataset_id: Optional[str] = None,
        tags: Optional[Dict[str, str]] = None,
        timestamp: Optional[datetime] = None
    ):
        """
        Record a single metric point.
        
        Non-blocking: metrics are buffered and flushed periodically.
        """
        try:
            client = await self._get_client()
            response = await client.post(
                self.single_endpoint,
                json={
                    "metric_name": metric_name,
                    "value": value,
                    "model_id": model_id,
                    "dataset_id": dataset_id,
                    "tags": tags or {},
                    "timestamp": timestamp.isoformat() if timestamp else None
                }
            )
            response.raise_for_status()
        except Exception as e:
            logger.error(f"Failed to record metric {metric_name}: {e}")
            # Don't raise - metrics are best-effort
    
    async def record_batch(self, metrics: List[Dict]):
        """
        Record a batch of metrics.
        
        Each metric dict should contain:
        - metric_name: str
        - value: float
        - model_id: Optional[str]
        - dataset_id: Optional[str]
        - tags: Optional[Dict[str, str]]
        - timestamp: Optional[datetime]
        """
        try:
            client = await self._get_client()
            response = await client.post(
                self.batch_endpoint,
                json={"metrics": metrics}
            )
            response.raise_for_status()
        except Exception as e:
            logger.error(f"Failed to record batch metrics: {e}")
            # Don't raise - metrics are best-effort


# Global singleton
metrics_client = MetricsClient()


# Convenience functions for common patterns
async def record_model_metric(
    model_id: str,
    metric_name: str,
    value: float,
    tags: Optional[Dict[str, str]] = None
):
    """Record a model performance metric"""
    await metrics_client.record(
        metric_name=f"model_{metric_name}",
        value=value,
        model_id=model_id,
        tags=tags
    )


async def record_dataset_metric(
    dataset_id: str,
    metric_name: str,
    value: float,
    tags: Optional[Dict[str, str]] = None
):
    """Record a dataset metric"""
    await metrics_client.record(
        metric_name=f"dataset_{metric_name}",
        value=value,
        dataset_id=dataset_id,
        tags=tags
    )


async def record_system_metric(
    metric_name: str,
    value: float,
    tags: Optional[Dict[str, str]] = None
):
    """Record a system metric"""
    await metrics_client.record(
        metric_name=metric_name,
        value=value,
        tags=tags
    )
