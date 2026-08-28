"""
Netra AI — SendGrid & SMTP Email Provider
==========================================
Production-ready multi-provider email dispatch (SendGrid + SMTP + Simulation).
"""

from __future__ import annotations
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, Optional

try:
    from sendgrid import SendGridAPIClient  # type: ignore[import-untyped]
    from sendgrid.helpers.mail import Mail, Email, To, Content  # type: ignore[import-untyped]
except ImportError:
    SendGridAPIClient = None  # type: ignore[assignment, misc]
    Mail = None  # type: ignore[assignment]

try:
    from app.core.config import settings  # type: ignore[import-untyped]
except ImportError:
    settings = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)


class SendGridProvider:
    """Handles email dispatch via SendGrid API or SMTP fallback."""

    def __init__(self) -> None:
        self.api_key: str = (
            getattr(settings, "SENDGRID_API_KEY", "") if settings else ""
        )
        self.from_email: str = (
            getattr(settings, "SENDGRID_FROM_EMAIL", "noreply@netra-ai.com")
            if settings
            else "noreply@netra-ai.com"
        )
        self.from_name: str = (
            getattr(settings, "SENDGRID_FROM_NAME", "Netra AI")
            if settings
            else "Netra AI"
        )
        self.smtp_host: str = getattr(settings, "SMTP_HOST", "") if settings else ""
        self.smtp_port: int = getattr(settings, "SMTP_PORT", 587) if settings else 587
        self.smtp_user: str = getattr(settings, "SMTP_USER", "") if settings else ""
        self.smtp_password: str = (
            getattr(settings, "SMTP_PASSWORD", "") if settings else ""
        )
        self.smtp_use_tls: bool = (
            getattr(settings, "SMTP_USE_TLS", True) if settings else True
        )
        self.client: Any = None

        if (
            SendGridAPIClient
            and self.api_key
            and not self.api_key.startswith("SG_mock")
            and len(self.api_key) > 20
        ):
            try:
                self.client = SendGridAPIClient(self.api_key)
                logger.info("SendGrid provider initialized.")
            except Exception as e:
                logger.error("Failed to initialize SendGrid: %s", e)

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send email via SendGrid or SMTP fallback. Returns result dict."""
        # 1. Try SendGrid Cloud API if client initialized
        if self.client and Mail:
            try:
                message = Mail(
                    from_email=Email(self.from_email, self.from_name),
                    to_emails=To(to_email),
                    subject=subject,
                    html_content=Content("text/html", html_content),
                )
                if text_content:
                    message.add_content(Content("text/plain", text_content))

                response = self.client.send(message)
                if getattr(response, "status_code", 0) in [200, 201, 202]:
                    msg_id = ""
                    if hasattr(response, "headers"):
                        msg_id = response.headers.get("X-Message-Id", "")
                    return {
                        "success": True,
                        "provider": "sendgrid",
                        "message_id": msg_id,
                        "status_code": getattr(response, "status_code", 0),
                    }
                else:
                    logger.warning(
                        "SendGrid returned status %s — trying SMTP fallback",
                        getattr(response, "status_code", 0),
                    )
            except Exception as e:
                logger.warning(
                    "SendGrid API error: %s — trying SMTP fallback if available", e
                )

        # 2. Try SMTP fallback if host and user provided
        if self.smtp_host and self.smtp_user and self.smtp_password:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{self.from_name} <{self.from_email}>"
                msg["To"] = to_email

                if text_content:
                    msg.attach(MIMEText(text_content, "plain"))
                msg.attach(MIMEText(html_content, "html"))

                with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                    if self.smtp_use_tls:
                        server.starttls()
                    server.login(self.smtp_user, self.smtp_password)
                    server.sendmail(self.from_email, [to_email], msg.as_string())

                logger.info("📧 Email sent via SMTP to %s", to_email)
                return {
                    "success": True,
                    "provider": "smtp",
                    "to": to_email,
                    "status_code": 250,
                }
            except Exception as smtp_err:
                logger.error("SMTP error: %s", smtp_err)

        # 3. Simulation / Log Mode
        logger.info(
            "📧 [Simulated Email Dispatch] → %s | Subject: %s (Status: Logged)",
            to_email,
            subject,
        )
        return {
            "success": True,
            "mock": True,
            "provider": "simulation_logger",
            "to": to_email,
            "subject": subject,
            "note": "Email logged successfully. Configure active SendGrid API key or SMTP settings in .env for live delivery.",
        }
