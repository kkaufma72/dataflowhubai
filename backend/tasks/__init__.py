"""Tasks package initialization."""

from tasks.ml_tasks import (
    train_model,
    evaluate_model,
    batch_predict,
    retrain_model
)

from tasks.data_tasks import (
    preprocess_dataset,
    check_data_quality,
    check_all_datasets_quality,
    transform_dataset,
    export_dataset
)

from tasks.monitoring_tasks import (
    check_model_drift,
    check_all_models_drift,
    cleanup_old_predictions,
    generate_daily_report,
    check_system_health,
    alert_on_anomaly
)

__all__ = [
    # ML tasks
    'train_model',
    'evaluate_model',
    'batch_predict',
    'retrain_model',
    # Data tasks
    'preprocess_dataset',
    'check_data_quality',
    'check_all_datasets_quality',
    'transform_dataset',
    'export_dataset',
    # Monitoring tasks
    'check_model_drift',
    'check_all_models_drift',
    'cleanup_old_predictions',
    'generate_daily_report',
    'check_system_health',
    'alert_on_anomaly',
]
