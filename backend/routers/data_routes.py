"""Data management API routes."""

from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from minio import Minio
from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.auth import get_current_user
from dependencies.database import get_minio_client, get_postgres_session, get_redis_client
from schemas.auth import User
from schemas.dataset import (
    Dataset,
    DatasetCreate,
    DatasetProfileRequest,
    DatasetProfileResponse,
    DataTransformationRequest,
    UploadResponse,
)
from services.cache_service import CacheService
from services.data_service import DataService
from utils.config import settings
from utils.errors import NotFoundError, ValidationError


router = APIRouter()


@router.get("/datasets/{dataset_id}/models", response_model=dict)
async def get_models_for_dataset(
    dataset_id: str,
    db: AsyncSession = Depends(get_postgres_session),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
) -> dict:
    """Return models linked to a dataset (Supabase/Postgres source of truth).

    This uses the Supabase schema in `public.datasets` and `public.models`:
    - `datasets.id` is the dataset UUID
    - `models.dataset_id` is a FK pointing at `datasets.id`
    - Both tables are user-scoped via `user_id`
    """

    try:
        dataset_uuid = UUID(dataset_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid dataset_id (expected UUID)")

    user_id = str(current_user.id)

    dataset_row = (
        await db.execute(
            text(
                """
                SELECT id, name, description, project_id, user_id, created_at, updated_at
                FROM datasets
                WHERE id = :dataset_id
                  AND user_id = CAST(:user_id AS uuid)
                LIMIT 1
                """
            ),
            {"dataset_id": dataset_uuid, "user_id": user_id},
        )
    ).mappings().first()

    if not dataset_row:
        return {"dataset_id": dataset_id, "dataset_found": False, "models": [], "total": 0}

    model_rows = (
        await db.execute(
            text(
                """
                SELECT id, name, description, model_type, status, dataset_id, project_id,
                       user_id, hyperparameters, training_config, metadata, created_at, updated_at
                FROM models
                WHERE dataset_id = :dataset_id
                  AND user_id = CAST(:user_id AS uuid)
                ORDER BY created_at DESC
                OFFSET :skip
                LIMIT :limit
                """
            ),
            {
                "dataset_id": dataset_uuid,
                "user_id": user_id,
                "skip": max(0, int(skip)),
                "limit": max(0, min(200, int(limit))),
            },
        )
    ).mappings().all()

    def _row_to_json(row: Dict[str, Any]) -> Dict[str, Any]:
        out: Dict[str, Any] = dict(row)
        for key in ["id", "dataset_id", "project_id", "user_id"]:
            if key in out and out[key] is not None:
                out[key] = str(out[key])
        for key in ["created_at", "updated_at"]:
            if key in out and out[key] is not None:
                out[key] = out[key].isoformat()
        return out

    dataset = _row_to_json(dict(dataset_row))
    models = [_row_to_json(dict(r)) for r in model_rows]

    return {
        "dataset_id": dataset_id,
        "dataset_found": True,
        "dataset": dataset,
        "models": models,
        "total": len(models),
    }


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(None),
    minio_client: Minio = Depends(get_minio_client),
    current_user: User = Depends(get_current_user),
) -> UploadResponse:
    """
    Upload a new dataset.
    
    Args:
        file: Dataset file to upload
        name: Dataset name
        description: Optional description
        minio_client: MinIO client
        current_user: Current authenticated user
        
    Returns:
        Upload response with dataset details
    """
    # Validate file size
    max_size = settings.UPLOAD_MAX_SIZE_MB * 1024 * 1024
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > max_size:
        raise ValidationError(
            f"File too large. Maximum size: {settings.UPLOAD_MAX_SIZE_MB}MB"
        )

    # Validate file extension
    if not any(file.filename.endswith(ext) for ext in settings.UPLOAD_ALLOWED_EXTENSIONS):
        raise ValidationError(
            f"Invalid file type. Allowed: {', '.join(settings.UPLOAD_ALLOWED_EXTENSIONS)}"
        )

    data_service = DataService(minio_client, settings.MINIO_BUCKET)
    
    result = await data_service.upload_dataset(
        file=file.file,
        filename=file.filename,
        user_id=current_user.id,
        dataset_name=name,
    )

    return result


