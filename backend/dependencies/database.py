"""
Database connection management and dependency injection.
"""

from typing import AsyncGenerator

import redis.asyncio as aioredis
from aiokafka import AIOKafkaProducer
from minio import Minio
from neo4j import AsyncGraphDatabase, AsyncDriver
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from utils.config import settings


# Database Engines and Clients
postgres_engine = None
timescaledb_engine = None
redis_client = None
neo4j_driver = None
minio_client = None
kafka_producer = None

# Session Makers
AsyncSessionLocal = None
TimescaleSessionLocal = None


async def initialize_database_connections() -> None:
    """Initialize all database connections on application startup."""
    global postgres_engine, timescaledb_engine, redis_client, neo4j_driver, minio_client, kafka_producer
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

    # TimescaleDB
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

    # Redis
    redis_client = await aioredis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
        max_connections=settings.REDIS_MAX_CONNECTIONS,
    )

    # Neo4j
    neo4j_driver = AsyncGraphDatabase.driver(
        settings.NEO4J_URI,
        auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
    )

    # MinIO
    minio_client = Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )

    # Ensure bucket exists
    if not minio_client.bucket_exists(settings.MINIO_BUCKET):
        minio_client.make_bucket(settings.MINIO_BUCKET)

    # Kafka Producer
    kafka_producer = AIOKafkaProducer(
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
    )
    await kafka_producer.start()


async def close_database_connections() -> None:
    """Close all database connections on application shutdown."""
    global postgres_engine, timescaledb_engine, redis_client, neo4j_driver, kafka_producer

    if postgres_engine:
        await postgres_engine.dispose()

    if timescaledb_engine:
        await timescaledb_engine.dispose()

    if redis_client:
        await redis_client.close()

    if neo4j_driver:
        await neo4j_driver.close()

    if kafka_producer:
        await kafka_producer.stop()


# Dependency Functions


async def get_postgres_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get PostgreSQL database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_timescaledb_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get TimescaleDB database session."""
    async with TimescaleSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def get_redis_client() -> aioredis.Redis:
    """Dependency to get Redis client."""
    return redis_client


def get_neo4j_driver() -> AsyncDriver:
    """Dependency to get Neo4j driver."""
    return neo4j_driver


def get_minio_client() -> Minio:
    """Dependency to get MinIO client."""
    return minio_client


def get_kafka_producer() -> AIOKafkaProducer:
    """Dependency to get Kafka producer."""
    return kafka_producer


