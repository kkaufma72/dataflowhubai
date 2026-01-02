"""
Machine learning service for model training and predictions.
"""

import pickle
import time
from io import BytesIO
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from minio import Minio
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.svm import SVC, SVR

try:
    from lightgbm import LGBMClassifier, LGBMRegressor

    HAS_LIGHTGBM = True
except Exception:
    HAS_LIGHTGBM = False

try:
    from xgboost import XGBClassifier, XGBRegressor

    HAS_XGBOOST = True
except Exception:
    HAS_XGBOOST = False

from schemas.ml_model import (
    AlgorithmType,
    FeatureImportance,
    ModelMetrics,
    PredictionResponse,
    TaskType,
)
from utils.errors import TrainingError, ValidationError


class MLService:
    """Service for machine learning operations."""

    def __init__(self, minio_client: Minio, bucket_name: str):
        self.minio = minio_client
        self.bucket = bucket_name
        self.unavailable_algorithms: Dict[AlgorithmType, str] = {}
        self.algorithm_map = {
            AlgorithmType.RANDOM_FOREST: {
                TaskType.CLASSIFICATION: RandomForestClassifier,
                TaskType.REGRESSION: RandomForestRegressor,
            },
            AlgorithmType.GRADIENT_BOOSTING: {
                TaskType.CLASSIFICATION: GradientBoostingClassifier,
                TaskType.REGRESSION: GradientBoostingClassifier,
            },
            AlgorithmType.SVM: {
                TaskType.CLASSIFICATION: SVC,
                TaskType.REGRESSION: SVR,
            },
            AlgorithmType.NEURAL_NETWORK: {
                TaskType.CLASSIFICATION: MLPClassifier,
                TaskType.REGRESSION: MLPRegressor,
            },
            AlgorithmType.LINEAR_REGRESSION: {
                TaskType.REGRESSION: LinearRegression,
            },
            AlgorithmType.LOGISTIC_REGRESSION: {
                TaskType.CLASSIFICATION: LogisticRegression,
            },
        }
        if HAS_XGBOOST:
            self.algorithm_map[AlgorithmType.XGBOOST] = {
                TaskType.CLASSIFICATION: XGBClassifier,
                TaskType.REGRESSION: XGBRegressor,
            }
        else:
            self.unavailable_algorithms[AlgorithmType.XGBOOST] = "xgboost is not installed"

        if HAS_LIGHTGBM:
            self.algorithm_map[AlgorithmType.LIGHTGBM] = {
                TaskType.CLASSIFICATION: LGBMClassifier,
                TaskType.REGRESSION: LGBMRegressor,
            }
        else:
            self.unavailable_algorithms[AlgorithmType.LIGHTGBM] = "lightgbm is not installed"

    async def train_model(
        self,
        df: pd.DataFrame,
        target_column: str,
        algorithm: AlgorithmType,
        task_type: TaskType,
        test_size: float = 0.2,
        features: Optional[List[str]] = None,
        hyperparameters: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Any, ModelMetrics, List[FeatureImportance]]:
        """
        Train a machine learning model.
        
        Args:
            df: Training data
            target_column: Target column name
            algorithm: ML algorithm to use
            task_type: Type of ML task
            test_size: Test set size
            features: Feature columns (uses all except target if None)
            hyperparameters: Model hyperparameters
            
        Returns:
            Tuple of (trained model, metrics, feature importance)
        """
        # Validate target column
        if target_column not in df.columns:
            raise ValidationError(f"Target column '{target_column}' not found in dataset")

        # Prepare features
        if features is None:
            features = [col for col in df.columns if col != target_column]

        # Check if we have enough data
        if len(df) < 10:
            raise ValidationError("Dataset too small for training (minimum 10 rows)")

        # Prepare data
        X = df[features].copy()
        y = df[target_column].copy()

        # Handle categorical features
        categorical_columns = X.select_dtypes(include=["object"]).columns
        label_encoders = {}
        
        for col in categorical_columns:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            label_encoders[col] = le

        # Handle missing values
        X = X.fillna(X.mean(numeric_only=True))

        # Encode target if classification
        target_encoder = None
        if task_type == TaskType.CLASSIFICATION:
            if y.dtype == "object":
                target_encoder = LabelEncoder()
                y = target_encoder.fit_transform(y)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )

        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        # Get model class
        model_class = self.algorithm_map.get(algorithm, {}).get(task_type)
        if not model_class:
            unavailable_reason = self.unavailable_algorithms.get(algorithm)
            if unavailable_reason:
                raise ValidationError(
                    f"Algorithm '{algorithm.value}' is available but missing an optional dependency ({unavailable_reason})."
                )
            raise ValidationError(
                f"Algorithm '{algorithm}' not supported for task type '{task_type}'"
            )

        # Initialize model with hyperparameters
        params = hyperparameters or {}
        if algorithm == AlgorithmType.SVM and task_type == TaskType.CLASSIFICATION:
            params.setdefault("probability", True)  # ensure predict_proba exists
        if algorithm == AlgorithmType.NEURAL_NETWORK:
            params.setdefault("max_iter", 300)
        model = model_class(**params)

        # Train model
        try:
            model.fit(X_train_scaled, y_train)
        except Exception as e:
            raise TrainingError(f"Model training failed: {str(e)}")

        # Make predictions
        y_pred = model.predict(X_test_scaled)

        # Calculate metrics
        metrics = self._calculate_metrics(
            y_test, y_pred, task_type, model, X_test_scaled
        )

        # Get feature importance
        feature_importance = self._get_feature_importance(model, features)

        # Store preprocessing artifacts
        model_artifacts = {
            "model": model,
            "scaler": scaler,
            "label_encoders": label_encoders,
            "target_encoder": target_encoder,
            "features": features,
        }

        return model_artifacts, metrics, feature_importance

    def _calculate_metrics(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        task_type: TaskType,
        model: Any,
        X_test: np.ndarray,
    ) -> ModelMetrics:
        """Calculate evaluation metrics based on task type."""
        metrics = ModelMetrics()

        if task_type == TaskType.CLASSIFICATION:
            metrics.accuracy = float(accuracy_score(y_true, y_pred))
            metrics.precision = float(precision_score(y_true, y_pred, average="weighted", zero_division=0))
            metrics.recall = float(recall_score(y_true, y_pred, average="weighted", zero_division=0))
            metrics.f1_score = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))

            # ROC AUC for binary classification
            if len(np.unique(y_true)) == 2 and hasattr(model, "predict_proba"):
                try:
                    y_proba = model.predict_proba(X_test)[:, 1]
                    metrics.roc_auc = float(roc_auc_score(y_true, y_proba))
                except Exception:
                    pass

        elif task_type == TaskType.REGRESSION:
            metrics.rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
            metrics.mae = float(mean_absolute_error(y_true, y_pred))
            metrics.r2_score = float(r2_score(y_true, y_pred))

        return metrics

    def _get_feature_importance(
        self,
        model: Any,
        features: List[str],
    ) -> List[FeatureImportance]:
        """Extract feature importance from model."""
        feature_importance = []

        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            indices = np.argsort(importances)[::-1]

            for rank, idx in enumerate(indices, 1):
                feature_importance.append(
                    FeatureImportance(
                        feature_name=features[idx],
                        importance_score=float(importances[idx]),
                        rank=rank,
                    )
                )

        return feature_importance

    async def save_model(
        self,
        model_artifacts: Dict[str, Any],
        model_id: str,
        user_id: str,
    ) -> str:
        """
        Save trained model to object storage.
        
        Args:
            model_artifacts: Dictionary containing model and preprocessing objects
            model_id: Unique model identifier
            user_id: User who owns the model
            
        Returns:
            Storage path
        """
        # Serialize model
        model_bytes = pickle.dumps(model_artifacts)

        # Generate storage path
        storage_path = f"models/{user_id}/{model_id}.pkl"

        try:
            # Upload to MinIO
            self.minio.put_object(
                bucket_name=self.bucket,
                object_name=storage_path,
                data=BytesIO(model_bytes),
                length=len(model_bytes),
            )
            return storage_path

        except Exception as e:
            raise TrainingError(f"Failed to save model: {str(e)}")

    async def load_model(self, storage_path: str) -> Dict[str, Any]:
        """
        Load model from object storage.
        
        Args:
            storage_path: Path to model in storage
            
        Returns:
            Model artifacts dictionary
        """
        try:
            response = self.minio.get_object(
                bucket_name=self.bucket,
                object_name=storage_path,
            )
            model_bytes = response.read()
            return pickle.loads(model_bytes)

        except Exception as e:
            raise TrainingError(f"Failed to load model: {str(e)}")

    async def predict(
        self,
        storage_path: str,
        data: List[Dict[str, Any]],
    ) -> PredictionResponse:
        """
        Make predictions using a trained model.
        
        Args:
            storage_path: Path to model in storage
            data: List of data points for prediction
            
        Returns:
            PredictionResponse with predictions
        """
        start_time = time.time()

        # Load model artifacts
        artifacts = await self.load_model(storage_path)
        model = artifacts["model"]
        scaler = artifacts["scaler"]
        label_encoders = artifacts["label_encoders"]
        target_encoder = artifacts.get("target_encoder")
        features = artifacts["features"]

        # Prepare input data
        df = pd.DataFrame(data)

        # Ensure all required features are present
        missing_features = set(features) - set(df.columns)
        if missing_features:
            raise ValidationError(f"Missing required features: {missing_features}")

        # Select and order features
        X = df[features].copy()

        # Apply label encoding
        for col, encoder in label_encoders.items():
            if col in X.columns:
                X[col] = X[col].apply(
                    lambda x: encoder.transform([str(x)])[0]
                    if str(x) in encoder.classes_
                    else -1
                )

        # Handle missing values
        X = X.fillna(X.mean(numeric_only=True))

        # Scale features
        X_scaled = scaler.transform(X)

        # Make predictions
        predictions = model.predict(X_scaled)

        # Decode predictions if needed
        if target_encoder is not None:
            predictions = target_encoder.inverse_transform(predictions)

        # Get probabilities if available
        probabilities = None
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(X_scaled).tolist()

        prediction_time = (time.time() - start_time) * 1000  # Convert to ms

        return PredictionResponse(
            model_id=storage_path,
            predictions=predictions.tolist(),
            probabilities=probabilities,
            prediction_time_ms=prediction_time,
        )


async def get_ml_service(minio_client: Minio, bucket_name: str) -> MLService:
    """Factory function to get ML service instance."""
    return MLService(minio_client, bucket_name)

