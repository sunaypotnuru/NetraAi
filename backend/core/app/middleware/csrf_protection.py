"""
CSRF Protection Middleware for FastAPI

Implements Double Submit Cookie pattern for CSRF protection.
Protects state-changing operations (POST, PUT, PATCH, DELETE) from CSRF attacks.
"""

import os
import secrets
from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
import logging

logger = logging.getLogger(__name__)

# CSRF token cookie name
CSRF_COOKIE_NAME = "csrf_token"
# CSRF token header name
CSRF_HEADER_NAME = "X-CSRF-Token"
# CSRF token length
CSRF_TOKEN_LENGTH = 32


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    CSRF Protection using Double Submit Cookie pattern.

    How it works:
    1. Server generates a random CSRF token and sets it as a cookie
    2. Client reads the cookie and includes it in a custom header for state-changing requests
    3. Server validates that the cookie value matches the header value

    This protects against CSRF because:
    - Attackers can't read cookies from other domains (Same-Origin Policy)
    - Attackers can't set custom headers in cross-origin requests
    """

    def __init__(self, app, exempt_paths: Optional[list] = None):
        super().__init__(app)
        # Paths that don't require CSRF protection
        self.exempt_paths = exempt_paths or [
            "/health",
            "/",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/v1/webhooks/",  # Webhooks use signature verification instead
        ]
        # Methods that require CSRF protection
        self.protected_methods = {"POST", "PUT", "PATCH", "DELETE"}

    def _is_exempt(self, path: str) -> bool:
        """Check if path is exempt from CSRF protection."""
        return any(path.startswith(exempt) for exempt in self.exempt_paths)

    def _generate_csrf_token(self) -> str:
        """Generate a cryptographically secure CSRF token."""
        return secrets.token_urlsafe(CSRF_TOKEN_LENGTH)

    def _get_csrf_token_from_cookie(self, request: Request) -> Optional[str]:
        """Extract CSRF token from cookie."""
        return request.cookies.get(CSRF_COOKIE_NAME)

    def _get_csrf_token_from_header(self, request: Request) -> Optional[str]:
        """Extract CSRF token from custom header."""
        return request.headers.get(CSRF_HEADER_NAME)

    def _set_csrf_cookie(self, response: Response, token: str) -> None:
        """Set CSRF token cookie on response."""
        # Get environment settings
        environment = os.getenv("ENVIRONMENT", "production")
        is_production = environment == "production"

        # Cookie settings
        secure = is_production  # Only send over HTTPS in production
        samesite = "strict"  # Strict same-site policy
        max_age = 86400  # 24 hours

        response.set_cookie(
            key=CSRF_COOKIE_NAME,
            value=token,
            httponly=False,  # Must be readable by JavaScript
            secure=secure,
            samesite=samesite,
            max_age=max_age,
            path="/",
        )

    async def dispatch(self, request: Request, call_next):
        """Process request and validate CSRF token for state-changing operations."""

        # Skip CSRF check for exempt paths
        if self._is_exempt(request.url.path):
            response = await call_next(request)
            return response

        # Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
        if request.method not in self.protected_methods:
            response = await call_next(request)

            # Generate and set CSRF token if not present
            csrf_token = self._get_csrf_token_from_cookie(request)
            if not csrf_token:
                csrf_token = self._generate_csrf_token()
                self._set_csrf_cookie(response, csrf_token)

            return response

        # For state-changing methods, validate CSRF token
        cookie_token = self._get_csrf_token_from_cookie(request)
        header_token = self._get_csrf_token_from_header(request)

        # Check if tokens are present
        if not cookie_token or not header_token:
            logger.warning(
                f"CSRF validation failed: Missing token. "
                f"Path: {request.url.path}, Method: {request.method}, "
                f"Cookie: {bool(cookie_token)}, Header: {bool(header_token)}"
            )
            return JSONResponse(
                status_code=403,
                content={
                    "detail": "CSRF token missing. Include X-CSRF-Token header.",
                    "error": "csrf_token_missing",
                },
            )

        # Validate tokens match (constant-time comparison)
        if not secrets.compare_digest(cookie_token, header_token):
            logger.warning(
                f"CSRF validation failed: Token mismatch. "
                f"Path: {request.url.path}, Method: {request.method}"
            )
            return JSONResponse(
                status_code=403,
                content={
                    "detail": "CSRF token validation failed.",
                    "error": "csrf_token_invalid",
                },
            )

        # CSRF validation passed, process request
        response = await call_next(request)

        # Refresh CSRF token on successful request
        new_token = self._generate_csrf_token()
        self._set_csrf_cookie(response, new_token)

        return response
