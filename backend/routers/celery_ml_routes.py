"""
Example ML routes showing Celery integration.
Add these endpoints to your existing ml_routes.py or create new routes.
"""

from uuid import UUID
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel

from dependencies.auth import get_current_user
from schemas.auth import User
from tasks.ml_tasks import train_model, evaluate_model, batch_predict
from celery.result import AsyncResult
from celery_app import celery_app


router = APIRouter()


# Request models
class TrainModelRequest(BaseModel):
    dataset_id: str
    config: Dict[str, Any] = {
        'epochs': 10,
        'batch_size': 32,
        'learning_rate': 0.001
    }


class BatchPredictRequest(BaseModel):
    input_data: list
    

class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    result: Any = None
    meta: Dict[str, Any] = {}


@router.post("/models/{model_id}/train/async", response_model=Dict[str, Any])
async def train_model_async(
    model_id: UUID,
    request: TrainModelRequest,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Start async model training with Celery.
    
    Args:
        model_id: Model identifier
        request: Training configuration
        current_user: Authenticated user
        
    Returns:
        Task ID for tracking progress
    """
    # Start Celery task
    task = train_model.apply_async(
        args=[str(model_id), request.dataset_id, request.config],
        queue='ml_tasks'
    )
    
    return {
        'status': 'training_started',
        'task_id': task.id,
        'model_id': str(model_id),
        'message': f'Training started. Track progress at /api/ml/tasks/{task.id}'
    }


@router.get("/models/{model_id}/evaluate/async", response_model=Dict[str, Any])
async def evaluate_model_async(
    model_id: UUID,
    test_dataset_id: str,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Start async model evaluation.
    
    Args:
        model_id: Model identifier
        test_dataset_id: Test dataset ID
        current_user: Authenticated user
        
    Returns:
        Task ID for tracking
    """
    task = evaluate_model.apply_async(
        args=[str(model_id), test_dataset_id],
        queue='ml_tasks'
    )
    
    return {
        'status': 'evaluation_started',
        'task_id': task.id,
        'model_id': str(model_id)
    }


@router.post("/models/{model_id}/predict/batch", response_model=Dict[str, Any])
async def batch_predict_async(
    model_id: UUID,
    request: BatchPredictRequest,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Make batch predictions asynchronously.
    
    Args:
        model_id: Model identifier
        request: Batch prediction data
        current_user: Authenticated user
        
    Returns:
        Task ID for tracking
    """
    task = batch_predict.apply_async(
        args=[str(model_id), request.input_data, str(current_user.id)],
        queue='ml_tasks'
    )
    
    return {
        'status': 'predictions_started',
        'task_id': task.id,
        'model_id': str(model_id),
        'batch_size': len(request.input_data)
    }


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
) -> TaskStatusResponse:
    """
    Get status of a Celery task.
    
    Args:
        task_id: Celery task identifier
        current_user: Authenticated user
        
    Returns:
        Task status and results
    """
    task_result = AsyncResult(task_id, app=celery_app)
    
    if not task_result:
        raise HTTPException(status_code=404, detail="Task not found")
    
    response = {
        'task_id': task_id,
        'status': task_result.state,
        'result': None,
        'meta': {}
    }
    
    if task_result.state == 'PENDING':
        response['meta'] = {'message': 'Task is waiting to start'}
    elif task_result.state == 'TRAINING' or task_result.state == 'PROGRESS':
        response['meta'] = task_result.info or {}
    elif task_result.state == 'SUCCESS':
        response['result'] = task_result.result
    elif task_result.state == 'FAILURE':
        response['result'] = str(task_result.info)
        response['meta'] = {'error': str(task_result.info)}
    
    return TaskStatusResponse(**response)


@router.post("/tasks/{task_id}/cancel", response_model=Dict[str, Any])
async def cancel_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Cancel a running task.
    
    Args:
        task_id: Celery task identifier
        current_user: Authenticated user
        
    Returns:
        Cancellation status
    """
    task_result = AsyncResult(task_id, app=celery_app)
    
    if not task_result:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_result.revoke(terminate=True)
    
    return {
        'status': 'cancelled',
        'task_id': task_id,
        'message': 'Task has been cancelled'
    }


@router.get("/tasks", response_model=Dict[str, Any])
async def list_active_tasks(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    List all active tasks.
    
    Args:
        current_user: Authenticated user
        
    Returns:
        List of active tasks
    """
    # Get active tasks from Celery
    inspect = celery_app.control.inspect()
    
    active_tasks = inspect.active() or {}
    scheduled_tasks = inspect.scheduled() or {}
    reserved_tasks = inspect.reserved() or {}
    
    return {
        'active': active_tasks,
        'scheduled': scheduled_tasks,
        'reserved': reserved_tasks,
        'message': 'For detailed monitoring, visit Flower dashboard at http://localhost:5555'
    }
