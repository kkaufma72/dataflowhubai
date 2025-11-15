#!/usr/bin/env python3
"""
Test script for Celery async tasks - Direct task invocation
Run this inside the Celery container or with proper environment setup
"""

import time
import sys
from celery.result import AsyncResult
from celery_app import celery_app


def test_training_task():
    """Test async model training"""
    print("🧪 Testing Async Model Training")
    print("=" * 50)
    
    # Import task
    from tasks.ml_tasks import train_model
    
    # Start training task
    print("\n1. Starting training task...")
    result = train_model.delay(
        model_id='test-model-123',
        dataset_id='test-dataset-456',
        config={
            'epochs': 3,
            'batch_size': 32,
            'learning_rate': 0.001
        }
    )
    
    print(f"✓ Task started!")
    print(f"  Task ID: {result.id}")
    print(f"  Initial Status: {result.status}")
    
    # Poll for results
    print("\n2. Polling task status...")
    max_checks = 20
    for i in range(max_checks):
        time.sleep(2)
        
        status = result.status
        print(f"  Check #{i+1}: {status}", end="")
        
        if status == 'PROGRESS':
            # Get progress info
            info = result.info
            if info:
                epoch = info.get('current_epoch', '?')
                total = info.get('total_epochs', '?')
                loss = info.get('loss', '?')
                print(f" - Epoch {epoch}/{total}, Loss: {loss}")
            else:
                print()
        else:
            print()
        
        if result.ready():
            break
    
    # Check final result
    print("\n3. Final result:")
    if result.successful():
        print(f"✓ Task completed successfully!")
        print(f"  Result: {result.result}")
    elif result.failed():
        print(f"✗ Task failed!")
        print(f"  Error: {result.info}")
    else:
        print(f"⚠ Task still running (status: {result.status})")
    
    return result


def test_batch_prediction():
    """Test batch predictions"""
    print("\n\n🧪 Testing Batch Predictions")
    print("=" * 50)
    
    from tasks.ml_tasks import batch_predict
    
    print("\n1. Starting batch prediction task...")
    result = batch_predict.delay(
        model_id='test-model-123',
        input_data=[
            {'feature1': 1.0, 'feature2': 2.0, 'feature3': 3.0},
            {'feature1': 1.5, 'feature2': 2.5, 'feature3': 3.5},
            {'feature1': 2.0, 'feature2': 3.0, 'feature3': 4.0},
        ],
        user_id='test-user-789'
    )
    
    print(f"✓ Task started!")
    print(f"  Task ID: {result.id}")
    
    # Wait for result
    print("\n2. Waiting for predictions...")
    try:
        predictions = result.get(timeout=10)
        print(f"✓ Predictions received!")
        print(f"  Predictions: {predictions}")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    return result


def test_data_quality_check():
    """Test data quality check"""
    print("\n\n🧪 Testing Data Quality Check")
    print("=" * 50)
    
    from tasks.data_tasks import check_data_quality
    
    print("\n1. Starting data quality check...")
    result = check_data_quality.delay(dataset_id='test-dataset-456')
    
    print(f"✓ Task started!")
    print(f"  Task ID: {result.id}")
    
    # Wait for result
    print("\n2. Waiting for quality report...")
    try:
        quality_report = result.get(timeout=10)
        print(f"✓ Quality report received!")
        print(f"  Report: {quality_report}")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    return result


def test_system_health():
    """Test system health check"""
    print("\n\n🧪 Testing System Health Check")
    print("=" * 50)
    
    from tasks.monitoring_tasks import check_system_health
    
    print("\n1. Starting system health check...")
    result = check_system_health.delay()
    
    print(f"✓ Task started!")
    print(f"  Task ID: {result.id}")
    
    # Wait for result
    print("\n2. Waiting for health metrics...")
    try:
        health_metrics = result.get(timeout=10)
        print(f"✓ Health metrics received!")
        print(f"  CPU Usage: {health_metrics.get('cpu_percent', 'N/A')}%")
        print(f"  Memory Usage: {health_metrics.get('memory_percent', 'N/A')}%")
        print(f"  Disk Usage: {health_metrics.get('disk_percent', 'N/A')}%")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    return result


def check_celery_status():
    """Check Celery worker status"""
    print("\n\n📊 Celery Worker Status")
    print("=" * 50)
    
    # Check active workers
    inspect = celery_app.control.inspect()
    
    print("\n1. Active workers:")
    active = inspect.active()
    if active:
        for worker, tasks in active.items():
            print(f"  • {worker}: {len(tasks)} active tasks")
    else:
        print("  No active tasks")
    
    print("\n2. Registered tasks:")
    registered = inspect.registered()
    if registered:
        for worker, tasks in registered.items():
            print(f"  • {worker}: {len(tasks)} registered tasks")
            for task in sorted(tasks)[:10]:  # Show first 10
                print(f"    - {task}")
    else:
        print("  No registered tasks")
    
    print("\n3. Worker stats:")
    stats = inspect.stats()
    if stats:
        for worker, stat in stats.items():
            print(f"  • {worker}:")
            print(f"    - Pool: {stat.get('pool', {}).get('implementation', 'N/A')}")
            print(f"    - Max concurrency: {stat.get('pool', {}).get('max-concurrency', 'N/A')}")
    else:
        print("  No stats available")


if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("🚀 DataFlowHub AI - Celery Test Suite")
    print("=" * 50)
    
    try:
        # Check Celery status first
        check_celery_status()
        
        # Run tests
        if '--quick' in sys.argv:
            print("\n⚡ Quick test mode")
            test_system_health()
        else:
            print("\n🔬 Running full test suite...")
            
            # Test 1: Training
            test_training_task()
            
            # Test 2: Batch predictions
            test_batch_prediction()
            
            # Test 3: Data quality
            test_data_quality_check()
            
            # Test 4: System health
            test_system_health()
        
        print("\n" + "=" * 50)
        print("✓ All tests completed!")
        print("=" * 50)
        print("\nNext steps:")
        print("  • View tasks in Flower: http://localhost:5555/tasks")
        print("  • Check worker logs: docker logs dataflow_celery_worker")
        print("  • API docs: http://localhost:8000/api/docs")
        
    except KeyboardInterrupt:
        print("\n\n⚠ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n✗ Test suite failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
