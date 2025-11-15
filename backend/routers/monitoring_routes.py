"""
Monitoring and drift detection routes.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from minio import Minio
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.auth import get_current_user
from dependencies.database import get_minio_client, get_timescaledb_session
from schemas.auth import User
from schemas.monitoring import (
    Alert,
    DriftDetectionRequest,
    DriftDetectionResult,
    ModelMetricsSnapshot,
)
from services.timescale_service import TimescaleService


router = APIRouter()


@router.post("/drift-detection", response_model=DriftDetectionResult)
async def detect_drift(
    request: DriftDetectionRequest,
    minio_client: Minio = Depends(get_minio_client),
    current_user: User = Depends(get_current_user),
) -> DriftDetectionResult:
    """
    Detect data drift between reference and comparison datasets.
    
    Args:
        request: Drift detection parameters
        minio_client: MinIO client
        current_user: Current authenticated user
        
    Returns:
        Drift detection results and recommendations
    """
    # In production, implement comprehensive drift detection
    # using statistical tests (KS test, PSI, etc.)
    
    return DriftDetectionResult(
        model_id=request.model_id,
        timestamp=datetime.utcnow(),
        has_drift=False,
        drift_score=0.02,
        drifted_features=[],
        feature_drift_scores={
            "feature_1": 0.01,
            "feature_2": 0.03,
            "feature_3": 0.02,
        },
        recommendations=["No significant drift detected. Model is performing well."],
    )


@router.get("/alerts", response_model=List[Alert])


@router.post("/metrics/{model_id}", response_model=dict)
async def record_model_metrics(
    model_id: UUID,
    metrics: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_timescaledb_session),
) -> dict:
    """
    Record model performance metrics snapshot.
    
    Args:
        model_id: Model identifier
        metrics: Dictionary of metric_name -> metric_value
        current_user: Current authenticated user
        db: TimescaleDB session
        
    Returns:
        Confirmation with recorded metrics
    """
    try:
        service = TimescaleService(db)
        recorded = []
        
        for metric_name, metric_value in metrics.items():
            await service.record_model_metric(
                model_id=model_id,
                metric_name=metric_name,
                metric_value=float(metric_value),
            )
            recorded.append({"metric_name": metric_name, "value": metric_value})
        
        return {
            "model_id": str(model_id),
            "recorded_at": datetime.utcnow().isoformat(),
            "metrics": recorded,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record metrics: {str(e)}")


@router.get("/metrics/{model_id}", response_model=List[dict])
async def get_model_metrics(
    model_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_timescaledb_session),
    metric_name: Optional[str] = Query(None, description="Filter by specific metric"),
    start_time: Optional[datetime] = Query(None, description="Start time for metrics"),
    end_time: Optional[datetime] = Query(None, description="End time for metrics"),
    limit: int = Query(100, ge=1, le=10000, description="Maximum number of metrics to return"),
) -> List[dict]:
    """
    Get historical metrics for a model.
    
    Args:
        model_id: Model identifier
        current_user: Current authenticated user
        db: TimescaleDB session
        metric_name: Optional filter by metric name
        start_time: Optional start time filter
        end_time: Optional end time filter
        limit: Maximum number of metrics to return
        
    Returns:
        List of metrics with timestamps
    """
    try:
        service = TimescaleService(db)
        
        # Default to last 24 hours if no time range specified
        if not start_time:
            start_time = datetime.utcnow() - timedelta(hours=24)
        if not end_time:
            end_time = datetime.utcnow()
        
        metrics = await service.get_model_metrics(
            model_id=model_id,
            metric_name=metric_name,
            start_time=start_time,
            end_time=end_time,
            limit=limit,
        )
        
        return [
            {
                "time": m.time.isoformat(),
                "metric_name": m.metric_name,
                "metric_value": float(m.metric_value),
                "metadata": m.metadata,
            }
            for m in metrics
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve metrics: {str(e)}")


@router.get("/metrics/{model_id}/aggregated", response_model=List[dict])
async def get_model_metrics_aggregated(
    model_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_timescaledb_session),
    metric_name: Optional[str] = Query(None, description="Filter by specific metric"),
    start_time: Optional[datetime] = Query(None, description="Start time for metrics"),
    end_time: Optional[datetime] = Query(None, description="End time for metrics"),
    interval: str = Query("1 hour", description="Time bucket interval (e.g., '1 hour', '1 day')"),
) -> List[dict]:
    """
    Get aggregated metrics for a model (avg, min, max per time bucket).
    
    Args:
        model_id: Model identifier
        current_user: Current authenticated user
        db: TimescaleDB session
        metric_name: Optional filter by metric name
        start_time: Optional start time filter
        end_time: Optional end time filter
        interval: Time bucket interval
        
    Returns:
        List of aggregated metrics by time bucket
    """
    try:
        service = TimescaleService(db)
        
        # Default to last 7 days if no time range specified
        if not start_time:
            start_time = datetime.utcnow() - timedelta(days=7)
        if not end_time:
            end_time = datetime.utcnow()
        
        metrics = await service.get_model_metrics_aggregated(
            model_id=model_id,
            metric_name=metric_name,
            start_time=start_time,
            end_time=end_time,
            interval=interval,
        )
        
        return [
            {
                "time_bucket": m.time_bucket.isoformat(),
                "metric_name": m.metric_name,
                "avg_value": float(m.avg_value),
                "min_value": float(m.min_value),
                "max_value": float(m.max_value),
                "count": m.count,
            }
            for m in metrics
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve aggregated metrics: {str(e)}")


@router.post("/predictions/{model_id}/log", response_model=dict)
async def log_prediction(
    model_id: UUID,
    prediction_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_timescaledb_session),
) -> dict:
    """
    Log a prediction made by a model.
    
    Args:
        model_id: Model identifier
        prediction_data: Dict with keys: input_data, prediction, confidence_score, response_time_ms
        current_user: Current authenticated user
        db: TimescaleDB session
        
    Returns:
        Logged prediction details
    """
    try:
        service = TimescaleService(db)
        
        prediction = await service.log_prediction(
            model_id=model_id,
            user_id=current_user.id,
            input_data=prediction_data.get("input_data"),
            prediction=prediction_data.get("prediction"),
            confidence_score=prediction_data.get("confidence_score"),
            response_time_ms=prediction_data.get("response_time_ms"),
            error=prediction_data.get("error"),
        )
        
        return {
            "prediction_id": str(prediction.prediction_id),
            "model_id": str(prediction.model_id),
            "time": prediction.time.isoformat(),
            "response_time_ms": prediction.response_time_ms,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log prediction: {str(e)}")


@router.get("/predictions/{model_id}/stats", response_model=dict)
async def get_prediction_stats(
    model_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_timescaledb_session),
    start_time: Optional[datetime] = Query(None, description="Start time"),
    end_time: Optional[datetime] = Query(None, description="End time"),
) -> dict:
    """
    Get prediction statistics for a model.
    
    Args:
        model_id: Model identifier
        current_user: Current authenticated user
        db: TimescaleDB session
        start_time: Optional start time filter
        end_time: Optional end time filter
        
    Returns:
        Prediction statistics (count, avg response time, error rate)
    """
    try:
        service = TimescaleService(db)
        
        # Default to last 24 hours
        if not start_time:
            start_time = datetime.utcnow() - timedelta(hours=24)
        if not end_time:
            end_time = datetime.utcnow()
        
        stats = await service.get_prediction_stats(
            model_id=model_id,
            start_time=start_time,
            end_time=end_time,
        )
        
        return {
            "model_id": str(model_id),
            "time_range": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
            },
            "total_predictions": stats.get("total_predictions", 0),
            "avg_response_time_ms": stats.get("avg_response_time", 0.0),
            "min_response_time_ms": stats.get("min_response_time", 0.0),
            "max_response_time_ms": stats.get("max_response_time", 0.0),
            "error_count": stats.get("error_count", 0),
            "error_rate": stats.get("error_rate", 0.0),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve prediction stats: {str(e)}")


@router.post("/training/{model_id}/metrics", response_model=dict)
async def record_training_metric(
    model_id: UUID,
    epoch: int,
    metrics: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_timescaledb_session),
) -> dict:
    """
    Record training metrics for a specific epoch.
    
    Args:
        model_id: Model identifier
        epoch: Training epoch number
        metrics: Dictionary of metric_name -> metric_value
        current_user: Current authenticated user
        db: TimescaleDB session
        
    Returns:
        Confirmation with recorded metrics
    """
    try:
        service = TimescaleService(db)
        recorded = []
        
        for metric_name, metric_value in metrics.items():
            await service.record_training_metric(
                model_id=model_id,
                epoch=epoch,
                metric_name=metric_name,
                metric_value=float(metric_value),
            )
            recorded.append({"metric_name": metric_name, "value": metric_value})
        
        return {
            "model_id": str(model_id),
            "epoch": epoch,
            "recorded_at": datetime.utcnow().isoformat(),
            "metrics": recorded,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record training metrics: {str(e)}")


@router.get("/training/{model_id}/history", response_model=List[dict])
async def get_training_history(
    model_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_timescaledb_session),
    metric_name: Optional[str] = Query(None, description="Filter by metric name"),
) -> List[dict]:
    """
    Get training history for a model.
    
    Args:
        model_id: Model identifier
        current_user: Current authenticated user
        db: TimescaleDB session
        metric_name: Optional filter by metric name
        
    Returns:
        Training history with metrics per epoch
    """
    try:
        service = TimescaleService(db)
        
        history = await service.get_training_history(
            model_id=model_id,
            metric_name=metric_name,
        )
        
        return [
            {
                "time": h.time.isoformat(),
                "epoch": int(h.epoch),
                "metric_name": h.metric_name,
                "metric_value": float(h.metric_value),
                "metadata": h.metadata,
            }
            for h in history
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve training history: {str(e)}")


@router.post("/drift-detection", response_model=DriftDetectionResult)
async def detect_drift(
    request: DriftDetectionRequest,
    minio_client: Minio = Depends(get_minio_client),
    current_user: User = Depends(get_current_user),
) -> DriftDetectionResult:
    """
    Record model performance metrics snapshot.
    
    Args:
        model_id: Model identifier
        metrics: Metrics snapshot to record
        current_user: Current authenticated user
        
    Returns:
        Recorded metrics snapshot
    """
    # In production, store metrics in TimescaleDB for time-series analysis
    return metrics


@router.get("/metrics/{model_id}", response_model=List[ModelMetricsSnapshot])
async def get_model_metrics(
    model_id: str,
    current_user: User = Depends(get_current_user),
    limit: int = 100,
) -> List[ModelMetricsSnapshot]:
    """
    Get historical metrics for a model.
    
    Args:
        model_id: Model identifier
        current_user: Current authenticated user
        limit: Maximum number of metrics to return
        
    Returns:
        List of metrics snapshots
    """
    # In production, retrieve from TimescaleDB
    return []


@router.get("/alerts", response_model=List[Alert])
async def get_alerts(
    current_user: User = Depends(get_current_user),
    is_acknowledged: bool | None = None,
    skip: int = 0,
    limit: int = 50,
) -> List[Alert]:
    """
    Get monitoring alerts for the user.
    
    Args:
        current_user: Current authenticated user
        is_acknowledged: Filter by acknowledgment status
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List of alerts
    """
    # In production, retrieve from database
    return []


@router.post("/alerts/{alert_id}/acknowledge", response_model=Alert)
async def acknowledge_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
) -> Alert:
    """
    Acknowledge an alert.
    
    Args:
        alert_id: Alert identifier
        current_user: Current authenticated user
        
    Returns:
        Updated alert
    """
    # In production, update in database
    from schemas.monitoring import AlertSeverity, MetricType
    
    return Alert(
        id=alert_id,
        model_id="model_123",
        severity=AlertSeverity.WARNING,
        title="Model accuracy below threshold",
        message="Model accuracy has dropped below 80%",
        metric_type=MetricType.ACCURACY,
        metric_value=0.75,
        threshold_value=0.80,
        is_acknowledged=True,
        created_at=datetime.utcnow(),
        acknowledged_at=datetime.utcnow(),
    )

