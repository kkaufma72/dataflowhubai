"""
Configuration management using Pydantic Settings.
"""

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "DataFlowHub AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_WORKERS: int = 4

    # CORS
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:3002",
            "http://localhost:5173",
            "https://dataflowhub.ai",
        ]
    )

    # PostgreSQL - Main Database
    # NOTE: docker-compose sets DATABASE_URL; support both styles.
    DATABASE_URL: str = ""
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "dataflow_user"
    POSTGRES_PASSWORD: str = "dataflow_secure_password"
    POSTGRES_DB: str = "dataflow_hub"
    POSTGRES_MAX_CONNECTIONS: int = 50
    POSTGRES_MIN_CONNECTIONS: int = 10

    # TimescaleDB - Time-series Database
    TIMESCALEDB_HOST: str = "localhost"
    TIMESCALEDB_PORT: int = 5433
    TIMESCALEDB_USER: str = "tsdata_user"
    TIMESCALEDB_PASSWORD: str = "timescale_secure_password"
    TIMESCALEDB_DB: str = "timeseries_db"

    # Redis - Cache and Queue
    # NOTE: docker-compose sets REDIS_URL; support both styles.
    REDIS_URL: str = ""
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0
    REDIS_MAX_CONNECTIONS: int = 50
    REDIS_CACHE_TTL: int = 3600  # 1 hour

    # Neo4j - Knowledge Graph
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "dataflow_secure_password"
    NEO4J_DATABASE: str = "neo4j"

    # MinIO - Object Storage
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin_secure_password"
    MINIO_SECURE: bool = False
    MINIO_BUCKET: str = "dataflow-datasets"

    # Kafka - Event Streaming
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_CONSUMER_GROUP: str = "dataflow-api"
    KAFKA_TOPICS_PREFIX: str = "dataflow"

    # Supabase - Authentication
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # JWT Configuration
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ML Configuration
    ML_MAX_TRAINING_TIME: int = 3600  # 1 hour
    ML_MAX_DATASET_SIZE_MB: int = 1000  # 1 GB
    ML_SUPPORTED_ALGORITHMS: List[str] = Field(
        default_factory=lambda: [
            "random_forest",
            "gradient_boosting",
            "xgboost",
            "lightgbm",
            "neural_network",
            "svm",
            "linear_regression",
            "logistic_regression",
        ]
    )

    # Storage Configuration
    UPLOAD_MAX_SIZE_MB: int = 500
    UPLOAD_ALLOWED_EXTENSIONS: List[str] = Field(
        default_factory=lambda: [".csv", ".json", ".parquet", ".xlsx"]
    )

    # Monitoring
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    LOG_LEVEL: str = "INFO"

    @property
    def postgres_url(self) -> str:
        """Get PostgreSQL connection URL."""
        if self.DATABASE_URL:
            url = self.DATABASE_URL.strip()
            # SQLAlchemy async engine expects postgresql+asyncpg
            if url.startswith("postgresql+asyncpg://"):
                return url
            if url.startswith("postgresql://"):
                return url.replace("postgresql://", "postgresql+asyncpg://", 1)
            if url.startswith("postgres://"):
                return url.replace("postgres://", "postgresql+asyncpg://", 1)
            return url
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def timescaledb_url(self) -> str:
        """Get TimescaleDB connection URL."""
        return (
            f"postgresql+asyncpg://{self.TIMESCALEDB_USER}:{self.TIMESCALEDB_PASSWORD}"
            f"@{self.TIMESCALEDB_HOST}:{self.TIMESCALEDB_PORT}/{self.TIMESCALEDB_DB}"
        )

    @property
    def redis_url(self) -> str:
        """Get Redis connection URL."""
        if self.REDIS_URL:
            return self.REDIS_URL.strip()
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()


