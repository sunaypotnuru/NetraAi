"""
Application-wide constants for NetraAI backend.
Replace magic numbers and strings with named constants.
"""
from enum import Enum


# ═══════════════════════════════════════════════════════════════════════════
# Rate Limiting
# ═══════════════════════════════════════════════════════════════════════════
class RateLimitConfig:
    """Rate limiting thresholds."""
    REQUESTS_PER_MINUTE = 100          # Default per-IP limit
    AUTH_REQUESTS_PER_MINUTE = 10      # Stricter limit for auth endpoints
    AI_REQUESTS_PER_MINUTE = 20        # AI/ML endpoint limit
    BURST_SIZE = 20                    # Allowed burst above rate limit
    WINDOW_SECONDS = 60                # Rate limit window
    WEBSOCKET_MAX_CONNECTIONS = 100    # Max concurrent WebSocket connections


# ═══════════════════════════════════════════════════════════════════════════
# File Upload
# ═══════════════════════════════════════════════════════════════════════════
class FileUploadConfig:
    """File upload constraints."""
    MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024      # 10 MB
    MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024      # 5 MB for medical images
    MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024     # 25 MB for audio recordings
    ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".bmp", ".tiff"]
    ALLOWED_DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx"]
    ALLOWED_AUDIO_EXTENSIONS = [".wav", ".mp3", ".ogg", ".m4a"]
    MAX_FILES_PER_REQUEST = 5


# ═══════════════════════════════════════════════════════════════════════════
# Session & Auth
# ═══════════════════════════════════════════════════════════════════════════
class SessionConfig:
    """Session management constants."""
    SESSION_TIMEOUT_MINUTES = 60           # Auto-logout after inactivity
    JWT_LEEWAY_SECONDS = 120              # Clock skew tolerance
    REFRESH_TOKEN_DAYS = 30              # Refresh token lifetime
    MAX_CONCURRENT_SESSIONS = 5          # Per-user session limit


# ═══════════════════════════════════════════════════════════════════════════
# API
# ═══════════════════════════════════════════════════════════════════════════
class APIConfig:
    """API configuration constants."""
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    DEFAULT_TIMEOUT_SECONDS = 30
    AI_TIMEOUT_SECONDS = 60
    ML_TIMEOUT_SECONDS = 120


# ═══════════════════════════════════════════════════════════════════════════
# Approval & Status Enums
# ═══════════════════════════════════════════════════════════════════════════
class ApprovalStatus(str, Enum):
    """Doctor/resource approval status."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class AppointmentStatus(str, Enum):
    """Appointment lifecycle status."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class ScanStatus(str, Enum):
    """AI diagnostic scan status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
