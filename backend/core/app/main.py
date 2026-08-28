from contextlib import asynccontextmanager  # type: ignore
from fastapi import FastAPI, HTTPException, Request  # type: ignore
from fastapi.responses import JSONResponse  # type: ignore
from fastapi.exceptions import RequestValidationError  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from starlette.middleware.trustedhost import TrustedHostMiddleware  # type: ignore
import logging
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
import asyncio

from app.core.config import settings  # type: ignore

from app.routes.patient import router as patient_router
from app.routes.doctor import router as doctor_router
from app.routes.doctor import public_router as doctor_public_router
from app.routes.admin import router as admin_router
from app.routes.admin import public_router as admin_public_router
from app.routes.video import router as video_router
from app.routes.ml import router as ml_router
from app.routes.hospitals import router as hospitals_router
from app.routes.reports import router as reports_router
from app.routes.audit import router as audit_router
from app.routes.messages import router as messages_router
from app.routes.gamification import router as gamification_router
from app.routes.referrals import router as referrals_router
from app.routes.preferences import router as preferences_router
from app.routes.documents import router as documents_router
from app.routes.insurance import router as insurance_router
from app.routes.contact import router as contact_router
from app.routes.quality import router as quality_router
from app.routes.timeline import router as timeline_router
from app.routes.waitlist import router as waitlist_router

from app.routes.analytics import router as analytics_router
from app.routes.search import router as search_router
from app.routes.i18n import router as i18n_router
from app.routes.health import router as health_router
from app.routes.ai import router as ai_router
from app.routes.settings import router as platform_settings_router
from app.routes.scribe import router as scribe_router
from app.routes.payment import router as payment_router
from app.routes.intake import router as intake_router
from app.routes.webhooks import router as webhooks_router
from app.routes.mental import router as mental_router
from app.routes.whiteboard import router as whiteboard_router
from app.routes.voice import router as voice_router
from app.routes.exercises import router as exercises_router
from app.routes.semantic_search import router as semantic_search_router
from app.routes.system_health import router as system_health_router
from app.routes.mcp_health import router as mcp_health_router
from app.routes.configuration import router as configuration_router
from app.routes.security import router as security_router
from app.routes.compliance import router as compliance_router
from app.routes.fhir import router as fhir_router
from app.routes.ai_models import router as ai_models_router
from app.routes.auth_security import router as auth_security_router
from app.routes.doctor_portal import router as doctor_portal_router
from app.routes.patient_portal import router as patient_portal_router
from app.routes.websocket import router as websocket_router
from app.routes.blogs import router as blogs_router
from app.routes.emergency_contacts import router as emergency_contacts_router
from app.middleware.activity import ActivityLoggingMiddleware  # type: ignore
from app.middleware.input_validation import SecurityInputValidationMiddleware  # type: ignore
from app.middleware.csrf_protection import CSRFProtectionMiddleware  # type: ignore

# SessionTimeoutMiddleware temporarily disabled - was causing 401 errors
# # from app.middleware.session_timeout import SessionTimeoutMiddleware  # type: ignore  # noqa: F401
from app.middleware.user_rate_limit import UserRateLimitMiddleware  # type: ignore

from app.middleware.advanced_rate_limiting import AdvancedRateLimitingMiddleware  # type: ignore
from app.middleware.security_headers import SecurityHeadersMiddleware  # type: ignore
from app.services.supabase import supabase as supabase_admin  # type: ignore
from app.utils.reminders import start_reminder_task  # type: ignore
from app.warmup import warmup_deepseek_sync  # type: ignore
from app.utils.storage_init import initialize_storage_buckets


# PHI scrubbing function for Sentry
def scrub_phi_from_events(event, hint):
    """Remove PHI (Protected Health Information) from Sentry events before sending."""
    # List of sensitive fields to scrub
    sensitive_fields = [
        "email",
        "phone",
        "address",
        "ssn",
        "medical_history",
        "patient_id",
        "doctor_id",
        "prescription",
        "diagnosis",
        "full_name",
        "date_of_birth",
        "blood_type",
        "hemoglobin",
    ]

    # Scrub request data
    if "request" in event:
        if "data" in event["request"]:
            for field in sensitive_fields:
                if field in event["request"]["data"]:
                    event["request"]["data"][field] = "[REDACTED]"

        # Scrub headers
        if "headers" in event["request"]:
            for header in ["Authorization", "Cookie", "X-API-Key"]:
                if header in event["request"]["headers"]:
                    event["request"]["headers"][header] = "[REDACTED]"

    # Scrub extra data
    if "extra" in event:
        for field in sensitive_fields:
            if field in event["extra"]:
                event["extra"][field] = "[REDACTED]"

    return event


