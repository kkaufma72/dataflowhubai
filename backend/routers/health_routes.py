"""
Health check and system status routes.
"""

import time
from datetime import datetime

from fastapi import APIRouter, Depends
from minio import Minio
from neo4j import AsyncDriver
from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.database import (
    get_minio_client,
    get_neo4j_driver,
    get_postgres_session,
    get_redis_client,
    get_timescaledb_session,
)
from schemas.monitoring import HealthCheckResponse
from utils.config import settings


router = APIRouter()

start_time = time.time()


@router.get("/health", response_model=HealthCheckResponse)
async def health_check(
    postgres_session: AsyncSession = Depends(get_postgres_session),
    timescaledb_session: AsyncSession = Depends(get_timescaledb_session),
    redis_client: Redis = Depends(get_redis_client),
    neo4j_driver: AsyncDriver = Depends(get_neo4j_driver),
    minio_client: Minio = Depends(get_minio_client),
) -> HealthCheckResponse:
    """
    Comprehensive health check for all services.
    
    Includes metrics batcher status.
    
    Returns:
        HealthCheckResponse with status of all services
    """
    services = {}

    # Check PostgreSQL
    try:
        result = await postgres_session.execute(text("SELECT 1"))
        result.scalar()
        services["postgres"] = {"status": "healthy", "message": "Connected"}
    except Exception as e:
        services["postgres"] = {"status": "unhealthy", "message": str(e)}

    # Check TimescaleDB
    try:
        result = await timescaledb_session.execute(text("SELECT 1"))
        result.scalar()
        services["timescaledb"] = {"status": "healthy", "message": "Connected"}
    except Exception as e:
        services["timescaledb"] = {"status": "unhealthy", "message": str(e)}

    # Check Redis
    try:
        await redis_client.ping()
        services["redis"] = {"status": "healthy", "message": "Connected"}
    except Exception as e:
        services["redis"] = {"status": "unhealthy", "message": str(e)}

    # Check Neo4j
    try:
        async with neo4j_driver.session() as session:
            result = await session.run("RETURN 1")
            await result.single()
        services["neo4j"] = {"status": "healthy", "message": "Connected"}
    except Exception as e:
        services["neo4j"] = {"status": "unhealthy", "message": str(e)}

    # Check MinIO
    try:
        minio_client.bucket_exists(settings.MINIO_BUCKET)
        services["minio"] = {"status": "healthy", "message": "Connected"}
    except Exception as e:
        services["minio"] = {"status": "unhealthy", "message": str(e)}

    # Check Metrics Batcher
    try:
        from lib.metrics_batcher import get_batcher
        batcher = get_batcher()
        stats = batcher.get_stats()
        
        if stats["running"]:
            services["metrics_batcher"] = {
                "status": "healthy",
                "message": f"Buffered: {stats['total_buffered']}, Flushed: {stats['total_flushed']}"
            }
        else:
            services["metrics_batcher"] = {
                "status": "unhealthy",
                "message": "Not running"
            }
    except Exception as e:
        services["metrics_batcher"] = {"status": "unhealthy", "message": str(e)}

    # Determine overall status
    all_healthy = all(s["status"] == "healthy" for s in services.values())
    overall_status = "healthy" if all_healthy else "degraded"

    return HealthCheckResponse(
        status=overall_status,
        timestamp=datetime.utcnow(),
        version=settings.APP_VERSION,
        services=services,
        uptime_seconds=time.time() - start_time,
    )


@router.get("/health/ready")
async def readiness_check() -> dict[str, str]:
    """
    Kubernetes readiness probe endpoint.
    
    Returns:
        Simple status response
    """
    return {"status": "ready"}


@router.get("/health/live")
async def liveness_check() -> dict[str, str]:
    """
    Kubernetes liveness probe endpoint.
    
    Returns:
        Simple status response
    """
    return {"status": "alive"}

