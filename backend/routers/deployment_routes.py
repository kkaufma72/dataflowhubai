"""
Model deployment and inference routes.
"""

import time
from typing import Any, Optional
from uuid import UUID

from typing import List

from fastapi import APIRouter, Depends, status
from minio import Minio
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.auth import get_current_user, require_subscription
from dependencies.database import get_minio_client, get_redis_client, get_timescaledb_session
from schemas.auth import User
from schemas.ml_model import PredictionRequest, PredictionResponse
from services.cache_service import CacheService
from services.ml_service import MLService
from services.timescale_service import TimescaleService
from utils.config import settings


router = APIRouter()


def _safe_uuid(value: Any) -> Optional[UUID]:
    try:
        if value is None:
            return None
        return UUID(str(value))
    except Exception:
        return None


def _extract_confidence(resp: PredictionResponse) -> Optional[float]:
    # If probabilities are present, use the max probability of the first row.
    probs = getattr(resp, "probabilities", None)
    if not probs:
        return None
    try:
        first = probs[0]
        if not first:
            return None
        return float(max(first))
    except Exception:
        return None


@router.post("/predict", response_model=PredictionResponse)
async def make_prediction(
    request: PredictionRequest,
    minio_client: Minio = Depends(get_minio_client),
    redis_client: Redis = Depends(get_redis_client),
    tsdb: AsyncSession = Depends(get_timescaledb_session),
    current_user: User = Depends(get_current_user),
) -> PredictionResponse:
    """
    Make predictions using a deployed model.
    
    Args:
        request: Prediction request with model_id and data
        minio_client: MinIO client
        redis_client: Redis client
        current_user: Current authenticated user
        
    Returns:
        Predictions and probabilities
    """
    ml_service = MLService(minio_client, settings.MINIO_BUCKET)
    
    # In production, retrieve model storage_path from database
    # and verify user has access
    storage_path = f"models/{current_user.id}/{request.model_id}.pkl"
    
    t0 = time.perf_counter()
    predictions = await ml_service.predict(storage_path=storage_path, data=request.data)
    response_time_ms = float((time.perf_counter() - t0) * 1000.0)

    # Best-effort logging for drift monitoring; never break predictions.
    try:
        service = TimescaleService(tsdb)
        await service.log_prediction(
            model_id=_safe_uuid(request.model_id) or UUID(predictions.model_id),
            user_id=_safe_uuid(current_user.id),
            input_data={"rows": request.data},
            prediction={
                "predictions": predictions.predictions,
                "probabilities": predictions.probabilities,
            },
            confidence_score=_extract_confidence(predictions),
            response_time_ms=response_time_ms,
        )
    except Exception:
        pass

    # Keep contract: PredictionResponse includes prediction_time_ms
    try:
        predictions.prediction_time_ms = response_time_ms
    except Exception:
        pass

    return predictions


@router.post("/models/{model_id}/deploy", response_model=dict)
async def deploy_model(
    model_id: str,
    current_user: User = Depends(require_subscription("pro")),
) -> dict:
    """
    Deploy a model for serving predictions.
    
    Requires Pro subscription or higher.
    
    Args:
        model_id: Model identifier
        current_user: Current authenticated user
        
    Returns:
        Deployment information
    """
    # In production, update model deployment status in database
    # and configure model serving endpoint
    
    return {
        "model_id": model_id,
        "status": "deployed",
        "endpoint": f"/api/deploy/predict",
        "message": "Model deployed successfully",
    }


@router.post("/models/{model_id}/undeploy", response_model=dict)
async def undeploy_model(
    model_id: str,
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Undeploy a model from serving.
    
    Args:
        model_id: Model identifier
        current_user: Current authenticated user
        
    Returns:
        Undeployment confirmation
    """
    # In production, update model deployment status in database
    
    return {
        "model_id": model_id,
        "status": "undeployed",
        "message": "Model undeployed successfully",
    }


@router.get("/models/{model_id}/endpoint-info", response_model=dict)
async def get_endpoint_info(
    model_id: str,
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Get deployment endpoint information for a model.
    
    Args:
        model_id: Model identifier
        current_user: Current authenticated user
        
    Returns:
        Endpoint configuration and usage information
    """
    return {
        "model_id": model_id,
        "endpoint": f"/api/deploy/predict",
        "method": "POST",
        "is_deployed": True,
        "usage_example": {
            "url": f"{settings.API_HOST}:{settings.API_PORT}/api/deploy/predict",
            "method": "POST",
            "headers": {
                "Authorization": "Bearer <your-token>",
                "Content-Type": "application/json",
            },
            "body": {
                "model_id": model_id,
                "data": [{"feature_1": 1.0, "feature_2": 2.0}],
            },
        },
    }