_SENTRY_DSN = os.getenv("SENTRY_DSN", "").strip()
_ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
_SENTRY_ENABLED = os.getenv("SENTRY_ENABLED", "").lower() in {"1", "true", "yes"}
# Initialize Sentry only when a real DSN is provided.
# This avoids silently "enabling" Sentry with a dummy DSN and gives deployments a clear on/off switch.
if (
    _SENTRY_DSN
    and "dummy@o0.ingest.sentry.io/0" not in _SENTRY_DSN
    and (_SENTRY_ENABLED or _ENVIRONMENT in {"staging", "production"})
):
    sentry_sdk.init(
        dsn=_SENTRY_DSN,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1,  # Sample only 10% of traces
        before_send=scrub_phi_from_events,
        environment=_ENVIRONMENT,
        # Don't send PII
        send_default_pii=False,
    )

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle for the app."""

    # ═══════════════════════════════════════════════════════════════
    # CRITICAL CONFIGURATION VALIDATION (Fail Fast)
    # ═══════════════════════════════════════════════════════════════
    logger.info("Validating critical configuration...")

    # Validate JWT Secret
    if not settings.SUPABASE_JWT_SECRET:
        logger.critical("❌ SUPABASE_JWT_SECRET is not configured!")
        logger.critical("Set SUPABASE_JWT_SECRET environment variable")
        raise RuntimeError(
            "SUPABASE_JWT_SECRET environment variable is required for authentication"
        )

    # Validate Supabase URL
    if not settings.SUPABASE_URL:
        logger.critical("❌ SUPABASE_URL is not configured!")
        raise RuntimeError("SUPABASE_URL environment variable is required")

    # Validate Supabase Service Key
    if not settings.SUPABASE_SERVICE_KEY:
        logger.critical("❌ SUPABASE_SERVICE_KEY is not configured!")
        raise RuntimeError("SUPABASE_SERVICE_KEY environment variable is required")

    # Log environment and auth status for debugging
    environment = os.getenv("ENVIRONMENT", "development").lower()
    logger.info(f"🌍 Environment: {environment}")
    logger.info(f"🔐 BYPASS_AUTH: {settings.BYPASS_AUTH}")

    # Never allow the local/demo auth bypass in production.
    if settings.BYPASS_AUTH and environment == "production":
        logger.critical("BYPASS_AUTH cannot be enabled in production")
        raise RuntimeError("BYPASS_AUTH cannot be enabled in production")

    if settings.BYPASS_AUTH:
        logger.warning("⚠️ BYPASS_AUTH is enabled - authentication is bypassed!")
        logger.warning("⚠️ This should only be used for development/testing")

    logger.info("✅ Configuration validation passed")

    # ═══════════════════════════════════════════════════════
    # HIGH PRIORITY: AI Provider Validation
    # ═══════════════════════════════════════════════════════
    groq_key = os.getenv("GROQ_API_KEY", "")
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    if not groq_key and not gemini_key:
        logger.critical(
            "❌ No AI provider configured! Set GROQ_API_KEY or GEMINI_API_KEY"
        )
        raise RuntimeError(
            "At least one AI provider key required (GROQ_API_KEY or GEMINI_API_KEY)"
        )
    if not groq_key:
        logger.warning("⚠️  GROQ_API_KEY missing - using Gemini fallback only")
    if not gemini_key:
        logger.warning("⚠️  GEMINI_API_KEY missing - no AI fallback available")

    # ═══════════════════════════════════════════════════════
    # HIGH PRIORITY: Payment Gateway (only if enabled)
    # ═══════════════════════════════════════════════════════
    enable_payments = os.getenv("ENABLE_PAYMENTS", "false").lower() == "true"
    if enable_payments:
        razorpay_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
        if not razorpay_secret:
            logger.critical(
                "❌ ENABLE_PAYMENTS=true but RAZORPAY_KEY_SECRET is missing"
            )
            raise RuntimeError("RAZORPAY_KEY_SECRET required when ENABLE_PAYMENTS=true")

    # ═══════════════════════════════════════════════════════
    # MEDIUM PRIORITY: Notification Services (warn only)
    # ═══════════════════════════════════════════════════════
    if not os.getenv("TWILIO_AUTH_TOKEN"):
        logger.warning("⚠️  TWILIO_AUTH_TOKEN missing - SMS notifications disabled")
    if not os.getenv("SENDGRID_API_KEY"):
        logger.warning("⚠️  SENDGRID_API_KEY missing - email delivery may be degraded")

    # ═══════════════════════════════════════════════════════
    # MEDIUM PRIORITY: Infrastructure Services (warn only)
    # ═══════════════════════════════════════════════════════
    if not os.getenv("LIVEKIT_API_SECRET"):
        logger.warning("⚠️  LIVEKIT_API_SECRET missing - video consultations disabled")
    if not os.getenv("REDIS_URL"):
        logger.warning(
            "⚠️  REDIS_URL missing - caching disabled, expect slower performance"
        )

    logger.info("✅ All configuration validation passed")

    # Initialize JWT secret cache for fast verification
    from app.core.security import _initialize_jwt_secret

    _initialize_jwt_secret()
    logger.info("✅ JWT secret initialized and cached")

    # ═══════════════════════════════════════════════════════════════
    # STARTUP TASKS
    # ═══════════════════════════════════════════════════════════════
    logger.info("Starting background tasks...")
    await start_reminder_task()

    # Initialize Supabase storage buckets
    logger.info("Initializing Supabase storage buckets...")
    # Run in background task instead of executor to avoid asyncio issues
    asyncio.create_task(asyncio.to_thread(initialize_storage_buckets))

    # Warm up DeepSeek-R1 to eliminate first-request delay
    # Run in background task to prevent blocking Uvicorn startup
    logger.info("Warming up AI models in the background...")
    asyncio.create_task(asyncio.to_thread(warmup_deepseek_sync))

    # Initialize ML cache cleanup task
    try:
        from app.utils.cache import get_ml_cache

        logger.info("Starting ML cache cleanup task...")
        ml_cache = get_ml_cache()
        await ml_cache.start_cleanup_task()
    except Exception as e:
        logger.error(f"Failed to start ML cache cleanup: {e}")

    # Initialize appointment reminder scheduler
    try:
        from app.tasks.reminders import start_reminder_scheduler

        logger.info("Starting appointment reminder scheduler...")
        start_reminder_scheduler()
    except Exception as e:
        logger.error(f"Failed to start reminder scheduler: {e}")

    # Initialize session cleanup task (Category 3: Security)
    try:
        from app.services.session_service import get_session_service

        logger.info("Starting session cleanup task...")
        session_service = get_session_service()

        # Run cleanup every hour
        async def cleanup_sessions_periodically():
            while True:
                try:
                    await asyncio.sleep(3600)  # 1 hour
                    count = await session_service.cleanup_expired_sessions()
                    if count > 0:
                        logger.info(f"Cleaned up {count} expired sessions")
                except Exception as e:
                    logger.error(f"Session cleanup error: {e}")

        asyncio.create_task(cleanup_sessions_periodically())
    except Exception as e:
        logger.error(f"Failed to start session cleanup: {e}")

    # Initialize WebSocket stale connection checker (Category 4: Messaging)
    try:
        from app.services.websocket_manager import start_stale_connection_checker

        logger.info("Starting WebSocket stale connection checker...")
        asyncio.create_task(start_stale_connection_checker())
    except Exception as e:
        logger.error(f"Failed to start stale connection checker: {e}")

    # Phase 3: Initialize Redis cache
    try:
        from app.cache.redis_client import init_redis_cache

        logger.info("Initializing Redis cache for Phase 3...")
        await init_redis_cache(app)
    except Exception as e:
        logger.error(f"Failed to initialize Redis cache: {e}")

    # Industrial Monitoring: Start MCP audit log simulation only in demo mode
    if os.getenv("DEMO_MODE", "false").lower() == "true":
        try:
            from app.routes.mcp_health import start_audit_simulation

            start_audit_simulation()
        except Exception as e:
            logger.error(f"Failed to start MCP audit simulation: {e}")

    # Deployment stability: optional periodic health checks (best-effort persistence to `service_health`)
    try:
        from app.routes.system_health import start_periodic_health_monitor

        start_periodic_health_monitor()
    except Exception as e:
        logger.error(f"Failed to start periodic health monitor: {e}")

    yield

    # Shutdown: Stop appointment reminder scheduler
    try:
        from app.tasks.reminders import stop_reminder_scheduler

        stop_reminder_scheduler()
        logger.info("Reminder scheduler stopped")
    except Exception:
        pass

    # Shutdown: Stop ML cache cleanup task
    try:
        from app.utils.cache import get_ml_cache

        ml_cache = get_ml_cache()
        await ml_cache.stop_cleanup_task()
        logger.info("ML cache cleanup task stopped")
    except Exception:
        pass

    # Shutdown: Close ML service HTTP client
    try:
        from app.services.ml_service import get_ml_service

        ml_service = get_ml_service()
        await ml_service.close()
        logger.info("ML service HTTP client closed")
    except Exception:
        pass

    # Shutdown: Close Redis cache
    try:
        from app.cache.redis_client import close_redis_cache

        await close_redis_cache()
    except Exception:
        pass

    # Shutdown: stop periodic health monitor if running
    try:
        from app.routes.system_health import stop_periodic_health_monitor

        stop_periodic_health_monitor()
    except Exception:
        pass


app = FastAPI(
    title="Netra AI Backend API",
    description="Telemedicine platform specializing in AI-powered anemia detection.",
    version="3.0.0",
    lifespan=lifespan,
)

# Register custom exception handlers for standardized error responses
from app.core.exception_handlers import register_exception_handlers  # type: ignore

register_exception_handlers(app)
logger.info("✅ Custom exception handlers registered")


# CORS for React/Vite frontend with strict security
def get_allowed_origins():
    """Get allowed origins based on environment."""
    base_origins = []

    # Add configured frontend URL (production Vercel domain)
    if settings.FRONTEND_URL:
        base_origins.append(settings.FRONTEND_URL)

    # Fallback for local development if FRONTEND_URL is not set
    if not base_origins or settings.ENVIRONMENT == "development":
        base_origins.extend(
            [
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173",
            ]
        )

    return base_origins


allowed_origins = get_allowed_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://(netra-ai-.*|netra-.*-sunays-projects-[a-z0-9]+)\.vercel\.app",  # All Vercel previews + production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-RateLimit-Remaining"],
    max_age=86400,
)

# Host header validation to reduce host-header injection risk in production.
trusted_hosts = [
    host.strip()
    for host in os.getenv(
        "ALLOWED_HOSTS",
        "localhost,127.0.0.1,*.onrender.com,*.hf.space,*.huggingface.co",
    ).split(",")
    if host.strip()
]
if trusted_hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=trusted_hosts)

# Security middleware (order matters!)
# Request flow: top to bottom
# Response flow: bottom to top
#
# Correct order:
# 1. Rate limiting (block bad actors early)
# 2. Input validation (validate before processing)
# 3. CSRF protection (validate tokens)
# 4. Auth state (extract user for other middleware)
# 5. Security headers (add to response last)

from app.middleware.auth_state import AuthStateMiddleware  # type: ignore  # noqa: E402

app.add_middleware(AdvancedRateLimitingMiddleware)  # 1st - Block bad actors early
app.add_middleware(UserRateLimitMiddleware)  # 2nd - Per-user rate limits
app.add_middleware(SecurityInputValidationMiddleware)  # 3rd - Validate input
app.add_middleware(CSRFProtectionMiddleware)  # 4th - CSRF protection
app.add_middleware(AuthStateMiddleware)  # 5th - Extract user context
# app.add_middleware(SessionTimeoutMiddleware)            # 6th - TEMPORARILY DISABLED (was causing 401)
app.add_middleware(SecurityHeadersMiddleware)  # 7th - Add headers to response (last)


# Activity logging middleware
app.add_middleware(ActivityLoggingMiddleware)

# ─── API Routers ─────────────────────────────────────────
app.include_router(patient_portal_router)  # Already has /api/v1/patient prefix
app.include_router(patient_router, prefix=settings.API_V1_STR)
app.include_router(doctor_router, prefix=settings.API_V1_STR)
app.include_router(doctor_public_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(admin_public_router, prefix=settings.API_V1_STR)
app.include_router(video_router, prefix=settings.API_V1_STR)
app.include_router(ml_router, prefix=settings.API_V1_STR)
app.include_router(hospitals_router, prefix=settings.API_V1_STR)

# ─── New Feature Routers ─────────────────────────────────
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(messages_router, prefix=settings.API_V1_STR)
app.include_router(gamification_router, prefix=settings.API_V1_STR)
app.include_router(referrals_router, prefix=settings.API_V1_STR)
app.include_router(preferences_router, prefix=settings.API_V1_STR)
app.include_router(documents_router, prefix=settings.API_V1_STR)
app.include_router(insurance_router, prefix=settings.API_V1_STR)
app.include_router(contact_router, prefix=settings.API_V1_STR)
app.include_router(quality_router, prefix=settings.API_V1_STR)
app.include_router(timeline_router, prefix=settings.API_V1_STR)
app.include_router(waitlist_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(search_router, prefix=f"{settings.API_V1_STR}/search")

# ─── Batch 5, 6 & 7 Routers ─────────────────────────────
# Use base versions
app.include_router(i18n_router, prefix=settings.API_V1_STR)
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(platform_settings_router, prefix=settings.API_V1_STR)
app.include_router(scribe_router, prefix=settings.API_V1_STR)
app.include_router(payment_router, prefix=settings.API_V1_STR)

app.include_router(intake_router, prefix=settings.API_V1_STR)
app.include_router(webhooks_router, prefix=settings.API_V1_STR)
app.include_router(mental_router, prefix=settings.API_V1_STR)
app.include_router(whiteboard_router, prefix=settings.API_V1_STR)
app.include_router(voice_router, prefix=settings.API_V1_STR)
app.include_router(exercises_router, prefix=settings.API_V1_STR)
app.include_router(semantic_search_router, prefix=settings.API_V1_STR)

# Industrial Standards Routes (Phase 1)
app.include_router(system_health_router, prefix=settings.API_V1_STR)
app.include_router(mcp_health_router, prefix=settings.API_V1_STR)
app.include_router(configuration_router, prefix=settings.API_V1_STR)
app.include_router(security_router, prefix=settings.API_V1_STR)

# Admin Portal Completion Routes
app.include_router(compliance_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(fhir_router, prefix=settings.API_V1_STR)
app.include_router(blogs_router, prefix=settings.API_V1_STR)

# Phase 2

# Industrial Standards Routes (Phase 3)
app.include_router(ai_models_router, prefix=settings.API_V1_STR)
app.include_router(auth_security_router, prefix=settings.API_V1_STR)

# Categories 5-6: Doctor & Patient Portal Features
app.include_router(doctor_portal_router)  # Already has /api/v1/doctor prefix
app.include_router(emergency_contacts_router)  # Already has /api/v1/patient prefix


# WebSocket Routes (Category 4: Messaging System)
app.include_router(websocket_router)


@app.get("/")
async def root():
    return {"message": "Netra AI API v3.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/api/v1/auth/confirm-email")
async def confirm_email(payload: dict):
    """Auto-confirm a user's email after signup (dev/demo mode).

    ⚠️ SECURITY NOTE: This endpoint is for development/demo only.
    In production, use proper email verification with time-limited tokens.

    Supabase requires email confirmation before granting sessions.
    Since we don't have email delivery configured, this endpoint
    uses the Admin API to confirm the email immediately.

    IMPORTANT: This should only be called immediately after signup, and the user_id should match the authenticated user.
    """
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    # Security check: only allow explicit local bypass mode outside production
    if os.getenv("ENVIRONMENT") == "production":
        raise HTTPException(
            status_code=403,
            detail="Email confirmation must be done via email link in production",
        )
    if not settings.BYPASS_AUTH:
        raise HTTPException(
            status_code=403,
            detail="Email confirmation endpoint is only available in BYPASS_AUTH mode",
        )

    try:
        supabase_admin.auth.admin.update_user_by_id(user_id, {"email_confirm": True})
        logger.info(f"Email confirmed for user: {user_id}")
        return {"confirmed": True}
    except Exception as e:
        logger.error(f"Failed to confirm email for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Global Exception Handlers ───────────────────────────────────────
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom handler for HTTPExceptions with consistent JSON structure."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "status_code": exc.status_code,
            "detail": exc.detail,
        },
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Custom handler for Request Validation Errors (422 Unprocessable Entity)."""
    logger.warning(
        f"Validation error on {request.method} {request.url.path}: {exc.errors()}"
    )
    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "status_code": 422,
            "detail": "Request validation failed",
            "errors": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Global catch-all for 500 Unhandled Exceptions to prevent sensitive leakages."""
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}: {exc}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "status_code": 500,
            "detail": "An internal server error occurred.",
        },
    )
