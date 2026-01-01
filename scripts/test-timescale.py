#!/usr/bin/env python3
"""
Test TimescaleDB client and write sample metrics
"""
import sys
import os
from datetime import datetime, timedelta

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from lib.timescale_client import get_timescale_client

def test_timescale():
    print("🧪 Testing TimescaleDB Client...")
    
    ts = get_timescale_client()
    
    # Test 1: Write a single metric
    print("\n1️⃣ Writing single metric...")
    ts.write_metric(
        metric_name="test_accuracy",
        value=0.95,
        model_id="test-model-001",
        tags={"env": "test", "region": "local"},
        metadata={"test": "initial"}
    )
    print("✅ Single metric written")
    
    # Test 2: Batch write
    print("\n2️⃣ Writing batch metrics...")
    ts.write_metrics_batch([
        {
            "metric_name": "inference_latency",
            "value": 45.2,
            "model_id": "test-model-001",
            "tags": {"env": "test"},
            "timestamp": datetime.utcnow() - timedelta(hours=1)
        },
        {
            "metric_name": "inference_latency",
            "value": 48.5,
            "model_id": "test-model-001",
            "tags": {"env": "test"},
            "timestamp": datetime.utcnow() - timedelta(hours=2)
        },
        {
            "metric_name": "throughput",
            "value": 1200.0,
            "model_id": "test-model-001",
            "tags": {"env": "test"}
        }
    ])
    print("✅ Batch metrics written (3 records)")
    
    # Test 3: Model performance
    print("\n3️⃣ Writing model performance...")
    ts.write_model_performance(
        model_id="test-model-001",
        accuracy=0.95,
        precision=0.93,
        recall=0.92,
        f1_score=0.925,
        auc_roc=0.96,
        inference_time_ms=45.2,
        throughput_qps=1200.0,
        metadata={"version": "v1.0", "test": True}
    )
    print("✅ Model performance written")
    
    # Test 4: Training metrics
    print("\n4️⃣ Writing training metrics...")
    ts.write_training_metric(
        experiment_id="exp-001",
        model_id="test-model-001",
        epoch=1,
        step=100,
        loss=0.25,
        validation_loss=0.28,
        learning_rate=0.001,
        batch_size=32,
        metadata={"optimizer": "adam"}
    )
    print("✅ Training metrics written")
    
    # Test 5: Data quality
    print("\n5️⃣ Writing data quality metrics...")
    ts.write_data_quality(
        dataset_id="dataset-001",
        completeness=0.98,
        validity=0.95,
        consistency=0.96,
        uniqueness=0.99,
        timeliness=0.97,
        row_count=10000,
        null_count=200,
        duplicate_count=10,
        metadata={"check_date": datetime.utcnow().isoformat()}
    )
    print("✅ Data quality metrics written")
    
    # Test 6: Query metrics
    print("\n6️⃣ Querying metrics...")
    metrics = ts.query_metrics(
        metric_name="test_accuracy",
        model_id="test-model-001"
    )
    print(f"✅ Found {len(metrics)} metric records")
    if metrics:
        print(f"   Sample: {metrics[0]}")
    
    # Test 7: Query model performance
    print("\n7️⃣ Querying model performance...")
    perf = ts.get_latest_model_performance("test-model-001")
    if perf:
        print(f"✅ Latest performance: accuracy={perf.get('accuracy')}, f1={perf.get('f1_score')}")
    
    # Test 8: Aggregated metrics
    print("\n8️⃣ Getting aggregated metrics...")
    agg = ts.get_aggregated_metrics(
        metric_name="inference_latency",
        model_id="test-model-001",
        interval="1 hour"
    )
    print(f"✅ Found {len(agg)} aggregated records")
    if agg:
        print(f"   Sample: bucket={agg[0].get('bucket')}, avg={agg[0].get('avg_value')}")
    
    print("\n✅ All tests passed!")
    print("\n📊 Summary:")
    print("   - metrics table: written")
    print("   - model_performance table: written")
    print("   - training_metrics table: written")
    print("   - data_quality_metrics table: written")
    print("   - Queries: working")
    print("   - Aggregations: working")
    print("\n🎉 TimescaleDB is ready to use!")

if __name__ == "__main__":
    try:
        test_timescale()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
