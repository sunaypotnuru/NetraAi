"""
Authentication State Middleware.

Populates request.state with user information from JWT token.
This allows other middleware (rate limiting, activity logging) to access user context.
"""

import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class AuthStateMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract user information from JWT and populate request.state.

    This runs BEFORE other middleware that need user context (rate limiting, activity logging).
    Does NOT enforce authentication - that's handled by route dependencies.
    """

    async def dispatch(self, request: Request, call_next):
        """Extract user info from token and set request.state."""

        # Initialize request state
        request.state.user_id = None
        request.state.user_role = "default"
        request.state.user_email = None

        # Try to extract user from Authorization header
        auth_header = request.headers.get("authorization", "")

        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()

            if token:
                try:
                    # Import here to avoid circular dependency
                    from app.core.security import verify_supabase_jwt

                    # Verify token and extract payload
                    payload = verify_supabase_jwt(token)

                    # Populate request state
                    request.state.user_id = payload.get("sub")
                    request.state.user_email = payload.get("email")

                    # Extract role from user_metadata
                    user_metadata = payload.get("user_metadata", {})
                    role = user_metadata.get("role", "patient")
                    request.state.user_role = role.lower()

                    logger.debug(
                        f"Auth state set: user_id={request.state.user_id}, "
                        f"role={request.state.user_role}"
                    )

                except Exception as e:
                    # Token verification failed, but don't block request
                    # Route dependencies will handle authentication enforcement
                    logger.debug(f"Failed to extract user from token: {e}")
                    pass

        # Continue with request
        response = await call_next(request)
        return response
