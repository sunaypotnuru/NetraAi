"""
Centralized storage utilities for Supabase Storage operations.
"""

import logging
from typing import Optional
from app.services.supabase import supabase

logger = logging.getLogger(__name__)


def generate_signed_url(
    bucket_name: str, file_path: str, expires_in: int = 3600
) -> Optional[str]:
    """
    Generate a signed URL for a file in Supabase Storage.

    Args:
        bucket_name: Name of the storage bucket
        file_path: Path to the file within the bucket
        expires_in: URL expiration time in seconds (default: 1 hour)

    Returns:
        Signed URL string or None if generation fails
    """
    if not file_path:
        return None

    # If already a full URL, return as-is
    if file_path.startswith("http"):
        return file_path

    try:
        # Request a signed URL from storage
        res = supabase.storage.from_(bucket_name).create_signed_url(
            file_path, expires_in
        )

        # Handle different response formats from supabase-py
        if isinstance(res, dict) and "signedURL" in res:
            return res["signedURL"]
        elif hasattr(res, "signed_url"):
            return getattr(res, "signed_url")
        elif isinstance(res, str):
            return res
        else:
            logger.warning(f"Unexpected signed URL response format: {type(res)}")
            return None
    except Exception as e:
        logger.warning(f"Failed to generate signed URL for {file_path}: {e}")
        return None


def get_public_url(bucket_name: str, file_path: str) -> Optional[str]:
    """
    Get the public URL for a file in a public bucket.

    Args:
        bucket_name: Name of the storage bucket
        file_path: Path to the file within the bucket

    Returns:
        Public URL string or None if generation fails
    """
    if not file_path:
        return None

    # If already a full URL, return as-is
    if file_path.startswith("http"):
        return file_path

    try:
        url = supabase.storage.from_(bucket_name).get_public_url(file_path)
        return url
    except Exception as e:
        logger.warning(f"Failed to get public URL for {file_path}: {e}")
        return None
