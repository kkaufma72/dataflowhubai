"""
Custom error types and error factories for consistent error handling.
"""

from typing import Any, Dict, Optional

from fastapi import HTTPException, status


class DataFlowError(Exception):
    """Base exception for DataFlowHub AI errors."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(DataFlowError):
    """Raised when input validation fails."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
        )


class NotFoundError(DataFlowError):
    """Raised when a resource is not found."""

    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            message=f"{resource} with ID '{resource_id}' not found",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"resource": resource, "id": resource_id},
        )


class AuthenticationError(DataFlowError):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class AuthorizationError(DataFlowError):
    """Raised when user lacks required permissions."""

    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
        )


class ResourceExistsError(DataFlowError):
    """Raised when attempting to create a resource that already exists."""

    def __init__(self, resource: str, identifier: str):
        super().__init__(
            message=f"{resource} '{identifier}' already exists",
            status_code=status.HTTP_409_CONFLICT,
            details={"resource": resource, "identifier": identifier},
        )


class DatabaseError(DataFlowError):
    """Raised when a database operation fails."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Database error: {message}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
        )


class StorageError(DataFlowError):
    """Raised when a storage operation fails."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Storage error: {message}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
        )


class TrainingError(DataFlowError):
    """Raised when model training fails."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Training error: {message}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
        )


class RateLimitError(DataFlowError):
    """Raised when rate limit is exceeded."""

    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )


class ServiceUnavailableError(DataFlowError):
    """Raised when a service is temporarily unavailable."""

    def __init__(self, service: str, message: Optional[str] = None):
        super().__init__(
            message=message or f"Service '{service}' is temporarily unavailable",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details={"service": service},
        )


# Error Factory Functions


def create_validation_error(field: str, message: str) -> ValidationError:
    """Create a validation error for a specific field."""
    return ValidationError(
        message=f"Validation failed for field '{field}'",
        details={"field": field, "error": message},
    )


def create_not_found_error(resource: str, resource_id: str) -> NotFoundError:
    """Create a not found error."""
    return NotFoundError(resource=resource, resource_id=resource_id)


def create_http_exception(
    status_code: int,
    message: str,
    details: Optional[Dict[str, Any]] = None,
) -> HTTPException:
    """Create an HTTPException with standardized format."""
    return HTTPException(
        status_code=status_code,
        detail={
            "message": message,
            "details": details or {},
        },
    )


def handle_database_error(error: Exception) -> DatabaseError:
    """Convert database exception to DatabaseError."""
    error_message = str(error)
    return DatabaseError(
        message=error_message,
        details={"original_error": error.__class__.__name__},
    )


def handle_storage_error(error: Exception) -> StorageError:
    """Convert storage exception to StorageError."""
    error_message = str(error)
    return StorageError(
        message=error_message,
        details={"original_error": error.__class__.__name__},
    )


