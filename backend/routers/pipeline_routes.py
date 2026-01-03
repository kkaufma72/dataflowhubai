"""
Pipeline orchestration routes.
"""

from typing import List

from fastapi import APIRouter, Depends, status
from redis.asyncio import Redis

from dependencies.auth import get_current_user, require_subscription
from dependencies.database import get_redis_client
from schemas.auth import User
from schemas.pipeline import (
    Pipeline,
    PipelineCreate,
    PipelineExecutionRequest,
    PipelineExecutionResult,
    PipelineUpdate,
)
from services.background_tasks import BackgroundTaskService


router = APIRouter()


@router.post("/", response_model=Pipeline, status_code=status.HTTP_201_CREATED)
async def create_pipeline(
    pipeline_data: PipelineCreate,
    current_user: User = Depends(require_subscription("pro")),
) -> Pipeline:
    """
    Create a new ML pipeline.
    
    Requires Pro subscription or higher.
    
    Args:
        pipeline_data: Pipeline configuration
        current_user: Current authenticated user
        
    Returns:
        Created pipeline
    """
    # In production, store in database
    from datetime import datetime
    from schemas.pipeline import PipelineStatus
    
    return Pipeline(
        id="pipeline_123",
        name=pipeline_data.name,
        description=pipeline_data.description,
        user_id=current_user.id,
        steps=pipeline_data.steps,
        status=PipelineStatus.DRAFT,
        schedule=pipeline_data.schedule,
        is_active=pipeline_data.is_active,
        config=pipeline_data.config,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


@router.get("/", response_model=List[Pipeline])
async def list_pipelines(
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> List[Pipeline]:
    """
    List user's pipelines with pagination.
    
    Args:
        current_user: Current authenticated user
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List of pipelines
    """
    # In production, retrieve from database
    return []


@router.get("/{pipeline_id}", response_model=Pipeline)
async def get_pipeline(
    pipeline_id: str,
    current_user: User = Depends(get_current_user),
) -> Pipeline:
    """
    Get pipeline by ID.
    
    Args:
        pipeline_id: Pipeline identifier
        current_user: Current authenticated user
        
    Returns:
        Pipeline information
    """
    # In production, retrieve from database
    from datetime import datetime
    from schemas.pipeline import PipelineStatus, PipelineStep, PipelineStepType
    
    return Pipeline(
        id=pipeline_id,
        name="Sample Pipeline",
        description="Sample ML pipeline",
        user_id=current_user.id,
        steps=[
            PipelineStep(
                id="step_1",
                name="Data Ingestion",
                type=PipelineStepType.DATA_INGESTION,
                config={},
            ),
            PipelineStep(
                id="step_2",
                name="Model Training",
                type=PipelineStepType.MODEL_TRAINING,
                config={},
                dependencies=["step_1"],
            ),
        ],
        status=PipelineStatus.DRAFT,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


@router.patch("/{pipeline_id}", response_model=Pipeline)
async def update_pipeline(
    pipeline_id: str,
    update_data: PipelineUpdate,
    current_user: User = Depends(get_current_user),
) -> Pipeline:
    """
    Update pipeline configuration.
    
    Args:
        pipeline_id: Pipeline identifier
        update_data: Pipeline update data
        current_user: Current authenticated user
        
    Returns:
        Updated pipeline
    """
    # In production, update in database
    return await get_pipeline(pipeline_id, current_user)


@router.post("/{pipeline_id}/execute", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def execute_pipeline(
    pipeline_id: str,
    request: PipelineExecutionRequest,
    redis_client: Redis = Depends(get_redis_client),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Execute a pipeline (async).
    
    Args:
        pipeline_id: Pipeline identifier
        request: Execution parameters
        redis_client: Redis client
        current_user: Current authenticated user
        
    Returns:
        Execution task information
    """
    if redis_client is None:
        raise HTTPException(
            status_code=503,
            detail="Background tasks unavailable (Redis not configured). Please configure Redis for pipeline execution."
        )
    
    task_service = BackgroundTaskService(redis_client)
    
    task_id = await task_service.enqueue_task(
        task_type="pipeline_execution",
        payload={
            "user_id": current_user.id,
            "pipeline_id": pipeline_id,
            "input_data": request.input_data,
            "override_config": request.override_config,
        },
        priority=2,
    )

    return {
        "execution_id": task_id,
        "pipeline_id": pipeline_id,
        "status": "queued",
        "message": "Pipeline execution started. Use execution_id to check progress.",
    }


@router.get("/{pipeline_id}/executions/{execution_id}", response_model=dict)
async def get_execution_status(
    pipeline_id: str,
    execution_id: str,
    redis_client: Redis = Depends(get_redis_client),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Get status of a pipeline execution.
    
    Args:
        pipeline_id: Pipeline identifier
        execution_id: Execution identifier
        redis_client: Redis client
        current_user: Current authenticated user
        
    Returns:
        Execution status and results
    """
    if redis_client is None:
        return {
            "execution_id": execution_id,
            "pipeline_id": pipeline_id,
            "status": "unavailable",
            "message": "Background tasks unavailable (Redis not configured)"
        }
    
    task_service = BackgroundTaskService(redis_client)
    task_result = await task_service.get_task_status(execution_id)

    if not task_result:
        return {
            "execution_id": execution_id,
            "pipeline_id": pipeline_id,
            "status": "not_found",
        }

    return {
        "execution_id": execution_id,
        "pipeline_id": pipeline_id,
        "status": task_result.status.value,
        "result": task_result.result,
        "error": task_result.error,
        "created_at": task_result.created_at.isoformat(),
        "completed_at": task_result.completed_at.isoformat()
        if task_result.completed_at
        else None,
    }


@router.delete("/{pipeline_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pipeline(
    pipeline_id: str,
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete a pipeline.
    
    Args:
        pipeline_id: Pipeline identifier
        current_user: Current authenticated user
    """
    # In production, delete from database
    pass

