import logging
import os
from typing import Optional

from supabase import Client, create_client

from app.core.config import settings

logger = logging.getLogger(__name__)

# Export a configured synchronous Supabase client using the service role key.
# This client bypasses RLS, so use it only inside authenticated backend paths.
supabase_url = settings.SUPABASE_URL
supabase_service_key = (
    settings.SUPABASE_SERVICE_KEY
    or settings.SUPABASE_SERVICE_ROLE_KEY
    or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
)

if not supabase_service_key:
    logger.warning("Supabase service key is missing; database operations will fail.")
else:
    key_source = (
        "SUPABASE_SERVICE_KEY"
        if settings.SUPABASE_SERVICE_KEY
        else (
            "SUPABASE_SERVICE_ROLE_KEY"
            if settings.SUPABASE_SERVICE_ROLE_KEY
            else "ENV_VAR"
        )
    )
    logger.info("Supabase service key loaded from %s.", key_source)

supabase: Optional[Client] = None
if supabase_url and supabase_service_key:
    try:
        supabase = create_client(
            supabase_url=supabase_url, supabase_key=supabase_service_key
        )
    except Exception as e:
        logger.critical("Failed to initialize Supabase client: %s", e)
else:
    logger.critical("Supabase URL or key missing. Database operations will fail.")
