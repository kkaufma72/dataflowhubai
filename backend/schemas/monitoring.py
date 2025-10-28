"""
Monitoring and observability schemas.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class MetricType(str, Enum):
    """Types of metrics to track."""

    PERFORMANCE = "performance"
    ACCURACY = "accuracy"
    DRIFT = "drift"
    USAGE = "usage"
    SYSTEM = "system"


class AlertSeverity(str, Enum):
    """Alert severity levels."""

    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class ModelMetricsSnapshot(BaseModel):
    """Snapshot of model metrics at a point in time."""

    model_id: str
    timestamp: datetime
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    latency_ms: float
    prediction_count: int
    error_count: int
    custom_metrics: Dict[str, float] = Field(default_factory=dict)


class DriftDetectionRequest(BaseModel):
    """Request for drift detection analysis."""

    model_id: str
    reference_dataset_id: str
    comparison_dataset_id: str
    features: Optional[List[str]] = None
    threshold: float = Field(default=0.05, ge=0.0, le=1.0)


class DriftDetectionResult(BaseModel):
    """Results of drift detection analysis."""

    model_id: str
    timestamp: datetime
    has_drift: bool
    drift_score: float
    drifted_features: List[str] = Field(default_factory=list)
    feature_drift_scores: Dict[str, float] = Field(default_factory=dict)
    recommendations: List[str] = Field(default_factory=list)


class Alert(BaseModel):
    """Monitoring alert."""

    id: str
    model_id: Optional[str] = None
    pipeline_id: Optional[str] = None
    severity: AlertSeverity
    title: str
    message: str
    metric_type: MetricType
    metric_value: Optional[float] = None
    threshold_value: Optional[float] = None
    is_acknowledged: bool = False
    created_at: datetime
    acknowledged_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class HealthCheckResponse(BaseModel):
    """System health check response."""

    status: str
    timestamp: datetime
    version: str
    services: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    uptime_seconds: float


class SystemMetrics(BaseModel):
    """System-level metrics."""

    timestamp: datetime
    cpu_usage_percent: float
    memory_usage_percent: float
    disk_usage_percent: float
    active_connections: int
    request_rate: float
    error_rate: float
    average_response_time_ms: float


