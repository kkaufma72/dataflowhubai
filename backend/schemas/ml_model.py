"""
Machine learning model schemas.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class AlgorithmType(str, Enum):
    """Supported ML algorithms."""

    RANDOM_FOREST = "random_forest"
    GRADIENT_BOOSTING = "gradient_boosting"
    XGBOOST = "xgboost"
    LIGHTGBM = "lightgbm"
    NEURAL_NETWORK = "neural_network"
    SVM = "svm"
    LINEAR_REGRESSION = "linear_regression"
    LOGISTIC_REGRESSION = "logistic_regression"


class TaskType(str, Enum):
    """ML task types."""

    CLASSIFICATION = "classification"
    REGRESSION = "regression"
    CLUSTERING = "clustering"
    TIME_SERIES = "time_series"


class ModelStatus(str, Enum):
    """Model training status."""

    PENDING = "pending"
    TRAINING = "training"
    COMPLETED = "completed"
    FAILED = "failed"
    DEPLOYED = "deployed"


class FeatureEngineeringRequest(BaseModel):
    """Request for automated feature engineering."""

    dataset_id: str
    target_column: str
    feature_types: List[str] = Field(default_factory=lambda: ["numeric", "categorical"])
    max_features: int = Field(default=100, ge=1, le=1000)
    include_interactions: bool = False
    include_polynomial: bool = False
    polynomial_degree: int = Field(default=2, ge=2, le=3)


class FeatureImportance(BaseModel):
    """Feature importance information."""

    feature_name: str
    importance_score: float
    rank: int


class ModelTrainingRequest(BaseModel):
    """Request for model training."""

    dataset_id: str
    target_column: str
    task_type: TaskType
    algorithm: AlgorithmType
    features: Optional[List[str]] = None
    test_size: float = Field(default=0.2, ge=0.1, le=0.5)
    cross_validation_folds: int = Field(default=5, ge=2, le=10)
    hyperparameter_tuning: bool = True
    max_training_time: Optional[int] = None  # seconds
    custom_params: Optional[Dict[str, Any]] = None

    @field_validator("target_column")
    @classmethod
    def validate_target_column(cls, v: str) -> str:
        """Validate target column name."""
        if not v.strip():
            raise ValueError("Target column cannot be empty")
        return v.strip()


class ModelMetrics(BaseModel):
    """Model evaluation metrics."""

    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    rmse: Optional[float] = None
    mae: Optional[float] = None
    r2_score: Optional[float] = None
    confusion_matrix: Optional[List[List[int]]] = None
    custom_metrics: Optional[Dict[str, float]] = None


class Model(BaseModel):
    """ML model schema."""

    id: str
    name: str
    description: Optional[str] = None
    user_id: str
    dataset_id: str
    algorithm: AlgorithmType
    task_type: TaskType
    status: ModelStatus
    target_column: str
    features: List[str]
    metrics: Optional[ModelMetrics] = None
    feature_importance: Optional[List[FeatureImportance]] = None
    hyperparameters: Dict[str, Any] = Field(default_factory=dict)
    training_time_seconds: Optional[float] = None
    storage_path: Optional[str] = None
    version: int = 1
    is_deployed: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ModelCreate(BaseModel):
    """Schema for creating a model record."""

    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    dataset_id: str
    algorithm: AlgorithmType
    task_type: TaskType


class ModelUpdate(BaseModel):
    """Schema for updating model information."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[ModelStatus] = None
    is_deployed: Optional[bool] = None


class PredictionRequest(BaseModel):
    """Request for model predictions."""

    model_id: str
    data: List[Dict[str, Any]]

    @field_validator("data")
    @classmethod
    def validate_data(cls, v: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validate prediction data."""
        if not v:
            raise ValueError("At least one data point required for prediction")
        return v


class PredictionResponse(BaseModel):
    """Model prediction response."""

    model_id: str
    predictions: List[Any]
    probabilities: Optional[List[List[float]]] = None
    prediction_time_ms: float


