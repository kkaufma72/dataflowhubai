#!/usr/bin/env python3
"""
Test script for metrics batching performance.
Compares direct TimescaleDB writes vs batched API writes.
"""
import asyncio
import time
import httpx
from datetime import datetime
import random
import statistics


async def test_direct_writes(num_metrics: int = 1000):
    """Test direct TimescaleDB writes (old way)"""
    import sys
    import os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
    
    from backend.lib.timescale_client import TimescaleClient
    
    client = TimescaleClient()
    
    print(f"\n{'='*60}")
    print(f"Testing DIRECT writes ({num_metrics} metrics)")
    print(f"{'='*60}")
    
    start = time.time()
    
    for i in range(num_metrics):
        client.write_metric(
            metric_name="test_metric",
            value=random.random() * 100,
            model_id=f"model_{i % 10}",
            tags={"test": "direct"}
        )
    
    elapsed = time.time() - start
    
    print(f"✓ Wrote {num_metrics} metrics in {elapsed:.2f}s")
    print(f"  Throughput: {num_metrics / elapsed:.0f} metrics/sec")
    print(f"  Avg latency: {elapsed / num_metrics * 1000:.2f}ms per metric")
    
    return elapsed


async def test_batched_writes(num_metrics: int = 1000, batch_size: int = 100):
    """Test batched API writes (new way)"""
    print(f"\n{'='*60}")
    print(f"Testing BATCHED writes ({num_metrics} metrics, batch_size={batch_size})")
    print(f"{'='*60}")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        start = time.time()
        
        # Send in batches
        for batch_start in range(0, num_metrics, batch_size):
            batch_end = min(batch_start + batch_size, num_metrics)
            
            metrics = [
                {
                    "metric_name": "test_metric",
                    "value": random.random() * 100,
                    "model_id": f"model_{i % 10}",
                    "tags": {"test": "batched"}
                }
                for i in range(batch_start, batch_end)
            ]
            
            response = await client.post(
                "http://localhost:8000/api/metrics/batch",
                json={"metrics": metrics}
            )
            response.raise_for_status()
        
        # Wait for flush
        print("  Waiting for flush...")
        await asyncio.sleep(6)
        
        elapsed = time.time() - start
        
        print(f"✓ Wrote {num_metrics} metrics in {elapsed:.2f}s")
        print(f"  Throughput: {num_metrics / elapsed:.0f} metrics/sec")
        print(f"  Avg latency: {elapsed / num_metrics * 1000:.2f}ms per metric")
        
        # Get stats
        stats_response = await client.get("http://localhost:8000/api/metrics/stats")
        stats = stats_response.json()
        
        print(f"\n  Batcher stats:")
        print(f"    Total received: {stats['total_received']}")
        print(f"    Total flushed: {stats['total_flushed']}")
        print(f"    Flush count: {stats['flush_count']}")
        print(f"    Dropped: {stats['dropped_count']}")
        
        return elapsed


async def test_concurrent_writes(num_workers: int = 10, metrics_per_worker: int = 100):
    """Test concurrent batched writes"""
    print(f"\n{'='*60}")
    print(f"Testing CONCURRENT writes ({num_workers} workers × {metrics_per_worker} metrics)")
    print(f"{'='*60}")
    
    async def worker(worker_id: int):
        async with httpx.AsyncClient(timeout=30.0) as client:
            for i in range(metrics_per_worker):
                await client.post(
                    "http://localhost:8000/api/metrics/single",
                    json={
                        "metric_name": f"worker_metric_{worker_id}",
                        "value": random.random() * 100,
                        "tags": {"worker": str(worker_id)}
                    }
                )
    
    start = time.time()
    
    # Run workers concurrently
    await asyncio.gather(*[worker(i) for i in range(num_workers)])
    
    # Wait for flush
    print("  Waiting for flush...")
    await asyncio.sleep(6)
    
    elapsed = time.time() - start
    total_metrics = num_workers * metrics_per_worker
    
    print(f"✓ Wrote {total_metrics} metrics in {elapsed:.2f}s")
    print(f"  Throughput: {total_metrics / elapsed:.0f} metrics/sec")
    print(f"  Avg latency: {elapsed / total_metrics * 1000:.2f}ms per metric")


async def main():
    print("\n" + "="*60)
    print("METRICS BATCHING PERFORMANCE TEST")
    print("="*60)
    
    # Small test first
    print("\n[1/4] Warmup test (100 metrics)")
    await test_batched_writes(num_metrics=100, batch_size=50)
    
    # Performance comparison
    print("\n[2/4] Performance comparison (1000 metrics)")
    
    try:
        direct_time = await test_direct_writes(num_metrics=1000)
    except Exception as e:
        print(f"  ✗ Direct writes failed: {e}")
        direct_time = None
    
    batched_time = await test_batched_writes(num_metrics=1000, batch_size=100)
    
    if direct_time:
        speedup = direct_time / batched_time
        print(f"\n  SPEEDUP: {speedup:.1f}x faster with batching!")
    
    # Larger batch test
    print("\n[3/4] Large batch test (10,000 metrics)")
    await test_batched_writes(num_metrics=10000, batch_size=500)
    
    # Concurrent test
    print("\n[4/4] Concurrent writes test")
    await test_concurrent_writes(num_workers=10, metrics_per_worker=100)
    
    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60)
    
    # Final stats
    async with httpx.AsyncClient() as client:
        stats_response = await client.get("http://localhost:8000/api/metrics/stats")
        stats = stats_response.json()
        
        print("\nFinal batcher statistics:")
        print(f"  Total received: {stats['total_received']}")
        print(f"  Total flushed: {stats['total_flushed']}")
        print(f"  Flush count: {stats['flush_count']}")
        print(f"  Dropped: {stats['dropped_count']}")
        print(f"  Currently buffered: {stats['total_buffered']}")


if __name__ == '__main__':
    asyncio.run(main())
