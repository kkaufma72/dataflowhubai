#!/usr/bin/env python3
"""
Test script for TimescaleDB metrics endpoints.
Tests all CRUD operations for metrics recording and retrieval.
"""

import asyncio
import json
from datetime import datetime, timedelta
from uuid import uuid4

import httpx


BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/monitoring"

# Test data
TEST_MODEL_ID = str(uuid4())
TEST_USER_TOKEN = "YOUR_AUTH_TOKEN_HERE"  # Replace with actual token


async def test_record_metrics():
    """Test recording model metrics."""
    print("\n" + "=" * 70)
    print("TEST 1: Record Model Metrics")
    print("=" * 70)
    
    url = f"{API_BASE}/metrics/{TEST_MODEL_ID}"
    metrics = {
        "accuracy": 0.95,
        "precision": 0.92,
        "recall": 0.94,
        "f1_score": 0.93,
    }
    
    headers = {"Authorization": f"Bearer {TEST_USER_TOKEN}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=metrics, headers=headers)
        
        if response.status_code == 200:
            print("✓ Metrics recorded successfully")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"✗ Failed: {response.status_code}")
            print(response.text)
    
    return response.status_code == 200


async def test_get_metrics():
    """Test retrieving model metrics."""
    print("\n" + "=" * 70)
    print("TEST 2: Get Model Metrics (Raw)")
    print("=" * 70)
    
    url = f"{API_BASE}/metrics/{TEST_MODEL_ID}"
    params = {
        "start_time": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
        "end_time": datetime.utcnow().isoformat(),
        "limit": 10,
    }
    
    headers = {"Authorization": f"Bearer {TEST_USER_TOKEN}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Retrieved {len(data)} metrics")
            if data:
                print("\nFirst metric:")
                print(json.dumps(data[0], indent=2))
        else:
            print(f"✗ Failed: {response.status_code}")
            print(response.text)
    
    return response.status_code == 200


async def test_get_aggregated_metrics():
    """Test retrieving aggregated metrics."""
    print("\n" + "=" * 70)
    print("TEST 3: Get Aggregated Metrics (Time-Bucketed)")
    print("=" * 70)
    
    url = f"{API_BASE}/metrics/{TEST_MODEL_ID}/aggregated"
    params = {
        "start_time": (datetime.utcnow() - timedelta(days=1)).isoformat(),
        "end_time": datetime.utcnow().isoformat(),
        "interval": "1 hour",
    }
    
    headers = {"Authorization": f"Bearer {TEST_USER_TOKEN}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Retrieved {len(data)} time buckets")
            if data:
                print("\nFirst bucket:")
                print(json.dumps(data[0], indent=2))
        else:
            print(f"✗ Failed: {response.status_code}")
            print(response.text)
    
    return response.status_code == 200


async def test_log_prediction():
    """Test logging a prediction."""
    print("\n" + "=" * 70)
    print("TEST 4: Log Prediction")
    print("=" * 70)
    
    url = f"{API_BASE}/predictions/{TEST_MODEL_ID}/log"
    prediction_data = {
        "input_data": {"feature1": 1.2, "feature2": 3.4, "feature3": 5.6},
        "prediction": {"class": "A", "probability": 0.87},
        "confidence_score": 0.87,
        "response_time_ms": 45.2,
    }
    
    headers = {"Authorization": f"Bearer {TEST_USER_TOKEN}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=prediction_data, headers=headers)
        
        if response.status_code == 200:
            print("✓ Prediction logged successfully")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"✗ Failed: {response.status_code}")
            print(response.text)
    
    return response.status_code == 200


async def test_prediction_stats():
    """Test getting prediction statistics."""
    print("\n" + "=" * 70)
    print("TEST 5: Get Prediction Statistics")
    print("=" * 70)
    
    url = f"{API_BASE}/predictions/{TEST_MODEL_ID}/stats"
    params = {
        "start_time": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
        "end_time": datetime.utcnow().isoformat(),
    }
    
    headers = {"Authorization": f"Bearer {TEST_USER_TOKEN}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, headers=headers)
        
        if response.status_code == 200:
            print("✓ Prediction stats retrieved")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"✗ Failed: {response.status_code}")
            print(response.text)
    
    return response.status_code == 200


async def test_record_training_metrics():
    """Test recording training metrics."""
    print("\n" + "=" * 70)
    print("TEST 6: Record Training Metrics")
    print("=" * 70)
    
    url = f"{API_BASE}/training/{TEST_MODEL_ID}/metrics"
    
    headers = {"Authorization": f"Bearer {TEST_USER_TOKEN}"}
    
    # Record metrics for 3 epochs
    for epoch in range(3):
        payload = {
            "epoch": epoch,
            "metrics": {
                "loss": 0.5 - (epoch * 0.1),
                "val_loss": 0.6 - (epoch * 0.1),
                "accuracy": 0.7 + (epoch * 0.05),
                "val_accuracy": 0.65 + (epoch * 0.05),
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                print(f"✓ Epoch {epoch} metrics recorded")
            else:
                print(f"✗ Epoch {epoch} failed: {response.status_code}")
                return False
    
    return True


async def test_get_training_history():
    """Test retrieving training history."""
    print("\n" + "=" * 70)
    print("TEST 7: Get Training History")
    print("=" * 70)
    
    url = f"{API_BASE}/training/{TEST_MODEL_ID}/history"
    params = {"metric_name": "loss"}
    
    headers = {"Authorization": f"Bearer {TEST_USER_TOKEN}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Retrieved {len(data)} training records")
            if data:
                print("\nTraining progression:")
                for record in data:
                    print(f"  Epoch {record['epoch']}: {record['metric_name']} = {record['metric_value']:.4f}")
        else:
            print(f"✗ Failed: {response.status_code}")
            print(response.text)
    
    return response.status_code == 200


async def run_all_tests():
    """Run all tests in sequence."""
    print("\n" + "=" * 70)
    print("TimescaleDB Metrics API Test Suite")
    print("=" * 70)
    print(f"\nTest Model ID: {TEST_MODEL_ID}")
    print(f"API Base URL: {API_BASE}")
    
    if TEST_USER_TOKEN == "YOUR_AUTH_TOKEN_HERE":
        print("\n⚠️  WARNING: Using placeholder auth token")
        print("   Set TEST_USER_TOKEN variable with a real token for authenticated tests")
    
    results = []
    
    # Run tests
    results.append(("Record Metrics", await test_record_metrics()))
    await asyncio.sleep(1)  # Brief pause between tests
    
    results.append(("Get Metrics", await test_get_metrics()))
    await asyncio.sleep(1)
    
    results.append(("Get Aggregated Metrics", await test_get_aggregated_metrics()))
    await asyncio.sleep(1)
    
    results.append(("Log Prediction", await test_log_prediction()))
    await asyncio.sleep(1)
    
    results.append(("Prediction Stats", await test_prediction_stats()))
    await asyncio.sleep(1)
    
    results.append(("Record Training Metrics", await test_record_training_metrics()))
    await asyncio.sleep(1)
    
    results.append(("Get Training History", await test_get_training_history()))
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    for test_name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{status:<12} {test_name}")
    
    total = len(results)
    passed = sum(1 for _, p in results if p)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")


if __name__ == "__main__":
    try:
        asyncio.run(run_all_tests())
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
    except Exception as e:
        print(f"\n✗ Test suite error: {e}")
        import traceback
        traceback.print_exc()
