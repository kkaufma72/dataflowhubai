#!/usr/bin/env python3
"""
Test script to dispatch tasks to CPU, IO, and GPU queues.
Run from repo root: python test-celery-queues.py
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from celery_app import celery_app

# Define test tasks that will route to each queue
@celery_app.task(bind=True, name='test_cpu_task')
def test_cpu_task(self):
    """Test task for CPU queue."""
    import time
    print(f"[CPU TASK] Started on worker {self.request.hostname}")
    time.sleep(2)
    result = sum(range(1000000))
    print(f"[CPU TASK] Completed: {result}")
    return {"queue": "cpu_tasks", "result": result}

@celery_app.task(bind=True, name='test_io_task')
def test_io_task(self):
    """Test task for IO queue."""
    import time
    print(f"[IO TASK] Started on worker {self.request.hostname}")
    time.sleep(3)
    print("[IO TASK] Simulating file operations...")
    return {"queue": "io_tasks", "result": "IO operations completed"}

@celery_app.task(bind=True, name='test_gpu_task')
def test_gpu_task(self):
    """Test task for GPU queue."""
    import time
    print(f"[GPU TASK] Started on worker {self.request.hostname}")
    time.sleep(1.5)
    print("[GPU TASK] Simulating GPU computation...")
    return {"queue": "gpu_tasks", "result": "GPU computation completed"}

if __name__ == '__main__':
    print("=" * 60)
    print("Dispatching test tasks to Celery queues...")
    print("=" * 60)
    
    # Dispatch to CPU queue
    cpu_result = test_cpu_task.apply_async(queue='cpu_tasks')
    print(f"✓ CPU task dispatched: {cpu_result.id} → cpu_tasks")
    
    # Dispatch to IO queue
    io_result = test_io_task.apply_async(queue='io_tasks')
    print(f"✓ IO task dispatched: {io_result.id} → io_tasks")
    
    # Dispatch to GPU queue
    gpu_result = test_gpu_task.apply_async(queue='gpu_tasks')
    print(f"✓ GPU task dispatched: {gpu_result.id} → gpu_tasks")
    
    print("\n" + "=" * 60)
    print("Check Flower UI at http://localhost:5555")
    print("Login: admin / floweradmin")
    print("=" * 60)
    print("\nTask IDs:")
    print(f"  CPU: {cpu_result.id}")
    print(f"  IO:  {io_result.id}")
    print(f"  GPU: {gpu_result.id}")
    print("\nWaiting for results (max 10 seconds)...")
    
    import time
    for task_name, task_result in [("CPU", cpu_result), ("IO", io_result), ("GPU", gpu_result)]:
        try:
            result = task_result.get(timeout=10)
            print(f"  ✓ {task_name}: {result}")
        except Exception as e:
            print(f"  ✗ {task_name}: {e}")
    
    print("\nDone! Check worker logs:")
    print("  docker-compose logs celery_worker_cpu")
    print("  docker-compose logs celery_worker_io")
    print("  docker-compose logs celery_worker_gpu")
