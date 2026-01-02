"""
Machine learning training and feature engineering routes.
"""

import random
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, status
from minio import Minio
from redis.asyncio import Redis

from dependencies.auth import get_current_user, require_subscription
from dependencies.database import get_minio_client, get_redis_client
from schemas.auth import User
from schemas.ml_model import (
    CrossValidationRequest,
    FeatureEngineeringRequest,
    Model,
    ModelCreate,
    ModelTrainingRequest,
    ModelUpdate,
    TaskType,
)
from services.background_tasks import BackgroundTaskService
from services.data_service import DataService
from services.ml_service import MLService
from utils.config import settings


router = APIRouter()


@router.post("/train", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def train_model(
    request: ModelTrainingRequest,
    background_tasks: BackgroundTasks,
    minio_client: Minio = Depends(get_minio_client),
    redis_client: Redis = Depends(get_redis_client),
    current_user: User = Depends(require_subscription("pro")),
) -> dict:
    """
    Train a machine learning model (async).
    
    Requires Pro subscription or higher.
    
    Args:
        request: Model training parameters
        background_tasks: FastAPI background tasks
        minio_client: MinIO client
        redis_client: Redis client
        current_user: Current authenticated user
        
    Returns:
        Task information for tracking training progress
    """
    # Enqueue training task
    task_service = BackgroundTaskService(redis_client)
    
    task_id = await task_service.enqueue_task(
        task_type="model_training",
        payload={
            "user_id": current_user.id,
            "dataset_id": request.dataset_id,
            "target_column": request.target_column,
            "algorithm": request.algorithm.value,
            "task_type": request.task_type.value,
            "test_size": request.test_size,
            "features": request.features,
            "hyperparameters": request.custom_params,
        },
        priority=1,
    )

    return {
        "task_id": task_id,
        "status": "queued",
        "message": "Model training started. Use task_id to check progress.",
    }


@router.get("/training/{task_id}")
async def get_training_status(
    task_id: str,
    redis_client: Redis = Depends(get_redis_client),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Get status of a training task.
    
    Args:
        task_id: Training task identifier
        redis_client: Redis client
        current_user: Current authenticated user
        
    Returns:
        Task status and results if completed
    """
    task_service = BackgroundTaskService(redis_client)
    task_result = await task_service.get_task_status(task_id)

    if not task_result:
        return {
            "task_id": task_id,
            "status": "not_found",
            "message": "Training task not found",
        }

    return {
        "task_id": task_id,
        "status": task_result.status.value,
        "result": task_result.result,
        "error": task_result.error,
        "created_at": task_result.created_at.isoformat(),
        "completed_at": task_result.completed_at.isoformat()
        if task_result.completed_at
        else None,
    }


@router.post("/feature-engineering", response_model=dict)
async def engineer_features(
    request: FeatureEngineeringRequest,
    minio_client: Minio = Depends(get_minio_client),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Perform automated feature engineering on a dataset.
    
    Args:
        request: Feature engineering parameters
        minio_client: MinIO client
        current_user: Current authenticated user
        
    Returns:
        Engineered features information
    """
    # In production, implement comprehensive feature engineering
    # For now, returning mock response
    
    return {
        "dataset_id": request.dataset_id,
        "original_features": 10,
        "engineered_features": 25,
        "new_features": [
            "feature_1_squared",
            "feature_2_log",
            "feature_1_feature_2_interaction",
        ],
        "message": "Feature engineering completed successfully",
    }


@router.post("/cross-validation", response_model=dict)
async def run_cross_validation(
    request: CrossValidationRequest,
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Return simulated cross-validation metrics to keep the UI functional.
    
    This endpoint will be replaced with a real service once backend
    model evaluation is wired up. Results are deterministic per dataset
    and target column to provide consistent UX.
    """

    def _clamp(value: float, minimum: float = 0.01, maximum: float = 0.99) -> float:
        return max(minimum, min(maximum, value))

    rng = random.Random(f"{request.dataset_id}:{request.target_column}:{request.folds}")
    base_score = 0.78 if request.task_type == TaskType.CLASSIFICATION else 0.72

    folds: List[dict] = []
    for fold_idx in range(1, request.folds + 1):
        variation = rng.uniform(-0.06, 0.06)
        accuracy = _clamp(base_score + variation)
        precision = _clamp(accuracy - rng.uniform(-0.02, 0.02))
        recall = _clamp(accuracy + rng.uniform(-0.02, 0.02))
        f1_score = _clamp((2 * precision * recall) / (precision + recall + 1e-6))

        folds.append(
            {
                "fold": fold_idx,
                "accuracy": round(accuracy, 4),
                "precision": round(precision, 4),
                "recall": round(recall, 4),
                "f1Score": round(f1_score, 4),
            }
        )

    def _average(key: str) -> float:
        return round(sum(f[key] for f in folds) / len(folds), 4) if folds else 0.0

    return {
        "datasetId": request.dataset_id,
        "targetColumn": request.target_column,
        "taskType": request.task_type.value,
        "algorithms": [algo.value for algo in request.algorithms] or ["auto"],
        "folds": folds,
        "results": folds,
        "summary": {
            "averageAccuracy": _average("accuracy"),
            "averagePrecision": _average("precision"),
            "averageRecall": _average("recall"),
            "averageF1Score": _average("f1Score"),
            "note": "Simulated cross-validation until full backend integration is available.",
        },
    }


@router.get("/models", response_model=List[Model])
async def list_models(
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> List[Model]:
    """
    List user's trained models with pagination.
    
    Args:
        current_user: Current authenticated user
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List of models
    """
    # In production, retrieve from database
    return []


@router.get("/models/{model_id}", response_model=Model)
async def get_model(
    model_id: str,
    current_user: User = Depends(get_current_user),
) -> Model:
    """
    Get model by ID.
    
    Args:
        model_id: Model identifier
        current_user: Current authenticated user
        
    Returns:
        Model information
    """
    # In production, retrieve from database
    from datetime import datetime
    from schemas.ml_model import AlgorithmType, ModelStatus, TaskType
    
    return Model(
        id=model_id,
        name="Sample Model",
        user_id=current_user.id,
        dataset_id="dataset_123",
        algorithm=AlgorithmType.RANDOM_FOREST,
        task_type=TaskType.CLASSIFICATION,
        status=ModelStatus.COMPLETED,
        target_column="target",
        features=["feature_1", "feature_2"],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


@router.patch("/models/{model_id}", response_model=Model)
async def update_model(
    model_id: str,
    update_data: ModelUpdate,
    current_user: User = Depends(get_current_user),
) -> Model:
    """
    Update model information.
    
    Args:
        model_id: Model identifier
        update_data: Model update data
        current_user: Current authenticated user
        
    Returns:
        Updated model information
    """
    # In production, update in database
    return await get_model(model_id, current_user)


@router.delete("/models/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_model(
    model_id: str,
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete a model.
    
    Args:
        model_id: Model identifier
        current_user: Current authenticated user
    """
    # In production, delete from database and storage
    pass
