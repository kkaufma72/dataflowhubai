"""
Global error handling middleware.
"""

import logging
from typing import Callable

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from utils.errors import DataFlowError


logger = logging.getLogger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Middleware for handling unexpected errors and logging."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Handle request and catch any errors."""
        try:
            response = await call_next(request)
            return response

        except DataFlowError as error:
            # Handle custom application errors
            logger.warning(
                f"Application error: {error.message}",
                extra={
                    "status_code": error.status_code,
                    "details": error.details,
                    "path": request.url.path,
                    "method": request.method,
                },
            )
            return JSONResponse(
                status_code=error.status_code,
                content={
                    "error": {
                        "message": error.message,
                        "type": error.__class__.__name__,
                        "details": error.details,
                    }
                },
            )

        except ValueError as error:
            # Handle validation errors
            logger.warning(
                f"Value error: {str(error)}",
                extra={"path": request.url.path, "method": request.method},
            )
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={
                    "error": {
                        "message": str(error),
                        "type": "ValidationError",
                    }
                },
            )

        except Exception as error:
            # Handle unexpected errors
            logger.error(
                f"Unexpected error: {str(error)}",
                exc_info=True,
                extra={
                    "path": request.url.path,
                    "method": request.method,
                    "error_type": error.__class__.__name__,
                },
            )
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": {
                        "message": "An unexpected error occurred",
                        "type": "InternalServerError",
                    }
                },
            )


