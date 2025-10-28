"""
Background task management with Redis queue.
"""

import asyncio
import json
import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, Optional

import redis.asyncio as aioredis

from utils.config import settings


class TaskStatus(str, Enum):
    """Background task status."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskResult:
    """Background task result."""

    def __init__(
        self,
        task_id: str,
        status: TaskStatus,
        result: Optional[Any] = None,
        error: Optional[str] = None,
        created_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None,
    ):
        self.task_id = task_id
        self.status = status
        self.result = result
        self.error = error
        self.created_at = created_at or datetime.utcnow()
        self.completed_at = completed_at


class BackgroundTaskService:
    """Service for managing background tasks with Redis."""

    def __init__(self, redis_client: aioredis.Redis):
        self.redis = redis_client
        self.queue_key = "background_tasks:queue"
        self.result_prefix = "background_tasks:result"
        self.task_handlers: Dict[str, Callable] = {}

    def register_handler(self, task_type: str, handler: Callable) -> None:
        """
        Register a task handler function.
        
        Args:
            task_type: Type identifier for the task
            handler: Async function to handle the task
        """
        self.task_handlers[task_type] = handler

    async def enqueue_task(
        self,
        task_type: str,
        payload: Dict[str, Any],
        priority: int = 0,
    ) -> str:
        """
        Add a task to the queue.
        
        Args:
            task_type: Type of task to execute
            payload: Task data
            priority: Priority level (higher = more important)
            
        Returns:
            Task ID
        """
        task_id = str(uuid.uuid4())
        
        task_data = {
            "task_id": task_id,
            "task_type": task_type,
            "payload": payload,
            "created_at": datetime.utcnow().isoformat(),
            "priority": priority,
        }
        
        # Add to queue with priority
        await self.redis.zadd(
            self.queue_key,
            {json.dumps(task_data): -priority},  # Negative for descending order
        )
        
        # Set initial status
        await self._set_task_status(task_id, TaskStatus.PENDING)
        
        return task_id

    async def get_task_status(self, task_id: str) -> Optional[TaskResult]:
        """
        Get task status and result.
        
        Args:
            task_id: Task ID
            
        Returns:
            TaskResult or None if not found
        """
        result_key = f"{self.result_prefix}:{task_id}"
        data = await self.redis.get(result_key)
        
        if not data:
            return None
        
        result_data = json.loads(data)
        return TaskResult(
            task_id=task_id,
            status=TaskStatus(result_data["status"]),
            result=result_data.get("result"),
            error=result_data.get("error"),
            created_at=datetime.fromisoformat(result_data["created_at"]),
            completed_at=datetime.fromisoformat(result_data["completed_at"])
            if result_data.get("completed_at")
            else None,
        )

    async def _set_task_status(
        self,
        task_id: str,
        status: TaskStatus,
        result: Optional[Any] = None,
        error: Optional[str] = None,
    ) -> None:
        """Set task status and result."""
        result_key = f"{self.result_prefix}:{task_id}"
        
        result_data = {
            "status": status.value,
            "result": result,
            "error": error,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        if status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
            result_data["completed_at"] = datetime.utcnow().isoformat()
        
        # Store with 24 hour expiry
        await self.redis.setex(
            result_key,
            86400,  # 24 hours
            json.dumps(result_data),
        )

    async def process_tasks(self) -> None:
        """
        Process tasks from the queue.
        This should run in a background worker.
        """
        while True:
            try:
                # Get highest priority task
                tasks = await self.redis.zpopmin(self.queue_key, count=1)
                
                if not tasks:
                    await asyncio.sleep(1)
                    continue
                
                task_json, _ = tasks[0]
                task_data = json.loads(task_json)
                
                task_id = task_data["task_id"]
                task_type = task_data["task_type"]
                payload = task_data["payload"]
                
                # Update status to running
                await self._set_task_status(task_id, TaskStatus.RUNNING)
                
                # Execute task
                handler = self.task_handlers.get(task_type)
                if not handler:
                    await self._set_task_status(
                        task_id,
                        TaskStatus.FAILED,
                        error=f"No handler registered for task type: {task_type}",
                    )
                    continue
                
                try:
                    result = await handler(payload)
                    await self._set_task_status(
                        task_id,
                        TaskStatus.COMPLETED,
                        result=result,
                    )
                except Exception as e:
                    await self._set_task_status(
                        task_id,
                        TaskStatus.FAILED,
                        error=str(e),
                    )
                    
            except Exception as e:
                # Log error and continue
                print(f"Error processing task: {e}")
                await asyncio.sleep(1)


async def get_background_task_service(redis_client: aioredis.Redis) -> BackgroundTaskService:
    """Factory function to get background task service instance."""
    return BackgroundTaskService(redis_client)


