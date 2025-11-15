"""
TimescaleDB models for time-series data storage.
Used for model metrics, monitoring data, and performance tracking.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import JSON, Column, DateTime, Float, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for TimescaleDB models."""
    pass


class ModelMetric(Base):
    """
    Time-series metrics for ML models.
    
    Stores performance metrics over time for deployed models including:
    - Accuracy, precision, recall, F1 score
    - Response time, throughput
    - Data drift indicators
    - Custom metrics
    """
    __tablename__ = "model_metrics"
    
    time = Column(DateTime(timezone=True), primary_key=True, nullable=False, index=True)
    model_id = Column(PGUUID(as_uuid=True), primary_key=True, nullable=False, index=True)
    metric_name = Column(String(255), primary_key=True, nullable=False, index=True)
    metric_value = Column(Numeric(precision=20, scale=10), nullable=False)
    meta_data = Column(JSON, nullable=True)  # Renamed from metadata to avoid SQLAlchemy conflict
    
    __table_args__ = (
        Index('idx_model_metrics_time_model', 'time', 'model_id'),
        Index('idx_model_metrics_time_name', 'time', 'metric_name'),
    )


class PredictionLog(Base):
    """
    Log of individual model predictions.
    
    Stores each prediction made by deployed models for:
    - Auditing and compliance
    - Performance analysis
    - Drift detection
    - A/B testing
    """
    __tablename__ = "prediction_logs"
    
    time = Column(DateTime(timezone=True), primary_key=True, nullable=False, index=True)
    prediction_id = Column(PGUUID(as_uuid=True), primary_key=True, nullable=False)
    model_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    user_id = Column(PGUUID(as_uuid=True), nullable=True, index=True)
    input_data = Column(JSON, nullable=False)
    prediction = Column(JSON, nullable=False)
    confidence_score = Column(Float, nullable=True)
    response_time_ms = Column(Float, nullable=False)
    error = Column(Text, nullable=True)
    
    __table_args__ = (
        Index('idx_prediction_logs_time_model', 'time', 'model_id'),
        Index('idx_prediction_logs_time_user', 'time', 'user_id'),
    )


class DatasetMetric(Base):
    """
    Metrics about datasets over time.
    
    Tracks dataset quality and characteristics:
    - Row count, column count
    - Missing values, outliers
    - Data types distribution
    - Quality scores
    """
    __tablename__ = "dataset_metrics"
    
    time = Column(DateTime(timezone=True), primary_key=True, nullable=False, index=True)
    dataset_id = Column(PGUUID(as_uuid=True), primary_key=True, nullable=False, index=True)
    metric_name = Column(String(255), primary_key=True, nullable=False, index=True)
    metric_value = Column(Numeric(precision=20, scale=10), nullable=False)
    meta_data = Column(JSON, nullable=True)
    
    __table_args__ = (
        Index('idx_dataset_metrics_time_dataset', 'time', 'dataset_id'),
    )


class SystemMetric(Base):
    """
    System-level metrics for infrastructure monitoring.
    
    Tracks:
    - API response times
    - Database query performance
    - Resource utilization (CPU, memory, disk)
    - Error rates
    """
    __tablename__ = "system_metrics"
    
    time = Column(DateTime(timezone=True), primary_key=True, nullable=False, index=True)
    service_name = Column(String(255), primary_key=True, nullable=False, index=True)
    metric_name = Column(String(255), primary_key=True, nullable=False, index=True)
    metric_value = Column(Numeric(precision=20, scale=10), nullable=False)
    meta_data = Column(JSON, nullable=True)
    
    __table_args__ = (
        Index('idx_system_metrics_time_service', 'time', 'service_name'),
    )


class TrainingMetric(Base):
    """
    Metrics captured during model training.
    
    Stores training progress and results:
    - Loss values per epoch
    - Validation metrics
    - Hyperparameter values
    - Training time
    """
    __tablename__ = "training_metrics"
    
    time = Column(DateTime(timezone=True), primary_key=True, nullable=False, index=True)
    model_id = Column(PGUUID(as_uuid=True), primary_key=True, nullable=False, index=True)
    epoch = Column(Numeric, primary_key=True, nullable=False)
    metric_name = Column(String(255), primary_key=True, nullable=False, index=True)
    metric_value = Column(Numeric(precision=20, scale=10), nullable=False)
    meta_data = Column(JSON, nullable=True)
    
    __table_args__ = (
        Index('idx_training_metrics_time_model', 'time', 'model_id'),
    )
