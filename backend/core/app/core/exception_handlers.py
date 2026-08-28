"""
FastAPI exception handlers for custom NetraAI exceptions.

This module registers exception handlers that convert custom exceptions
into properly formatted JSON responses with appropriate HTTP status codes.
"""

import logging
from typing import Union

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import NetraAIError

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    """
    Register all custom exception handlers with the FastAPI application.
    
    Args:
        app: FastAPI application instance
    """

    @app.exception_handler(NetraAIError)
    async def netraai_exception_handler(
        request: Request, exc: NetraAIError
    ) -> JSONResponse:
        """
        Handle all custom NetraAI exceptions.
        
        Converts custom exceptions to JSON responses with proper status codes
        and logs the error for monitoring.
        """
        logger.error(
            f"{exc.__class__.__name__}: {exc.message}",
            extra={
                "exception_type": exc.__class__.__name__,
                "status_code": exc.status_code,
                "details": exc.details,
                "path": request.url.path,
                "method": request.method,
            },
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.to_dict(),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        """
        Handle standard HTTP exceptions.
        
        Converts FastAPI/Starlette HTTP exceptions to consistent JSON format.
        """
        logger.warning(
            f"HTTP {exc.status_code}: {exc.detail}",
            extra={
                "status_code": exc.status_code,
                "path": request.url.path,
                "method": request.method,
            },
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": "HTTPException",
                "message": str(exc.detail),
                "details": {},
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """
        Handle Pydantic validation errors.
        
        Converts validation errors into user-friendly JSON responses.
        """
        errors = []
        for error in exc.errors():
            field_path = " -> ".join(str(loc) for loc in error["loc"])
            errors.append({
                "field": field_path,
                "message": error["msg"],
                "type": error["type"],
            })
        
        logger.warning(
            f"Validation error: {len(errors)} field(s)",
            extra={
                "errors": errors,
                "path": request.url.path,
                "method": request.method,
            },
        )
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "ValidationError",
                "message": "Request validation failed",
                "details": {"validation_errors": errors},
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """
        Catch-all handler for unexpected exceptions.
        
        Logs the full exception and returns a generic error response
        to avoid leaking sensitive information.
        """
        logger.exception(
            f"Unexpected error: {exc.__class__.__name__}: {str(exc)}",
            extra={
                "exception_type": exc.__class__.__name__,
                "path": request.url.path,
                "method": request.method,
            },
        )
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "InternalServerError",
                "message": "An unexpected error occurred. Please try again later.",
                "details": {},
            },
        )


def create_error_response(
    error_type: str,
    message: str,
    status_code: int = status.HTTP_400_BAD_REQUEST,
    details: Union[dict, None] = None,
) -> JSONResponse:
    """
    Helper function to create standardized error responses.
    
    Args:
        error_type: Type/name of the error
        message: Human-readable error message
        status_code: HTTP status code
        details: Additional error context
        
    Returns:
        JSONResponse with standardized error format
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "error": error_type,
            "message": message,
            "details": details or {},
        },
    )