@router.post("/profile", response_model=DatasetProfileResponse)
async def profile_dataset(
    request: DatasetProfileRequest,
    minio_client: Minio = Depends(get_minio_client),
    redis_client: Redis = Depends(get_redis_client),
    current_user: User = Depends(get_current_user),
) -> DatasetProfileResponse:
    """
    Generate comprehensive dataset profile with statistics and recommendations.
    
    Args:
        request: Profiling request parameters
        minio_client: MinIO client
        redis_client: Redis client
        current_user: Current authenticated user
        
    Returns:
        Dataset profile with statistics and quality metrics
    """
    # Check cache first
    cache_service = CacheService(redis_client)
    cache_key = cache_service.cache_key(
        "dataset_profile",
        request.dataset_id,
        str(request.compute_correlations),
    )
    
    cached_profile = await cache_service.get(cache_key)
    if cached_profile:
        return DatasetProfileResponse(**cached_profile)

    # Profile dataset
    data_service = DataService(minio_client, settings.MINIO_BUCKET)
    
    # In production, retrieve storage_path and file_format from database
    # For now, using mock values
    storage_path = f"datasets/{current_user.id}/sample.csv"
    file_format = "csv"
    
    profile = await data_service.profile_dataset(
        storage_path=storage_path,
        file_format=file_format,
        compute_correlations=request.compute_correlations,
    )

    # Cache result
    await cache_service.set(cache_key, profile.model_dump(), ttl=3600)

    return profile


@router.post("/transform", response_model=UploadResponse)
async def transform_dataset(
    request: DataTransformationRequest,
    minio_client: Minio = Depends(get_minio_client),
    current_user: User = Depends(get_current_user),
) -> UploadResponse:
    """
    Apply transformations to a dataset.
    
    Args:
        request: Transformation request with operations
        minio_client: MinIO client
        current_user: Current authenticated user
        
    Returns:
        Upload response for transformed dataset
    """
    data_service = DataService(minio_client, settings.MINIO_BUCKET)
    
    # In production, retrieve storage_path and file_format from database
    storage_path = f"datasets/{current_user.id}/sample.csv"
    file_format = "csv"
    
    # Apply transformations
    transformed_df = await data_service.apply_transformations(
        storage_path=storage_path,
        file_format=file_format,
        transformations=request.transformations,
    )

    # Save transformed dataset
    import io
    buffer = io.BytesIO()
    transformed_df.to_csv(buffer, index=False)
    buffer.seek(0)
    
    dataset_name = request.new_dataset_name or f"transformed_{request.dataset_id}"
    
    result = await data_service.upload_dataset(
        file=buffer,
        filename=f"{dataset_name}.csv",
        user_id=current_user.id,
        dataset_name=dataset_name,
    )

    return result


@router.get("/{dataset_id}", response_model=Dataset)
async def get_dataset(
    dataset_id: str,
    current_user: User = Depends(get_current_user),
) -> Dataset:
    """
    Get dataset by ID.
    
    Args:
        dataset_id: Dataset identifier
        current_user: Current authenticated user
        
    Returns:
        Dataset information
    """
    # In production, retrieve from database
    # For now, returning mock data
    from datetime import datetime
    from schemas.dataset import DatasetMetadata
    
    return Dataset(
        id=dataset_id,
        name="Sample Dataset",
        description="Sample dataset for testing",
        user_id=current_user.id,
        storage_path=f"datasets/{current_user.id}/sample.csv",
        file_format="csv",
        metadata=DatasetMetadata(
            row_count=1000,
            column_count=10,
            size_bytes=50000,
            file_format="csv",
        ),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


@router.get("/", response_model=List[Dataset])
async def list_datasets(
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> List[Dataset]:
    """
    List user's datasets with pagination.
    
    Args:
        current_user: Current authenticated user
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List of datasets
    """
    # In production, retrieve from database with pagination
    # For now, returning empty list
    return []


@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dataset(
    dataset_id: str,
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete a dataset.
    
    Args:
        dataset_id: Dataset identifier
        current_user: Current authenticated user
    """
    # In production, delete from database and storage
    pass


