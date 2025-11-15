"""
Pipeline and workflow schemas.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class PipelineStepType(str, Enum):
    """Types of pipeline steps."""

    DATA_INGESTION = "data_ingestion"
    DATA_PREPROCESSING = "data_preprocessing"
    FEATURE_ENGINEERING = "feature_engineering"
    MODEL_TRAINING = "model_training"
    MODEL_EVALUATION = "model_evaluation"
    MODEL_DEPLOYMENT = "model_deployment"
    CUSTOM = "custom"


class PipelineStatus(str, Enum):
    """Pipeline execution status."""

    DRAFT = "draft"
    SCHEDULED = "scheduled"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"


class PipelineStep(BaseModel):
    """Individual pipeline step configuration."""

    id: str
    name: str
    type: PipelineStepType
    config: Dict[str, Any] = Field(default_factory=dict)
    dependencies: List[str] = Field(default_factory=list)  # IDs of steps this depends on
    retry_count: int = Field(default=0, ge=0, le=5)
    timeout_seconds: Optional[int] = None


class PipelineCreate(BaseModel):
    """Schema for creating a pipeline."""

    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    steps: List[PipelineStep]
    schedule: Optional[str] = None  # Cron expression
    is_active: bool = True
    config: Dict[str, Any] = Field(default_factory=dict)


class PipelineUpdate(BaseModel):
    """Schema for updating a pipeline."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    steps: Optional[List[PipelineStep]] = None
    schedule: Optional[str] = None
    is_active: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None


class Pipeline(BaseModel):
    """Complete pipeline schema."""

    id: str
    name: str
    description: Optional[str] = None
    user_id: str
    steps: List[PipelineStep]
    status: PipelineStatus
    schedule: Optional[str] = None
    is_active: bool
    config: Dict[str, Any] = Field(default_factory=dict)
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PipelineExecutionRequest(BaseModel):
    """Request to execute a pipeline."""

    pipeline_id: str
    input_data: Optional[Dict[str, Any]] = None
    override_config: Optional[Dict[str, Any]] = None


class PipelineExecutionStepResult(BaseModel):
    """Result of a single pipeline step execution."""

    step_id: str
    step_name: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class PipelineExecutionResult(BaseModel):
    """Complete pipeline execution result."""

    execution_id: str
    pipeline_id: str
    status: PipelineStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    step_results: List[PipelineExecutionStepResult]
    final_output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


