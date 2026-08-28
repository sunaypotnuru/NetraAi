"""
Custom exception classes for NetraAI core backend.

This module defines a standardized hierarchy of exceptions used throughout
the application for better error handling, logging, and API responses.
"""

from typing import Any, Dict, Optional
from fastapi import status


class NetraAIError(Exception):
    """
    Base exception for all NetraAI application errors.

    Attributes:
        message: Human-readable error message
        details: Additional context about the error
        status_code: HTTP status code to return for this error
    """

    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
    ):
        """
        Initialize the exception.

        Args:
            message: Error message
            details: Optional dictionary with additional error context
            status_code: HTTP status code for API responses
        """
        super().__init__(message)
        self.message = message
        self.details = details or {}
        self.status_code = status_code

    def __str__(self) -> str:
        """Return string representation of the error."""
        if self.details:
            details_str = ", ".join(f"{k}={v}" for k, v in self.details.items())
            return f"{self.message} ({details_str})"
        return self.message

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API responses."""
        return {
            "error": self.__class__.__name__,
            "message": self.message,
            "details": self.details,
        }


# ==================== Authentication & Authorization ====================


class AuthenticationError(NetraAIError):
    """
    Raised when authentication fails.

    Examples:
        - Invalid credentials
        - Expired tokens
        - Missing authentication headers
    """

    def __init__(
        self,
        message: str = "Authentication failed",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, details, status.HTTP_401_UNAUTHORIZED)


class AuthorizationError(NetraAIError):
    """
    Raised when user lacks required permissions.

    Examples:
        - Accessing admin-only endpoints
        - Modifying resources owned by other users
        - Role-based access violations
    """

    def __init__(
        self,
        message: str = "Permission denied",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, details, status.HTTP_403_FORBIDDEN)


class TokenExpiredError(AuthenticationError):
    """Raised when JWT or session token has expired."""

    def __init__(
        self,
        message: str = "Token has expired",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, details)


class InvalidTokenError(AuthenticationError):
    """Raised when token signature or format is invalid."""

    def __init__(
        self, message: str = "Invalid token", details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, details)


# ==================== Validation & Input Errors ====================


class ValidationError(NetraAIError):
    """
    Raised when input validation fails.

    Examples:
        - Invalid email format
        - Missing required fields
        - Data type mismatches
        - Business rule violations
    """

    def __init__(
        self,
        message: str = "Validation failed",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, details, status.HTTP_422_UNPROCESSABLE_ENTITY)


class InvalidInputError(ValidationError):
    """Raised when user input is malformed or invalid."""

    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if field:
            details = details or {}
            details["field"] = field
        super().__init__(message, details)


class MissingFieldError(ValidationError):
    """Raised when required field is missing."""

    def __init__(self, field: str, details: Optional[Dict[str, Any]] = None):
        details = details or {}
        details["field"] = field
        super().__init__(f"Required field missing: {field}", details)


# ==================== Resource Errors ====================


class ResourceError(NetraAIError):
    """Base class for resource-related errors."""

    pass


class ResourceNotFoundError(ResourceError):
    """
    Raised when requested resource doesn't exist.

    Examples:
        - User ID not found
        - Appointment not found
        - Model not found
    """

    def __init__(
        self,
        resource_type: str,
        resource_id: Any,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        details.update({"resource_type": resource_type, "resource_id": resource_id})
        message = f"{resource_type} with ID '{resource_id}' not found"
        super().__init__(message, details, status.HTTP_404_NOT_FOUND)


class ResourceAlreadyExistsError(ResourceError):
    """
    Raised when attempting to create duplicate resource.

    Examples:
        - Email already registered
        - Appointment slot already booked
        - Duplicate database entry
    """

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, details, status.HTTP_409_CONFLICT)


class ResourceConflictError(ResourceError):
    """
    Raised when resource operation conflicts with current state.

    Examples:
        - Canceling completed appointment
        - Deleting resource with active dependencies
        - Version conflicts in concurrent updates
    """

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, details, status.HTTP_409_CONFLICT)


# ==================== Service & Infrastructure Errors ====================


class ServiceError(NetraAIError):
    """Base class for service-level errors."""

    pass


class ServiceUnavailableError(ServiceError):
    """
    Raised when external service is unavailable.

    Examples:
        - Database connection failure
        - External API timeout
        - Message queue unavailable
        - AI model service down
    """

    def __init__(
        self,
        service_name: str,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        details["service"] = service_name
        message = message or f"{service_name} service is currently unavailable"
        super().__init__(message, details, status.HTTP_503_SERVICE_UNAVAILABLE)


class DatabaseError(ServiceError):
    """
    Raised when database operations fail.

    Examples:
        - Connection timeout
        - Query execution failure
        - Transaction rollback
        - Constraint violations
    """

    def __init__(
        self,
        message: str = "Database operation failed",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, details, status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExternalAPIError(ServiceError):
    """
    Raised when external API call fails.

    Examples:
        - Supabase API error
        - Payment gateway failure
        - Third-party service error
    """

    def __init__(
        self,
        api_name: str,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        details["api"] = api_name
        message = message or f"{api_name} API request failed"
        super().__init__(message, details, status.HTTP_502_BAD_GATEWAY)


# ==================== Configuration & System Errors ====================


class ConfigurationError(NetraAIError):
    """
    Raised when application configuration is invalid.

    Examples:
        - Missing required environment variables
        - Invalid configuration values
        - Misconfigured services
    """

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, details, status.HTTP_500_INTERNAL_SERVER_ERROR)


class MissingEnvironmentVariableError(ConfigurationError):
    """Raised when required environment variable is not set."""

    def __init__(self, variable_name: str, details: Optional[Dict[str, Any]] = None):
        details = details or {}
        details["variable"] = variable_name
        message = f"Required environment variable not set: {variable_name}"
        super().__init__(message, details)


# ==================== AI/ML Model Errors ====================


class ModelError(NetraAIError):
    """Base class for AI/ML model errors."""

    pass


class ModelNotFoundError(ModelError):
    """Raised when AI model file or service is not found."""

    def __init__(self, model_name: str, details: Optional[Dict[str, Any]] = None):
        details = details or {}
        details["model"] = model_name
        message = f"Model '{model_name}' not found or not loaded"
        super().__init__(message, details, status.HTTP_404_NOT_FOUND)


class ModelInferenceError(ModelError):
    """
    Raised when model inference/prediction fails.

    Examples:
        - Invalid input format
        - Model timeout
        - Inference computation error
    """

    def __init__(
        self,
        model_name: str,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        details["model"] = model_name
        message = message or f"Model inference failed: {model_name}"
        super().__init__(message, details, status.HTTP_500_INTERNAL_SERVER_ERROR)


class ImageProcessingError(ModelError):
    """
    Raised when image preprocessing or analysis fails.

    Examples:
        - Invalid image format
        - Corrupted image data
        - ROI extraction failure
    """

    def __init__(
        self,
        message: str = "Image processing failed",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, details, status.HTTP_422_UNPROCESSABLE_ENTITY)


# ==================== Business Logic Errors ====================


class BusinessLogicError(NetraAIError):
    """
    Base class for business rule violations.

    Examples:
        - Appointment booking conflicts
        - Invalid state transitions
        - Business rule violations
    """

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, details, status.HTTP_400_BAD_REQUEST)


class AppointmentError(BusinessLogicError):
    """Raised when appointment operations fail business rules."""

    pass


class PaymentError(BusinessLogicError):
    """Raised when payment operations fail."""

    def __init__(
        self,
        message: str = "Payment processing failed",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, details)


# ==================== Rate Limiting ====================


class RateLimitExceededError(NetraAIError):
    """
    Raised when user exceeds rate limit.

    Examples:
        - Too many requests per minute
        - API quota exceeded
    """

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        retry_after: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if retry_after:
            details["retry_after"] = retry_after
        super().__init__(message, details, status.HTTP_429_TOO_MANY_REQUESTS)
