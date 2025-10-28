"""
Performance monitoring middleware.
"""

import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from prometheus_client import Counter, Histogram


# Prometheus metrics
http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
)


class PerformanceMiddleware(BaseHTTPMiddleware):
    """Middleware for performance monitoring and metrics collection."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Monitor request performance and collect metrics."""
        # Start timer
        start_time = time.time()

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration = time.time() - start_time

        # Record metrics
        endpoint = request.url.path
        method = request.method
        status_code = response.status_code

        http_requests_total.labels(
            method=method,
            endpoint=endpoint,
            status=status_code,
        ).inc()

        http_request_duration_seconds.labels(
            method=method,
            endpoint=endpoint,
        ).observe(duration)

        return response


