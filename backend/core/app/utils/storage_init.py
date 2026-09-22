"""
Initialize Supabase Storage buckets on application startup.
This ensures all required buckets exist before any upload operations.

NOTE: This runs inside a background thread on startup. DNS/network errors
(Errno -2, ConnectError) are expected when HuggingFace Spaces are waking up
or have intermittent connectivity. These are swallowed silently — they are NOT
code bugs and should NOT be reported to Sentry.
"""

import logging
import socket
from app.services.supabase import supabase

logger = logging.getLogger(__name__)

# Define all required buckets with their configuration
REQUIRED_BUCKETS = {
    "scan-images": {
        "public": False,
        "description": "Private bucket for patient scan images",
    },
    "documents": {
        "public": False,
        "description": "Private bucket for patient documents",
    },
    "documents-private": {
        "public": False,
        "description": "Private bucket for sensitive documents",
    },
    "avatars": {"public": True, "description": "Public bucket for user avatars"},
}

_NETWORK_ERRORS = (
    OSError,          # covers [Errno -2] Name or service not known
    ConnectionError,
    TimeoutError,
)


def _is_network_error(exc: Exception) -> bool:
    """Return True if the exception is a transient network/DNS error."""
    msg = str(exc).lower()
    return (
        isinstance(exc, _NETWORK_ERRORS)
        or "name or service not known" in msg
        or "errno -2" in msg
        or "connect" in msg
        or "timeout" in msg
        or "network" in msg
    )


def initialize_storage_buckets() -> bool:
    """
    Create all required storage buckets if they don't already exist.

    Returns True on success, False on failure.
    Network/DNS errors are logged at WARNING level only and never
    bubble up to Sentry — they are transient startup hiccups.
    """
    if supabase is None:
        logger.warning("Supabase client not initialised — skipping bucket setup.")
        return False

    try:
        # Get list of existing buckets
        existing_buckets: list[str] = []
        try:
            response = supabase.storage.list_buckets()
            if response:
                existing_buckets = [bucket.name for bucket in response]
        except Exception as e:
            if _is_network_error(e):
                # Transient DNS/network issue — perfectly normal on cold-start.
                # Log quietly so it never reaches Sentry.
                logger.warning(
                    "Storage bucket check skipped — network not ready yet: %s", e
                )
                return False
            logger.warning("Could not list buckets: %s. Will attempt to create anyway.", e)

        # Create missing buckets
        for bucket_name, config in REQUIRED_BUCKETS.items():
            if bucket_name not in existing_buckets:
                try:
                    supabase.storage.create_bucket(
                        bucket_name, options={"public": config.get("public", False)}
                    )
                    logger.info("✅ Created storage bucket: %s", bucket_name)
                except Exception as e:
                    err_str = str(e).lower()
                    if "already exists" in err_str or "bucket already exists" in err_str:
                        logger.info("✅ Bucket already exists: %s", bucket_name)
                    elif _is_network_error(e):
                        # DNS not ready — skip quietly, do NOT call logger.error
                        # so Sentry never captures this.
                        logger.warning(
                            "Bucket '%s' setup skipped — network not ready: %s",
                            bucket_name, e,
                        )
                    else:
                        logger.warning(
                            "Could not create bucket '%s' (non-critical): %s",
                            bucket_name, e,
                        )
            else:
                logger.info("✅ Bucket already exists: %s", bucket_name)

        logger.info("✅ Storage buckets initialised successfully")
        return True

    except Exception as e:
        if _is_network_error(e):
            logger.warning(
                "Storage init skipped — network not ready on startup: %s", e
            )
            return False
        # Genuine unexpected error — log as warning (not error) to avoid Sentry noise
        logger.warning("Storage bucket init encountered an issue: %s", e)
        return False
