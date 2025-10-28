"""
DataFlowHub AI - FastAPI Backend
Enterprise AutoML Platform API
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from dependencies.database import (
    close_database_connections,
    initialize_database_connections,
)
from middleware.error_handler import ErrorHandlerMiddleware
from middleware.logging import LoggingMiddleware
from middleware.performance import PerformanceMiddleware
from routers import (
    analytics_routes,
    auth_routes,
    data_routes,
    deployment_routes,
    health_routes,
    knowledge_graph_routes,
    ml_routes,
    monitoring_routes,
    pipeline_routes,
)
from utils.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifecycle: startup and shutdown events."""
    # Startup
    await initialize_database_connections()
    yield
    # Shutdown
    await close_database_connections()


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="DataFlowHub AI API",
        description="Enterprise AutoML Platform - Build, train, and deploy ML models without specialized expertise",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # CORS Configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Compression
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # Custom Middleware (order matters - first added is outermost)
    app.add_middleware(ErrorHandlerMiddleware)
    app.add_middleware(PerformanceMiddleware)
    app.add_middleware(LoggingMiddleware)

    # Include Routers
    app.include_router(health_routes.router, prefix="/api", tags=["Health"])
    app.include_router(auth_routes.router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(data_routes.router, prefix="/api/data", tags=["Data Management"])
    app.include_router(ml_routes.router, prefix="/api/ml", tags=["Machine Learning"])
    app.include_router(deployment_routes.router, prefix="/api/deploy", tags=["Deployment"])
    app.include_router(monitoring_routes.router, prefix="/api/monitoring", tags=["Monitoring"])
    app.include_router(pipeline_routes.router, prefix="/api/pipelines", tags=["Pipelines"])
    app.include_router(knowledge_graph_routes.router, prefix="/api/knowledge", tags=["Knowledge Graph"])
    app.include_router(analytics_routes.router, prefix="/api/analytics", tags=["Analytics"])

    return app


app = create_application()


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint - API information."""
    return {
        "name": "DataFlowHub AI API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/api/docs",
    }


