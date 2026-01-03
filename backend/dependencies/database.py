"""
Database connection management and dependency injection.
"""

import logging
from typing import AsyncGenerator

from fastapi import HTTPException, status
import redis.asyncio as aioredis
from minio import Minio
from neo4j import AsyncGraphDatabase, AsyncDriver
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from utils.config import settings

logger = logging.getLogger(__name__)


# Database Engines and Clients
postgres_engine = None
timescaledb_engine = None
redis_client = None
neo4j_driver = None
minio_client = None

# Session Makers
AsyncSessionLocal = None
TimescaleSessionLocal = None


async def initialize_database_connections() -> None:
    """Initialize all database connections on application startup."""
    global postgres_engine, timescaledb_engine, redis_client, neo4j_driver, minio_client
    global AsyncSessionLocal, TimescaleSessionLocal

    # PostgreSQL
    postgres_engine = create_async_engine(
        settings.postgres_url,
        echo=settings.DEBUG,
        pool_size=settings.POSTGRES_MAX_CONNECTIONS,
        max_overflow=20,
        pool_pre_ping=True,
    )
    AsyncSessionLocal = async_sessionmaker(
        postgres_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    # Check if we're in a cloud environment (skip localhost services)
    is_cloud_env = settings.ENVIRONMENT.lower() in ("production", "railway", "staging")

    # TimescaleDB (optional - may not be available in all environments)
    skip_timescaledb = (
        is_cloud_env and 
        (settings.TIMESCALEDB_HOST == "localhost" or settings.TIMESCALEDB_HOST == "timescaledb")
    )
    
    if skip_timescaledb:
        logger.info("⚠ TimescaleDB disabled (localhost endpoint in cloud environment)")
        timescaledb_engine = None
        TimescaleSessionLocal = None
    else:
        try:
            timescaledb_engine = create_async_engine(
                settings.timescaledb_url,
                echo=settings.DEBUG,
                pool_size=20,
                max_overflow=10,
                pool_pre_ping=True,
            )
            TimescaleSessionLocal = async_sessionmaker(
                timescaledb_engine,
                class_=AsyncSession,
                expire_on_commit=False,
            )
            logger.info("✓ TimescaleDB connection established")
        except Exception as e:
            logger.warning(f"TimescaleDB connection failed (optional service): {e}")
            timescaledb_engine = None
            TimescaleSessionLocal = None

    # Redis (optional for caching, but recommended)
    skip_redis = (
        is_cloud_env and 
        settings.REDIS_HOST in ("localhost", "redis")
    )
    
    if skip_redis:
        logger.info("⚠ Redis disabled (localhost endpoint in cloud environment)")
        redis_client = None
    else:
        try:
            redis_client = await aioredis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
                max_connections=settings.REDIS_MAX_CONNECTIONS,
            )
            logger.info("✓ Redis connection established")
        except Exception as e:
            logger.warning(f"Redis connection failed (optional service): {e}")
            redis_client = None

    # Neo4j (optional - may not be available in all environments)
    skip_neo4j = (
        is_cloud_env and 
        ("localhost" in settings.NEO4J_URI or "neo4j://" in settings.NEO4J_URI)
    )
    
    if skip_neo4j:
        logger.info("⚠ Neo4j disabled (localhost endpoint in cloud environment)")
        neo4j_driver = None
    else:
        try:
            neo4j_driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
        )
        logger.info("✓ Neo4j connection established")
    except Exception as e:
        logger.warning(f"Neo4j connection failed (optional service): {e}")
        neo4j_driver = None

    # MinIO (optional - may not be available in all environments)
    skip_minio = (
        is_cloud_env and 
        settings.MINIO_ENDPOINT.startswith("localhost")
    )
    
    if skip_minio:
        logger.info("⚠ MinIO disabled (localhost endpoint in cloud environment)")
        minio_client = None
    else:
        try:
            minio_client = Minio(
                settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE,
            )
            # Test connection and ensure bucket exists
            if not minio_client.bucket_exists(settings.MINIO_BUCKET):
                minio_client.make_bucket(settings.MINIO_BUCKET)
            logger.info("✓ MinIO connection established")
        except Exception as e:
            logger.warning(f"MinIO connection failed (optional service): {e}")
            minio_client = None

async def close_database_connections() -> None:
    """Close all database connections on application shutdown."""
    global postgres_engine, timescaledb_engine, redis_client, neo4j_driver

    if postgres_engine:
        await postgres_engine.dispose()

    if timescaledb_engine:
        await timescaledb_engine.dispose()

    if redis_client:
        await redis_client.close()

    if neo4j_driver:
        await neo4j_driver.close()

# Dependency Functions


async def get_postgres_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get PostgreSQL database session."""
    if AsyncSessionLocal is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not initialized. Backend startup may have failed.",
        )
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_timescaledb_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get TimescaleDB database session."""
    if TimescaleSessionLocal is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TimescaleDB not initialized. Backend startup may have failed.",
        )
    async with TimescaleSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def get_redis_client() -> aioredis.Redis | None:
    """Dependency to get Redis client."""
    if redis_client is None:
        logger.warning("Redis client not available")
    return redis_client


def get_neo4j_driver() -> AsyncDriver | None:
    """Dependency to get Neo4j driver."""
    if neo4j_driver is None:
        logger.warning("Neo4j driver not available")
    return neo4j_driver


def get_minio_client() -> Minio | None:
    """Dependency to get MinIO client."""
    if minio_client is None:
        logger.warning("MinIO client not available")
    return minio_client

